// Shared by server and client. No database imports here.
export const INTERVIEW_MODES = ["after_action_review", "exit_interview", "process_mapping", "handover", "self_review"] as const;
export type InterviewMode = (typeof INTERVIEW_MODES)[number];

export const PAGE_TYPES = ["overview", "decision", "concept", "best_practice", "how_to", "insight", "entity"] as const;
export type PageType = (typeof PAGE_TYPES)[number];

export const DOCUMENT_TYPES = ["handover", "sop", "onboarding_guide", "training_module", "decision_tree"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const MODE_LABELS: Record<InterviewMode, { label: string; blurb: string }> = {
  after_action_review: { label: "After action review", blurb: "A project, incident, or launch that just ended." },
  exit_interview: { label: "Exit interview", blurb: "Someone leaving. Capture the judgement they built." },
  process_mapping: { label: "Process mapping", blurb: "How a recurring task really gets done." },
  handover: { label: "Handover", blurb: "Pass a role or project to the next owner." },
  self_review: { label: "Self review", blurb: "Your own wins, misses, and lessons." },
};

// Used when topic planning is slow or unavailable. Each list follows its method's order.
export const DEFAULT_TOPICS: Record<InterviewMode, string[]> = {
  after_action_review: ["What was supposed to happen", "What actually happened", "Why the outcome differed", "What to keep doing", "What to change next time"],
  exit_interview: ["A hard case only you could handle", "The decision points in that case", "Cues a newcomer would miss", "Contacts and workarounds", "Recurring traps in this role"],
  process_mapping: ["Main steps and their order", "Inputs, outputs, and owners", "What experts notice at each step", "When the standard path breaks", "How you check the result"],
  handover: ["Responsibilities and cadence", "Open items and deadlines", "Key contacts", "Risks and early warnings", "Decisions in flight", "First week for the next owner"],
  self_review: ["Goals for the period", "Results against each goal", "Biggest wins and why", "Biggest misses and causes", "Goals for next period"],
};

export const DOCUMENT_LABELS: Record<DocumentType, { label: string; blurb: string }> = {
  handover: { label: "Handover", blurb: "Everything the next owner needs in week one." },
  sop: { label: "SOP", blurb: "A procedure someone can follow cold." },
  onboarding_guide: { label: "Onboarding guide", blurb: "A ramp-up path for a new hire." },
  training_module: { label: "Training module", blurb: "A short lesson with a quiz." },
  decision_tree: { label: "Decision tree", blurb: "A flowchart for a recurring judgement call." },
};

export type Topic = { id: string; label: string; covered: boolean };
export type Note = { id: string; topicId: string | null; text: string; byUser: boolean };
export type ChecklistItem = { id: string; text: string; done: boolean };
export type Citation =
  | { n: number; kind: "page"; slug: string; title: string }
  | { n: number; kind: "evidence"; slug: string; title: string; interviewId: string | null; tStartMs: number | null; quote: string };
