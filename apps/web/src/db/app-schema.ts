import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth-schema";
import type { ChecklistItem, Citation, DocumentType, InterviewMode, Note, PageType, Topic } from "@/lib/constants";
export * from "@/lib/constants";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const created = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updated = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date());
const orgRef = () =>
  text("org_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" });




export const interview = pgTable(
  "interview",
  {
    id: id(),
    orgId: orgRef(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    mode: text("mode").$type<InterviewMode>().notNull(),
    title: text("title").notNull(),
    area: text("area").notNull().default(""),
    goal: text("goal").notNull(),
    background: text("background").notNull().default(""),
    expertName: text("expert_name").notNull().default(""),
    status: text("status")
      .$type<"live" | "ended" | "published">()
      .notNull()
      .default("live"),
    topics: jsonb("topics").$type<Topic[]>().notNull().default([]),
    notes: jsonb("notes").$type<Note[]>().notNull().default([]),
    checklist: jsonb("checklist").$type<ChecklistItem[]>().notNull().default([]),
    draftMd: text("draft_md").notNull().default(""),
    verified: boolean("verified").notNull().default(false),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [index("interview_org_idx").on(t.orgId, t.createdAt)],
);

export const utterance = pgTable(
  "utterance",
  {
    id: id(),
    interviewId: text("interview_id")
      .notNull()
      .references(() => interview.id, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    speaker: text("speaker").$type<"expert" | "interviewer">().notNull(),
    text: text("text").notNull(),
    tStartMs: integer("t_start_ms").notNull(),
    tEndMs: integer("t_end_ms").notNull(),
    createdAt: created(),
  },
  (t) => [uniqueIndex("utterance_seq_idx").on(t.interviewId, t.seq)],
);

// A published interview (or imported document) becomes an immutable source.
export const source = pgTable("source", {
  id: id(),
  orgId: orgRef(),
  kind: text("kind").$type<"interview" | "document" | "chat">().notNull(),
  interviewId: text("interview_id").references(() => interview.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  expertName: text("expert_name").notNull().default(""),
  text: text("text").notNull(),
  createdAt: created(),
});

export const chunk = pgTable(
  "chunk",
  {
    id: id(),
    orgId: orgRef(),
    sourceId: text("source_id")
      .notNull()
      .references(() => source.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    charStart: integer("char_start").notNull(),
    charEnd: integer("char_end").notNull(),
    tStartMs: integer("t_start_ms"),
  },
  (t) => [index("chunk_source_idx").on(t.sourceId)],
);

export const page = pgTable(
  "page",
  {
    id: id(),
    orgId: orgRef(),
    slug: text("slug").notNull(),
    type: text("type").$type<PageType>().notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    bodyMd: text("body_md").notNull().default(""),
    tags: text("tags").array().notNull().default([]),
    editMode: text("edit_mode")
      .$type<"llm_managed" | "hybrid" | "human_locked">()
      .notNull()
      .default("llm_managed"),
    status: text("status").$type<"published" | "needs_review">().notNull().default("published"),
    version: integer("version").notNull().default(1),
    searchText: text("search_text").notNull().default(""),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [uniqueIndex("page_slug_idx").on(t.orgId, t.slug)],
);

export const pageRevision = pgTable("page_revision", {
  id: id(),
  pageId: text("page_id")
    .notNull()
    .references(() => page.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  bodyMd: text("body_md").notNull(),
  author: text("author").notNull(),
  sourceId: text("source_id"),
  createdAt: created(),
});

export const claim = pgTable(
  "claim",
  {
    id: id(),
    pageId: text("page_id")
      .notNull()
      .references(() => page.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    status: text("status").$type<"active" | "superseded" | "contested">().notNull().default("active"),
    supersededBy: text("superseded_by"),
    createdAt: created(),
  },
  (t) => [index("claim_page_idx").on(t.pageId)],
);

export const evidence = pgTable(
  "evidence",
  {
    id: id(),
    claimId: text("claim_id")
      .notNull()
      .references(() => claim.id, { onDelete: "cascade" }),
    sourceId: text("source_id")
      .notNull()
      .references(() => source.id, { onDelete: "cascade" }),
    utteranceId: text("utterance_id"),
    quote: text("quote").notNull(),
    charStart: integer("char_start").notNull(),
    charEnd: integer("char_end").notNull(),
    tStartMs: integer("t_start_ms"),
    stance: text("stance").$type<"supports" | "contradicts">().notNull().default("supports"),
    createdAt: created(),
  },
  (t) => [index("evidence_claim_idx").on(t.claimId)],
);

export const link = pgTable(
  "link",
  {
    fromPageId: text("from_page_id")
      .notNull()
      .references(() => page.id, { onDelete: "cascade" }),
    toPageId: text("to_page_id")
      .notNull()
      .references(() => page.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.fromPageId, t.toPageId] })],
);

export const ingestRun = pgTable("ingest_run", {
  id: id(),
  orgId: orgRef(),
  sourceId: text("source_id")
    .notNull()
    .references(() => source.id, { onDelete: "cascade" }),
  status: text("status").$type<"queued" | "running" | "done" | "failed">().notNull().default("queued"),
  stats: jsonb("stats").$type<Record<string, number>>().notNull().default({}),
  log: text("log").notNull().default(""),
  createdAt: created(),
  updatedAt: updated(),
});


export const chatThread = pgTable("chat_thread", {
  id: id(),
  orgId: orgRef(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New chat"),
  createdAt: created(),
  updatedAt: updated(),
});

export const chatMessage = pgTable("chat_message", {
  id: id(),
  threadId: text("thread_id")
    .notNull()
    .references(() => chatThread.id, { onDelete: "cascade" }),
  role: text("role").$type<"user" | "assistant">().notNull(),
  content: text("content").notNull(),
  citations: jsonb("citations").$type<Citation[]>().notNull().default([]),
  createdAt: created(),
});


export const document = pgTable("document", {
  id: id(),
  orgId: orgRef(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),
  type: text("type").$type<DocumentType>().notNull(),
  title: text("title").notNull(),
  brief: text("brief").notNull(),
  bodyMd: text("body_md").notNull().default(""),
  pageIds: text("page_ids").array().notNull().default([]),
  citations: jsonb("citations").$type<Citation[]>().notNull().default([]),
  createdAt: created(),
  updatedAt: updated(),
});

export const orgSettings = pgTable("org_settings", {
  orgId: text("org_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  wikiSchema: text("wiki_schema").notNull().default(""),
  interviewerNotes: text("interviewer_notes").notNull().default(""),
  glossary: text("glossary").notNull().default(""),
  apiKeyHash: text("api_key_hash"),
  apiKeyPrefix: text("api_key_prefix"),
  notionTokenEnc: text("notion_token_enc"),
  notionParentPageId: text("notion_parent_page_id"),
  updatedAt: updated(),
});
