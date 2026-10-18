# 04 — Generation, Integrations & Platform Layers

Verified via `gh api` on 2026-10-17 (stars / last push / SPDX license / archived). The 8 rows that were first unverified were checked on the same date, and each has a decision in its last column.
"NOASSERTION" licenses were resolved by reading the LICENSE file.

---

## 1. Document generation agents, templating/export, diagrams

### 1a. Long-form/research writing agents
| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [assafelovic/gpt-researcher](https://github.com/assafelovic/gpt-researcher) | 30.1k | 2026-10-10 | Apache-2.0 | Planner→sub-researchers→report writer pattern, local-docs mode, MD/PDF/DOCX export | Web scraping/search retrievers, frontend, LangChain deps; point retriever at wiki |
| [stanford-oval/storm](https://github.com/stanford-oval/storm) | 31.7k | 2025-09-30 | MIT | Outline-first long-form (perspective-guided Q&A → outline → sections); Co-STORM | Stale (>1 yr); dspy dependency. Copy the prompts/pipeline idea, not the code |
| [dzhng/deep-research](https://github.com/dzhng/deep-research) | 19.8k | 2026-04-11 | MIT | ~500 LOC TS recursive research loop on Vercel AI SDK, easy to read and fork | Firecrawl search; swap for wiki retrieval |
| [langchain-ai/open_deep_research](https://github.com/langchain-ai/open_deep_research) | 12.7k | 2026-08-10 | MIT | Supervisor/researcher LangGraph reference | **Archived**, don't depend on it |
| [jina-ai/node-DeepResearch](https://github.com/jina-ai/node-DeepResearch) | 5.2k | 2026-05-01 | Apache-2.0 | TS loop with token budget | Jina-specific search/reader |
| [nickscamara/open-deep-research](https://github.com/nickscamara/open-deep-research) | 6.3k | 2025-05-07 | Apache-2.0 (Vercel template) | Next.js + AI SDK UI reference | Stale |
| [btahir/open-deep-research](https://github.com/btahir/open-deep-research) | 2.1k | 2025-12-15 | MIT | — | Archived |
| [iOfficeAI/OfficeCLI](https://github.com/iOfficeAI/OfficeCLI) | 32.1k | 2026-10-13 | Apache-2.0 | C# binary: agent-driven DOCX/PPTX/XLSX edit + render to PNG | **Rejected for v1:** second runtime (C#); dolanmiu/docx + PptxGenJS cover export in-process. Revisit for editing customer-branded Office templates |

### 1b. Templating & export
| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [typst/typst](https://github.com/typst/typst) | 56.7k | 2026-10-16 | Apache-2.0 | Fast, good-looking PDF from markup/JSON templates (handover, SOP, certificates); ms compile, Rust CLI or WASM | — |
| [jgm/pandoc](https://github.com/jgm/pandoc) | 46.6k | 2026-10-17 | GPL-2.0 | MD→DOCX/ODT/EPUB/LaTeX/HTML; reference-doc DOCX styling. Run as CLI subprocess (GPL stays out of your code) | Haskell build; use static binary |
| [dolanmiu/docx](https://github.com/dolanmiu/docx) | 6.0k | 2026-10-17 | MIT | Programmatic DOCX in TS/Node/browser | — |
| [python-openxml/python-docx](https://github.com/python-openxml/python-docx) | 5.7k | 2026-08-01 | MIT | DOCX in Python | — |
| [elapouya/python-docx-template](https://github.com/elapouya/python-docx-template) | 2.7k | 2026-07-07 | LGPL-2.1 | Jinja inside customer-branded .docx templates | — |
| [gitbrent/PptxGenJS](https://github.com/gitbrent/PptxGenJS) | 6.3k | 2025-11-28 | MIT | PPTX generation in TS (training decks) | — |
| [scanny/python-pptx](https://github.com/scanny/python-pptx) | 3.6k | 2024-08-07 | MIT | PPTX in Python | Stale |
| [slidevjs/slidev](https://github.com/slidevjs/slidev) | 49.1k | 2026-10-02 | MIT | MD→interactive slides (Vue) | Heavy for server export |
| [marp-team/marp-cli](https://github.com/marp-team/marp-cli) | 3.9k | 2026-09-08 | MIT | MD→PDF/PPTX/HTML slides, single CLI | — |
| [simonhaenisch/md-to-pdf](https://github.com/simonhaenisch/md-to-pdf) | 2.0k | 2025-12-03 | MIT | MD→PDF via Puppeteer | Typst is faster/lighter |
| [gotenberg/gotenberg](https://github.com/gotenberg/gotenberg) | 13.3k | 2026-10-16 | MIT | Docker API for HTML/Office→PDF (Chromium + LibreOffice) | Big image; only if you need DOCX→PDF |
| [diegomura/react-pdf](https://github.com/diegomura/react-pdf) | 16.8k | 2026-10-16 | MIT | PDFs from React components | — |
| [pdfme/pdfme](https://github.com/pdfme/pdfme) | 4.9k | 2026-10-16 | MIT | WYSIWYG PDF template designer | — |
| [Kozea/WeasyPrint](https://github.com/Kozea/WeasyPrint) | 9.7k | 2026-10-15 | BSD-3 | HTML/CSS→PDF in Python | — |

### 1c. Diagrams / decision trees
| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [mermaid-js/mermaid](https://github.com/mermaid-js/mermaid) | 90.7k | 2026-10-17 | MIT | LLM writes flowchart/decision-tree text, rendered in browser; exports via mermaid-cli | — |
| [xyflow/xyflow](https://github.com/xyflow/xyflow) | 38.7k | 2026-10-16 | MIT | Interactive, clickable decision-tree player/editor (React Flow) | — |
| [d2lang/d2](https://github.com/d2lang/d2) | 25.6k | 2026-10-11 | MPL-2.0 | Better auto-layout for static diagrams (Go binary) | — |
| [excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) | 134k | 2026-10-15 | MIT | Hand-drawn whiteboard; mermaid→excalidraw | Optional |
| [plait-board/drawnix](https://github.com/plait-board/drawnix) | 15.0k | 2026-09-08 | MIT | Mind-map/flow whiteboard | Optional |

**Recommended pick (1):** Write your own lean outline→section→assemble agent (STORM-style prompts, dzhng/deep-research as the code template) on the wiki. Export through **Typst** (PDF), **docx** (dolanmiu, DOCX), **PptxGenJS** (PPTX), and **Pandoc** CLI as a catch-all converter. Use **Mermaid** for generated decision trees and **React Flow** for the interactive player. All MIT/Apache except Pandoc (GPL, but run as a separate process).

---

## 2. E-learning (courses, quizzes, SCORM/xAPI, H5P)
| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [jcputney/scorm-again](https://github.com/jcputney/scorm-again) | 356 | 2026-10-14 | MIT | Modern SCORM 1.2/2004 runtime API, embedded in exported packages | — |
| [pipwerks/scorm-api-wrapper](https://github.com/pipwerks/scorm-api-wrapper) | 392 | 2023-05-13 | none (no license file) | Classic SCO wrapper | No license, avoid |
| [lmihaidaniel/simple-scorm-packager](https://github.com/lmihaidaniel/simple-scorm-packager) | 74 | 2026-04-03 | MIT | imsmanifest + zip | **Rejected:** archived. Write our own ~100-line manifest generator |
| [course-code-framework/coursecode](https://github.com/course-code-framework/coursecode) | 7 | 2026-07-20 | MIT | SCORM/cmi5/LTI authoring CLI | **Rejected:** 7 stars, immature |
| [jtangen/classbuild](https://github.com/jtangen/classbuild) | 143 | 2026-06-10 | MIT | AI course generator, learning-science prompts | **Reference:** course-structure prompts only |
| [fracabu/scorm-course-generator](https://github.com/fracabu/scorm-course-generator) | 5 | 2025-12-11 | none | Multi-agent LLM→SCORM | **Rejected:** no license, 5 stars |
| [SYuan03/Skill-Anything](https://github.com/SYuan03/Skill-Anything) | 338 | 2026-09-26 | MIT | Source → quizzes/flashcards | **Reference:** quiz-type prompts (MIT, may copy) |
| [adaptlearning/adapt_framework](https://github.com/adaptlearning/adapt_framework) | 631 | 2026-10-13 | GPL-3.0 | Responsive SCORM course framework | GPL, heavy |
| [numbas/Numbas](https://github.com/numbas/Numbas) | 215 | 2026-10-16 | Apache-2.0 | SCORM-compliant assessment engine (math-oriented) | Overkill |
| [xapijs/cmi5](https://github.com/xapijs/cmi5) | 24 | 2026-04-01 | MIT | cmi5/xAPI client in TS | Only if customers ask for xAPI |
| [adlnet/xAPIWrapper](https://github.com/adlnet/xAPIWrapper) | 223 | 2022-12-04 | Apache-2.0 | xAPI statements | Stale; prefer xapijs |
| [AICC/CMI-5_Spec_Current](https://github.com/AICC/CMI-5_Spec_Current) | 189 | 2024-09-06 | Apache-2.0 | cmi5 spec | — |
| [Lumieducation/H5P-Nodejs-library](https://github.com/Lumieducation/H5P-Nodejs-library) | 206 | 2026-10-15 | GPL-3.0 | H5P server/player in Node | GPL + H5P content-type complexity; skip for MVP |
| [h5p/h5p-php-library](https://github.com/h5p/h5p-php-library) | 151 | 2026-10-08 | GPL-3.0 | — | PHP, skip |
| [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | 825 | 2026-10-16 | MIT | FSRS spaced-repetition scheduler for flashcards | — |
| [ankitects/anki](https://github.com/ankitects/anki) | 32.1k | 2026-10-16 | AGPL-3.0 | Reference only; export .apkg via genanki (MIT) | AGPL, don't embed |
| [frappe/lms](https://github.com/frappe/lms) | 3.3k | 2026-10-16 | AGPL-3.0 | Full LMS | Bloat + AGPL |
| [classroomio/classroomio](https://github.com/classroomio/classroomio) | 1.7k | 2026-10-17 | AGPL-3.0 | Full LMS | Bloat + AGPL |
| [moodle/moodle](https://github.com/moodle/moodle), [openedx/openedx-platform](https://github.com/openedx/openedx-platform) | 7.5k / 8.2k | active | GPL-3 / AGPL-3 | Integration targets, not embeds | — |

GitHub search for "quiz generator llm" or "mcq generation" turns up only toy repos (under 70★). There is no mature OSS quiz-generation library. In 2026 this is just LLM structured output (Zod/Pydantic schema → MCQ/scenario/true-false + rationale + source citation).

**Recommended pick (2):** Build it in-house. Generate course, lesson, and quiz JSON with schema-validated structured output. Render it in your own small React player. For LMS export, wrap it as SCORM 1.2/2004 with **scorm-again** (runtime) plus a tiny imsmanifest generator (or simple-scorm-packager). Use **ts-fsrs** for flashcards. Skip H5P and full LMSes (GPL/AGPL bloat). Add cmi5 via **xapijs/cmi5** only when customers ask.

---

## 3. Fine-tuning dataset generation
| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [argilla-io/distilabel](https://github.com/argilla-io/distilabel) | 3.4k | 2026-10-12 | Apache-2.0 | Pipelines for instruction/QA/preference (DPO) data, LLM-as-judge, multi-provider | Argilla UI coupling, Ray |
| [meta-llama/synthetic-data-kit](https://github.com/meta-llama/synthetic-data-kit) | 1.7k | 2025-10-28 | MIT | Simple ingest→create (QA/CoT)→curate→save-as (Alpaca/ChatML/OpenAI FT JSONL) CLI; easiest to lift | vLLM default; point it at an OpenAI-compatible gateway. Slowing down |
| [ConardLi/easy-dataset](https://github.com/ConardLi/easy-dataset) | 15.0k | 2026-05-01 | **AGPL-3.0** | Best UX for doc→chunk→QA→export; UI reference | AGPL, reference only |
| [e-p-armstrong/augmentoolkit](https://github.com/e-p-armstrong/augmentoolkit) | 1.9k | 2026-06-27 | MIT | Docs→multi-turn conversational/factual datasets; strong prompts | Heavy pipeline configs |
| [BatsResearch/bonito](https://github.com/BatsResearch/bonito) | 829 | 2025-07-15 | BSD-3 | Model for unannotated text→instruction tasks | Needs a GPU-hosted model |
| [NVIDIA-NeMo/DataDesigner](https://github.com/NVIDIA-NeMo/DataDesigner) | 2.3k | 2026-10-16 | Apache-2.0 | Schema-driven synthetic data (Python) | **Alternative** to synthetic-data-kit (stale since 2025-10). Use if the dataset feature moves to a Python worker |
| [Kiln-AI/Kiln](https://github.com/Kiln-AI/Kiln) | 5.2k | 2026-10-16 | MIT libs + desktop EULA | Desktop app: synth data, evals, fine-tuning | **Rejected:** app, not a library; desktop part is EULA |
| [NVIDIA-NeMo/Curator](https://github.com/NVIDIA-NeMo/Curator) | 1.8k | 2026-10-16 | Apache-2.0 | Large-scale dedupe/filter | Overkill |
| [open-thoughts/open-thoughts](https://github.com/open-thoughts/open-thoughts) | 2.3k | 2025-12-02 | Apache-2.0 | Reasoning-trace recipes | Research-grade |
| [hiyouga/LlamaFactory](https://github.com/hiyouga/LlamaFactory) / [unslothai/unsloth](https://github.com/unslothai/unsloth) / [axolotl-ai-cloud/axolotl](https://github.com/axolotl-ai-cloud/axolotl) | 75.5k / 78.2k / 12.6k | active | Apache-2.0 | Downstream trainers; the export format must match theirs (Alpaca/ShareGPT/ChatML) | Not part of the product |

**Recommended pick (3):** Port **synthetic-data-kit**'s pipeline (MIT, small) into your worker: wiki pages → QA/CoT pairs → LLM-judge curation → JSONL in OpenAI/ChatML/Alpaca/ShareGPT formats. Borrow distilabel's judge/preference tasks if you need DPO pairs. Use Easy Dataset (AGPL) for UX inspiration only.

---

## 4. Agent orchestration
| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [vercel/ai](https://github.com/vercel/ai) | 27.4k | 2026-10-16 | Apache-2.0 | TS: unified providers (OpenAI/Anthropic/Gemini/xAI/DeepSeek/Mistral), streaming, tools, `generateObject` structured output, MCP client | Nothing; it's a library |
| [mastra-ai/mastra](https://github.com/mastra-ai/mastra) | 28.9k | 2026-10-17 | Apache-2.0 + `ee/` dirs | TS agents + workflows + memory + evals on top of AI SDK | `ee/` code, playground, cloud deployers |
| [pydantic/pydantic-ai](https://github.com/pydantic/pydantic-ai) | 20.7k | 2026-10-17 | MIT | Python equivalent: typed agents, structured output, multi-provider, MCP, graphs | Logfire is optional |
| [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) / [langgraphjs](https://github.com/langchain-ai/langgraphjs) | 43.4k / 3.4k | active | MIT | Durable stateful graphs | LangChain ecosystem weight |
| [openai/openai-agents-python](https://github.com/openai/openai-agents-python) / [openai-agents-js](https://github.com/openai/openai-agents-js) | 30.1k / 3.9k | active | MIT | Handoffs/guardrails, minimal | OpenAI-centric defaults |
| [anthropics/claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python) | 8.3k | 2026-10-16 | MIT | Claude Code harness (files, tools, skills) | Claude-only; bundles the CLI |
| [anthropics/claude-agent-sdk-typescript](https://github.com/anthropics/claude-agent-sdk-typescript) | 1.8k | 2026-10-16 | **no OSS license** (Anthropic commercial terms) | Same, TS | Claude-only, not OSS |
| [VoltAgent/voltagent](https://github.com/VoltAgent/voltagent) | 10.8k | 2026-10-15 | MIT | TS agent framework + observability | Overlaps Mastra |
| [agno-agi/agno](https://github.com/agno-agi/agno) | 42.8k | 2026-10-17 | Apache-2.0 | Python agents, fast | Large surface |
| [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) | 59.8k | 2026-10-17 | MIT | Role-based crews | Too opinionated |
| [microsoft/autogen](https://github.com/microsoft/autogen) | 61.4k | 2026-10-16 | CC-BY-4.0 (docs) / MIT code | — | Maintenance mode (moved to MS Agent Framework) |

**Recommended pick (4):** **Vercel AI SDK** (TS, Apache-2.0). Doc generators are mostly pipelines: plan → parallel section generation → assemble. Plain functions + `generateObject`/`streamText` + a Postgres job queue cover it without framework bloat. Add **Mastra** only if you need built-in workflow suspend/resume or memory. Use **Pydantic AI** if the backend is Python.

---

## 5. LLM gateway & observability/evals

### 5a. Gateway
| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [BerriAI/litellm](https://github.com/BerriAI/litellm) | 61.4k | 2026-10-17 | MIT + `enterprise/` | 100+ providers, OpenAI-compatible proxy, virtual keys, per-team budgets, fallbacks; route to EU endpoints (Azure OpenAI EU, Bedrock eu-central, Vertex europe-west, Mistral) | Enterprise dir, admin UI if unused. Pin versions (2026 PyPI supply-chain incident reported) |
| [maximhq/bifrost](https://github.com/maximhq/bifrost) | 8.9k | 2026-10-17 | Apache-2.0 | Go gateway, very low overhead, OpenAI-compatible, fallbacks, budgets | Clustering/SSO/guardrails are commercial |
| [Portkey-AI/gateway](https://github.com/Portkey-AI/gateway) | 13.2k | 2026-05-25 | MIT | TS gateway, guardrails, routing configs | Push cadence slowed |
| [mnfst/llm-gateway](https://github.com/mnfst/llm-gateway) (not verified individually) | 7.6k | 2026-10-16 | MIT | Newer gateway | Evaluate |
| [songquanpeng/one-api](https://github.com/songquanpeng/one-api) | 37.2k | 2026-01-09 | MIT | Key/quota reseller proxy | China-focused, not B2B-grade |
| [tensorzero/tensorzero](https://github.com/tensorzero/tensorzero) | 11.7k | 2026-06-11 | Apache-2.0 | — | **Archived** (company shut down June 2026) |
| [Helicone/helicone](https://github.com/Helicone/helicone) | 6.2k | 2026-10-10 | Apache-2.0 | Proxy + logging, has EU cloud region | ClickHouse stack |
| [theagentrouter/agent-router](https://github.com/theagentrouter/agent-router) (formerly envoyproxy/ai-gateway redirect) | 2.2k | 2026-10-16 | Apache-2.0 | Envoy-based | K8s-heavy |

### 5b. Observability / evals
| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [langfuse/langfuse](https://github.com/langfuse/langfuse) | 36.0k | 2026-10-17 | MIT + `ee/` | Traces, prompt mgmt, datasets, LLM-judge evals; EU cloud or self-host | Needs ClickHouse + Redis + S3 for self-host; use EU cloud early |
| [Arize-ai/phoenix](https://github.com/Arize-ai/phoenix) | 11.9k | 2026-10-17 | **Elastic-2.0** | OTel traces/evals, single container | ELv2 (fine internally, not as a resold service) |
| [comet-ml/opik](https://github.com/comet-ml/opik) | 22.7k | 2026-10-17 | Apache-2.0 | Traces + evals | Heavy stack |
| [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo) | 26.1k | 2026-10-17 | MIT | CI prompt/regression evals + red-teaming, YAML, no server | — |
| [traceloop/openllmetry](https://github.com/traceloop/openllmetry) | 7.5k | 2026-10-13 | Apache-2.0 | OTel instrumentation | AI SDK has native OTel |

**Recommended pick (5):** For a TS app, start with no gateway: AI SDK provider packages + EU-region endpoints + an env-configured model map. When you need virtual keys, budgets, and fallbacks per org, add **LiteLLM proxy** (MIT, widest coverage, pinned) or **Bifrost** (Apache-2.0, faster, single Go binary). Use **Langfuse** (EU cloud → self-host later) for traces and **promptfoo** in CI for generator-quality regression.

---

## 6. MCP, integrations, document import

### 6a. MCP
| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) | 13.6k | 2026-10-14 | MIT→Apache-2.0 transition | Tacivo MCP server (Streamable HTTP + OAuth) inside the Node app | — |
| [modelcontextprotocol/python-sdk](https://github.com/modelcontextprotocol/python-sdk) | 24.6k | 2026-10-16 | MIT | Python server | — |
| [PrefectHQ/fastmcp](https://github.com/PrefectHQ/fastmcp) (jlowin/fastmcp) | 28.1k | 2026-10-17 | Apache-2.0 | Fastest Python MCP server with auth providers | — |
| [punkpeye/fastmcp](https://github.com/punkpeye/fastmcp) | 3.3k | 2026-10-14 | MIT | TS ergonomic wrapper | Official SDK is enough |
| [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | 91.3k | 2026-10-13 | MIT/Apache | Reference servers (memory, filesystem, git) to copy patterns | — |
| [modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector) | 11.1k | 2026-10-14 | MIT/Apache | Debug your server | Dev only |

### 6b. Vendor connectors (export/sync targets)
| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [makenotion/notion-sdk-js](https://github.com/makenotion/notion-sdk-js) | 5.7k | 2026-10-16 | MIT | Notion page create/update (export) | — |
| [makenotion/notion-mcp-server](https://github.com/makenotion/notion-mcp-server) | 4.7k | 2026-09-20 | MIT | Reference; Notion also hosts a remote MCP | — |
| [sooperset/mcp-atlassian](https://github.com/sooperset/mcp-atlassian) | 6.0k | 2026-09-19 | MIT | Confluence + Jira (Cloud & Server/DC) read/write; copy its REST/ADF conversion | — |
| [taylorwilsdon/google_workspace_mcp](https://github.com/taylorwilsdon/google_workspace_mcp) | 3.4k | 2026-10-09 | MIT | Google Drive/Docs OAuth + write patterns | — |
| [DEmodoriGatsuO/sharepoint-mcp](https://github.com/DEmodoriGatsuO/sharepoint-mcp) | 91 | 2026-04-14 | other | SharePoint example | Weak; use Microsoft Graph SDK directly |
| Official SDKs (not row-verified): `@microsoft/microsoft-graph-client` (SharePoint/OneDrive), `googleapis`, `@linear/sdk`, `jira.js`, `@octokit/rest`, `@gitbeaker/rest`, `asana`, Intercom SDK; Workday has no good OSS SDK (REST/SOAP or a unified API) | — | — | mostly MIT | One thin adapter per target: `export(doc) → upsert page/file/issue` | — |

### 6c. Integration platforms
| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [NangoHQ/nango](https://github.com/NangoHQ/nango) | 12.7k | 2026-10-16 | **Elastic-2.0** | Managed OAuth + token refresh + syncs for 500+ APIs (incl. Workday, SharePoint, Confluence); EU cloud available | ELv2: self-host OK, can't offer as a competing hosted service. Use only auth+proxy |
| [ComposioHQ/composio](https://github.com/ComposioHQ/composio) | 30.6k | 2026-10-17 | MIT (SDK) | Hosted tool/auth catalog for agents | Backend is SaaS (US); data residency concern |
| [activepieces/activepieces](https://github.com/activepieces/activepieces) | 25.1k | 2026-10-17 | MIT + `ee/` | Embeddable automation; MIT "pieces" source as connector reference | Full platform is bloat |
| [n8n-io/n8n](https://github.com/n8n-io/n8n) | 207.8k | 2026-10-17 | **Sustainable Use License** (+ `.ee` proprietary) | Internal ops only | Can't embed/resell; not OSS |
| [airbytehq/airbyte](https://github.com/airbytehq/airbyte) | 22.2k | 2026-10-17 | **Elastic-2.0** (platform) / connectors largely MIT | ELT ingestion | Way too heavy |
| [PipedreamHQ/pipedream](https://github.com/PipedreamHQ/pipedream) | 11.7k | 2026-10-16 | Source-available, no competing commercial use | — | Avoid |
| [windmill-labs/windmill](https://github.com/windmill-labs/windmill) | 18.2k | 2026-10-17 | AGPL-3 / Apache / proprietary mix | — | Avoid |

### 6d. Importing existing docs
| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [microsoft/markitdown](https://github.com/microsoft/markitdown) | 190.7k | 2026-10-04 | MIT | Fast, light DOCX/PPTX/XLSX/PDF/HTML→Markdown; default importer | — |
| [docling-project/docling](https://github.com/docling-project/docling) | 69.0k | 2026-10-16 | MIT | High-fidelity PDF layout/tables/OCR when markitdown isn't enough | Torch models (heavier) |
| [datalab-to/marker](https://github.com/datalab-to/marker) | 40.5k | 2026-10-14 | Apache-2.0 code / model weights restricted commercially | PDF→MD quality | Weights license |
| [opendatalab/MinerU](https://github.com/opendatalab/MinerU) | 81.9k | 2026-10-14 | Apache-2.0 + commercial thresholds | PDF parsing | Extra license terms |
| [Unstructured-IO/unstructured](https://github.com/Unstructured-IO/unstructured) | 15.6k | 2026-10-16 | Apache-2.0 | Many formats + partitioning | Heavy deps |

**Recommended pick (6):** Build the Tacivo MCP server on the **official TS SDK** (or **FastMCP** if Python), exposing `search_wiki`, `get_page`, `generate_doc`. Write **direct per-vendor adapters** with official SDKs for the top 5 targets (Notion, Confluence, Google Drive, SharePoint/OneDrive via Graph, Jira/Linear), copying patterns from mcp-atlassian and google_workspace_mcp. Add **Nango** (ELv2, self-hostable in the EU) only when the long tail (Workday, Intercom, Asana) makes OAuth upkeep painful. Use **markitdown** for import, with **Docling** as the high-fidelity fallback. Avoid n8n, Pipedream, and Airbyte on license and weight grounds.

---

## 7. SaaS plumbing

### 7a. Auth / orgs
| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [better-auth/better-auth](https://github.com/better-auth/better-auth) | 30.3k | 2026-10-17 | MIT | In-app TS auth with organization/teams/roles/invites, SSO/SAML, 2FA, passkeys plugins; data stays in your EU Postgres | — |
| [supabase/supabase](https://github.com/supabase/supabase) | 111.7k | 2026-10-17 | Apache-2.0 | Postgres + auth + storage, EU regions | No native orgs; self-host is many containers |
| [logto-io/logto](https://github.com/logto-io/logto) | 14.7k | 2026-10-17 | MPL-2.0 | OIDC IdP with orgs/RBAC, EU cloud | Separate service |
| [zitadel/zitadel](https://github.com/zitadel/zitadel) | 15.3k | 2026-10-16 | AGPL-3.0 | Multi-tenant IdP (Swiss) | AGPL, separate service |
| [ory/kratos](https://github.com/ory/kratos) | 13.9k | 2026-07-29 | Apache-2.0 | Identity only | Orgs need Keto/Hydra, too many pieces |
| [keycloak/keycloak](https://github.com/keycloak/keycloak) | 37.4k | 2026-10-17 | Apache-2.0 | Enterprise IdP | JVM-heavy |

### 7b. Jobs (Postgres-based)
| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [timgit/pg-boss](https://github.com/timgit/pg-boss) | 4.1k | 2026-10-17 | MIT | Node queue on existing Postgres: retries, cron, priorities, DLQ, transactional enqueue | — |
| [graphile/worker](https://github.com/graphile/worker) | 2.4k | 2026-10-09 | MIT | Lowest-latency Postgres queue (LISTEN/NOTIFY) | — |
| [hatchet-dev/hatchet](https://github.com/hatchet-dev/hatchet) | 8.1k | 2026-10-16 | MIT | Durable workflows/fan-out on Postgres, dashboard | Separate engine service |
| [triggerdotdev/trigger.dev](https://github.com/triggerdotdev/trigger.dev) | 16.6k | 2026-10-17 | Apache-2.0 | Long-running AI tasks, realtime streams | Self-host is heavy |
| [inngest/inngest](https://github.com/inngest/inngest) | 6.0k | 2026-10-17 | **SSPL** (→Apache delayed) | Step functions | SSPL |
| DBOS (`dbos-inc/dbos-transact-ts`), Absurd (`earendil-works/absurd`), pgmq (not row-verified) | — | — | MIT / Apache / PostgreSQL | Library-level durable workflows on Postgres | Evaluate if pg-boss steps get complex |

### 7c. Storage, billing, deploy, starters
| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [minio/minio](https://github.com/minio/minio) | 61.3k | 2026-04-24 | AGPL-3.0 | — | **Archived**, don't use |
| [seaweedfs/seaweedfs](https://github.com/seaweedfs/seaweedfs) | 35.5k | 2026-10-17 | Apache-2.0 | Self-host S3 | Use a managed EU S3 instead (Hetzner Object Storage, Scaleway, OVH); Garage (AGPL) is a light self-host option |
| [stripe/stripe-node](https://github.com/stripe/stripe-node) | 4.5k | 2026-10-17 | MIT | Billing (Better Auth has a Stripe plugin) | Polar/Lago only if you need usage-based billing |
| [coollabsio/coolify](https://github.com/coollabsio/coolify) | 63.1k | 2026-10-16 | Apache-2.0 | Self-host PaaS on Hetzner/OVH with UI, Postgres backups, previews | — |
| [basecamp/kamal](https://github.com/basecamp/kamal) | 14.6k | 2026-10-14 | MIT | Zero-downtime Docker deploys over SSH, no control plane (leanest) | — |
| [Dokploy/dokploy](https://github.com/Dokploy/dokploy) | 37.8k | 2026-10-16 | Apache-2.0 + `/proprietary` | Coolify alternative | Proprietary dir |
| [pocketbase/pocketbase](https://github.com/pocketbase/pocketbase) | 61.5k | 2026-10-14 | MIT | — | SQLite single-node; poor fit for multi-tenant orgs |
| [nextjs/saas-starter](https://github.com/nextjs/saas-starter) | 16.2k | 2025-12-11 | MIT | Minimal Next.js + Drizzle + Postgres + Stripe + teams | Stale-ish; swap its custom auth for Better Auth |
| [wasp-lang/open-saas](https://github.com/wasp-lang/open-saas) | 16.1k | 2026-10-16 | MIT | Full starter | Wasp DSL lock-in |
| [ixartz/SaaS-Boilerplate](https://github.com/ixartz/SaaS-Boilerplate) | 7.5k | 2026-10-01 | MIT | Next.js + Clerk multi-tenant | Clerk is US SaaS, so swap it out |
| [boxyhq/saas-starter-kit](https://github.com/boxyhq/saas-starter-kit) | 5.0k | 2026-07-20 | Apache-2.0 | Teams + SAML SSO + audit logs + webhooks | Heavier, several services |

**Recommended pick (7):** One Postgres (EU: Hetzner/Scaleway/OVH) as the source of truth. **Better Auth** (organization + SSO plugins) for auth/orgs. **pg-boss** for generation jobs, moving to **Hatchet** only if multi-step fan-out outgrows it. Managed EU S3 for files. Stripe through the Better Auth plugin. **Kamal** (leanest) or **Coolify** (if you want a UI) for deploys. Start from **nextjs/saas-starter** with its auth replaced by Better Auth. Encryption: TLS + disk encryption + per-org envelope encryption of sensitive columns (app-level, no extra repo).

---

## License red flags summary
- Not OSS / restrictive: n8n (Sustainable Use), Pipedream (source-available), Nango, Airbyte platform and Phoenix (ELv2), Inngest (SSPL), Claude Agent SDK TS (commercial terms), MinerU (revenue thresholds), Marker weights.
- Copyleft (fine as a separate process or reference, avoid embedding): Pandoc (GPL-2), Easy Dataset / Anki / Zitadel / frappe-lms / ClassroomIO (AGPL), H5P / Adapt / Moodle (GPL-3).
- Archived/dead: langchain open_deep_research, btahir/open-deep-research, TensorZero, MinIO, mintlify/writer; STORM is stale (last push Sep 2025).
