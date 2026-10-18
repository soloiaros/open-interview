# 02 — Interview Layer: Voice and Text Agent Stack

Research date: 2026-10-17. Stars, last push, and license come from the GitHub API on that date. "Other"/NOASSERTION means the license is custom. Read it before you ship.
> **Update 2026-10-17:** the product is English-only. The Dutch requirement below is dropped; REPOS.md has the revised English picks (Qwen3-TTS / Kokoro / Pocket TTS, Kyutai STT as an alternative).

The original hard constraint was **Dutch** (plus EN/DE). Many SOTA models are English-only, and the tables call that out.

---

## 1. Realtime voice-agent frameworks

| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [livekit/agents](https://github.com/livekit/agents) | 14.8k | 2026-10-17 | Apache-2.0 | Agent runtime: STT→LLM→TTS pipeline, multilingual semantic turn detector, preemptive generation (LLM starts on interim transcript), adaptive interruption, text-only sessions over the same agent, WebRTC SFU transport (self-host `livekit-server` or LiveKit Cloud) | Telephony/SIP, avatar, and video plugins; all unused provider plugins |
| [livekit/agents-js](https://github.com/livekit/agents-js) | 942 | 2026-10-17 | Apache-2.0 | Node port. Only if the backend must be TS. It lags Python on features | — |
| [livekit-examples/agent-starter-react](https://github.com/livekit-examples/agent-starter-react) | 952 | 2026-10-15 | MIT | Browser front end (Next.js): mic, transcript, agent state. Zero install for the interviewee | Video/screenshare tiles, theming |
| [pipecat-ai/pipecat](https://github.com/pipecat-ai/pipecat) | 16.5k | 2026-10-17 | BSD-2-Clause | Strong alternative. Frame pipeline, Smart Turn v3 built in, **Flows now in core (`pipecat.flows`)**, which maps directly onto interview stages. `SmallWebRTCTransport` = P2P browser WebRTC with no SFU (least infra) | Daily/Twilio transports and the 60+ service integrations you don't use |
| [pipecat-ai/pipecat-client-web](https://github.com/pipecat-ai/pipecat-client-web) / [voice-ui-kit](https://github.com/pipecat-ai/voice-ui-kit) | 326 / 419 | 2026-10 | BSD-2 | Browser client and React components for Pipecat | Debug console components |
| [pipecat-ai/pipecat-flows](https://github.com/pipecat-ai/pipecat-flows) | 626 | 2026-07-05 | BSD-2 | **Archived**. Merged into pipecat core. Read its examples only | — |
| [TEN-framework/ten-framework](https://github.com/TEN-framework/ten-framework) | 11.2k | 2026-10-17 | Other (Apache-2.0 + extra conditions) | Graph-based multi-language agent runtime with its own VAD and turn detector | Heavy (C++ core, designer UI, Agora coupling). License conditions add friction. Not recommended |
| [kyutai-labs/unmute](https://github.com/kyutai-labs/unmute) | 1.5k | 2026-09-09 | MIT | Reference low-latency cascaded stack (Kyutai STT/TTS around any LLM). Good to learn semantic VAD and streaming tricks from | Only EN/FR STT and TTS, so no Dutch |
| [kyutai-labs/moshi](https://github.com/kyutai-labs/moshi) | 11.3k | 2026-09-09 | Apache-2.0 (code), CC-BY-4.0 (weights) | Full-duplex speech-to-speech, ~200 ms. Benchmark reference only | You can't steer it with a structured interview guide, and it has no Dutch |
| [fixie-ai/ultravox](https://github.com/fixie-ai/ultravox) | 4.6k | 2025-12-12 | MIT | Speech-in LLM (skips STT). Training code | Slowing activity, text-out only, weak Dutch. Skip |
| [huggingface/speech-to-speech](https://github.com/huggingface/speech-to-speech) | 13.5k | 2026-10-16 | Apache-2.0 | Fully local modular VAD→STT→LLM→TTS reference | No WebRTC or browser transport, no turn model. Prototype only |
| [openai/openai-realtime-agents](https://github.com/openai/openai-realtime-agents) | 7.0k | 2026-01-07 | MIT | Agent-handoff and "supervisor" patterns worth copying | Locked to the proprietary OpenAI Realtime API |
| [openai/openai-agents-js](https://github.com/openai/openai-agents-js) | 3.9k | 2026-10-16 | MIT | Realtime-agent SDK (browser WebRTC to OpenAI) | Proprietary model lock-in |
| [dograh-hq/dograh](https://github.com/dograh-hq/dograh) | 5.9k | 2026-10-17 | BSD-2 | OSS Vapi clone (workflow builder on Pipecat) | Built for telephony and call centers. Too heavy for this use |
| [bolna-ai/bolna](https://github.com/bolna-ai/bolna) | 796 | 2026-10-16 | MIT | Telephony voice agents | Phone-first, no browser focus. Skip |
| [vocodedev/vocode-core](https://github.com/vocodedev/vocode-core) | 3.8k | 2024-11-15 | MIT | — | **Dead** (no push for 2 years). Drop |

**Recommended pick: LiveKit Agents (Python) + agent-starter-react.** It has the best open turn detector for Dutch (benchmark below), preemptive generation, mature interruption handling, production WebRTC with browser auto-reconnect, and text-only sessions on the same agent code. **Runner-up: Pipecat**, if you want a pure BSD stack, P2P WebRTC without an SFU, and the Flows state machine. OASIS (§4) is already built on Pipecat.

---

## 2. Turn detection / VAD

| Repo / model | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [snakers4/silero-vad](https://github.com/snakers4/silero-vad) | 10.5k | 2026-09-29 | MIT | Frame-level speech/non-speech (<1 ms per 30 ms chunk on CPU). The first gate in every stack | — |
| [livekit turn-detector](https://huggingface.co/livekit/turn-detector) (in livekit/agents) | — | 2026 | LiveKit Model License (use with LiveKit Agents) | Semantic end-of-turn on transcript text. Multilingual model covers 14 languages **incl. Dutch** (HF card: nl TPR 99.3%, TNR 88.1%). [eot-bench](https://github.com/livekit/eot-bench) (vendor-run): 9.9% false cutoffs at 300 ms vs 35.2% for Smart Turn v3.2 | Deprecated English-only model |
| [pipecat-ai/smart-turn](https://github.com/pipecat-ai/smart-turn) | 1.6k | 2026-01-29 | BSD-2 (open weights and training code) | Audio-native end-of-turn (hears prosody), 23 languages **incl. Dutch** (vendor: 96.3% nl accuracy), ~12 ms CPU, 8.7 MB. Can be fine-tuned on your own interview audio | — |
| [TEN-framework/ten-vad](https://github.com/TEN-framework/ten-vad) / [ten-turn-detection](https://github.com/TEN-framework/ten-turn-detection) | 2.3k / 619 | 2026-10 / 2025-12 | Other | Alternative VAD and text EOT. Turn model is EN/ZH | Restrictive license, no Dutch EOT |
| [ricky0123/vad](https://github.com/ricky0123/vad) | 2.1k | 2026-09-12 | ISC-style (NOASSERTION in API) | Silero in the browser (ONNX-web). Only for a client-side "speaking" indicator or text-fallback push-to-talk | — |

**Recommended pick: silero-vad + LiveKit multilingual turn detector.** It has the lowest false-cutoff rate with Dutch support. Never interrupting an expert who is thinking is *the* precision metric for interviews. If you choose Pipecat: Smart Turn v3, fine-tuned on recorded expert pauses.
**Interview-specific tuning:** set `min_endpointing_delay` to about 0.5 s and `max_endpointing_delay` to 3–4 s, which is longer than customer-service defaults. Experts pause mid-thought. Use a backchannel-safe interruption setting (ignore "ja"/"mm-hm" under ~500 ms).

---

## 3a. STT

| Repo / model | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| **[nvidia/nemotron-3.5-asr-streaming-0.6b](https://huggingface.co/nvidia/nemotron-3.5-asr-streaming-0.6b)** via [NVIDIA-NeMo/Speech](https://github.com/NVIDIA/NeMo) | 18.6k (NeMo) | 2026-06 (model) / 2026-10-17 | OpenMDW-1.1 (commercial OK) | **Live streaming STT.** 40 languages incl. nl/de, chunks 80 ms–1.12 s, punctuation and casing built in. FLEURS WER nl 14.0% (80 ms) → 11.5% (1.12 s), de 9.8 → 8.3 | NeMo training stack. Serve with NeMo/Riva or sherpa-onnx |
| [mistralai Voxtral-Mini-4B-Realtime-2602](https://huggingface.co/mistralai/Voxtral-Mini-4B-Realtime-2602) | (HF only) | 2026-02 | Apache-2.0 | Alternative live STT. 13 languages incl. nl/de, delay configurable 80–1200 ms (480 ms ≈ offline accuracy), served via vLLM Realtime API, ≥16 GB GPU. C port: [antirez/voxtral.c](https://github.com/antirez/voxtral.c) (1.7k, MIT) | 4B is heavier than the 0.6B Nemotron |
| [nvidia/parakeet-tdt-0.6b-v3](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3) / canary-1b-v2 | — | 2025-09 | CC-BY-4.0 | **Second-pass, high-accuracy final transcript** of the whole recording (25 EU languages incl. nl, word timestamps, very fast) | — |
| [k2-fsa/sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) | 15.3k | 2026-10-17 | Apache-2.0 | ONNX runtime for Parakeet/Nemotron/Moonshine/Silero on CPU/GPU/WASM. Simplest deployment | Mobile/embedded bindings |
| [m-bain/whisperX](https://github.com/m-bain/whisperX) | 24.6k | 2026-09-26 | BSD-2 | Post-call word alignment + pyannote diarization (interviewer vs expert) when Whisper-large-v3 accuracy is wanted | Live use |
| [pyannote/pyannote-audio](https://github.com/pyannote/pyannote-audio) | 10.7k | 2026-10-16 | MIT (code). Models are gated on HF | Diarization. Mostly unneeded, because the agent's own audio is on a separate track | — |
| [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) | 25.9k | 2026-10-16 | MIT | Whisper-large-v3(-turbo) batch fallback, broad language coverage | Not streaming-native |
| [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp) | 54.4k | 2026-10-12 | MIT | CPU/Metal/WASM Whisper (in-browser offline fallback) | — |
| [QuentinFuxa/WhisperLiveKit](https://github.com/QuentinFuxa/WhisperLiveKit) | 11.1k | 2026-10-01 | Apache-2.0 | Streaming Whisper (SimulStreaming) + live diarization server. Good if you insist on Whisper | Its own web UI |
| [microsoft/VibeVoice](https://github.com/microsoft/VibeVoice) (ASR-7B) | 54.9k | 2026-10-08 | MIT ("research and development only" notice) | 60-min single-pass ASR with speakers and timestamps (50+ languages). Candidate for second-pass transcription | TTS (removed), research-only caveat |
| [moonshine-ai/moonshine](https://github.com/moonshine-ai/moonshine) | 11.2k | 2026-10-02 | MIT. Legacy non-English models are non-commercial | Edge/in-browser English streaming | Dutch not confirmed |
| [kyutai-labs/delayed-streams-modeling](https://github.com/kyutai-labs/delayed-streams-modeling) (Kyutai STT) | 3.0k | 2026-01-26 | Apache-2.0 / CC-BY | Excellent EN/FR streaming with semantic VAD | **No Dutch**. Skip |
| [KoljaB/RealtimeSTT](https://github.com/KoljaB/RealtimeSTT), [collabora/WhisperLive](https://github.com/collabora/WhisperLive), [ufal/whisper_streaming](https://github.com/ufal/whisper_streaming) | 10.2k / 4.3k / 3.7k | 2026-10 / 2026-10 / 2025-11 | MIT | Hobby-grade streaming wrappers. Superseded by the framework plugins above | — |

**Recommended pick: two-pass STT.** Live: **Nemotron-3.5-ASR-Streaming 0.6B** at a 160 ms chunk. It is commercial, multilingual (nl/de), has punctuation, and fits one small GPU. Post-call: **Parakeet-TDT-0.6B-v3**, or WhisperX, over the full per-track recording, so the wiki gets the cleanest transcript. Keyword/hotword boosting from the template and company glossary raises precision on jargon.

## 3b. TTS

| Repo | Stars | Last push | License | Dutch? | Use it for | Strip |
|---|---|---|---|---|---|---|
| **[resemble-ai/chatterbox](https://github.com/resemble-ai/chatterbox)** (Multilingual V3, 500M) | 27.0k | 2026-07-21 | MIT | **Yes** (23+ langs) | Best open **commercial** Dutch/German TTS quality. Zero-shot voice from a 10 s reference. Turbo (350M) and Nano (110M, CPU) are **English-only** | No native streaming in the repo: stream per sentence. Perth watermark is embedded (keep it, for AI disclosure) |
| [devnen/Chatterbox-TTS-Server](https://github.com/devnen/Chatterbox-TTS-Server) | 1.5k | 2026-05-26 | MIT | — | OpenAI-compatible server wrapper for Chatterbox (chunked) | Web UI |
| [QwenLM/Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS) | 13.8k | 2026-03-17 | Apache-2.0 | **No** (10 languages incl. de/en) | Fastest streaming open TTS (97 ms first packet) for EN/DE sessions | — |
| [kyutai-labs/pocket-tts](https://github.com/kyutai-labs/pocket-tts) | 9.9k | 2026-10-16 | MIT | **No** (en/fr/de/es/pt/it) | 100M, CPU-only, ~200 ms first audio, voice cloning. Cheapest EN/DE TTS | — |
| [hexgrad/kokoro](https://github.com/hexgrad/kokoro) (+ [remsky/Kokoro-FastAPI](https://github.com/remsky/Kokoro-FastAPI)) | 9.4k / 5.6k | 2025-08 / 2026-10 | Apache-2.0 | **No** | 82M, very fast English | — |
| [OHF-Voice/piper1-gpl](https://github.com/OHF-Voice/piper1-gpl) | 5.9k | 2026-10-16 | **GPL-3.0** | Yes (nl_NL, nl_BE voices) | CPU, near-instant Dutch fallback. Robotic but reliable. Run it as a separate process to keep GPL contained | Old rhasspy/piper is archived |
| [microsoft/VibeVoice](https://github.com/microsoft/VibeVoice) Realtime-0.5B | 54.9k | 2026-10-08 | MIT ("R&D only" notice) | Experimental nl voice | ~300 ms first audio, streaming text input. Watch, but don't ship | — |
| [fishaudio/fish-speech](https://github.com/fishaudio/fish-speech) | 33.2k | 2026-10-14 | Other (Fish research license, **non-commercial**) | 80+ langs | Top open-weight quality on leaderboards. Commercial use needs a paid license | — |
| [QwenAudio/CosyVoice](https://github.com/FunAudioLLM/CosyVoice) | 24.0k | 2026-05-25 | Apache-2.0 | No (Dutch not confirmed) | 150 ms streaming, mostly zh/en/ja/ko | — |
| [SWivid/F5-TTS](https://github.com/SWivid/F5-TTS) | 15.4k | 2026-10-14 | MIT code / CC-BY-NC weights | Community finetunes | Non-commercial weights | — |
| [idiap/coqui-ai-TTS](https://github.com/idiap/coqui-ai-TTS) (XTTS-v2) | 2.3k | 2026-10-16 | MPL-2.0 code / CPML weights (non-commercial) | Yes | Legacy. License blocks it | — |
| [canopyai/Orpheus-TTS](https://github.com/canopyai/Orpheus-TTS), [SesameAILabs/csm](https://github.com/SesameAILabs/csm), [nari-labs/dia](https://github.com/nari-labs/dia), [index-tts](https://github.com/index-tts/index-tts), [Spark-TTS](https://github.com/SparkAudio/Spark-TTS), [ChatTTS](https://github.com/2noise/ChatTTS) | 6–40k | mostly 2025 | mixed | No | EN/ZH-centric, stale, or AGPL. Skip | — |

**Recommended pick: Chatterbox Multilingual V3 for nl (sentence-chunked streaming); Qwen3-TTS or Pocket TTS for en/de sessions; Piper nl as CPU failover.** Honest gap: no open model in Oct 2026 delivers commercial-licensed Dutch at <150 ms first audio. If the latency target is strict, keep TTS behind the framework's plugin interface and fall back to a hosted Dutch TTS (ElevenLabs Flash / Cartesia). That is a one-line swap in LiveKit/Pipecat.

---

## 4. Open-source AI interviewer projects and methodology

| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| **[oasis-surveys/oasis-platform](https://github.com/oasis-surveys/oasis-platform)** | 29 | 2026-09-30 | AGPL-3.0 | Closest existing analog: Pipecat-based **voice + text** interview agents. Semi-structured guides (questions → probes → transitions, CSV/JSON). Rule-based adaptive engagement scoring (latency, answer length, fillers) mapped to actions (offer break, soften question). Shadow-mode policies. Full audit log. React/FastAPI/Postgres+pgvector | Qualtrics/LimeSurvey embedding, survey-research admin. **AGPL**: copy the design and prompt schema, not the code (or isolate it as a service) |
| **[linxule/openinterviewer](https://github.com/linxule/openinterviewer)** | 28 | 2026-10-16 | MIT | Qualitative-research interviewer: study setup → participant link → adaptive interview → transcript + synthesis dashboard. Multi-LLM (Claude/Gemini/OpenAI/OpenRouter). MIT, so code reuse is fine for the text-mode flow and synthesis | Demo/scripted modes |
| [friedrichgeiecke/interviews](https://github.com/friedrichgeiecke/interviews) | 71 | 2026-02-09 | Other (check) | Code and prompts behind *"Conversations at Scale: Robust AI-led Interviews"* (Geiecke & Jaravel, LSE). Validated interviewer system prompt, topic-coverage logic, and safety/off-topic moderation. The research-backed baseline | Streamlit UI |
| [umars28/ai-interviewer](https://github.com/umars28/ai-interviewer) | 0 | 2026-09-26 | none | Ideas only: probe-vs-move-on decision, leading-question rejection, cap on consecutive follow-ups, **quote verification by string match** (useful for wiki precision) | Everything else (no license) |
| [cookiy-ai/user-research-skill](https://github.com/cookiy-ai/user-research-skill) | 1.6k | 2026-10-16 | MIT | Agent-skill prompts for discussion-guide authoring and synthesis | Cookiy SaaS coupling |
| [coopersimson96/aar-loop](https://github.com/coopersimson96/aar-loop) | 89 | 2026-07-26 | MIT | Compact AAR prompt (planned vs actual vs why vs lessons). Template starting point | Claude-session specifics |
| [rafaelrubiao/ai-interview-toolkit](https://github.com/rafaelrubiao/ai-interview-toolkit) | 1 | 2026-07-30 | — | Qualtrics AI-led interview template: probe wording examples | — |
| Hiring "AI interviewer" repos (e.g. [videosdk-community/ai-agent](https://github.com/videosdk-community/ai-agent), many 0–30 star clones) | <30 | — | — | Nothing reusable beyond tutorial code | Drop |

**No GitHub repo implements Critical Decision Method / ACTA / AAR elicitation for an LLM interviewer** (searched: "critical decision method", "tacit knowledge interview", "knowledge elicitation llm", "after action review"). Write these templates in-house from the primary methods:
- **After Action Review** (US Army TC 25-20): 1) What was supposed to happen? 2) What actually happened? 3) Why the difference? 4) What to sustain / what to improve? Probe each with "concrete example?" and "who/when/what signal?".
- **Critical Decision Method** (Klein, Calderwood & MacGregor 1989; Crandall, Klein & Hoffman, *Working Minds* 2006): four sweeps. (1) Incident selection: a non-routine case. (2) Timeline construction. (3) Deepening at decision points: cues, goals, options considered, expectancies, knowledge used, analogues. (4) What-if: novice vs expert, a changed cue. This is the best fit for tacit-knowledge capture in Exit Interviews.
- **ACTA** (Militello & Hutton 1998): task diagram → knowledge audit (past/future, big picture, noticing, job smarts, improvising, self-monitoring, anomalies) → simulation interview. This is the best fit for **Process Mapping**.
- Open-access LLM evidence: *Investigating Knowledge Elicitation Automation with LLMs* (Semantic Web Journal, swj3868), which uses ACTA-style adaptive probing and has a public data repo.

**Recommended pick: build the interview engine as an explicit state machine** (LiveKit `AgentTask`/handoffs or `pipecat.flows`). Model it on OASIS's guide schema (question → probes → exit criteria), use Geiecke & Jaravel's validated interviewer prompt as the base persona, and have the template prompts encode AAR/CDM/ACTA sweeps. Add a coverage tracker (which slots are filled), a follow-up cap, a 30-min time budget per stage, and quote verification before wiki ingestion.

---

## 5. Text-mode fallback chat UI

| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| **[assistant-ui/assistant-ui](https://github.com/assistant-ui/assistant-ui)** | 12.6k | 2026-10-17 | MIT | React chat primitives (streaming, markdown, attachments). Drop into the same Next.js app as the voice client | Thread list, tool UIs you don't need |
| [vercel/chatbot](https://github.com/vercel/chatbot) | 21.0k | 2026-07-08 | Other (Apache-style) | Full Next.js + AI SDK reference app | Auth, history, artifacts, model picker. Most of it |
| [huggingface/chat-ui](https://github.com/huggingface/chat-ui) | 11.0k | 2026-10-16 | Apache-2.0 | SvelteKit alternative | Assistants, multi-model, MongoDB |
| [CopilotKit/CopilotKit](https://github.com/CopilotKit/CopilotKit) | 38.1k | 2026-10-17 | MIT | In-app copilot framework | Overkill. Skip |
| [open-webui/open-webui](https://github.com/open-webui/open-webui) | 156k | 2026-10-16 | Other (branding clause) | — | Wrong shape (admin chat app). Skip |

**Recommended pick: assistant-ui in the same Next.js client as agent-starter-react.** Send text over the LiveKit data channel/text stream (or Pipecat RTVI) to the **same agent session**, so voice and text share one interview state machine and the user can switch mid-interview (for example, a noisy environment).

---

## Recommended end-to-end pipeline

```
Browser (Next.js: agent-starter-react + assistant-ui, no install)
  │ WebRTC (Opus, AEC/NS in browser)       ← text fallback over data channel
  ▼
LiveKit server (self-host, Apache-2.0) ── per-track recording (egress) ──► post-call pass
  ▼
LiveKit Agent worker (Python)
  silero-vad → Nemotron-3.5-ASR-Streaming (160 ms chunks, glossary boost)
            → multilingual turn-detector (nl/en/de)
            → LLM (interview state machine: AAR / Exit(CDM) / Process(ACTA))
              with preemptive generation on interim transcript
            → TTS (Chatterbox-ML nl | Qwen3-TTS/Pocket en/de | Piper nl failover), sentence-streamed
Post-call: Parakeet-TDT-v3 (or WhisperX) on per-speaker tracks → clean transcript
           → quote-verified structured extraction → wiki ingestion
```

### Latency budget (end of user speech → first agent audio), GPU-hosted in EU region

| Stage | Target p50 | Notes |
|---|---|---|
| Uplink network + jitter | 40 ms | WebRTC, EU POP |
| VAD silence + turn-detector decision | 200–300 ms | Semantic EOT lets you commit early on complete utterances. Extend to 3–4 s on incomplete ones (thinking pauses). Never cut an expert off |
| STT finalization | 50–100 ms | Streaming partials already present. Only the last chunk is left |
| LLM time-to-first-token | 200–350 ms | Preemptive generation hides part of this. Keep the system prompt cached, and keep the first sentence short (acknowledge + question) |
| TTS time-to-first-audio | 100–250 ms | Qwen3/Pocket ~100–200 ms. Chatterbox-ML sentence chunk ~200–300 ms on L4/A10-class GPU (benchmark it) |
| Downlink + playout buffer | 50 ms | |
| **Total** | **~650–1,100 ms** | Matches commercial voice agents (~800 ms). Precision (no false cutoffs, relevant probes) matters more than shaving the last 100 ms in a 30-min expert interview |

Validate with LiveKit/Pipecat built-in metrics (`eou_delay`, `ttft`, `ttfb`) and [livekit/eot-bench](https://github.com/livekit/eot-bench) on recorded Dutch expert audio before locking models.
