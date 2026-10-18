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

## Open-source repositories

These are the open-source repositories this build takes from. The framework around them (Next.js, Tailwind, Radix, Drizzle, Postgres) is omitted. The full research list is in [REPOS.md](REPOS.md).

### Used

| Repo | What it does here | Why | Left out |
|---|---|---|---|
| [livekit/livekit](https://github.com/livekit/livekit) | WebRTC room, token, agent dispatch | Browser voice with no install | SIP, phone ingress |
| [livekit/agents](https://github.com/livekit/agents) | Agent joins the room, interruptions, early reply, local turn detector | Same interview as text, spoken | Telephony, avatars, unused speech plugins, Cloud interruption |
| [livekit/components-js](https://github.com/livekit/components-js) | Listening / thinking / speaking bar | Smallest interview screen | Video, screen share, prefab theme. The React starter was not forked |
| [snakers4/silero-vad](https://github.com/snakers4/silero-vad) | Speech / non-speech gate | Needed before transcription | — |
| [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) | CPU transcript, one utterance at a time | No GPU | Streaming partials, multilingual models |
| [hexgrad/kokoro](https://github.com/hexgrad/kokoro) | English voice inside the agent | No extra speech server | Other languages, the Kokoro HTTP server |
| [better-auth/better-auth](https://github.com/better-auth/better-auth) | Email, password, one org per team | Self-serve start | SSO, magic links, Stripe plugin |
| [timgit/pg-boss](https://github.com/timgit/pg-boss) | Ingest queue after publish | Jobs stay in Postgres | Nightly lint |
| [Tencent/WeKnora](https://github.com/Tencent/WeKnora) | Ingest shape: page plan, dedup, citations, slugs, revisions | Main wiki design. The code is rewritten here | Vue app, Neo4j, Feishu, DingTalk, multimodal |
| [xoai/sage-wiki](https://github.com/xoai/sage-wiki) | A claim keeps its quote, source, and time. A disagreement stays visible | Evidence model | TUI, Obsidian, federation |
| [mem0ai/mem0](https://github.com/mem0ai/mem0) | Merge choice: add, support, supersede, contradict, or noop | Only the decision prompt | Chat-memory runtime |
| [Future-House/paper-qa](https://github.com/Future-House/paper-qa) | Ask cites a source, or says the wiki has no answer | Refusal rule | Paper clients |
| [mermaid-js/mermaid](https://github.com/mermaid-js/mermaid) | Decision-tree block inside a document | A diagram without a second editor | — |
| [dolanmiu/docx](https://github.com/dolanmiu/docx) | Word download | One file export | — |
| [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) | `search_wiki`, `get_page`, `list_pages`, `ask`, `create_document` | Other agents can read the wiki | — |
| [vercel/streamdown](https://github.com/vercel/streamdown) | Ask and Create while tokens are still arriving | Streaming markdown | KaTeX |
| [remarkjs/react-markdown](https://github.com/remarkjs/react-markdown) | Finished wiki page, page links, claim citations | Stable page render | — |
| [uiwjs/react-codemirror](https://github.com/uiwjs/react-codemirror) | Draft editor and wiki editor | The expert verifies the draft before publish | — |
| [dip/cmdk](https://github.com/dip/cmdk) | Wiki search palette | Jump to a page | — |
| [vasturiano/react-force-graph](https://github.com/vasturiano/react-force-graph) | 2D graph of page links | See how pages connect | 3D, VR |
| [motiondivision/motion](https://github.com/motiondivision/motion) | Landing page motion | One marketing surface | Spring overshoot |
| [hardikpandya/stop-slop](https://github.com/hardikpandya/stop-slop) | Eight writing rules on every prose prompt | Less generic generated text | Full skill text at runtime |
| [oil-oil/oil-ui](https://github.com/oil-oil/oil-ui) | Skill used while the screens were designed | Direction and review, not a component library | Update check, Pro ad |

### Studied, not used

| Group | Repositories | Why they stayed out |
|---|---|---|
| Heavier voice | [k2-fsa/sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx), [kyutai-labs/delayed-streams-modeling](https://github.com/kyutai-labs/delayed-streams-modeling), [m-bain/whisperX](https://github.com/m-bain/whisperX), [QwenLM/Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS), [kyutai-labs/pocket-tts](https://github.com/kyutai-labs/pocket-tts), [resemble-ai/chatterbox](https://github.com/resemble-ai/chatterbox), [kyutai-labs/unmute](https://github.com/kyutai-labs/unmute) | GPU, an extra process, or a quality test this build has not run |
| Retrieval and extraction | [pgvector/pgvector](https://github.com/pgvector/pgvector), [timescale/pg_textsearch](https://github.com/timescale/pg_textsearch), [HKUDS/LightRAG](https://github.com/HKUDS/LightRAG), [getzep/graphiti](https://github.com/getzep/graphiti), [tobi/qmd](https://github.com/tobi/qmd), [google/langextract](https://github.com/google/langextract), [567-labs/instructor](https://github.com/567-labs/instructor) | Keyword search and a local quote check cover the first wiki |
| Document generation | [dzhng/deep-research](https://github.com/dzhng/deep-research), [stanford-oval/storm](https://github.com/stanford-oval/storm), [assafelovic/gpt-researcher](https://github.com/assafelovic/gpt-researcher), [xyflow/xyflow](https://github.com/xyflow/xyflow), [typst/typst](https://github.com/typst/typst), [jgm/pandoc](https://github.com/jgm/pandoc), [gitbrent/PptxGenJS](https://github.com/gitbrent/PptxGenJS), [jcputney/scorm-again](https://github.com/jcputney/scorm-again), [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs), [meta-llama/synthetic-data-kit](https://github.com/meta-llama/synthetic-data-kit), [argilla-io/distilabel](https://github.com/argilla-io/distilabel) | Create is one writing pass plus a Mermaid tree and a Word file. Their prompts were the reference |
| Platform | [vercel/ai](https://github.com/vercel/ai), [maximhq/bifrost](https://github.com/maximhq/bifrost), [BerriAI/litellm](https://github.com/BerriAI/litellm), [langfuse/langfuse](https://github.com/langfuse/langfuse), [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo), [stanfordnlp/dspy](https://github.com/stanfordnlp/dspy), [hatchet-dev/hatchet](https://github.com/hatchet-dev/hatchet), [basecamp/kamal](https://github.com/basecamp/kamal), [coollabsio/coolify](https://github.com/coollabsio/coolify) | One model, one machine, `npm run dev` |
| License blocks | [outline/outline](https://github.com/outline/outline), [docmost/docmost](https://github.com/docmost/docmost), [requarks/wiki](https://github.com/requarks/wiki), [infiniflow/ragflow](https://github.com/infiniflow/ragflow), [onyx-dot-app/onyx](https://github.com/onyx-dot-app/onyx), [paradedb/paradedb](https://github.com/paradedb/paradedb), [open-webui/open-webui](https://github.com/open-webui/open-webui), [ConardLi/easy-dataset](https://github.com/ConardLi/easy-dataset) | BSL, AGPL, a proprietary directory, or a branding clause |
