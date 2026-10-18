"""Live audio smoke test. Run after test-live.mjs with apps/agent/.venv/bin/python.

Uses a prerecorded synthetic answer, never the computer's microphone. Requires
the running local stack and makes paid AI calls. Artifacts stay in .data/testing.
"""
import asyncio
import json
import time
import wave
from pathlib import Path

import httpx
import numpy as np
from kokoro_onnx import Kokoro
from livekit import rtc

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / ".data/testing"


async def main():
    session = json.loads((OUT / "session.json").read_text())
    async with httpx.AsyncClient(base_url="http://localhost:3000", headers={"cookie": session["cookie"], "origin": "http://localhost:3000"}, timeout=30) as http:
        response = await http.post("/api/interviews", json={"mode": "process_mapping", "title": "Synthetic voice test: supplier checks", "goal": "Capture how we verify supplier bank details."})
        response.raise_for_status()
        interview_id = response.json()["id"]
        print(f"Voice interview: {interview_id}", flush=True)
        response = await http.post(f"/api/interviews/{interview_id}/voice")
        response.raise_for_status()
        conn = response.json()
        engine = Kokoro(str(ROOT / "apps/agent/models/kokoro-v1.0.int8.onnx"), str(ROOT / "apps/agent/models/voices-v1.0.bin"))
        answer = "Every Tuesday I check the supplier tax certificate and bank details. Maya Chen is the finance lead and she approves every new supplier. If the bank details do not match the legal company name, I stop and call the supplier using the number in our vendor directory."
        samples, rate = await asyncio.to_thread(engine.create, answer, voice="am_michael", speed=1.0, lang="en-us")
        pcm = (np.clip(samples, -1, 1) * 32767).astype(np.int16)
        with wave.open(str(OUT / "voice-input.wav"), "wb") as wav:
            wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(rate); wav.writeframes(pcm.tobytes())
        room = rtc.Room()
        received = []
        audio_tasks = []
        first_audio = asyncio.Event()
        started = time.monotonic()
        first_audio_ms = None

        async def read_audio(track):
            nonlocal first_audio_ms
            async for event in rtc.AudioStream(track, sample_rate=24000, num_channels=1):
                received.append(bytes(event.frame.data))
                if not first_audio.is_set():
                    first_audio_ms = round((time.monotonic() - started) * 1000)
                    first_audio.set()

        @room.on("track_subscribed")
        def subscribed(track, publication, participant):
            if track.kind == rtc.TrackKind.KIND_AUDIO:
                audio_tasks.append(asyncio.create_task(read_audio(track)))

        try:
            await room.connect(conn["url"], conn["token"])
            source = rtc.AudioSource(rate, 1)
            track = rtc.LocalAudioTrack.create_audio_track("recorded-answer", source)
            await room.local_participant.publish_track(track, rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE))
            await asyncio.wait_for(first_audio.wait(), 90)
            print(f"First agent audio: {first_audio_ms} ms", flush=True)
            # Wait for the opening to be stored, then let the agent's playout finish.
            for _ in range(90):
                state = (await http.get(f"/api/interviews/{interview_id}")).json()
                if any(u["speaker"] == "interviewer" for u in state["utterances"]):
                    break
                await asyncio.sleep(1)
            else:
                raise AssertionError("Opening was not saved")
            await asyncio.sleep(2)
            baseline_audio = sum(map(len, received))
            frame_size = rate // 50
            # Real-time packets through LiveKit exercise VAD, STT, LLM, TTS, and storage.
            for offset in range(0, len(pcm), frame_size):
                frame = pcm[offset:offset + frame_size]
                if len(frame) < frame_size:
                    frame = np.pad(frame, (0, frame_size - len(frame)))
                await source.capture_frame(rtc.AudioFrame(frame.tobytes(), rate, 1, len(frame)))
                await asyncio.sleep(0.02)
            await source.wait_for_playout()
            ended = time.monotonic()
            for _ in range(30):
                await source.capture_frame(rtc.AudioFrame(bytes(frame_size * 2), rate, 1, frame_size))
                await asyncio.sleep(0.02)
            for _ in range(90):
                state = (await http.get(f"/api/interviews/{interview_id}")).json()
                experts = [u for u in state["utterances"] if u["speaker"] == "expert"]
                replies = [u for u in state["utterances"] if u["speaker"] == "interviewer"]
                if experts and len(replies) >= 2 and state["interview"]["notes"]:
                    break
                await asyncio.sleep(1)
            else:
                raise AssertionError("Voice answer, follow-up, or coverage was not saved")
            assert "bank" in experts[0]["text"].lower(), experts[0]["text"]
            assert sum(map(len, received)) > baseline_audio, "No spoken follow-up received"
            result = {"passed": True, "interviewId": interview_id, "firstAudioMs": first_audio_ms, "replyAndCoverageMs": round((time.monotonic() - ended) * 1000), "transcript": [u["text"] for u in state["utterances"]], "notes": len(state["interview"]["notes"])}
            (OUT / "voice-results.json").write_text(json.dumps(result, indent=2))
            print(json.dumps(result), flush=True)
        finally:
            await room.disconnect()
            for task in audio_tasks:
                task.cancel()
            await asyncio.gather(*audio_tasks, return_exceptions=True)
            with wave.open(str(OUT / "voice-output.wav"), "wb") as wav:
                wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(24000); wav.writeframes(b"".join(received))


if __name__ == "__main__":
    asyncio.run(main())
