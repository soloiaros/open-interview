# 03 — Knowledge Layer: LLM-Wiki, Graph/Memory, RAG, Retrieval, Editors, Extraction

Research date: 2026-10-17. Stars, last push, license and archived status were checked with the GitHub API on that date. HF model licenses were checked with the HF API.
License legend: **permissive** = MIT, Apache-2.0, BSD or PostgreSQL. **Copyleft/restrictive** = GPL, AGPL, BSL, or "open core" with an `ee/` directory.

---

## 0. The reference pattern: Karpathy "LLM Wiki" (April 2026)

Source: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f (an "idea file", not code).

- **Three layers.** (1) Raw sources are immutable and are the source of truth. (2) The wiki is LLM-owned markdown: source summaries, entity pages, concept pages, comparisons, overview, synthesis. (3) The schema is a CLAUDE.md/AGENTS.md file holding conventions and workflows.
- **Three operations.** *Ingest:* one source touches roughly 10–15 pages, then updates `index.md` and appends to `log.md`. *Query:* read the index, then the relevant pages, then answer with citations; good answers are filed back as pages. *Lint:* find contradictions, stale claims, orphans, missing pages and missing cross-links.
- **Scale note.** The index-file approach works up to about 100 sources and a few hundred pages. Beyond that you need real search; Karpathy points to `tobi/qmd` (BM25 + vector + rerank).
- **Gaps for Tacivo.** No ACL, concurrency, multi-tenant support, citation format, or dedup algorithm. Implementations add these. Tencent WeKnora and sage-wiki are the most production-grade.

---

## 1. LLM-Wiki implementations and auto-wiki generators

| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [Tencent/WeKnora](https://github.com/Tencent/WeKnora) | 34.5k | 2026-10-17 | MIT (+3rd-party notices) | **Best production reference for the wiki pipeline.** The Go service has the full ingest set: `wiki_ingest.go`, `_dedup.go` (pg_trgm + Jaccard candidate pre-filter, then LLM merge with a `validMerge` guard), `_cite.go` (chunk-level citation pass with batched short chunk handles `c000…`), `_taxonomy.go` (one coherent folder tree per batch), `wiki_linkify.go`, `wiki_lint.go` (cursor-walk orphan/broken-link/stale/missing-xref checks). Also slug continuity across re-ingest, page revisions and diffs, a task queue with dead-letter queue (40k docs), agent tools (`wiki_write_page`, `wiki_replace_text`, `wiki_flag_issue`), an MCP server, and hybrid retrieval on pgvector/ParadeDB with rerank. ASR ingest exists. | Vue UI, the 8 object-store and 8 vector-DB adapters, Feishu/DingTalk connectors, sandbox and browser skills, Neo4j GraphRAG, multimodal image gallery |
| [xoai/sage-wiki](https://github.com/xoai/sage-wiki) | 628 | 2026-10-14 | MIT | **Best data-model ideas.** Evidenced, bi-temporal edges (`evidence` span + `confidence` + `source_doc`); contradiction invalidates the old edge; `as_of` queries. Review-gated entity resolution; a global concept-curation pass (keep/fold/drop). Search fuses BM25, vector and graph proximity; tiered compilation scales to 100k docs; Postgres/pgvector backend; 19 MCP tools. Single Go binary. | TUI, Obsidian overlay, federation |
| [atomicstrata/llm-wiki-compiler](https://github.com/atomicstrata/llm-wiki-compiler) | 2.2k | 2026-10-15 | MIT | **Best citation/quality tooling.** Claims cite source file + line range and `lint` validates them. Review queue holds pages that trip confidence, contradiction or provenance rules. `refresh --stale`; `eval` reports citation coverage/precision and graph health. Typed pages (concept/entity/comparison/overview); "lifecycle profiles" act as a typed schema; TS SDK + MCP. | Themes/viewer, AutoSci/Newsroom templates, OKF/Marp/JSON-LD exports |
| [bybit-exchange/kaas](https://github.com/bybit-exchange/kaas) | 150 | 2026-09-11 | MIT | **Closest to Tacivo's use case.** Built for meetings/transcripts and "role knowledge survives turnover". Four phases: extract concepts/entities/**decisions** → classify into articles → write/merge markdown → update indexes. Answers cite articles; MCP `ask` tool. Python. | No embeddings (we want hybrid search at org scale); small project |
| [lucasastorian/llmwiki](https://github.com/lucasastorian/llmwiki) | 1.7k | 2026-10-16 | Apache-2.0 | Next.js wiki viewer with citations back to sources, graph view, MCP read/write/search tools, "nightly routine" maintenance pattern. Python API. | Chrome clipper, Claude-account coupling |
| [nashsu/llm_wiki](https://github.com/nashsu/llm_wiki) | 20.7k | 2026-09-28 | **GPL-3.0** | Desktop app; ideas only (incremental-ingest UX) | Everything — GPL, desktop |
| [inkeep/open-knowledge](https://github.com/inkeep/open-knowledge) | 4.6k | 2026-10-17 | **GPL-3.0** | AI-native markdown IDE: UX reference for human-edit plus agent-edit | Code (GPL) |
| [SamurAIGPT/llm-wiki-agent](https://github.com/SamurAIGPT/llm-wiki-agent) | 3.6k | 2026-10-12 | MIT | Prompt/schema (AGENTS.md) examples | Agent-CLI-only runtime |
| [Astro-Han/karpathy-llm-wiki](https://github.com/Astro-Han/karpathy-llm-wiki) | 2.5k | 2026-07-23 | MIT | Clean skill prompts for ingest/compile/lint | Runtime (it's a skill) |
| [AgriciDaniel/claude-obsidian](https://github.com/AgriciDaniel/claude-obsidian), [Ar9av/obsidian-wiki](https://github.com/Ar9av/obsidian-wiki) | 15.6k / 3.6k | 2026-10 | MIT | Prompt conventions (hot-cache, index/log) | Obsidian coupling |
| [nvk/llm-wiki](https://github.com/nvk/llm-wiki) | 1.4k | 2026-10-02 | MIT | Multi-agent parallel research → wiki | Research-agent scope |
| [microsoft/llmwiki](https://github.com/microsoft/llmwiki) | 86 | 2026-10-15 | MIT | Small, readable VS Code reference | VS Code host |
| [stanford-oval/storm](https://github.com/stanford-oval/storm) (STORM/Co-STORM) | 31.7k | 2025-09-30 | MIT | Perspective-guided outline → cited article generation; Co-STORM mind-map. Borrow the "outline then write with inline cites" pattern for synthesis/overview pages | Web-search retrieval, research-paper code; stale (last push 2025-09) |
| [AsyncFuncAI/deepwiki-open](https://github.com/AsyncFuncAI/deepwiki-open) | 18.2k | 2026-09-03 | MIT | Code-repo → wiki only. Little relevance | All |
| [AIDotNet/OpenDeepWiki](https://github.com/AIDotNet/OpenDeepWiki) | 3.6k | 2026-10-10 | MIT | Same (code → docs), .NET | All |
| [yuezhiai/jonex](https://github.com/yuezhiai/jonex) | 1.4k | 2026-10-10 | Apache-2.0 *amended* (commercial license needed in some cases) | Skip | — |
| [kiwifs/kiwifs](https://github.com/kiwifs/kiwifs) | 720 | 2026-10-14 | **BSL 1.1** | Skip | — |

**Recommended pick:** Port the **WeKnora wiki pipeline** design (MIT; dedup pre-filter, chunk-citation pass, taxonomy, lint, revisions) into our own lean service. Add **sage-wiki's evidenced bi-temporal claims** and **llm-wiki-compiler's citation lint, review queue and eval**. Use **kaas**'s "decision" extraction phase as the prompt starting point. Don't fork any of them wholesale: WeKnora is too broad, and the rest are personal-scale.

---

## 2. Knowledge graph / memory / GraphRAG

| Repo | Stars | Last push | License | Incremental update | Entity dedup | Use it for | Strip |
|---|---|---|---|---|---|---|---|
| [getzep/graphiti](https://github.com/getzep/graphiti) | 31.8k | 2026-10-15 | Apache-2.0 | **Best**: episode-by-episode ingest, no recompute | **Best**: embedding + LLM resolution; bi-temporal edge invalidation on contradiction; Pydantic custom entity/edge types | Model for fact supersession ("decision X replaced by Y on date") | Needs a graph DB (Neo4j/FalkorDB/Kuzu/Neptune). Latency of 3–6 LLM calls per episode |
| [HKUDS/LightRAG](https://github.com/HKUDS/LightRAG) | 40.2k | 2026-10-15 | MIT | Good: incremental insert + per-doc deletion | Weak-moderate: merges by normalized entity name, with LLM description summarization on merge | **Runs entirely on Postgres** (KV + pgvector + AGE graph); local/global/mix query modes; citations | Web UI, many backends, multimodal (RAG-Anything) |
| [microsoft/graphrag](https://github.com/microsoft/graphrag) | 36.4k | 2026-10-12 | MIT | Poor-fair: batch-oriented; incremental `update` exists but re-runs community reports | Name-based | Community summaries for "global" questions (offline, optional) | Most of it: expensive, batch |
| [topoteretes/cognee](https://github.com/topoteretes/cognee) | 32.4k | 2026-10-16 | Apache-2.0 | Good (`add`/`cognify`/`memify`) | Ontology-grounded | Pipeline/ontology ideas | Framework weight |
| [mem0ai/mem0](https://github.com/mem0ai/mem0) | 67.3k | 2026-10-16 | Apache-2.0 | Good (ADD/UPDATE/DELETE fact ops) | LLM fact-level | The ADD/UPDATE/DELETE/NOOP merge-decision prompt is the template for our claim merge | User-chat-memory orientation |
| [vectorize-io/hindsight](https://github.com/vectorize-io/hindsight) | 50.7k | 2026-10-16 | MIT | Good | LLM | Agent memory (retain/recall/reflect); ideas only | Agent-memory scope |
| [letta-ai/letta](https://github.com/letta-ai/letta) | 25.2k | 2026-09-10 | Apache-2.0 | n/a | n/a | Not needed (stateful agent runtime) | All |
| [OSU-NLP-Group/HippoRAG](https://github.com/OSU-NLP-Group/HippoRAG) | 4.1k | 2026-10-06 | MIT | Fair | Synonym edges | PPR multi-hop idea | Research code |
| [MemTensor/MemOS](https://github.com/MemTensor/MemOS) | 11.9k | 2026-10-17 | Apache-2.0 | Good | LLM | Skip (agent memory OS) | — |
| [gusye1234/nano-graphrag](https://github.com/gusye1234/nano-graphrag) | 4.0k | 2026-01-27 | MIT | Fair | Name | Readable ~1k-LOC GraphRAG reference | Slowing |
| [circlemind-ai/fast-graphrag](https://github.com/circlemind-ai/fast-graphrag) | 4.0k | 2025-11-01 | MIT | Good (PPR) | Fair | Skip: stale for about a year | — |
| [raphaelmansuy/edgequake](https://github.com/raphaelmansuy/edgequake) | 2.3k | 2026-10-17 | Apache-2.0 | LightRAG-style in Rust | — | Watch only | — |
| [apecloud/ApeRAG](https://github.com/apecloud/ApeRAG) | 1.3k | 2026-09-12 | Apache-2.0 | LightRAG-derived | — | Skip | — |

**Recommended pick:** No separate graph DB. The **wiki itself is the graph**: pages are nodes, and wikilinks plus typed relations are edges stored in Postgres tables. Borrow **Graphiti's bi-temporal fact invalidation and entity-resolution algorithm** and **mem0's ADD/UPDATE/DELETE/NOOP merge prompt**. If an off-the-shelf KG-RAG is wanted for a second retrieval channel, use **LightRAG on Postgres** (MIT, incremental, deletion, single datastore).

---

## 3. RAG engines / chat-with-docs with citations

| Repo | Stars | Last push | License | Borrow | Bloat / strip |
|---|---|---|---|---|---|
| [infiniflow/ragflow](https://github.com/infiniflow/ragflow) | 92.4k | 2026-10-17 | Apache-2.0 | DeepDoc parsing, template chunking, citation rendering UX | Agent canvas, Elasticsearch/Infinity dependency, heavyweight |
| [onyx-dot-app/onyx](https://github.com/onyx-dot-app/onyx) | 32.5k | 2026-10-17 | MIT CE + **proprietary `ee/`** | Connectors, permission-sync design, citation UI | EE features, Vespa, enterprise search breadth |
| [Mintplex-Labs/anything-llm](https://github.com/Mintplex-Labs/anything-llm) | 67.2k | 2026-10-17 | MIT | Little (workspace chat) | Most |
| [khoj-ai/khoj](https://github.com/khoj-ai/khoj) | 37.7k | 2026-08-02 | **AGPL-3.0** | Ideas only | Code (AGPL) |
| [Cinnamon/kotaemon](https://github.com/Cinnamon/kotaemon) | 25.8k | 2026-07-14 | Apache-2.0 | **In-context citation highlighting with relevance scores** (span-level) | Gradio UI |
| [Future-House/paper-qa](https://github.com/Future-House/paper-qa) (PaperQA2) | 9.4k | 2026-10-13 | Apache-2.0 | **Best precision pattern**: RCS (rerank + per-chunk contextual summarization) then answer with strict cites; "unsure" refusals | Paper-specific metadata/clients |
| [neuml/txtai](https://github.com/neuml/txtai) | 13.0k | 2026-10-16 | Apache-2.0 | All-in-one embeddings DB; fine for prototyping | Unneeded if on Postgres |
| [SciPhi-AI/R2R](https://github.com/SciPhi-AI/R2R) | 8.0k | 2025-11-07 | MIT | Postgres hybrid+graph design notes | Stale (last push 2025-11) |
| [weaviate/Verba](https://github.com/weaviate/Verba) | 7.7k | 2026-06-08 | BSD-3 | — | **Archived**; drop |
| [Tencent/WeKnora](https://github.com/Tencent/WeKnora) | 34.5k | 2026-10-17 | MIT | Also a full RAG engine (see §1) | — |
| [VectifyAI/PageIndex](https://github.com/VectifyAI/PageIndex) | 39.2k | 2026-10-16 | MIT | Vectorless "reasoning over a ToC tree" retrieval; matches the index.md-first query pattern | — |
| [tobi/qmd](https://github.com/tobi/qmd) | 30.5k | 2026-10-15 | MIT | Karpathy-endorsed local BM25 + vector + LLM-rerank over markdown; small reference implementation of query expansion + RRF + rerank | Local CLI shape |
| [1Panel-dev/MaxKB](https://github.com/1Panel-dev/MaxKB) | 23.0k | 2026-10-16 | GPL-3.0 | Skip | — |

**Recommended pick:** Don't adopt a RAG platform. Copy **PaperQA2's RCS + refusal** and **kotaemon's span-highlight citations** into a ~1k-LOC query service over Postgres. **qmd** is the reference for the hybrid/rerank fusion code.

---

## 4. Retrieval primitives and models

### 4a. Stores

| Repo | Stars | Last push | License | Use it for | Note |
|---|---|---|---|---|---|
| [pgvector/pgvector](https://github.com/pgvector/pgvector) | 23.4k | 2026-10-17 | PostgreSQL | Dense vectors (HNSW, halfvec, iterative scans) | Default |
| [timescale/pg_textsearch](https://github.com/timescale/pg_textsearch) | 4.0k | 2026-10-17 | **PostgreSQL** | **True BM25 in Postgres** (`ORDER BY content <@> 'q'`, Block-Max WAND); uses PG text-search configs, so the `dutch` snowball stemmer works | PG 17/18. **Pick over ParadeDB on license** |
| [paradedb/paradedb](https://github.com/paradedb/paradedb) (pg_search) | 9.4k | 2026-10-17 | **AGPL-3.0** | Tantivy BM25 + facets; strongest features | AGPL (fine if unmodified and not distributed, but a legal review is needed for SaaS) |
| [timescale/pgvectorscale](https://github.com/timescale/pgvectorscale) | 3.1k | 2026-10-14 | PostgreSQL | StreamingDiskANN + SBQ when vectors exceed 10M | Only needed at scale |
| [supervc-stack/VectorChord](https://github.com/supervc-stack/VectorChord) (+ VectorChord-bm25) | 1.8k | 2026-08-06 | AGPL-3.0 / ELv2 dual | Alternative | License |
| [lancedb/lancedb](https://github.com/lancedb/lancedb) | 11.7k | 2026-10-17 | Apache-2.0 | Embedded/local-first or edge; native FTS + multivector | Second store, so avoid |
| [qdrant/qdrant](https://github.com/qdrant/qdrant) | 35.1k | 2026-10-17 | Apache-2.0 | Best dedicated vector DB (sparse+dense+multivector, server-side RRF) if Postgres becomes a bottleneck | Not needed at Tacivo scale |

### 4b. Late interaction

| Repo | Stars | Last push | License | Note |
|---|---|---|---|---|
| [lightonai/pylate](https://github.com/lightonai/pylate) | 897 | 2026-07-23 | MIT | The maintained ColBERT train/infer lib (PLAID/Voyager index). Models: `lightonai/GTE-ModernColBERT-v1` (Apache, EN), `ColBERT-Zero` (Apache, EN, 2026-02), `LiquidAI/LFM2.5-ColBERT-350M` (multilingual incl. de/fr/es but **no nl**, custom LFM license) |
| [stanford-futuredata/ColBERT](https://github.com/stanford-futuredata/ColBERT) | 3.9k | 2025-10-14 | MIT | Reference; slowing |
| [AnswerDotAI/RAGatouille](https://github.com/AnswerDotAI/RAGatouille) | 4.0k | 2025-05-17 | Apache-2.0 | Stale; drop |

Verdict: skip ColBERT for v1. The corpus is wiki pages plus transcript chunks (small to medium), and a cross-encoder reranker gives most of the gain. For Dutch, the multilingual ColBERT options are weak or license-encumbered (jina-colbert-v2 is CC-BY-NC).

### 4c. Embedding and reranker models (open weights; Dutch-capable)

| Model | License | Notes |
|---|---|---|
| **Qwen/Qwen3-Embedding-0.6B / 4B / 8B** | Apache-2.0 | 100+ languages incl. nl. Instruction-aware, MRL dims, 32k ctx. 8B ≈ top open on MTEB-multilingual (older board). **Default pick: 0.6B (cheap) or 4B (quality)** |
| microsoft/harrier-oss-v1 (270m / 0.6b / 27b) | MIT | Released 2026-03; nl listed. Reported #1 on MTEB Multilingual v2 (27B, 0.7427; secondary source). **Benchmark 0.6b against Qwen3-0.6B on our Dutch set** |
| BAAI/bge-m3 | MIT | Dense + sparse + multivector in one model; solid multilingual baseline, older |
| ibm-granite/granite-embedding-311m-multilingual-r2 | Apache-2.0 | 2026-04, small, enterprise-friendly |
| google/embeddinggemma-300m | Gemma terms | Best <500M on-device; license restrictions |
| jina-embeddings-v5 / jina-reranker-v3 / jina-colbert-v2 | **CC-BY-NC** | Not usable commercially without a license |
| nvidia/llama-embed-nemotron-8b | NVIDIA custom | Avoid |
| **Qwen/Qwen3-Reranker-0.6B / 4B** | Apache-2.0 | Multilingual cross-encoder (LLM-based). **Default reranker pick** |
| zeroentropy/zerank-2-reranker | Apache-2.0 (HF card) | 2025-11; strong on independent boards; card tags EN only, so verify Dutch |
| BAAI/bge-reranker-v2-m3 | Apache-2.0 | Fast multilingual baseline |
| mixedbread-ai/mxbai-rerank-large-v2 | Apache-2.0 | Fast; multilingual claims |

**Recommended pick:** Postgres 17/18 + **pgvector** + **pg_textsearch** (BM25, `dutch` config), fused with RRF. **Qwen3-Embedding-0.6B** (or harrier-oss-v1-0.6b if it wins the Dutch eval), then **Qwen3-Reranker-0.6B/4B** on the top 50. One datastore, all permissive licenses.

---

## 5. Wiki / editor front-ends

| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [outline/outline](https://github.com/outline/outline) | 40.9k | 2026-10-17 | **BSL 1.1** | UX reference only (best-in-class team wiki) | Can't reuse code commercially as a competing service |
| [docmost/docmost](https://github.com/docmost/docmost) | 22.0k | 2026-10-16 | **AGPL-3.0** (+EE) | UX reference; Tiptap-based | Code |
| [BookStackApp/BookStack](https://github.com/BookStackApp/BookStack) | 19.1k | 2026-10-17 | MIT | Book/chapter/page hierarchy idea; PHP/Laravel, not a stack fit | Most |
| [requarks/wiki](https://github.com/requarks/wiki) (Wiki.js) | 29.0k | 2026-10-17 | **AGPL-3.0** | Markdown + git-sync idea | Code |
| [toeverything/AFFiNE](https://github.com/toeverything/AFFiNE) | 73.6k | 2026-10-12 | MIT CE + EE | BlockSuite; too heavy | All |
| [AppFlowy-IO/AppFlowy](https://github.com/AppFlowy-IO/AppFlowy) | 77.5k | 2026-10-08 | **AGPL-3.0** | Skip | All |
| [ueberdosis/tiptap](https://github.com/ueberdosis/tiptap) | 38.8k | 2026-10-16 | MIT (core) | ProseMirror editor; `@tiptap/markdown`; Yjs collab via Hocuspocus (MIT) | Paid Pro extensions (AI, comments, Docx) |
| [TypeCellOS/BlockNote](https://github.com/TypeCellOS/BlockNote) | 10.3k | 2026-10-16 | MPL-2.0 core; **XL packages GPL/commercial** | Notion-style blocks on Tiptap; fastest to ship; AI-edit extension | XL packages (AI, PDF/Docx export) |
| [udecode/plate](https://github.com/udecode/plate) | 16.7k | 2026-10-17 | MIT | Slate + shadcn; strong markdown serialization (`@platejs/markdown`) and AI plugins, all MIT | Plate Plus templates (paid) |
| [facebook/lexical](https://github.com/facebook/lexical) | 24.0k | 2026-10-17 | MIT | Fast, but markdown round-trip is weaker | — |
| [steven-tey/novel](https://github.com/steven-tey/novel) | 16.4k | 2025-01-18 | Apache-2.0 | Stale (last push 2025-01); drop | — |

**Recommended pick:** Use **Tiptap (MIT core) with `@tiptap/markdown`**, or **Plate (fully MIT)** if we want shadcn components and AI plugins without paid tiers. Store pages as **markdown with frontmatter** (the canonical form, and LLM-friendly). Render read-mode with a plain markdown renderer plus a custom `[[wikilink]]` and `[^cite]` chip. Borrow page-tree, backlinks and revision-diff UX from Outline and WeKnora; reuse no code from either.

---

## 6. Structured extraction from transcripts

| Repo | Stars | Last push | License | Use it for | Strip |
|---|---|---|---|---|---|
| [google/langextract](https://github.com/google/langextract) | 39.0k | 2026-10-17 | Apache-2.0 | **Source grounding**: every extraction is mapped to exact char offsets in the source; ungroundable extractions are flagged; long-doc chunking with multi-pass. Gives **char span → transcript timestamp** directly | Gemini-default provider; HTML viz |
| [567-labs/instructor](https://github.com/567-labs/instructor) | 14.0k | 2026-10-14 | MIT | Pydantic-typed extraction with retries/validation; any provider | — |
| [BoundaryML/baml](https://github.com/BoundaryML/baml) | 9.4k | 2026-10-17 | Apache-2.0 | Schema-first prompts, robust parsing (SAP), prompt tests; good if the backend is TS or Go | New DSL in the toolchain |
| [pydantic/pydantic-ai](https://github.com/pydantic/pydantic-ai) | 20.7k | 2026-10-17 | MIT | Typed agent + structured output + evals in one package | — |
| [dottxt-ai/outlines](https://github.com/dottxt-ai/outlines) | 15.9k | 2026-09-21 | Apache-2.0 | Constrained decoding for self-hosted vLLM models only | Not needed with API models (native structured outputs) |
| [stanfordnlp/dspy](https://github.com/stanfordnlp/dspy) | 38.7k | 2026-10-16 | MIT | Offline prompt optimization (GEPA/MIPRO) of extraction/merge prompts against a labeled set | Don't run in the hot path |

**Recommended pick:** Use **provider-native structured outputs + Instructor/Pydantic** (or pydantic-ai) for page-claim extraction. Enforce **LangExtract-style grounding**: every claim must carry verbatim quote spans that are string-matched back to the transcript, and any claim that fails the match is dropped. Use **DSPy offline** to tune the extract and merge prompts on a gold set.

---

## 7. Proposed wiki data model (Postgres)

```
source            id, org_id, kind(interview|doc|meeting), title, expert_id, recorded_at,
                  language, media_uri, status, hash
utterance         id, source_id, seq, speaker_id, t_start_ms, t_end_ms, text,
                  char_start, char_end                       -- diarized transcript
chunk             id, source_id, utterance_from, utterance_to, text, tsv/bm25, embedding
page              id, org_id, slug UNIQUE(org_id,slug), type, title, aliases[],
                  summary(1 line for index), body_md, frontmatter jsonb, category_path[],
                  status(draft|published|needs_review|archived), confidence,
                  current_revision_id, embedding, updated_at
page_type enum    decision | concept | best_practice | how_to | entity(person/team/system/client)
                  | source_summary | overview | faq(answer filed back from chat)
claim             id, page_id, section, text, claim_hash, embedding,
                  valid_from, valid_to (bi-temporal), superseded_by, status, confidence
evidence          id, claim_id, source_id, utterance_id, t_start_ms, t_end_ms,
                  quote (verbatim), char_start, char_end, speaker_id, stance(supports|contradicts)
link              from_page, to_page, rel_type(relates|depends_on|supersedes|part_of|
                  contradicts|example_of|owned_by), evidence_id NULL
page_revision     id, page_id, body_md, diff, author(llm|user_id), ingest_run_id, created_at
ingest_run        id, source_id, model, prompt_version, cost, stats, log
lint_issue        id, page_id, type(orphan|broken_link|stale|contradiction|missing_xref|
                  uncited_claim), severity, target_slug, status
```

**Page-type templates** go in frontmatter and the schema doc:
- **decision**: context, options, chosen, rationale, owner, date, status (active/superseded).
- **best_practice**: practice, when to apply, why, anti-patterns, examples.
- **how_to**: goal, prerequisites, steps, pitfalls.
- **concept**: definition, why it matters, related.

Every bullet or paragraph in `body_md` carries `[^e:<evidence_id>]` markers. The renderer turns them into chips: speaker, "12:34", play-from-timestamp.

## 8. Ingest pipeline (per transcript; idempotent, queued)

1. **Normalize.** ASR plus diarization produce `utterance` rows with timestamps and char offsets. Chunk by speaker turn and topic, 300–800 tokens, and record utterance ranges. Embed and BM25-index the chunks.
2. **Skeleton pass** (1 call, long context). Produce a source summary page plus a candidate list of decisions, concepts, best practices, how-tos and entities. Each candidate has name, type, aliases and a one-line description. Pass in the existing slugs that came from this source earlier so slugs stay stable on re-ingest (WeKnora pattern).
3. **Grounded claim pass** (batched by chunk, parallel). For each candidate, extract atomic claims, each with **verbatim quote + utterance id**. Fuzzy-match each quote to the transcript to get char span → `t_start_ms/t_end_ms`. Drop ungroundable claims.
4. **Entity resolution / dedup.**
   - Candidate generation: pg_trgm on name and aliases, plus embedding kNN on the description (top-k ≈ 5, Jaccard floor), plus same type.
   - LLM judge: `same | new | sub-topic-of` with a guard that rejects merges sharing no surface or semantic signal (WeKnora `validMerge`).
   - Skip pre-filtering when the org has fewer than about 150 pages.
   - Never fold enumerated or distinct named items (sage-wiki rule).
   - Merges below the confidence threshold go to a review queue.
5. **Claim merge per target page** (mem0/Graphiti logic). Compare each new claim with the page's existing claims (embedding top-k) and label it:
   - **ADD**: new info, appended to the right section.
   - **SUPPORT**: same claim; attach the new `evidence`, which raises confidence and the corroboration count.
   - **UPDATE/SUPERSEDE**: newer or different. Set the old claim's `valid_to`, link `superseded_by`, and keep history. For decisions, mark "superseded" and link both pages.
   - **CONTRADICT**: experts disagree. Keep both claims with their evidence, add a "Differing views" section, and raise a `lint_issue`.
   - **NOOP**.
6. **Rewrite page body.** One call per touched page, with the old body, the claim delta and the template. Constrain it with "edit, don't rewrite": section-level `replace_text` ops, not full regeneration, which keeps diffs reviewable and stops human edits from being clobbered. Human-edited sections are locked unless contradicted. Write a `page_revision`.
7. **Linkify and taxonomy.** Insert `[[slug|name]]` for known titles and aliases. One batch-level taxonomy call assigns categories only to pages that have none.
8. **Index and log.** Update per-org `index` (slug, one-line summary, type, source count) and append to `ingest_run` log. Re-embed touched pages.
9. **Lint** (async, nightly):
   - Mechanical checks: orphans, broken links, uncited claims, stale pages (only old evidence, superseded decisions still linked).
   - LLM checks: contradictions, missing pages ("concept mentioned in 3+ pages without its own page").
   - Auto-fix the safe classes; queue the rest.

**Query path:** BM25 + vector over **pages and claims** first (the compiled layer). Fall back to transcript chunks. RRF, then Qwen3-Reranker, then PaperQA-style per-snippet relevance summaries. Answer with `[^e:id]` cites that resolve to expert, source and timestamp. If no evidence passes the threshold, refuse. Good Q&A gets filed back as `faq` pages (draft, review-gated).

**Speed levers:**
- Steps 3 and 6 are parallel per chunk and per page.
- Use a cheap model for steps 2, 3 and 4 and a strong model for steps 5 and 6.
- Prompt-cache the schema and the existing page.
- Only touched pages are rewritten.
- The query path uses no LLM until the final answer, apart from an optional query rewrite.
