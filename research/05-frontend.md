# 05 Frontend: skills, stack, building blocks

All repo stats came from `gh api repos/OWNER/NAME` on 2026-10-17. Stars are rounded, "push" is the last `pushed_at` date. You can find design tokens (colours, fonts, the App&Flow button CSS) in `06-design-tokens.md`. This file covers tooling and libraries.

---

## 1. Required skills: oiloil + stop-slop

### 1a. "oiloil" = the `oil-oil` GitHub org (brand site ui.oiloil.org)

"oiloil" is the handle of a Chinese indie developer. The GitHub org `oil-oil` publishes a family of agent skills. No repo is named exactly `oiloil`; `Vira1992/oiloil` and similar are unrelated. The UI-design skill is **oil-ui**, and two companions are relevant.

| Repo | Stars | Push | License | Role |
|---|---|---|---|---|
| **https://github.com/oil-oil/oil-ui** | 1,667 | 2026-10-16 | MIT | **Primary.** UI design skill: explores directions, builds a comparison page, refines against screenshots. v0.23.4 |
| https://github.com/oil-oil/ui-ux-guide (old name `oiloil-ui-ux-guide`, redirects) | 112 | 2026-09-10 | Apache-2.0 | Design-spec, rules, and review skill. Writes `design-spec.md` and P0/P1/P2 review lists |
| https://github.com/oil-oil/oil-frontend | 134 | 2026-10-04 | MIT | Optional. Chinese-language rules for frontend implementation: UI, interaction, data states, components |
| https://github.com/oil-oil/oil-tone | 234 | 2026-09-23 | MIT | Optional. Copy rewriting. oil-ui hands copy work to it when it is installed |
| https://github.com/oil-oil/oil-cli | 0 | – | MIT | Official installer: `npx github:oil-oil/oil-cli install <skill>` |

**Install (project scope, which writes into `./.claude/skills/`):**
```bash
npx skills add oil-oil/oil-ui -a claude-code -y
npx skills add oil-oil/ui-ux-guide -a claude-code -y      # optional, for design-spec.md and reviews
# manual alternative
git clone --depth 1 https://github.com/oil-oil/oil-ui .claude/skills/oil-ui     # SKILL.md is at repo root
# official CLI alternative
npx github:oil-oil/oil-cli install oil-ui
```
`npx skills` is vercel-labs/skills (35k stars, MIT). Add `-g` to install into `~/.claude/skills/`.

**Strip or neutralise:**
- `export OIL_NO_UPDATE_CHECK=1`. Without it, every run calls `scripts/check_update.sh`, which contacts ui.oiloil.org at most once every 10 minutes.
- `scripts/recommend_once.py` appends an "Oil UI Pro $9.99" ad to the first reply. The skill also mentions Pro once when work goes beyond its scope. Delete the script or ignore the ad.
- Do not install both oil-ui and oil-ui-pro. They compete for the same requests.
- The skill writes Python and shot scripts plus comparison pages into the task dir. Keep that dir out of `app/`.

**Rules oil-ui imposes (from SKILL.md and references/):**
1. **Design north star first.** Before drawing, answer three questions. What category is this? What does the user come to the first screen to see or do? How do the best peers handle the first screen and controls? Every deviation needs a reason drawn from this product, never from model defaults.
2. **Three directions in words first.** For a new UI, write three distinct directions, 3–4 lines each (feel, first-screen skeleton, type, colour, key visual), recommend one, then stop the turn. Render three first-screen HTML mockups on a side-by-side comparison page only if the user asks. Any two directions may share at most one of layout, typography, colour, or key imagery. Squint-test the light/dark shapes, and if two look alike, change the layout, not just the colours.
3. **If the user already gave a style** (refs, brand), the three directions stay inside that style and differ only in skeleton, key visual, and page structure. **This applies to us.** April/App&Flow are fixed, so expect skeleton-only variants.
4. **Small edits bypass the process** (named element plus named change). No inventory, no directions, no review.
5. **Content first on work screens.** Pages for browsing, shopping, or getting work done open on the content itself. Only persuasion pages (landing) get a designed hero, and its skeleton is settled before the copy is written.
6. **One memorable moment.** Make one or two details exceptional (tap response, AI-at-work, 404) and keep everything else quiet. For us that moment is the interviewer orb/transcript.
7. **Visual language** (`references/visual-language.md`):
   - Each region has one focal point.
   - Use the same spacing for the same relationship.
   - Structure comes from alignment and whitespace before containers. Do not nest cards inside cards.
   - Each line does one job. No doubled borders.
   - Fix text roles (title, body, aux, label, data) with large steps between levels.
   - Body text starts at 14–16px for product UI and 16–18px for reading pages, with line-height 1.6–1.75. Never fake refinement with 9–12px grey text.
   - Use tabular numerals for data.
   - Sample data must look real (1,238 users, +1.83%, "yesterday 16:12"), never "Lorem", "John Doe", or round numbers.
   - Button labels say the action ("Save draft").
   - Purple, rounding, and gradients are allowed, but not as unmotivated repetition.
   - Single-colour or two-colour systems and hard-edged alternating dark/light bands are allowed.
8. **Motion is mandatory** for new UI and flow changes: three base motions (`references/motion.md`). Landing pages must have scroll-driven sections built with a mature motion library.
9. **No production notes on screen.** Mock data, generated images, and unwired actions are listed in the delivery notes, never on the UI ("sample", "not connected"). Never fake metrics or testimonials.
10. **Evidence.** Run the page at the target viewport, take desktop and mobile screenshots, and check at 100% and 200% zoom. `scripts/shoot.mjs --evidence` produces state shots, a 200% crop, and a recording. Act on its "default-pattern" warnings.
11. **Independent review.** A fresh-context reviewer scores out of 10 against `reviewer-manual.md`. If none is available, self-review and label it as such.
12. **Subtraction pass before delivery.** One protagonist per screen. Delete repeated or explanatory copy, but never object names, state, or the main action.
13. **Delivery note must list:** direction plus reason, changes, omissions, motion added, review rounds and scores, text removed, and where evidence lives.
14. **Scope limits.** It makes design judgements only. It does not cover business logic, data flow, tests, or production builds. Only typecheck and lint are run.

**ui-ux-guide adds** 10 "UX Hard Rules" that apply across styles: task-first, closed state loops, affordance, error prevention, feedback loops, consistency, CRAP, regular spacing, hint layering L0–L3, and UI-copy discipline. It also adds 8 "Style Lens" families. Ours is `modern-minimal` crossed with `editorial`. Each family's taste rules stay inside that family.

### 1b. stop-slop = https://github.com/hardikpandya/stop-slop

| Stars | Push | License |
|---|---|---|
| 18,081 | 2026-03-17 | MIT |

It is a writing skill by Hardik Pandya that removes AI tells from prose. It does not cover visual design. On this project it governs **all UI copy, landing copy, and LLM system prompts for generated docs and wiki pages**. Files: `SKILL.md`, `references/phrases.md`, `references/structures.md`, `references/examples.md`.

**Install:**
```bash
npx skills add hardikpandya/stop-slop -a claude-code -y
# or
git clone --depth 1 https://github.com/hardikpandya/stop-slop .claude/skills/stop-slop
```
README options: in Claude Code, add the folder as a skill. In Claude Projects, upload `SKILL.md` and the references. Over the API, put `SKILL.md` in the system prompt. Use the last option for our doc generator and chat prompts.

**Rules:**
1. Cut filler: throat-clearing openers ("Here's the thing", "It turns out", any "here's what/why"), emphasis crutches ("Full stop.", "Let that sink in."), business jargon (navigate, unpack, lean into, landscape, game-changer, deep dive, circle back), and **all adverbs** ("really", "just", and other -ly words).
2. Break formulaic structures:
   - binary contrasts ("Not X. It's Y.", "not just X but also Y")
   - negative listing ("Not a X… not a Y… a Z")
   - dramatic fragmentation ("X. And Y. And Z.")
   - rhetorical setups ("What if…?", "Think about it:")
   - false agency ("the data tells us", "the decision emerges")
3. Active voice. Every sentence has a human subject.
4. Be specific. No vague declaratives, and no lazy "every/always/never".
5. Put the reader in the room: "you" beats "people".
6. Vary rhythm. Two items beat three. **No em dashes.** Do not end every paragraph with a punchy one-liner.
7. Trust readers. No softening or hand-holding.
8. Cut quotables, meaning anything that reads like a pull-quote.
9. Quick checks: no sentence starts with a Wh- word, no three consecutive sentences of the same length, no meta-joiners.
10. Scoring: rate Directness, Rhythm, Trust, Authenticity, and Density from 1 to 10 each. **Below 35/50, revise.**

Related, not required: `funboy322/avoid-ai-design` (109 stars) audits visual AI-slop (purple gradients, cream plus terracotta). It could serve as an extra design-side check.

### 1c. How the two fit together on this project
- oil-ui owns visual decisions. The style is already fixed by 06-design-tokens.md, so its direction step is skeleton-only.
- stop-slop owns every string: buttons, empty states, landing copy, and system prompts for generated content.
- Commit both skills to the repo under `.claude/skills/` so every agent session picks them up.

---

## 2. App framework

| Repo | Stars | Push | License | Use it for | Strip |
|---|---|---|---|---|---|
| https://github.com/vercel/next.js | 143k | 2026-10-17 | MIT | App Router, route handlers for AI streaming and LiveKit token, `next/font/local` for Heros | Pages Router, Edge middleware, ISR |
| https://github.com/remix-run/react-router | 56.6k | 2026-10-16 | MIT | v7 framework mode, a simpler mental model, Vite | – |
| https://github.com/sveltejs/kit | 20.9k | 2026-10-17 | MIT | Fast, but no React means losing shadcn, AI Elements, LiveKit React, and assistant-ui | – |
| https://github.com/TanStack/router | 15.2k | 2026-10-17 | MIT | TanStack Start: type-safe, but a smaller example ecosystem | – |

**Recommended pick: Next.js (App Router).** Every starter we would fork targets Next.js: LiveKit `agent-starter-react`, Vercel `chatbot`, AI Elements, assistant-ui, and ElevenLabs UI. Copy-paste speed matters more than router elegance. React Router v7 is the fallback if Next feels heavy.

## 3. Components and styling

| Repo | Stars | Push | License | Use it for | Strip |
|---|---|---|---|---|---|
| https://github.com/shadcn-ui/ui | 126k | 2026-10-17 | MIT | Copy-in components (Button, Dialog, Command, Sheet, Tabs, Tooltip). Base for AI Elements and ElevenLabs UI registries | Default zinc theme, radii, shadows. Re-skin to 06 tokens (40px pill buttons, 24px cards) |
| https://github.com/radix-ui/primitives | 19.4k | 2026-10-14 | MIT | Unstyled a11y primitives behind classic shadcn | – |
| https://github.com/mui/base-ui | 11.2k | 2026-10-17 | MIT | Newer unstyled primitives. shadcn can scaffold on Base UI instead of Radix | – |
| https://github.com/chakra-ui/ark | 5.4k | 2026-10-17 | MIT | Zag state-machine primitives | Skip, since no AI or voice registries build on it |
| https://github.com/tailwindlabs/tailwindcss | 97.9k | 2026-10-16 | MIT | v4 with CSS-first `@theme` tokens mapped from 06 | – |

**Recommended pick: shadcn/ui (Radix base) with Tailwind v4.** Radix is chosen because AI Elements, ElevenLabs UI, and agent-starter-react ship Radix-based shadcn code, so the primitives match. Write the App&Flow button once as a `cva` variant (`primary` pill 52px, `ghost` dotted pill, `tile` 50px/16px radius) and use it everywhere.

## 4. Chat UI: streaming and citations

| Repo | Stars | Push | License | Use it for | Strip |
|---|---|---|---|---|---|
| https://github.com/vercel/ai | 27.4k | 2026-10-16 | Apache-2.0 | `useChat` and `streamText`. The `source` / `source-url` message parts carry citations | – |
| https://github.com/vercel/ai-elements | 2.5k | 2026-10-14 | Apache-2.0 | shadcn registry: `conversation`, `message`, `inline-citation`, `sources`, `reasoning`, `prompt-input` | Model picker, attachments, branch UI |
| https://github.com/vercel/chatbot | 21.0k | 2026-07-08 | Apache-2.0 | Reference for history persistence and auth wiring | Artifacts, multi-model, Vercel-specific storage |
| https://github.com/assistant-ui/assistant-ui | 12.6k | 2026-10-17 | MIT | Alternative runtime plus primitives (thread, composer, attachments) | – |
| https://github.com/ibelick/prompt-kit | 3.1k | 2026-09-28 | MIT | Small shadcn chat pieces (prompt input, scroll button) | – |
| https://github.com/LibreChat-AI/LibreChat | 45.8k | 2026-10-17 | MIT | Reference only (citation UX in search mode) | Everything |
| https://github.com/open-webui/open-webui | 156k | 2026-10-16 | Custom "Open WebUI License" (BSD-3 plus branding clause) | Reference only for source/citation chips | Do not copy code |

**Recommended pick: AI SDK + AI Elements (`inline-citation` + `sources`), rendered with Streamdown.** Have the server stream wiki page IDs as `source` parts. Render each inline `[n]` marker as an `InlineCitation` hover card that links to `/wiki/[slug]#anchor`.

## 5. Voice interview UI

| Repo | Stars | Push | License | Use it for | Strip |
|---|---|---|---|---|---|
| https://github.com/livekit-examples/agent-starter-react | 952 | 2026-10-15 | MIT | **Fork base** if the backend uses LiveKit Agents: Next.js plus shadcn, session view, live transcript, mic controls, token route | Video and screen-share tiles, chat input, branding |
| https://github.com/livekit/components-js | 467 | 2026-10-16 | Apache-2.0 | `@livekit/components-react` 2.9.x: `useVoiceAssistant`, `BarVisualizer`, `useTranscriptions`, `RoomAudioRenderer` | Prefab styles (`@livekit/components-styles`) |
| https://github.com/livekit/agents-playground | 382 | 2026-10-15 | Apache-2.0 | Debugging reference | Not for production UI |
| https://github.com/pipecat-ai/pipecat-client-web | 326 | 2026-10-16 | BSD-2-Clause | Client SDK if the backend uses Pipecat | – |
| https://github.com/pipecat-ai/voice-ui-kit | 419 | 2026-10-12 | BSD-2-Clause | `@pipecat-ai/voice-ui-kit` 0.14: console template, transcript, visualizers for Pipecat | Its theme |
| https://github.com/elevenlabs/ui | 2.4k | 2026-10-16 | MIT | shadcn registry, transport-agnostic visuals: `orb`, `live-waveform`, `bar-visualizer`, `voice-button`, `transcript-viewer`, `conversation-bar` | ElevenLabs SDK coupling in some components (keep just the visuals) |
| https://github.com/katspaugh/wavesurfer.js | 10.4k | 2026-10-13 | BSD-3-Clause | Recorded-interview playback with a waveform on transcript pages | – |

**Recommended pick:** match the transport chosen in the backend research. With LiveKit, fork `agent-starter-react` and replace its visualizer with an ElevenLabs UI `orb` or `live-waveform` in monochrome `#F4F4F4` (the "one memorable moment"). With Pipecat, use `voice-ui-kit` primitives in the same way. The transcript renders as plain Heros text with the speaker in DM Mono uppercase. No chat bubbles.

## 6. Wiki: render, edit, search, graph

| Repo | Stars | Push | License | Use it for | Strip |
|---|---|---|---|---|---|
| https://github.com/vercel/streamdown | 5.7k | 2026-10-16 | Apache-2.0 | `streamdown` 2.7: streaming-safe markdown for chat answers and generated docs (handles partial tokens, code, math) | Mermaid/KaTeX plugins unless needed |
| https://github.com/remarkjs/react-markdown | 15.9k | 2026-10-03 | MIT | Static wiki page render plus remark plugins | – |
| https://github.com/remarkjs/remark-gfm | 1.3k | 2025-02-10 | MIT | Tables and task lists | – |
| https://github.com/landakram/remark-wiki-link | 108 | 2023-10-10 | MIT | `[[Page]]` links (stale; a 30-line custom remark plugin is fine) | – |
| https://github.com/mdx-js/mdx | 19.8k | 2026-10-15 | MIT | Not needed. Wiki content is user data, not code | Skip |
| https://github.com/uiwjs/react-codemirror | 2.3k | 2026-09-24 | MIT | Plain-markdown editor with `[[` autocomplete. Markdown stays the source of truth | – |
| https://github.com/ueberdosis/tiptap | 38.8k | 2026-10-16 | MIT (core) | WYSIWYG if needed, using the markdown extension | Pro/collab extensions (paid) |
| https://github.com/TypeCellOS/BlockNote | 10.3k | 2026-10-16 | MPL-2.0 (XL packages GPL/commercial) | Notion-style blocks | Skip: markdown round-trip is lossy, and licensing has caveats |
| https://github.com/dip/cmdk | 13.0k | 2025-10-29 | MIT | ⌘K search palette (shadcn `Command` wraps it) | – |
| https://github.com/vasturiano/react-force-graph | 3.3k | 2026-09-29 | MIT | `react-force-graph-2d` backlink graph, fine below ~5k nodes | 3D/VR variants |
| https://github.com/jacomyal/sigma.js | 12.2k | 2026-10-16 | MIT | WebGL graph for large wikis (`@react-sigma/core` 6.0) | – |

**Recommended pick:**
- Render: Streamdown for anything streamed, react-markdown with gfm and a custom wikilink plugin for stored pages.
- Edit: CodeMirror markdown (simplest, lossless). Tiptap only if users demand WYSIWYG.
- Search: cmdk via shadcn `Command`.
- Graph: react-force-graph-2d, nodes in `#F4F4F4`, accent `#0080FF` on hover only.

## 7. Fonts

| Font | Source | License | Webfont / package |
|---|---|---|---|
| Instrument Serif (400 + italic) | https://github.com/Instrument/instrument-serif (366 stars, OFL-1.1), Google Fonts | OFL-1.1 | `next/font/google` `Instrument_Serif` or `@fontsource/instrument-serif` 5.3.0 (OFL). No variable version exists (there is only one weight) |
| TeX Gyre Heros (regular, bold, italics) | GUST e-foundry: https://www.gust.org.pl/projects/e-foundry/tex-gyre/heros (`qhv2.004otf.zip`, HTTP 200), also CTAN `fonts/tex-gyre` | GUST Font License (LPPL-based, free and commercial use) | **No npm or Fontsource package exists** (`@fontsource/tex-gyre-heros` returns 404). Self-host: download the OTF, convert to WOFF2 (`pyftsubset … --flavor=woff2`, Latin subset), load with `next/font/local`, and keep the original family name plus the GUST license file in `/public/fonts` |
| DM Mono (micro labels) | Google Fonts | OFL-1.1 | `next/font/google` `DM_Mono` |

Fallback stack: `"TeX Gyre Heros","Helvetica Neue",Helvetica,Arial,sans-serif`. Confirmed from source that aprilleihuanani.com loads both "Instrument Serif" and "Gyre Heros" / "Gyre Heros On". App&Flow uses Inter, DM Mono, and GT Maru (commercial, so not used).

## 8. Motion

| Repo | Stars | Push | License | Use it for | Strip |
|---|---|---|---|---|---|
| https://github.com/motiondivision/motion | 34.2k | 2026-10-16 | MIT | `motion` 14.x (`motion/react`): orb state transitions, transcript line enter, page fades, landing scroll sections (`useScroll`) | Layout animations on lists, spring overshoot |
| https://github.com/oil-oil/oil-motion | 2.6k | 2026-10-04 | MIT | Optional skill for scroll- and mouse-driven web animation | Only if the landing page needs a scroll film |

**Recommended pick: Motion, used minimally.**
- Use CSS for the App&Flow squish hover (`scale(1.02,.98)` → `(.99,1.01)`, `.3s ease-out`) and the `.25s` theme fades.
- Use Motion only for voice-state changes and landing scroll reveals. That covers oil-ui's "three base motions" and its scroll-narrative requirement.
- Respect `prefers-reduced-motion`.

---

## Final stack (one line each)
- Next.js App Router, React, TypeScript, Tailwind v4, shadcn/ui (Radix) re-skinned to 06 tokens.
- Chat: AI SDK `useChat` + AI Elements (`conversation`, `message`, `inline-citation`, `sources`) + Streamdown.
- Voice: agent-starter-react (LiveKit) or voice-ui-kit (Pipecat), with an ElevenLabs UI `orb` / `live-waveform` as the single hero visual.
- Wiki: react-markdown + remark-gfm + custom `[[wikilink]]` plugin, CodeMirror editor, cmdk search, react-force-graph-2d.
- Fonts: Instrument Serif (Fontsource/Google), TeX Gyre Heros self-hosted WOFF2, DM Mono.
- Motion: CSS for hovers, `motion/react` for voice states and landing scroll.
- Skills in `.claude/skills/`: `oil-ui` (with `OIL_NO_UPDATE_CHECK=1`), `stop-slop`, and optionally `ui-ux-guide`.
