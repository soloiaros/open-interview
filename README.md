# Tacit

An open-source MVP of [Tacivo](https://tacivo.com)'s core feature: an AI interviewer that pulls what an expert knows out of their head, by voice or text, and writes it up. Published interviews feed a small wiki you can ask questions of.

Research behind the stack: [REPOS.md](REPOS.md). Design rules: [docs/design-spec.md](docs/design-spec.md).

## Start

You need Node 20+, Python 3.11+, and an Anthropic API key. On macOS you also need Go, used once to build the LiveKit server, because LiveKit ships no macOS binary.

```bash
npm run setup     # installs everything locally: web deps, LiveKit server, Python agent, speech models (~1 GB)
# put ANTHROPIC_API_KEY in .env
npm run dev       # starts Postgres (embedded), LiveKit, the web app, and the voice agent
```

Open http://localhost:3000, create an account, and press **Start interview**. Nothing is installed system-wide, and Docker isn't needed.

## How fast, how cheap

| Stage | Runs on | Measured on an M-series laptop |
|---|---|---|
| Speech to text | faster-whisper `base.en`, local CPU | 0.45 s for a 4.5 s answer |
| End of turn | LiveKit turn detector `v1-mini`, local | runs alongside VAD |
| Interviewer reply | Claude Haiku 5.5, no thinking, low effort | network bound, first token in well under a second |
| Text to speech | Kokoro-82M int8 (ONNX), local CPU | 0.58 s for a 4 s sentence |

The only paid part is Claude Haiku 5.5, at $0.10 per million input tokens and $0.50 per million output tokens. By estimate, a 15-minute interview plus its draft and wiki update costs about 2 to 3 cents. That assumes roughly 30 turns at around 3k prompt tokens each, plus one coverage check per turn; prompt caching lowers it further.

## What it does

- **Interviews:** five modes, each following a published elicitation method:
  - after action review (US Army AAR)
  - exit interview (Klein's Critical Decision Method)
  - process mapping (ACTA)
  - handover
  - self review
- **During the interview:**
  - Text or voice, switchable mid-session. Voice runs in the browser with no install.
  - Topics are planned from your one-line goal, and topic coverage updates live.
  - Notes build up as the expert talks, and the expert can correct them. Corrections override the transcript.
  - An optional must-cover checklist.
- **Draft:** one click writes the interview up. The expert edits it, confirms it, and publishes.
- **Wiki and Ask:**
  - Publishing files the interview into wiki pages. A fact only reaches a page if its quote matches the transcript.
  - Every fact links to the transcript line it came from.
  - Ask answers only from those pages and transcripts, with sources.
- **Secondary, built but lightly tested:** Create (SOPs, handovers, training), Notion export, an MCP endpoint at `/api/mcp`.

## Layout

```
apps/web     Next.js 16: UI, API routes, ingest worker (pg-boss), MCP endpoint
apps/agent   LiveKit voice agent: silero VAD, faster-whisper, turn detector, Claude Haiku 5.5, Kokoro
scripts/     setup.mjs (one-time install), dev.mjs (starts everything)
```

## Configuration

Everything is optional except the API key. See `.env.example`.
- **Speech-to-text:** `STT_MODEL=tiny.en` is faster still (0.19 s), and `small.en` is more accurate on heavy accents.
- **Voice:** `TTS_VOICE` picks any Kokoro voice.
- **Database:** `DATABASE_URL` uses your own Postgres instead of the embedded one.
- **LLM:** `LLM_MODEL=claude-opus-5-5` gives better follow-up questions at higher cost and latency.

## Tests

`cd apps/web && npm test` runs the unit tests (quote grounding, markdown parsing). `npm run typecheck` checks types.

## Where the build differs from REPOS.md

| REPOS.md pick | MVP uses | Why |
|---|---|---|
| Vercel AI SDK + AI Elements | Official Anthropic SDK; own components; Streamdown | Model calls go through the official SDK, and the components follow the App&Flow style. |
| Opus-class model | Claude Haiku 5.5 | Cheapest and fastest. Live turns run with thinking off. |
| Nemotron STT (GPU) | faster-whisper `base.en` (CPU) | No GPU needed; measured 0.45 s per answer. |
| Qwen3-TTS (GPU) / Kokoro server | Kokoro int8 inside the agent | No GPU and no extra server. |
| Postgres + pgvector + pg_textsearch | Embedded Postgres, built-in full-text search | One command, no Docker, no extensions. |
| LiveKit turn-detector plugin | `inference.TurnDetector(version="v1-mini")` | The old plugin is deprecated in Agents 1.8; v1-mini runs locally. |
