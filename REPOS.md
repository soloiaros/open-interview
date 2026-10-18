# Tacivo clone: open-source repositories

Compiled 2026-10-17. **Language: English only.** Keep the language behind a setting so others can be added later. Stars, last push and license for each repo come from the GitHub API on that date. Details and the rejected alternatives are in [research/](research/):

| File | Covers |
|---|---|
| [01-tacivo-teardown.md](research/01-tacivo-teardown.md) | What Tacivo actually ships: features, vendors, interview mechanics, wiki model |
| [02-interview-voice.md](research/02-interview-voice.md) | Voice framework, turn detection, STT, TTS, interviewer method, latency budget |
| [03-knowledge-wiki.md](research/03-knowledge-wiki.md) | LLM-wiki, graph, RAG, retrieval, editor, extraction; Postgres schema and ingest pipeline |
| [04-generation-integrations-platform.md](research/04-generation-integrations-platform.md) | Doc generation, e-learning, datasets, agents, gateway, MCP, integrations, SaaS plumbing |
| [05-frontend.md](research/05-frontend.md) | oiloil and stop-slop, framework, components, chat, voice UI, wiki UI, fonts |
| [06-design-tokens.md](research/06-design-tokens.md) | Colours, fonts and button/card CSS taken from the two reference sites |

---

## What we are cloning

This is the product as shipped in the app. The marketing site claims more than this.

- **Capture.** Five interview modes: After Action Review, Process Mapping, Exit Interview, Self Performance Review and Handover.
  - **Setup:** area, title, goal, background, and optional files.
  - **Format:** text or realtime voice, switchable mid-session. Voice runs on ElevenLabs.
  - **Progress and length:** progress counts topics covered, not time. Sessions run 10–15 exchanges, about 15 minutes.
  - **Live notes:** the user can correct them, and corrections outrank the transcript.
  - **Checklists:** whoever assigns the interview can attach one.
  - **Output:** a private draft that the expert verifies before publishing.
- **Wiki.** Seven page types: overview, best_practice, how_to, decision, insight, entity, concept.
  - **Page fields:** a 140-character index summary, versions, a numbered citation on every paragraph, and a "source conflicts" block.
  - **Edit modes:** each page is AI-managed, append-only, or human-locked.
  - **Upkeep:** a team-editable schema, lint, and a weekly AI review. In practice this is Karpathy's LLM-wiki pattern.
- **Create.** Five output types: Handover, SOP, Onboarding Guide, Training Module, and an HTML slide deck.
- **Chat.** Answers come from the wiki with page citations. There are 18 prompt templates and a "save to wiki" button.
- **Integrations.**
  - **Export:** Notion, Confluence, SharePoint, Google Drive, plus a read-only REST API key.
  - **MCP server:** not live. The homepage's Workday, Jira and Linear logos aren't in the app.
- **Stack.** Next.js, Tailwind and shadcn on Vercel; Supabase in the EU (Dublin). The LLM vendor is not disclosed.
- **Access.** Invite-only paid pilots. No self-serve signup.

**Where we can beat it:**
1. **Self-serve start:** sign up and run the first interview in under a minute.
2. **Citations:** link each claim to the transcript timestamp, not just the source document.
3. **Fact checking:** a quote must match the transcript before a fact reaches the wiki.
4. **More outputs:** the features Tacivo only claims (decision trees, e-learning/SCORM, fine-tuning datasets, MCP).
5. **Self-hostable:** an open stack that can run in the EU.

---

## Architecture

```
Browser: Next.js + shadcn (06 tokens)
  ├─ Interview: agent-starter-react + ElevenLabs UI orb ── WebRTC ──► LiveKit server
  ├─ Text interview / chat: AI SDK + AI Elements + Streamdown
  └─ Wiki: react-markdown + CodeMirror + cmdk + react-force-graph
LiveKit Agent (Python): silero-vad → Nemotron streaming STT → turn detector
                        → LLM (interview state machine: AAR / CDM / ACTA) → TTS
Workers (pg-boss): post-call STT (Parakeet) → grounded extraction (LangExtract/Instructor)
                   → dedup + claim merge → page edits → links → index → nightly lint
                   → generators (docs, SCORM, datasets) → exporters (Notion/Confluence/Drive/Graph)
Postgres (EU): Better Auth · pages/claims/evidence · pgvector + pg_textsearch · jobs
MCP server (official TS SDK): search_wiki · get_page · generate_doc
```

---

## 1. Interview layer (voice + text)

| Repo | ★ | License | Role | Strip |
|---|---|---|---|---|
| [livekit/agents](https://github.com/livekit/agents) | 14.8k | Apache-2.0 | Voice agent runtime. Starts the reply on partial transcripts, handles interruptions, lets text sessions share the agent code | Telephony, avatar/video, unused provider plugins |
| [livekit/livekit](https://github.com/livekit/livekit) | 21.5k | Apache-2.0 | Self-hosted WebRTC media server (EU), plus per-track recording | Ingress/SIP |
| [livekit-examples/agent-starter-react](https://github.com/livekit-examples/agent-starter-react) | 952 | MIT | Browser interview screen to fork | Video and screen-share tiles |
| [snakers4/silero-vad](https://github.com/snakers4/silero-vad) | 10.5k | MIT | Speech/non-speech gate | — |
| [livekit turn-detector](https://huggingface.co/livekit/turn-detector) | — | LiveKit model license | Decides when the speaker has finished, by meaning. 9.9% false cutoffs vs 35.2% for Smart Turn (vendor benchmark). Use the multilingual model, since the English-only one is deprecated | — |
| [nvidia/nemotron-3.5-asr-streaming-0.6b](https://huggingface.co/nvidia/nemotron-3.5-asr-streaming-0.6b) via [k2-fsa/sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) (15.3k) | — | OpenMDW / Apache-2.0 | Live STT with punctuation, 80 ms–1.12 s chunks | NeMo training stack |
| [kyutai-labs/delayed-streams-modeling](https://github.com/kyutai-labs/delayed-streams-modeling) (Kyutai STT) | 3.0k | Apache-2.0 / CC-BY | Alternative live STT (English/French) with built-in semantic VAD | — |
| [nvidia/parakeet-tdt-0.6b-v3](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3) | — | CC-BY-4.0 | Post-call clean transcript for the wiki, with word timestamps | — |
| [m-bain/whisperX](https://github.com/m-bain/whisperX) | 24.6k | BSD-2 | Alternative second pass when Whisper-large accuracy is needed | — |
| [QwenLM/Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS) | 13.8k | Apache-2.0 | **Main TTS:** streaming, ~97 ms to first audio | Non-English voices |
| [hexgrad/kokoro](https://github.com/hexgrad/kokoro) + [remsky/Kokoro-FastAPI](https://github.com/remsky/Kokoro-FastAPI) | 9.4k / 5.6k | Apache-2.0 | 82M model, very fast and cheap. Default if Qwen3-TTS's GPU cost isn't worth it | — |
| [kyutai-labs/pocket-tts](https://github.com/kyutai-labs/pocket-tts) | 9.9k | MIT | CPU-only (~200 ms), voice cloning. Failover and local dev | — |
| [resemble-ai/chatterbox](https://github.com/resemble-ai/chatterbox) (Turbo) | 27.0k | MIT | Most expressive voice option (350M Turbo). Use if the voice sounds too flat | Multilingual model |
| [kyutai-labs/unmute](https://github.com/kyutai-labs/unmute) | 1.5k | MIT | Reference for a fast voice pipeline (Kyutai STT + TTS around any LLM). Study the streaming and VAD tricks | Its own frontend |
| [linxule/openinterviewer](https://github.com/linxule/openinterviewer) | 28 | MIT | Reusable code for the text interview flow and synthesis | Demo modes |
| [friedrichgeiecke/interviews](https://github.com/friedrichgeiecke/interviews) | 71 | custom (check) | Validated interviewer prompt and topic-coverage logic from the LSE paper | Streamlit UI |
| [oasis-surveys/oasis-platform](https://github.com/oasis-surveys/oasis-platform) | 29 | AGPL-3.0 | **Design only:** guide schema (question → probes → exit criteria), engagement rules | Code |
| [coopersimson96/aar-loop](https://github.com/coopersimson96/aar-loop) | 89 | MIT | Starting prompt for the AAR template | — |

- **Runner-up:** [pipecat-ai/pipecat](https://github.com/pipecat-ai/pipecat) (16.5k, BSD-2). It has an interview state machine built in (Flows), and its peer-to-peer WebRTC needs no media server. Pair it with [smart-turn](https://github.com/pipecat-ai/smart-turn) and [voice-ui-kit](https://github.com/pipecat-ai/voice-ui-kit).
- **Interviewer method:** no repo implements these for an LLM. We write the three templates from the original methods:
  - After Action Review (TC 25-20) for After Action Reviews.
  - Critical Decision Method (Klein) for Exit Interviews.
  - ACTA (Militello & Hutton) for Process Mapping.
- **Latency target:** about 600–950 ms (English TTS reaches first audio in ~100 ms) from the end of the user's speech to the first audio. A wait of 3–4 s applies when an answer sounds unfinished, so experts aren't cut off.

## 2. LLM inference

The interviewer uses a fast model; the wiki merge and generators use a strong one. Which model goes where is a config setting.

| Repo | ★ | License | Role |
|---|---|---|---|
| [vercel/ai](https://github.com/vercel/ai) | 27.4k | Apache-2.0 | Provider-agnostic calls (OpenAI, Claude, Gemini, Mistral, DeepSeek, Grok), streaming, structured output |
| [vllm-project/vllm](https://github.com/vllm-project/vllm) | 94.0k | Apache-2.0 | Self-hosted open models (also serves Voxtral Realtime) |
| [sgl-project/sglang](https://github.com/sgl-project/sglang) | 37.2k | Apache-2.0 | Alternative server, faster when many calls share the same prompt prefix (ingest batches) |
| [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) | 131.5k | MIT | CPU/edge and local dev |
| [maximhq/bifrost](https://github.com/maximhq/bifrost) | 8.9k | Apache-2.0 | Gateway added later for per-org keys, budgets and fallbacks (single Go binary) |
| [BerriAI/litellm](https://github.com/BerriAI/litellm) | 61.4k | MIT + `enterprise/` | Alternative gateway with the widest provider coverage. Pin versions (2026 PyPI supply-chain incident) |
| [langfuse/langfuse](https://github.com/langfuse/langfuse) | 36.0k | MIT + `ee/` | Traces, cost, prompt versions (EU cloud or self-host) |
| [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo) | 26.1k | MIT | Quality regression tests in CI for interviewer, extraction and generator prompts |
| [stanfordnlp/dspy](https://github.com/stanfordnlp/dspy) | 38.7k | MIT | Offline tuning of the extraction and merge prompts against a gold set |

## 3. Knowledge layer (LLM-wiki, retrieval, extraction)

| Repo | ★ | License | Role | Strip |
|---|---|---|---|---|
| [Tencent/WeKnora](https://github.com/Tencent/WeKnora) | 34.5k | MIT | **Main design to port:** wiki ingest, dedup (cheap pre-filter, then LLM merge with a guard), chunk-level citations, taxonomy, linking, lint, revisions, stable slugs | Vue UI, 8 store adapters, Feishu/DingTalk, Neo4j, multimodal |
| [xoai/sage-wiki](https://github.com/xoai/sage-wiki) | 628 | MIT | Facts with evidence attached and dates. A contradiction closes out the old fact. Review-gated entity matching | TUI, Obsidian, federation |
| [atomicstrata/llm-wiki-compiler](https://github.com/atomicstrata/llm-wiki-compiler) | 2.2k | MIT | Citation lint, review queue, citation coverage and precision evals | Themes, exporters |
| [bybit-exchange/kaas](https://github.com/bybit-exchange/kaas) | 150 | MIT | Transcript-to-wiki prompts that extract decisions explicitly | — |
| [lucasastorian/llmwiki](https://github.com/lucasastorian/llmwiki) | 1.7k | Apache-2.0 | Next.js wiki viewer with citations, graph and MCP tools to borrow from | Clipper |
| [karpathy LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) | — | — | The pattern: raw sources, LLM-owned wiki, schema; ingest, query, lint | — |
| [getzep/graphiti](https://github.com/getzep/graphiti) | 31.8k | Apache-2.0 | **Algorithm only:** entity matching and marking old facts as superseded | Graph DB |
| [mem0ai/mem0](https://github.com/mem0ai/mem0) | 67.3k | Apache-2.0 | **Prompt only:** the ADD/UPDATE/DELETE/NOOP merge decision | Chat-memory runtime |
| [HKUDS/LightRAG](https://github.com/HKUDS/LightRAG) | 40.2k | MIT | Optional second retrieval channel, entirely on Postgres | Web UI, extra backends |
| [Future-House/paper-qa](https://github.com/Future-House/paper-qa) | 9.4k | Apache-2.0 | **Pattern:** rerank, summarize each snippet, cite strictly, refuse when unsure | Paper-specific clients |
| [Cinnamon/kotaemon](https://github.com/Cinnamon/kotaemon) | 25.8k | Apache-2.0 | **Pattern:** highlighting the cited span | Gradio |
| [tobi/qmd](https://github.com/tobi/qmd) | 30.5k | MIT | Reference code for hybrid search, query expansion and reranking | CLI shell |
| [pgvector/pgvector](https://github.com/pgvector/pgvector) | 23.4k | PostgreSQL | Vector search | — |
| [timescale/pg_textsearch](https://github.com/timescale/pg_textsearch) | 4.0k | PostgreSQL | Keyword (BM25) search in Postgres with the `english` stemmer. Chosen over ParadeDB, which is AGPL | — |
| [Qwen3-Embedding 0.6B/4B](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B) | — | Apache-2.0 | Embeddings. Test against [harrier-oss-v1-0.6b](https://huggingface.co/microsoft/harrier-oss-v1-0.6b) (MIT) on our own transcripts | — |
| [Qwen3-Reranker 0.6B/4B](https://huggingface.co/Qwen/Qwen3-Reranker-0.6B) | — | Apache-2.0 | Reranker for the top 50 results | — |
| [google/langextract](https://github.com/google/langextract) | 39.0k | Apache-2.0 | Maps every extraction to character offsets in the source, which converts to transcript timestamps | Gemini default, HTML viz |
| [567-labs/instructor](https://github.com/567-labs/instructor) | 14.0k | MIT | Typed claim extraction with retries | — |
| [pydantic/pydantic-ai](https://github.com/pydantic/pydantic-ai) | 20.7k | MIT | Alternative for typed agents and evals in Python | — |

The Postgres schema (source, utterance, chunk, page, claim, evidence, link, revision, lint_issue) and the 9-step ingest pipeline are in [03 §7–8](research/03-knowledge-wiki.md).

## 4. Create Agent (documents, training, datasets, diagrams)

| Repo | ★ | License | Role | Strip |
|---|---|---|---|---|
| [dzhng/deep-research](https://github.com/dzhng/deep-research) | 19.8k | MIT | Code template (~500 lines of TS on the AI SDK) for the outline → sections → assemble loop | Firecrawl; use wiki retrieval instead |
| [stanford-oval/storm](https://github.com/stanford-oval/storm) | 31.7k | MIT | **Prompts only:** outline first, then write with inline citations (stale since Sep 2025) | Code |
| [assafelovic/gpt-researcher](https://github.com/assafelovic/gpt-researcher) | 30.1k | Apache-2.0 | Planner → researchers → writer pattern, local-docs mode | Web retrievers, LangChain |
| [typst/typst](https://github.com/typst/typst) | 56.7k | Apache-2.0 | PDF export: fast, templated | — |
| [dolanmiu/docx](https://github.com/dolanmiu/docx) | 6.0k | MIT | DOCX export | — |
| [gitbrent/PptxGenJS](https://github.com/gitbrent/PptxGenJS) | 6.3k | MIT | PPTX export (Tacivo only does HTML decks) | — |
| [jgm/pandoc](https://github.com/jgm/pandoc) | 46.6k | GPL-2.0 | Catch-all converter, run as a separate program | — |
| [mermaid-js/mermaid](https://github.com/mermaid-js/mermaid) | 90.7k | MIT | Generated decision trees and process maps | — |
| [xyflow/xyflow](https://github.com/xyflow/xyflow) | 38.7k | MIT | Interactive decision-tree player (React Flow) | — |
| [jcputney/scorm-again](https://github.com/jcputney/scorm-again) | 356 | MIT | SCORM 1.2/2004 runtime for LMS export | — |
| [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | 825 | MIT | Spaced-repetition scheduling for flashcards | — |
| [meta-llama/synthetic-data-kit](https://github.com/meta-llama/synthetic-data-kit) | 1.7k | MIT | Pipeline to port: wiki → Q&A/reasoning pairs → LLM-judged filtering → JSONL (OpenAI/ChatML/Alpaca/ShareGPT) | CLI shell |
| [argilla-io/distilabel](https://github.com/argilla-io/distilabel) | 3.4k | Apache-2.0 | Preference (DPO) pairs and judge tasks, when needed | — |
| [hardikpandya/stop-slop](https://github.com/hardikpandya/stop-slop) | 18.1k | MIT | Its `SKILL.md` goes into every generator and chat system prompt | — |

- **Orchestration:** plain functions, AI SDK `generateObject`/`streamText`, and pg-boss.
- **Mastra:** add [mastra-ai/mastra](https://github.com/mastra-ai/mastra) (28.9k, Apache + `ee/`) only if workflows need to pause and resume.

## 5. Integrations, import, MCP

| Repo | ★ | License | Role |
|---|---|---|---|
| [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) | 13.6k | MIT→Apache-2.0 | MCP server: `search_wiki`, `get_page`, `generate_doc` |
| [PrefectHQ/fastmcp](https://github.com/PrefectHQ/fastmcp) | 28.1k | Apache-2.0 | Alternative if the MCP server is written in Python |
| [sooperset/mcp-atlassian](https://github.com/sooperset/mcp-atlassian) | 6.0k | MIT | Confluence/Jira adapter patterns |
| [taylorwilsdon/google_workspace_mcp](https://github.com/taylorwilsdon/google_workspace_mcp) | 3.4k | MIT | Google Drive/Docs adapter patterns |
| [microsoft/markitdown](https://github.com/microsoft/markitdown) | 190.7k | MIT | Imports existing docs (PDF/DOCX/PPTX) to markdown, for interview prep files and wiki seeding |
| [docling-project/docling](https://github.com/docling-project/docling) | 69.0k | MIT | High-fidelity fallback for hard PDFs and tables |
| [NangoHQ/nango](https://github.com/NangoHQ/nango) | 12.7k | Elastic-2.0 | Only for long-tail OAuth (Workday, Intercom, Asana). Self-host in the EU |

Notion, Confluence, Google Drive, SharePoint/OneDrive (Microsoft Graph), Jira and Linear each get a direct adapter using the vendor's official SDK.

## 6. Platform

| Repo | ★ | License | Role |
|---|---|---|---|
| [better-auth/better-auth](https://github.com/better-auth/better-auth) | 30.3k | MIT | Auth, orgs/teams, SSO, magic links, Stripe plugin |
| [timgit/pg-boss](https://github.com/timgit/pg-boss) | 4.1k | MIT | Postgres job queue for ingest, generation and lint |
| [hatchet-dev/hatchet](https://github.com/hatchet-dev/hatchet) | 8.1k | MIT | Upgrade path if fan-out outgrows pg-boss |
| [nextjs/saas-starter](https://github.com/nextjs/saas-starter) | 16.2k | MIT | App skeleton, with its auth swapped for Better Auth |
| [basecamp/kamal](https://github.com/basecamp/kamal) | 14.6k | MIT | Deploys to EU VMs (Hetzner/Scaleway/OVH) |
| [coollabsio/coolify](https://github.com/coollabsio/coolify) | 63.1k | Apache-2.0 | Alternative if you want a deploy UI |

## 7. Frontend

| Repo | ★ | License | Role | Strip |
|---|---|---|---|---|
| [oil-oil/oil-ui](https://github.com/oil-oil/oil-ui) | 1.7k | MIT | **oiloil**: the UI design skill (direction, build, screenshot review) | Set `OIL_NO_UPDATE_CHECK=1`; skip its one-time "Oil UI Pro" ad |
| [oil-oil/ui-ux-guide](https://github.com/oil-oil/ui-ux-guide) | 112 | Apache-2.0 | Companion skill: UX hard rules and a `design-spec.md` | — |
| [hardikpandya/stop-slop](https://github.com/hardikpandya/stop-slop) | 18.1k | MIT | **stop-slop**: writing rules for all UI copy | — |
| [vercel/next.js](https://github.com/vercel/next.js) | 143k | MIT | App Router, streaming routes, `next/font/local` | Pages Router, ISR |
| [shadcn-ui/ui](https://github.com/shadcn-ui/ui) + [radix-ui/primitives](https://github.com/radix-ui/primitives) | 126k / 19.4k | MIT | Component base, re-skinned to the 06 tokens | Default theme |
| [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) | 97.9k | MIT | v4 `@theme` tokens | — |
| [vercel/ai-elements](https://github.com/vercel/ai-elements) | 2.5k | Apache-2.0 | Chat pieces: conversation, message, inline-citation, sources | Model picker, branching |
| [vercel/streamdown](https://github.com/vercel/streamdown) | 5.7k | Apache-2.0 | Renders markdown while it streams, for chat and generated docs | Mermaid/KaTeX unless needed |
| [assistant-ui/assistant-ui](https://github.com/assistant-ui/assistant-ui) | 12.6k | MIT | Alternative chat runtime | Thread list |
| [livekit/components-js](https://github.com/livekit/components-js) | 467 | Apache-2.0 | `useVoiceAssistant`, transcriptions, audio renderer | Prefab styles |
| [elevenlabs/ui](https://github.com/elevenlabs/ui) | 2.4k | MIT | `orb` / `live-waveform` as the single hero visual on the interview screen | ElevenLabs SDK coupling |
| [katspaugh/wavesurfer.js](https://github.com/katspaugh/wavesurfer.js) | 10.4k | BSD-3 | Plays a citation from its timestamp on transcript pages | — |
| [remarkjs/react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm) | 15.9k | MIT | Wiki page rendering, with custom `[[link]]` and `[^cite]` plugins | — |
| [uiwjs/react-codemirror](https://github.com/uiwjs/react-codemirror) | 2.3k | MIT | Markdown editor with `[[` autocomplete | — |
| [ueberdosis/tiptap](https://github.com/ueberdosis/tiptap) / [udecode/plate](https://github.com/udecode/plate) | 38.8k / 16.7k | MIT | WYSIWYG option if non-technical editors need it | Paid extensions |
| [dip/cmdk](https://github.com/dip/cmdk) | 13.0k | MIT | ⌘K search across pages, sessions and actions | — |
| [vasturiano/react-force-graph](https://github.com/vasturiano/react-force-graph) | 3.3k | MIT | Wiki link graph | 3D/VR |
| [motiondivision/motion](https://github.com/motiondivision/motion) | 34.2k | MIT | Orb states, transcript lines, page fades | Spring overshoot |
| [Instrument/instrument-serif](https://github.com/Instrument/instrument-serif) | 366 | OFL-1.1 | Display font | — |

**Fonts and buttons:**
- **TeX Gyre Heros** (GUST license) has no npm package. Download the OTF from gust.org.pl, convert it to WOFF2 and load it with `next/font/local`.
- **Buttons** copy App&Flow's CSS exactly: 52px pill with a 40px radius and inverted colours, the squish keyframe on hover, a dotted-SVG ghost pill, and 16px-radius tiles. App&Flow's button font, GT Maru, has to be paid for, so the clone uses Heros 12px/700 instead. Full spec in [06-design-tokens.md](research/06-design-tokens.md).

**Install the design skills:**
```bash
npx skills add oil-oil/oil-ui -a claude-code -y
npx skills add oil-oil/ui-ux-guide -a claude-code -y
npx skills add hardikpandya/stop-slop -a claude-code -y
export OIL_NO_UPDATE_CHECK=1
```

---

## Reference only: don't copy the code

| Repo | Why |
|---|---|
| [outline/outline](https://github.com/outline/outline) | BSL. Best team-wiki UX to study |
| [docmost/docmost](https://github.com/docmost/docmost), [requarks/wiki](https://github.com/requarks/wiki) | AGPL. Wiki UX |
| [nashsu/llm_wiki](https://github.com/nashsu/llm_wiki), [inkeep/open-knowledge](https://github.com/inkeep/open-knowledge) | GPL. UX for human and agent editing the same pages |
| [infiniflow/ragflow](https://github.com/infiniflow/ragflow), [onyx-dot-app/onyx](https://github.com/onyx-dot-app/onyx) | Too heavy, and Onyx has a proprietary `ee/` directory. Citation UI and connector design |
| [paradedb/paradedb](https://github.com/paradedb/paradedb) | AGPL. Strongest BM25 in Postgres if you get legal sign-off |
| [open-webui/open-webui](https://github.com/open-webui/open-webui) | Branding clause. Citation chips |
| [ConardLi/easy-dataset](https://github.com/ConardLi/easy-dataset) | AGPL. Dataset-builder UX |

**Rejected:**
- **Dead or archived:** vocode-core, rhasspy/piper, pipecat-flows (merged into Pipecat), Verba, open_deep_research, novel, RAGatouille, TensorZero, MinIO.
- **Licence:**
  - Non-commercial weights: Fish-Speech, F5-TTS, XTTS, Jina models.
  - Not open source: n8n (Sustainable Use), Inngest (SSPL), Phoenix (ELv2).
- **Wrong shape:** Moshi (speech-to-speech, can't follow an interview guide), Ultravox (slowing, text-out only).

---

## Open gaps (no open-source answer yet)

1. **Voice quality vs ElevenLabs.** Open English TTS is now fast enough (Qwen3-TTS ~97 ms), but test whether it sounds as natural as ElevenLabs, which Tacivo uses. Keep TTS behind LiveKit's plugin interface so a hosted voice is a one-line swap if testers prefer it.
2. **Interviewer method prompts** (CDM, ACTA, AAR for LLMs) don't exist on GitHub. We write them ourselves; this is the main quality differentiator.
3. **Choosing models.** Open-model rankings changed weekly in Oct 2026 ([BenchLM](https://benchlm.ai/best/open-source), [Artificial Analysis summary](https://pasqualepillitteri.it/en/news/24368/best-open-weight-models-october-2026-compared)). Pick models with our own promptfoo tests on our own transcripts:
   - Interviewer: time to first token and question quality.
   - Merge: claim-merge accuracy.
   - Generators: document quality.
4. ~~Unverified repos~~ Done: all 8 checked. OfficeCLI, simple-scorm-packager (archived), coursecode, fracabu and Kiln rejected; classbuild and Skill-Anything kept as prompt references; NeMo DataDesigner noted as the alternative to synthetic-data-kit. All 105 GitHub links in this file resolve and none are archived.
