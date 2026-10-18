# 01: Tacivo product teardown

Research date: 2026-10-17. Subject: Tacivo B.V. (KVK 42176281, Nicolaas Beetsstraat 114, Utrecht, NL). Site: https://tacivo.com. App: https://app.tacivo.com.

**How to read the labels.** **[FACT]** means a public source states it, cited inline. **[CODE]** means it comes from the public, unauthenticated JS bundle of app.tacivo.com. That bundle ships the complete English and German UI string dictionary, which turned out to be the richest source of all. **[INFERENCE]** means my own reasoning.

Raw downloads are in `/tmp/tacivo_dl/` (untrusted data). The full UI dictionary is at `/tmp/tacivo_dl/research_site/app/en.json`, with a flattened copy at `en_flat.txt` (~2,300 strings).

---

## 0. TL;DR for cloning

- **Stack [FACT/CODE]:**
  - Next.js (App Router) on **Vercel**. Response headers show `server: Vercel` and `x-vercel-id: fra1::…`.
  - **Supabase** for auth, DB, realtime and storage. Project ref `nlplxlcrvtemgmjjqxad`, from the CSP on app.tacivo.com/login.
  - **ElevenLabs** for voice. The CSP `connect-src` includes `https://api.elevenlabs.io wss://api.elevenlabs.io`, so the browser talks to ElevenLabs directly.
  - The LLM vendor is not disclosed. LLM calls are server-side, because no OpenAI or Anthropic domain appears in the CSP.
  - Data is said to be "EU-hosted (Dublin)". **[INFERENCE]** That most likely means Supabase eu-west-1.
- **Interview [FACT/CODE]:**
  - Each "capture mode" (AAR, Process Mapping, Exit Interview, Self Performance Review, Handover) has a setup form and then runs as either **text chat or realtime voice**. You can switch between them mid-session.
  - Progress is **topic-coverage based** ("{done} of {total} topics covered"), not time based.
  - A **live notes** side panel groups notes by topic. Users can correct notes, and corrections outrank the transcript.
  - An optional **assigner checklist** gets ticked off during the interview.
  - "A typical interview takes 10-15 exchanges." The quick AAR invite says "about 15 minutes". Marketing says "30-min".
  - Output is a structured markdown document, saved as a private draft and then published.
- **Wiki [FACT/CODE]:**
  - Publishing a document triggers an LLM "ingest". The ingest creates or updates pages of **7 fixed types**: overview, best_practice, how_to, decision, insight, entity, concept.
  - Pages carry tags, a ≤140-char summary, a version number and per-paragraph numbered source citations. Pages link to each other.
  - Conflicts are recorded as "Source conflicts" rather than being overwritten.
  - Each page has an edit mode: `llm_managed` / `hybrid` (append-only) / `human_locked`.
  - A per-team **wiki schema** steers ingest: domain, entity types, terms and rules.
  - Lint rule checks, plus a weekly **"Tacivo dreams"** LLM review that proposes patterns, gaps, duplicates, contradictions and interviewer notes.
  - There is a 3D knowledge-graph map.
- **Create [FACT/CODE]:**
  - 5 output types today: Handover, SOP, Onboarding Guide, Training Module, Presentation Deck (an HTML slideshow with speaker notes and Present mode).
  - Layout is split-pane chat plus streaming draft. The agent asks only for what the wiki lacks. Documents have version history and are saved to "Learn".
  - Marketing also claims e-learning, decision trees, fine-tuning datasets, podcasts and playbooks. **None of these exist as Create types in the shipped UI.**
- **Chat [FACT/CODE]:** "Tacivo AI" answers from the wiki and lists the pages it used, with inline "📖 See: [page]" links. It supports `#` page, `@` expert, `/` query templates (18 built-in), file attachments, voice dictation and read-aloud. "Save to wiki" turns an answer into an insight page.
- **Integrations [CODE]:**
  - Push/export to Notion (integration token + parent page), Confluence (OAuth + space key), SharePoint (OAuth + site) and Google Drive (OAuth + folder).
  - An org-wide **read-only REST API key** (bearer token).
  - **The MCP server is NOT live.** The UI literally says: "A Model Context Protocol server … is separate work and is not live yet, so MCP client configs will not connect. Use the REST endpoint in the meantime."
  - Workday, Jira, Linear and the other logos on the homepage have **no trace in the app**. They are marketing only.
- **Go-to-market [FACT]:** Invite-only app. No self-serve signup (the `/signup` route redirects to `/login`). No public pricing: "custom paid pilots" with founder involvement. The team is 3 founders (2–10 on LinkedIn), founded 2025.

---

## 1. Company and team

- **Founded and size [FACT].** LinkedIn lists the company as founded 2025, 2-10 employees, "Partnership", Information Services, 14 followers (https://www.linkedin.com/company/tacivo/). The tagline there is "Structure, preserve and leverage your experts knowledge".
- **Founders [FACT].** Huuk Mandos, Pietro Pavesi and Bart Kleibrink are the newsletter authors (https://tacivoai-newsletter.beehiiv.com/p/tacivo-ai-monthly-newsletter, 1 Dec 2025). A marketing screenshot names "Pietro (Co-founder & CTO)" (https://tacivo.com/videos/how-it-works/transfer-3.png).
  - "Huuk Mandos" also appears in the app as the placeholder example of a voice-transcription term [CODE].
- **Background [FACT].** About page (https://tacivo.com/about): "Three young European entrepreneurs — from Italy and the Netherlands"; experience at PwC and Deloitte, plus PhD research in AI security at Maastricht University; met in Maastricht.
- **Stage history [FACT].** In Dec 2025 the newsletter said "Validating → Prototyping → Team building → MVP next". Release notes show v1.1 on 22 Sep 2026 through v1.7 on 6 Oct 2026, so the product shipped quickly in autumn 2026. A demo video shows "Version 1.2.1".
- **ICP [FACT, leaked in a demo screenshot of their own wiki].**
  - Targets "MLEs (250–5,000 employees) in manufacturing, industrial, and B2B software". Buyers are "VP Operations, CHROs, and Plant Managers"; the core pain is an "aging/retiring expert workforce". There was a "pivot from SMBs to MLEs".
  - Their qualification bar: "budget authority for €25K+ strategic purchases" and "Can quantify the cost of expert departures (e.g., €500K+ productivity losses)" (https://tacivo.com/videos/how-it-works/learn.mp4, transfer-1.png, transfer-3.png).
  - **[INFERENCE]** Pilots are probably priced around €25K+.
- **Industries claimed [FACT].** Technology, professional services, manufacturing, healthcare, industrial (FAQ).
- **Public footprint [FACT].** Very thin.
  - No press coverage, Product Hunt page, YouTube channel, job listings or founder interviews turned up in searches.
  - The blog has 4 posts, all "Article coming soon": /blog/aimi, /blog/llm-wiki, /blog/new-releases, /blog/knowledge-loss.
  - The newsletter has 1 issue.
  - X: https://x.com/tacivo (not fetched).
  - LinkedIn posts cite Anthropic's Peter McCrory: "get all your tacit knowledge written down and stocked in MD files".

## 2. Marketing claims (homepage https://tacivo.com, FAQ https://tacivo.com/faq)

- **Loop.**
  1. Knowledge Capture: "30-min AI-moderated interviews".
  2. LLM-Wiki Synthesis: a "proprietary LLM-wiki".
  3. Knowledge Transfer: "Create Agent".
  4. Learning & Development: chat with the wiki, and grounding for AI agents.
- **Use-case tiles.** Exit Interviews, Handovers, Onboarding, AARs, Best Practice Updates, SOPs, E-Learning, Process Mapping, AI Fine-Tuning ("Generate high-quality datasets"), Self Performance Review, Decision Trees.
- **Stats used.** 80% of knowledge undocumented; 6 months to ramp; 20% of time spent searching; "95% of AI pilots fail due to lack of context"; "$31B lost annually … Fortune 500s".
- **Integration logos.** Notion, Confluence, Microsoft, OneDrive, Google Drive, OpenAI, Claude, Gemini, Grok, DeepSeek, Workday, Linear, Jira, Asana, Intercom, Hootsuite, GitHub, GitLab, Firebase, DataGrip, Hugging Face. The copy says "20+ other tools with APIs and the Tacivo MCP Server".
- **FAQ outputs.** "Onboarding Guides, Handover Documents, Upskilling Modules, Playbooks, SOPs, and Podcasts", published to the "Learn Center". Other FAQ claims:
  - Out of the box: "SharePoint, Notion, Confluence, OneDrive, ChatGPT (Custom GPTs), Claude, and Microsoft Copilot".
  - "Novel insights from Chat Agent conversations are automatically ingested back into the Wiki". **In the shipped product this is manual "Save to wiki"** [CODE].
- **FAQ interview description.** "30-minute session with Tacivo's Capture Agent — an AI interviewer that asks targeted, adaptive questions designed to surface the reasoning, patterns, and edge cases … No prep needed … The AI generates a structured draft … which the expert reviews and approves before it enters the LLM Wiki."
- **FAQ wiki description.** "Every time an approved interview enters the system, the AI reads the new material against the full catalog of existing knowledge, detects patterns and gaps, and creates or updates structured pages automatically. It maintains 7 page types: Best Practices, Overviews, Insights, How-Tos, Entities (people, projects, tools), Concepts, and Decisions."
- **Positioning against note-takers.** Granola and Otter record meetings, while Tacivo proactively elicits knowledge: "knowledge creation, not meeting capture".
- **Demo form [CODE, homepage bundle].**
  - POSTs `/api/demo-request` with `{full_name, company_name, company_size (1-10|11-50|51-200|200+), work_email}`.
  - Then: "We sent a confirmation link … Click it to verify your email, and your Tacivo demo arrives in your inbox right away."
  - **[INFERENCE]** This is a double-opt-in that emails a recorded demo.
  - Modal copy: "We're kicking off this project with a small group of selected pilots … The platform is ready to go".

## 3. Pricing, pilot, onboarding

- **Pricing [FACT, FAQ].** "We don't publish fixed pricing … custom paid pilots. Every engagement is scoped."
- **Pilot contents [FACT].** Pilot = "structured onboarding and goal-setting, a set of AI-guided expert interview sessions tailored to your context (AARs, process mappings, exit interviews, or others), custom output templates for your use case, synthesis and review sessions, and ongoing access to the founders … No account manager." Value: "first expert interview within the first week".
- **After the pilot [FACT].** "We scope a broader deployment together."
- **Booking links [FACT].**
  - https://cal.eu/tacivo/discovery and https://cal.eu/tacivo/pilot-overview. The pilot-overview link returned 404 to WebFetch, so the page was not read.
  - The privacy policy says "Calendly", but the site actually links Cal.eu.
- **Minimal onboarding [CODE].** The app is **invite-only**: "Tacivo is invite-only. Contact your administrator for access."
  - The first admin gets a special admin-invite signup. It has 3 steps: password (min 12 chars) → profile (role, expertise, goal) → organization (name, industry, size, description).
  - Experts join from an emailed invite link that pre-sets team and role, then set a password.
  - Sign-in options: email+password or a Supabase **magic link** (OTP, `shouldCreateUser:false`, 1-hour expiry).
  - Idle auto-signout with a one-minute warning.
  - There is a **Get started checklist** for admins, listed below.
  - **Assigned interviews come prefilled.** "Everything is set up already — the interview is prefilled and ready when you are" (assignment email). The expert only picks chat or voice.
  - **Quick sessions.** A "**Quick session**" invites a *non-member* by email to a single AAR via a **48-hour link**, with no account needed ("It only takes about 15 minutes").

| Get started checklist step | What it does |
|---|---|
| Org settings | Name, logo, language |
| Teams | Create teams and give each a manager |
| Invite experts | Invitation sets teams and role |
| Assign first capture | Send an expert a session |
| Publish to wiki | Fold the document into the team wiki |
| Wiki health | Rule checks and weekly dreams |
| Tune the interviewer | Interviewer notes and transcription terms |
| Connect tools | Notion, Confluence, SharePoint, Drive, API key |
| Put the wiki to work | Tacivo AI, Create, Learn |

## 4. Information architecture (app) [CODE + demo videos]

- **Sidebar.** Search (⌘K), Tacivo AI, All Sessions, Your Knowledge, Tasks, Learn, Wiki, Experts (an admin can toggle Experts off), then Inbox, Admin/Settings, Profile, Help. A team switcher sits at the top (org logo, teams with tinted initials and role).
- **Tacivo AI page.** Three tabs: **Capture | Chat | Create**, plus a right-hand Tasks bar ("My tasks" / "Assigned").
- **URLs.** A wiki page URL seen in the demo is `/platform/wiki/<uuid>`.
- **Settings dialog.** Three sections:
  - Organization: Org settings with language and Features switches, Connections, Teams, People.
  - Team: Stats, Knowledge base, Wiki health, Tacivo AI preferences, Assigned Tasks.
  - Account: Profile, Security, Appearance.
- **Shortcuts.** ⌘K search, ⌘, settings, ⌘/ shortcut list, ⌘⇧L dark mode, plus jump to last page, copy URL, back/forward and peek up/down.
  - The editor has markdown shortcuts: bold, italic, code, strike, H1-3, bullets, numbered, to-do, toggle, quote. **[INFERENCE]** This looks like a Notion-like block editor (e.g., Tiptap or BlockNote).
- **Languages [CODE].** Only `en` and `de` UI locales exist (`tacivoLocale`). Policy is "One organization, one language", driving the UI, interviews, generated docs, the wiki and the AI. In voice, an expert can ask to switch the spoken language; the document is still written in the org language. Wiki-schema built-in descriptions are "shown as the AI reads them, in English", which suggests English system prompts.

## 5. Roles and teams [FACT help + CODE]

- **Org roles.** Admin or Member. Admins see every team and all settings without needing team membership.
- **Team roles.** **Manager** or **Expert**. A person can hold different roles in different teams.
  - Managers invite and assign experts in their own teams and manage wiki health and AI preferences.
  - Experts capture, publish and use the wiki.
- **Teams.** Every org starts with a "General" team. **One wiki per team.**
  - Sub-teams are full teams; "access is not inherited" from the parent.
  - Deleting a team deletes its wiki; documents stay with their authors.
  - A user can copy a document to another team as a private draft there.
- **Profile.** Name, role/job title, years of experience, area of expertise ("What colleagues come to you for"), avatar (colour + icon or initials). Also **personal instructions for Tacivo AI**.
- **Experts directory.** Profiles with expertise, years and shared documents.
- **Security page claims.** "SSO/SAML on Enterprise plans", "MFA available across all plans", "Full audit logs". **No SSO or MFA UI strings were found in the bundle** **[INFERENCE: not yet built]**.

## 6. Capture: interview mechanics (core)

### 6.1 Modes and setup [CODE]

There are five modes; the internal docType keys are `aar`, `process-mapping`, `exit-interview`, `self-performance-review` and `handover`.

**Setup form ("Let's set up your {mode}")**

- **Area.** "Process or Area" / "Role or Area" / "Area or Period".
- **Title.**
- **"What's the goal of this interview?"** The hint insists on "One specific outcome". Example: "'Capture why the migration slipped by six weeks' steers the questions; 'talk about the project' does not."
- **Background**, minimum 50 characters, with a live counter.
- **Optional supporting files**: PDF, DOCX, TXT, MD (an earlier version also accepted PPTX). Max 10 MB each, up to N files per session.
  - Extracted text is used as context.
  - Scanned PDFs are rejected: "No readable text in that PDF — it looks like a scan".

**Who records**

- "Start it yourself", or
- "Assign to someone": pick expert and team; the expert gets an email and a prefilled interview.

**Choose a medium**

- "Text Chat — Type your answers. Good for reflective, detailed responses."
- "Voice Interview — Speak naturally. Best for capturing rich context quickly."

**Per-mode prompt focus** (from the help article and the generation-progress copy; these reveal the output template sections)

| Mode | Generation sections (from progress copy) |
|---|---|
| AAR | situation and context, approach and actions, outcomes, lessons learned, executive summary |
| Process Mapping | frameworks and principles, step-by-step, decision frameworks, common pitfalls, practical tips, overview |
| Exit Interview | role overview, undocumented knowledge, key relationships and contacts, systems and access, open threads and commitments, risks for successor, transition guidance |
| Self Performance Review | period summary, goals and outcomes, wins and evidence, challenges, growth areas, impact, development priorities |
| Handover | role overview, responsibilities, open tasks and projects, key contacts and stakeholders, critical processes and systems, pending decisions and risks, transition notes |

### 6.2 During the interview [CODE + help]

- **Header.** Interview type, a renameable title, area, and a progress bar.
- **Progress.** "Tacivo AI keeps track of the topics your document needs and marks each as covered once you have said enough … the bar shows what is done, not how long you have talked. When every topic is covered, the 'Generate' button appears."
  - The UI shows "{done} of {total} topics covered · Next: {topic}". Progress "never goes backwards".
  - **[INFERENCE]** Each mode has a fixed topic list matching the document template sections. A parallel LLM call evaluates coverage after each answer.
- **Length.** "A typical interview takes 10-15 exchanges."
- **Ending early.** The user can end early ("Generate with what we have"), with a confirmation ("You haven't reached 100% progress yet"). An early end reports "The conversation ended at {percent}%".
- **Live notes panel.**
  - "Notes appear here as you talk — what Tacivo AI understood, grouped by topic."
  - Each note has a ✎ to correct it. The correction is sent into the conversation as: `A correction to your notes — you wrote: "{note}". It should say: {instruction}`. "your correction outranks the transcript when the document is written."
  - Notes are saved with the session.
  - Failure is non-blocking: "Notes are not available right now. The interview carries on as normal."
- **Checklist (from the assigner).**
  - Up to N items, typed or extracted from an uploaded PDF, DOCX, TXT, MD, CSV or XLSX.
  - "The interviewer works each point into the conversation and ticks it off."
  - The final document gets a "Checklist" section listing what was covered and what is still open.
- **Interviewer notes (team-level).**
  - Two kinds: **Question**, i.e. "questions interviews tend to leave out" (optionally scoped to one interview type), and **Term**, i.e. names and terms the voice transcription should expect, with a max-length limit set by the STT.
  - Notes can be active or paused, and are created manually or from accepted dreams.
- **Chat-mode input.**
  - "Enter to send · Shift+Enter for new line · Hold T to speak · + for files, # wiki pages, @ colleagues".
  - Dictation records audio, shows "Transcribing…", then fills the text box.
  - "Play this message" provides TTS of an AI message.
- **Voice mode.**
  - States: Connecting / AI Speaking / Listening / Paused / Disconnected. Controls: Mute, Pause/Resume, Switch to Chat, End Conversation.
  - "The interviewer waits through long pauses, so you can think."
  - Pausing truly pauses the session. On resume, or on a chat→voice switch, the AI opens "with a short recap of what has been said and a question".
  - Error strings include "Failed to create conversation agent" and "Voice connection error".
- **Voice model.** v1.7 (6 Oct 2026): "Voice interviews use ElevenLabs' newest voice model … warmer … changes tone naturally … Its tone cues are performed, never written: transcripts, notes and documents stay free of them. Replies start faster." (https://tacivo.com/releases/natural-voice)
  - **[INFERENCE]** This is ElevenLabs Agents (Conversational AI) over WebSocket from the browser, with an Eleven v3-style expressive model and audio tags (e.g., `[warmly]`, `[curious]`). The tags are emitted by the LLM and stripped from stored transcripts.
  - "Failed to create conversation agent" suggests a per-session agent or conversation config created server-side, with a signed URL handed to the browser.
  - The term list maps to ElevenLabs ASR keywords/keyterms.
  - **The LLM behind the voice agent is unknown.** It could be ElevenLabs-hosted (e.g., Claude, GPT or Gemini via ElevenLabs) or a custom LLM endpoint.
- **Microphone.** The permissions policy is `microphone=(self)`.

### 6.3 After the interview [CODE + help]

1. "Generating Your {doc}" runs, with 10 rotating progress messages. The document is written "only from what was said … A short session gives a short document; Tacivo does not fill gaps with invented detail."
2. The document appears in **Your Knowledge** as a **private draft**. It can be edited with AI writing help, and its full version history records the source of each version: ai_generated, ai_edited, expert_edited, admin_edited, uploaded, restored, ingest, query_filed, manual_edit, dream.
3. Publish confirmation requires ticking: "Everything in this document is real and verified — the names, numbers, dates and outcomes are accurate, and nothing in it is a placeholder or a guess." A warning says that unpublishing "does not take it back out" of the wiki.
4. **Reopening a session** adds content incrementally. The document "is updated with what you add; it is not rewritten from scratch", and user edits and the title are preserved. The welcome-back prompt is: "Welcome back! I can see we've previously structured {docType} — "{title}" … What would you like to add or refine?"
5. If the document is already published, changes become "unpublished changes" that must be re-published.
6. **Add source** (non-interview): upload PDF, DOCX, MD or TXT (10 MB), or write markdown manually. It becomes a draft "Reference" document. "Extracted text" is "What the wiki reads".

## 7. LLM-wiki: structure and update logic

### 7.1 Page model [CODE]

- **Types** (built-in, fixed; the user's schema works within them): overview, best_practice, how_to, decision, insight, entity, concept.
- **Fields:** title, type, summary ("One-sentence summary for the wiki index (140 chars)"), tags (comma-separated, kebab-case in the demo, e.g. `sales-strategy`), content (Markdown), version (v1, v2…), sources (count and list), related pages, "Source conflicts" block, edit mode, read count, stars.
- **Edit modes:**
  - `llm_managed`: "The ingest LLM may freely rewrite this page, preserving prior facts."
  - `hybrid`: "may only append new sections or bullets. Prose is frozen."
  - `human_locked`: "will never modify this page."
- **Citations.** "every paragraph cites the source document it comes from. Numbers in the text match the page's list of sources" (v1.2). There are inline "source tags"; lint has `unresolved_source_tags`.
- **Links.** Inline links by page title. Lint `unresolved_links` fires when titles change; `broken_links` relates to FK constraints. **[INFERENCE]** Postgres has a `wiki_links` table with FKs plus `[[Title]]`-style inline links.
- **Index.** There is an "Index" button on the Wiki page. **[INFERENCE]** This is a Karpathy-style "LLM wiki" with an `index.md` of title + summary, which the ingest LLM reads instead of embedding search. The 140-char summary "for the wiki index" strongly supports this.

### 7.2 Ingest pipeline [CODE strings]

- **Trigger.** Publishing a document runs ingest. Notably: "Publishing starts the wiki update **in your browser**, so closing the tab too quickly can mean it never ran". **[INFERENCE]** The client calls a long-running API route or edge function and there is no durable job queue.
- **Status strings.** "Ingesting…" / "Wiki failed" / "Retry wiki update" / "already being added". Visibility is locked while ingesting.
- **Result screen.** "{created} created · {updated} updated", lists of created and updated pages, "{count} source conflicts recorded — This document disagrees with something already in the wiki. Nothing was overwritten". If nothing changed: "No pages changed — this source matched existing coverage".
- **Error modes, which reveal the architecture:**
  - "The AI returned a malformed response, so the wiki was not updated": a single structured-output LLM call returning page operations.
  - "{count} of the proposed page(s) could not be written": the LLM proposes N page writes and the server applies them.
  - "The text has not changed since the wiki last read this document (version {version})": idempotent per document version.
- **Wiki schema (per team; "Name, branding and the schema doc that steers wiki ingest").**
  - Parts: "What this wiki covers" (domain), **Entity types** (name + what to record), **Terms** (term + meaning) and **Rules** (free-text).
  - Can be uploaded or downloaded as .txt (<200 KB), which gets parsed into those parts.
  - "Page types, summaries and tags are always handled for you."
- **Deleting or unpublishing a source.** Pages keep their synthesized text ("nothing rewrites it now"); only the citation trail breaks. There is no retraction of knowledge.

### 7.3 Wiki health [CODE]

**Rule checks** (manual "Check now", or weekly). Each has a severity of error, warning or info.

| Check | What it catches |
|---|---|
| `orphan_source_pages` | Pages citing deleted source documents |
| `unfed_sources` | Published documents that no page cites |
| `missing_provenance` | Pages with no recorded sources (chat insights are exempt) |
| `stale_pages` | Pages more than N days since their last ingest |
| `untagged_pages` | Pages without any tags |
| `broken_links` | Links pointing to missing targets |
| `unresolved_links` | Inline links naming page titles that no longer exist |
| `duplicate_titles` | Pages sharing a title within one page type |
| `unresolved_source_tags` | Citations pointing at deleted or unpublished documents |

**Tacivo dreams** (v1.2)

- Runs every Sunday night if new sessions were published; can be toggled per team, with an org default for new teams.
- The LLM reads the wiki plus sessions published since the last dream.
- Proposal kinds, each with an accept action:

| Proposal kind | Accept action |
|---|---|
| `pattern` | New insight page drawing on N sources, editable before "Create and publish" |
| `gap` | Session to assign (title + mode) → "Assign" |
| `interviewer_note` | Question to ask, or term for transcription |
| `duplicate` | "Keep X, fold in Y", merged by the AI; folded pages are hidden but restorable, links redirected |
| `contradiction` | Pick the correct side or write your own; the AI corrects only the affected parts and shows a diff (strike/green) |
| `rule_check` | Results of the rule checks |

- Each proposal carries evidence (pages and sources). Dismissed ideas are not re-proposed. Locked pages block acceptance.
- Log line: "Last dream: {date} · pages read: {pages} · new sessions: {sessions}".

**Knowledge map**

- 2D map on the Wiki page; a 3D map in Wiki health ("Drag to turn · right-drag to move").
- Nodes are pages, edges are links; unlinked pages are excluded.

**Team stats:** People, Completed interviews, Wiki pages (+drafts), Open tasks, Wiki links, and "pages link nowhere".

## 8. Create Agent ("Create" tab) and Learn [CODE + help + screenshots]

**Types** (admin-togglable in Org settings → Features, at least one stays on; "Ask Tacivo to add one" mails the team):

| Type | Description from the UI |
|---|---|
| **Handover Document** | "what matters most, who to know, what's in flight, and the unwritten rules" |
| **Standard Operating Procedure** | "A clear, numbered procedure anyone qualified can follow" |
| **Onboarding Guide** | "role-specific ramp plan: milestones, who to meet, what to read, and how your team works". The demo's sections: Welcome & Role Summary, Milestones (Day 30/60/90 table), Week 1, Weeks 2-4, Month 2, Month 3, Key People, Essential Reading & Wiki, Tools & Access Checklist, How We Work |
| **Training Module** | "clear outcomes, the few ideas that matter, a worked example and practice" |
| **Presentation Deck** | "concise HTML slideshow — title slide, 3–5 key points per slide, speaker notes". Slides are edited inline (add, duplicate, delete), with full-screen Present mode |

**Flow**

1. Pick a type and see 3 suggestion prompts.
2. Chat. The agent reads the wiki (status "Reading the wiki"), states what it already knows with links to wiki pages, and asks at most a couple of clarifying questions. The demo asked about seniority and the 90-day success metric.
3. It streams a **short** draft into the right pane ("Writing the draft"). Users refine via chat chips ("Make it shorter", "Add more detail", "More formal", "Add what's still open"; for decks, "Fewer slides", "Sharper headlines", "Add speaker notes", "Add a closing ask") or by direct edit. The AI keeps user edits.
4. Version history is labelled by author: Tacivo AI / Your edits / Restored.
5. "Save to Learn" saves the result. The session status becomes completed, and the session stays resumable.

**Inputs.** + menu files, `#` pages and `@` experts.

**Learn.** A library with folders (All, Favourites, one per type), author, date and preview. Documents open with an index (TOC), "Copy MD", Edit and "Share & Export".

**Export.** Download as plain text and other formats (format list not fully visible), push to a connected platform, copy a link, or share by email (opens the mail client via mailto).

**Not shipped despite marketing:** e-learning/SCORM, decision trees, fine-tuning datasets, podcasts, playbooks as a distinct type. **[INFERENCE]** These are roadmap or pilot-custom templates.

## 9. Chat ("Tacivo AI" Chat tab) [CODE + help + video]

- "I draw from your organization's wiki". The status shows "Searching knowledge base…". "It opens the pages it needs and tells you which ones it used."
  - **[INFERENCE]** This is agentic tool use (list/read pages) over the index rather than vector RAG.
- **Answer format.** Markdown with headers, plus inline "📖 See: [Page title](/platform/wiki/<uuid>)" links after sections.
- **Truncation.** "This answer was cut off because it hit the length limit": a max-tokens cap.
- **Input.** `/` templates, `#` pages, `@` experts, + files (PDF, DOCX, TXT, MD ≤10 MB), voice dictation. Each answer has a "Read aloud"/"Listen" TTS control.
- **Example prompts:** "What are our best practices for outbound sales?", "What should I know before starting as a new sales rep?", "Compare how different people approach cold calls."
- **Save to wiki.** Asks "Why are you saving this?" (chips: A decision we made / How we actually do it / A lesson worth remembering / Something new hires should know) plus "Context for the wiki". The answer becomes an **insight page** (history source `query_filed`). Sessions show "{count} saved to wiki".
- **Personalization.** Personal instructions (Profile) plus team instructions ("Say 'loss notice', not 'FNOL'").
- **Refusal string:** "I can't help with that request."
- **18 query templates in 6 categories.** The full prompts are in `en_flat.txt` under `queryTemplates.items.*`.

| Category | Templates |
|---|---|
| Synthesis | Single biggest insight, Executive brief, Connect the dots |
| Gap-finding | What is missing, Under-documented entities, Capture priorities |
| Debate | Biggest internal disagreement, Tension map, Devil's advocate |
| Output | Onboarding cheat sheet, Competitive brief, FAQ document |
| Health | Duplication audit, Consistency check, Tag & taxonomy hygiene |
| Personal | Likely mistakes, Role-specific playbook, Decision brief |

## 10. Tasks, inbox, sessions [CODE]

- **Tasks.** "My tasks" and, for managers and admins, "Assigned".
  - Kinds: Session (assignment), Review, Personal (title, notes, due date).
  - Statuses: To do / In progress / Done. Overdue flags.
- **Assign new task.**
  - Capture session: mode, team, expert, area, title, goal, background, checklist. The expert receives an email.
  - Review request: pick a source or wiki page, choose an expert, write a message.
  - Quick session (non-member, 48h link, AAR).
- **Admin knowledge view.** Multi-select documents or wiki pages → "Request expert review" / "Request new session", which prefills: "Please do a new session to contribute to the "{title}" wiki page". Lists can be exported as CSV.
- **Inbox.** Assigned tasks, wiki updates ("{n} pages created · {m} updated — from {source}", "Wiki updated from a dream"), new shared content, stale-doc suggestions, dream suggestions (managers).
- **Sessions.** A unified list across Capture / Chat / Create with type, status, visibility (Shared/Private), date, message count and wiki count.
- **Emails sent:**
  - invitation (as Admin or Expert)
  - assignment ("{assigner} asked you to record a {mode}", with session, goal, area, context and checklist)
  - quick session
  - update requested / review requested

## 11. Integrations, API, MCP [CODE + help]

- **Connections** are org-wide and admin-only. Credentials are server-side ("never shown in the browser").
  - **Notion.** Internal integration token (`secret_…`) + parent page URL/ID → "Push knowledge to Notion automatically".
  - **Confluence.** OAuth (Atlassian) + Space Key (e.g. `~TEAM`) + optional parent page ID.
  - **SharePoint.** OAuth (Microsoft) + site.
  - **Google Drive.** OAuth + optional folder ID/URL.
  - The OAuth flow uses a signed state (env var `INTEGRATION_STATE_SECRET`, leaked in an error string). Errors cover auth_failed, token_failed, state_invalid and state_expired.
  - v1.1 note: "Connections to Confluence, Google Drive and SharePoint verify each sign-in round trip."
  - Export is per document or per folder ("Export {count}"), with partial-failure reporting. **[INFERENCE]** This is push/export only; there is no import or sync from those tools.
- **API.** "Tacivo API key — One credential, scoped to this organization, read-only. Send it as a bearer token to read this organization's shared knowledge." The UI shows an Endpoint and an Example; the values were not visible without auth. The key can be regenerated or deleted.
- **MCP.** Shown as "MCP server — For ChatGPT, Claude and Cursor connectors — **In progress**", with the not-live disclaimer quoted in §0.
- **Not present in the app:** Workday, Jira, Linear, Asana, Intercom, Hootsuite, GitHub, GitLab, Firebase, DataGrip, Hugging Face, OneDrive (separately from SharePoint), and the Custom GPT/Copilot integrations.

## 12. Security and compliance claims [FACT, https://tacivo.com/security]

- **Encryption and hosting.** TLS 1.3 in transit, AES-256 at rest. "stored exclusively on EU servers (Dublin)".
- **AI processing.** "processed through enterprise AI infrastructure with a **30-day retention policy** for security monitoring, then automatically deleted. Your data is never used to train AI models." Also: "Our AI providers handle model governance and regulatory compliance on our behalf".
  - **[INFERENCE]** The 30-day abuse-monitoring retention matches the OpenAI and Anthropic API defaults (and Azure OpenAI). It does not identify which one is used.
- **Infrastructure.** "Built on enterprise-grade infrastructure (**Supabase, Vercel**) with 99.9% uptime SLA. Our providers maintain SOC 2 Type II". Tacivo itself claims no SOC 2 or ISO certification.
- **GDPR.** DPA on request, 72h breach notification, right to delete. A security questionnaire is available on request.
- **Access and auth claims.** RBAC, "Full audit logs", SSO/SAML (Enterprise), MFA (claimed).
- **Vulnerability reporting.** security@tacivo.com, acknowledged within 3 business days, safe harbour.
- **App headers [CODE].**
  - Strict CSP: `frame-ancestors 'none'`, `img-src` adds `storage.googleapis.com` and Supabase, `connect-src` = self + Supabase https/wss + ElevenLabs https/wss.
  - HSTS preload, X-Frame-Options DENY, `microphone=(self)`, camera off.
  - Password minimum of 12 characters. Sign out on this device / everywhere.
- **Privacy and Terms** (both dated 1 Oct 2026) cover **only the website**. The platform has "separate terms and privacy policies provided to customers", so **no platform sub-processor list is public**.
  - Website processors named: Vercel, Calendly, "Analytics providers (e.g., Google Analytics, if applicable)".
  - The website actually loads the **Apollo.io** website tracker and **Vercel Analytics**, and uses a **beehiiv** newsletter.

## 13. Sub-processor / tech-stack summary

| Layer | Vendor | Evidence |
|---|---|---|
| Hosting (web + app) | Vercel (fra1 edge) | security page; `server: Vercel`, `x-vercel-id: fra1` |
| DB / Auth / Storage / Realtime | Supabase (`nlplxlcrvtemgmjjqxad.supabase.co`) | security page; app CSP; supabase-js `signInWithPassword` / `signInWithOtp` in the login bundle |
| Data region | "Dublin" | security page [INFERENCE: Supabase eu-west-1 / AWS Ireland] |
| Voice (TTS + realtime agent; likely STT) | ElevenLabs | release 1.7; CSP `api.elevenlabs.io` + `wss://` |
| LLM | Undisclosed "enterprise AI infrastructure", 30-day retention | security page. v1.2 "An upgraded AI model across the platform" |
| Image storage / CDN | `storage.googleapis.com` | CSP img-src [INFERENCE: GCS bucket, maybe release media or avatars] |
| Frontend | Next.js App Router, React, Tailwind, shadcn/radix, lucide icons | bundles |
| Scheduling | Cal.eu (privacy says Calendly) | links |
| Marketing analytics | Apollo.io tracker, Vercel Analytics | homepage HTML/bundle |
| Newsletter | beehiiv | link |
| Email (transactional) | unknown | invitation, assignment and review emails exist (HTML templates in i18n) |
| File parsing | server-side PDF, DOCX, TXT, MD, CSV, XLSX text extraction, no OCR | upload errors |

## 14. Latency and quality claims

- **Latency:** "Replies start faster" (v1.7). "Generating your document" uses rotating messages. The dream page prep "can take up to a minute". No numbers are published.
- **Quality and grounding:**
  - No invented detail in documents.
  - Corrections outrank the transcript.
  - Per-paragraph citations.
  - Conflicts are recorded, never overwritten.
  - Human-in-the-loop publish with a verification checkbox.
  - Locked pages are never touched.

## 15. Release history [FACT, https://tacivo.com/releases]

| Version | Date | Highlights |
|---|---|---|
| 1.1 | 22 Sep 2026 | Security hardening: route auth checks, OAuth round-trip verification, upload sanitising, headers |
| 1.2 | 30 Sep 2026 | Version history + restore; clearer publish flow; numbered inline sources; team managers; Tacivo dreams; upgraded AI model |
| 1.3 | 30 Sep 2026 | Single Settings dialog (Org/Team/Account); Profile + personal AI instructions; Team Stats; Wiki health + 3D map; AI preferences (team instructions, wiki schema, interviewer notes); Help menu |
| 1.4 | 1 Oct 2026 | Tasks page (My/Assigned); sub-teams, logos, avatars; dark mode; shortcuts; floating inbox; admin-selectable Create types |
| 1.5 | 1 Oct 2026 | Folders by type, favourites/stars, latest edits, most read; ⋯ menu (history, copy, download, export, share by email, delete); source↔page impact; copy to another team; Learn folders |
| 1.6 | 1 Oct 2026 | Unified conversation design; + menu, #, @; saved/resumable Chat and Create sessions; Create rebuilt (short grounded draft, edit in place, split pane, deck slide editing); interview live notes + topic progress + early generate; voice pause/resume with recap |
| 1.7 | 6 Oct 2026 | Newest ElevenLabs voice model, expressive tone not written to transcripts, faster replies |

## 16. Gaps and things not verifiable

- Authenticated app routes, API endpoint paths, the REST response schema, and the exact LLM vendor and model. The user rejected further route probing, so it was stopped.
- The cal.eu pilot-overview page (404 via fetch).
- No platform DPA or sub-processor list is public. It may be requestable via hello@tacivo.com.
- Homepage videos (capture.mp4 9s, learn.mp4 14s) were sampled; the frames are described above.
- Note: tacivo.com's website Terms (§4) prohibit automated scraping "without permission". This research was limited to a small number of public page fetches.
