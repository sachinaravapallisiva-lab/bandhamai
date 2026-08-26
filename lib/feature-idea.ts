import { asTrimmed } from "./support";

export const FEATURE_IDEA_CATEGORY = "idea" as const;
export const FEATURE_IDEA_SOURCE = "idea" as const;
export const FEATURE_IDEA_PATH = "/idea";
export const FEATURE_IDEA_API_PATH = "/api/support/ideas";
export const FEATURE_IDEA_SQL_FILE = "supabase/feature_ideas.sql";

export const FEATURE_IDEA_LABEL = "Send a feature idea";
export const FEATURE_IDEA_CONFIRM = "We got your idea. Thank you.";
export const FEATURE_IDEA_KICKER = "FEATURE IDEA";
export const FEATURE_IDEA_BODY =
  "Tell Bandham AI what to add or change. Bandham AI reviews the same queue as app issue tickets.";
export const FEATURE_IDEA_SIGN_IN = "Sign in to send a feature idea.";
export const FEATURE_IDEA_SUBMIT = "Send a feature idea";
export const FEATURE_IDEA_FIELD_LABEL = "YOUR IDEA";
export const FEATURE_IDEA_PLACEHOLDER = "What should Bandham AI add or change?";
export const FEATURE_IDEA_TOO_SHORT = "Add a bit more so we can review it.";
export const FEATURE_IDEA_SAFETY =
  "This is not for harassment or emergencies. Use Block or Report on a profile for that.";

export type FeatureIdeaDraft = {
  category: typeof FEATURE_IDEA_CATEGORY;
  subject: string;
  body: string;
};

export function ideaTableMissingHint() {
  return (
    "Feature idea storage is not applied yet. Run " +
    FEATURE_IDEA_SQL_FILE +
    " in the Supabase SQL editor after support_tickets.sql."
  );
}

export function looksLikeFeatureIdeaIntent(text: string) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return (
    /\bsend a feature idea\b/.test(lower) ||
    /\b(feature idea|product idea)\b/.test(lower)
  );
}

export function deriveIdeaSubject(body: string) {
  const compact = asTrimmed(body.replace(/\s+/g, " "), 160);
  return asTrimmed(compact, 80);
}

export function normalizeIdeaDraft(raw: {
  subject?: unknown;
  body?: unknown;
  idea?: unknown;
} | null | undefined): FeatureIdeaDraft | null {
  if (!raw) return null;
  const body = asTrimmed(raw.body ?? raw.idea, 4000);
  if (body.length < 8) return null;
  const subject = asTrimmed(raw.subject, 160) || deriveIdeaSubject(body);
  if (subject.length < 4) return null;
  return { category: FEATURE_IDEA_CATEGORY, subject, body };
}
