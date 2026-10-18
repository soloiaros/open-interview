# Open Interview

Open Interview is an open-source implementation of the [Tacivo](https://tacivo.com) capture loop. You interview an expert by text or voice, edit the draft, and publish it. Publish writes wiki pages. Ask answers from those pages and from the transcript.

Stack research: [REPOS.md](REPOS.md). UI rules: [docs/design-spec.md](docs/design-spec.md).

## Requirements

Node 20+, Python 3.11+, and an Anthropic API key. On macOS, install Go. LiveKit publishes no macOS server binary, so `npm run setup` compiles it.

```bash
npm run setup
# set ANTHROPIC_API_KEY in .env
npm run dev
```

`setup` installs web dependencies, the LiveKit server, the Python agent, and speech models (~1 GB) inside the repo. `dev` starts embedded Postgres, LiveKit, the Next.js app, and the voice agent as host processes.

Open http://localhost:3000, create an account, and start an interview.

## Latency and cost

| Stage | Runtime | M-series laptop |
|---|---|---|
| Speech to text | faster-whisper `base.en`, CPU, int8 | 0.45 s for a 4.5 s utterance |
| End of turn | LiveKit turn detector `v1-mini` | runs in the same process as Silero VAD |
| Interviewer | Claude Haiku 5.5, thinking disabled, effort `low` | time to first token is the network round trip |
| Speech synthesis | Kokoro-82M int8, ONNX, CPU | 0.58 s for a 4 s sentence |

Haiku 5.5 is the billed API: $0.10 per million input tokens, $0.50 per million output tokens. A 15-minute session plus its draft and wiki update costs ~$0.02–$0.03 at 30 turns, ~3,000 prompt tokens per turn, and one coverage call per turn. Prompt caching removes the repeated system prompt from later input tokens.

## Runtime behavior

Modes:

- After action review (US Army TC 25-20)
- Exit interview (Klein, Critical Decision Method)
- Process mapping (Militello and Hutton, ACTA)
- Handover
- Self review

On create, the app sends mode, goal, and background to a planner. The planner returns 5–7 topic labels in method order. If that call exceeds 4 seconds, the app inserts `DEFAULT_TOPICS` for the mode.

Text and voice use one system prompt and one `utterance` table. The voice path is a LiveKit room in the browser. After each expert turn, a coverage call marks topics and checklist items and appends notes. Notes flagged `byUser` override the transcript in the draft and in wiki prompts.

Generate draft writes one markdown section per covered topic. You edit that draft, confirm it, and publish. Publish stores the transcript as a `source` row and enqueues `ingest-source` on pg-boss.

Ingest plans pages, extracts claims, and keeps a claim when `locateQuote` finds the quote in the expert's lines. Merge labels are `add`, `support`, `supersede`, `contradict`, and `noop`. Ask and Create search `page.search_text` and `chunk.text` with `to_tsvector('english')` and attach the hit numbers. Ask returns a fixed refusal when both result sets are empty.

Create (handover, SOP, onboarding guide, training module, decision tree), Notion export, and `POST /api/mcp` ship in this tree. `npm test` covers quote grounding and markdown parsing.

## Layout

```
apps/web     Next.js 16: UI, route handlers, pg-boss worker, /api/mcp
apps/agent   LiveKit agent: Silero VAD, faster-whisper, turn detector v1-mini, Haiku 5.5, Kokoro
scripts/     setup.mjs, dev.mjs
```

## Configuration

`.env.example` lists every variable. `ANTHROPIC_API_KEY` is required.

| Variable | Effect |
|---|---|
| `STT_MODEL=tiny.en` | 0.19 s for a 4.5 s utterance. `small.en` loads a larger English checkpoint. |
| `TTS_VOICE` | Kokoro voice id. Default `af_heart`. |
| `DATABASE_URL` | External Postgres. Unset, `dev` uses embedded Postgres. |
| `LLM_MODEL` | Default `claude-haiku-5-5`. `claude-opus-5-5` raises latency and token cost. |

## Tests

From `apps/web`: `npm test` runs the unit tests. `npm run typecheck` runs `tsc --noEmit`.

## Open-source repositories

| Repository | Role in this tree |
|---|---|
| [livekit/livekit](https://github.com/livekit/livekit) | WebRTC server. The web app mints a join token and dispatches the agent. |
| [livekit/agents](https://github.com/livekit/agents) | Python session: Silero VAD, faster-whisper, `TurnDetector` `v1-mini`, Haiku 5.5, Kokoro. Endpointing waits 0.6–4.0 s. |
| [livekit/components-js](https://github.com/livekit/components-js) | `LiveKitRoom`, `useVoiceAssistant`, and `BarVisualizer` on the interview screen. |
| [snakers4/silero-vad](https://github.com/snakers4/silero-vad) | Speech and non-speech segments. `min_silence_duration` is 0.5 s. |
| [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) | `base.en`, int8, one VAD-bounded utterance per call, on CPU. |
| [hexgrad/kokoro](https://github.com/hexgrad/kokoro) | English TTS through `kokoro-onnx`, int8, inside the agent process. |
| [better-auth/better-auth](https://github.com/better-auth/better-auth) | Email and password sessions. The organization plugin is the team id on each row. |
| [timgit/pg-boss](https://github.com/timgit/pg-boss) | Queue `ingest-source` after publish. Two retries, 30 s delay. |
| [Tencent/WeKnora](https://github.com/Tencent/WeKnora) | Ingest design in `apps/web/src/lib/ingest.ts`: page plan, dedup, citations, slugs, revisions. |
| [xoai/sage-wiki](https://github.com/xoai/sage-wiki) | A claim stores quote, source, and `t_start_ms`. Status `contested` keeps both sides. |
| [mem0ai/mem0](https://github.com/mem0ai/mem0) | Merge labels in `MERGE_SYSTEM`: add, support, supersede, contradict, noop. |
| [Future-House/paper-qa](https://github.com/Future-House/paper-qa) | Ask cites retrieved numbers. Empty retrieval returns `NO_ANSWER`. |
| [mermaid-js/mermaid](https://github.com/mermaid-js/mermaid) | Renders a `flowchart TD` block on decision-tree documents. |
| [dolanmiu/docx](https://github.com/dolanmiu/docx) | Export route builds a `.docx` from the document markdown. |
| [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) | `POST /api/mcp`: `search_wiki`, `get_page`, `list_pages`, `ask`, `create_document`. |
| [vercel/streamdown](https://github.com/vercel/streamdown) | Renders Ask and Create markdown while `streamText` is open. |
| [remarkjs/react-markdown](https://github.com/remarkjs/react-markdown) | Renders a stored wiki page, `[[title]]` links, and `[^claim]` citations. |
| [uiwjs/react-codemirror](https://github.com/uiwjs/react-codemirror) | Markdown editor on the draft page and on wiki pages. |
| [dip/cmdk](https://github.com/dip/cmdk) | Command palette over wiki page titles. |
| [vasturiano/react-force-graph](https://github.com/vasturiano/react-force-graph) | 2D graph of `link` rows on `/app/wiki/graph`. |
| [motiondivision/motion](https://github.com/motiondivision/motion) | Scroll-linked motion on the landing page. |
| [hardikpandya/stop-slop](https://github.com/hardikpandya/stop-slop) | Eight prose rules in `apps/web/src/lib/prompts/style.ts`, appended to draft, wiki, Ask, and Create prompts. |
| [oil-oil/oil-ui](https://github.com/oil-oil/oil-ui) | Design skill used to build the screens. The app imports none of its components. |
