"""Voice interviewer.

Joins the LiveKit room the web app dispatches it to, runs the interview by voice, and writes every
turn back to the web app. The web app owns the interviewer prompt and topic tracking, so voice and
text interviews behave the same.

Pipeline: silero VAD -> faster-whisper (local) -> LiveKit turn detector (local v1-mini)
          -> Claude Haiku 5.5 (no thinking, low effort) -> Kokoro TTS (local, ONNX).
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time

from pathlib import Path
from typing import Any

import httpx
import numpy as np
from dotenv import load_dotenv
from faster_whisper import WhisperModel
from kokoro_onnx import Kokoro
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    APIConnectOptions,
    JobContext,
    JobProcess,
    TurnHandlingOptions,
    cli,
    inference,
    stt,
    tts,
)
from livekit.agents.llm import ChatContext, Tool
from livekit.agents.types import DEFAULT_API_CONNECT_OPTIONS
from livekit.agents.types import NOT_GIVEN, NotGivenOr
from livekit.agents.utils import AudioBuffer
from livekit.plugins import anthropic, silero

load_dotenv()
load_dotenv("../../.env")

logger = logging.getLogger("interviewer")

APP_URL = os.getenv("APP_URL", "http://localhost:3000").rstrip("/")
AGENT_SECRET = os.getenv("AGENT_SHARED_SECRET", "change-me-agent-secret")
LLM_MODEL = os.getenv("LLM_MODEL", "claude-haiku-5-5")
STT_MODEL = os.getenv("STT_MODEL", "base.en")
TTS_VOICE = os.getenv("TTS_VOICE", "af_heart")
MODELS = Path(__file__).parent / "models"
AGENT_NAME = "tacivo-interviewer"


class WhisperSTT(stt.STT):
    """Local, non-streaming STT. LiveKit's StreamAdapter feeds it one VAD-bounded utterance at a time."""

    def __init__(self, model: WhisperModel, keyterms: list[str] | None = None) -> None:
        super().__init__(capabilities=stt.STTCapabilities(streaming=False, interim_results=False))
        self._model = model
        self._prompt = ", ".join(keyterms or []) or None

    async def _recognize_impl(
        self,
        buffer: AudioBuffer,
        *,
        language: NotGivenOr[str] = NOT_GIVEN,
        conn_options: APIConnectOptions,
    ) -> stt.SpeechEvent:
        frame = rtc.combine_audio_frames(buffer)
        audio = np.frombuffer(frame.data, dtype=np.int16).astype(np.float32) / 32768.0
        if frame.num_channels > 1:
            audio = audio.reshape(-1, frame.num_channels).mean(axis=1)
        if frame.sample_rate != 16000:
            n = int(len(audio) * 16000 / frame.sample_rate)
            audio = np.interp(np.linspace(0, len(audio), n, endpoint=False), np.arange(len(audio)), audio).astype(np.float32)

        def run() -> str:
            segments, _ = self._model.transcribe(
                audio,
                language="en",
                beam_size=1,
                vad_filter=False,
                condition_on_previous_text=False,
                initial_prompt=self._prompt,
            )
            return " ".join(s.text.strip() for s in segments).strip()

        text = await asyncio.to_thread(run)
        return stt.SpeechEvent(
            type=stt.SpeechEventType.FINAL_TRANSCRIPT,
            alternatives=[stt.SpeechData(language="en", text=text)],
        )


class KokoroTTS(tts.TTS):
    """Local Kokoro-82M via ONNX (int8). One sentence per call; StreamAdapter feeds it sentence by sentence."""

    def __init__(self, model: Kokoro, voice: str) -> None:
        super().__init__(capabilities=tts.TTSCapabilities(streaming=False), sample_rate=24000, num_channels=1)
        self._model = model
        self._voice = voice

    def synthesize(self, text: str, *, conn_options: APIConnectOptions = DEFAULT_API_CONNECT_OPTIONS) -> tts.ChunkedStream:
        return _KokoroStream(tts=self, input_text=text, conn_options=conn_options)


class _KokoroStream(tts.ChunkedStream):
    async def _run(self, output_emitter: tts.AudioEmitter) -> None:
        engine: KokoroTTS = self._tts  # type: ignore[assignment]
        samples, sample_rate = await asyncio.to_thread(engine._model.create, self._input_text, voice=engine._voice, speed=1.0, lang="en-us")
        pcm = (np.clip(samples, -1.0, 1.0) * 32767).astype(np.int16).tobytes()
        output_emitter.initialize(request_id=str(id(self)), sample_rate=sample_rate, num_channels=1, mime_type="audio/pcm")
        output_emitter.push(pcm)
        output_emitter.flush()


class FastClaude(anthropic.LLM):
    """Live turns: no thinking and low effort for the fastest first token. Haiku 5.5 allows disabled thinking at low effort."""

    def chat(self, *, chat_ctx: ChatContext, tools: list[Tool] | None = None, extra_kwargs: Any = NOT_GIVEN, **kw: Any):  # type: ignore[override]
        extra = dict(extra_kwargs) if isinstance(extra_kwargs, dict) else {}
        extra.setdefault("output_config", {"effort": "low"})
        if LLM_MODEL.startswith("claude-haiku"):
            extra.setdefault("thinking", {"type": "disabled"})
        return super().chat(chat_ctx=chat_ctx, tools=tools, extra_kwargs=extra, **kw)


class Interviewer(Agent):
    def __init__(self, instructions: str, opening: str) -> None:
        super().__init__(instructions=instructions)
        self._opening = opening

    async def on_enter(self) -> None:
        self.session.generate_reply(instructions=self._opening)


class AppClient:
    """Talks to the web app. Same prompts, same storage, same coverage tracking as text interviews."""

    def __init__(self, interview_id: str) -> None:
        self.id = interview_id
        self.http = httpx.AsyncClient(base_url=APP_URL, headers={"x-agent-secret": AGENT_SECRET}, timeout=30)

    async def context(self) -> dict:
        r = await self.http.get(f"/api/agent/interviews/{self.id}")
        r.raise_for_status()
        return r.json()

    async def utterance(self, speaker: str, text: str, t_start_ms: int, t_end_ms: int) -> dict:
        r = await self.http.post(
            f"/api/agent/interviews/{self.id}/utterance",
            json={"speaker": speaker, "text": text, "tStartMs": t_start_ms, "tEndMs": t_end_ms},
        )
        r.raise_for_status()
        return r.json()


def prewarm(proc: JobProcess) -> None:
    proc.userdata["vad"] = silero.VAD.load(min_silence_duration=0.5)
    proc.userdata["whisper"] = WhisperModel(STT_MODEL, device="auto", compute_type="int8")
    kokoro = Kokoro(str(MODELS / "kokoro-v1.0.int8.onnx"), str(MODELS / "voices-v1.0.bin"))
    kokoro.create("Ready.", voice=TTS_VOICE, speed=1.0, lang="en-us")  # warm up so the first spoken line is fast
    proc.userdata["kokoro"] = kokoro


server = AgentServer()
server.setup_fnc = prewarm


@server.rtc_session(agent_name=AGENT_NAME)
async def entrypoint(ctx: JobContext) -> None:
    meta = json.loads(ctx.job.metadata or "{}")
    interview_id = meta.get("interviewId")
    if not interview_id:
        logger.error("job has no interviewId in metadata")
        return
    ctx.log_context_fields = {"room": ctx.room.name, "interview": interview_id}

    app = AppClient(interview_id)
    info = await app.context()
    vad = ctx.proc.userdata["vad"]

    session = AgentSession(
        vad=vad,
        stt=stt.StreamAdapter(stt=WhisperSTT(ctx.proc.userdata["whisper"], info.get("keyterms")), vad=vad),
        llm=FastClaude(model=LLM_MODEL, caching="ephemeral", max_tokens=600),
        tts=tts.StreamAdapter(tts=KokoroTTS(ctx.proc.userdata["kokoro"], TTS_VOICE)),
        turn_handling=TurnHandlingOptions(
            # Local end-of-turn model. Experts pause mid-thought, so wait longer than a support bot would.
            turn_detection=inference.TurnDetector(version="v1-mini"),
            endpointing={"min_delay": 0.6, "max_delay": 4.0},
            interruption={"resume_false_interruption": True, "false_interruption_timeout": 1.0},
            preemptive_generation={"enabled": True},
        ),
    )

    started = time.monotonic()
    ms = lambda: int((time.monotonic() - started) * 1000)  # noqa: E731
    agent = Interviewer(info["instructions"], info["opening"])

    async def record(role: str, text: str) -> None:
        if not text.strip():
            return
        speaker = "expert" if role == "user" else "interviewer"
        end = ms()
        start = max(0, end - int(len(text.split()) / 2.5 * 1000))  # rough start from speaking rate
        try:
            res = await app.utterance(speaker, text, start, end)
            if res.get("instructions"):
                await agent.update_instructions(res["instructions"])
        except httpx.HTTPError as err:
            logger.warning("could not save utterance: %s", err)

    @session.on("conversation_item_added")
    def on_item(ev) -> None:  # noqa: ANN001
        item = ev.item
        if getattr(item, "role", None) in ("user", "assistant") and getattr(item, "text_content", None):
            asyncio.create_task(record(item.role, item.text_content))

    ctx.add_shutdown_callback(app.http.aclose)
    await session.start(agent=agent, room=ctx.room)


if __name__ == "__main__":
    cli.run_app(server)
