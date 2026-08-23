export const VERIFYAI_SQL_FILE = "supabase/verifyai.sql";
export const VERIFYAI_PAYMENTS_TABLE = "verifyai_payments";
export const VERIFYAI_SESSIONS_TABLE = "verifyai_sessions";
export const VERIFYAI_PURPOSE = "verifyai";
export const VERIFYAI_PRICE_CENTS = 499;
export const VERIFYAI_PRICE_LABEL = "$4.99";
export const VERIFYAI_PRICE_ENV = "STRIPE_VERIFYAI_PRICE_ID";

export const VERIFYAI_COPY = {
  headline: "Get verified · $4.99",
  body: "One-time $4.99. That pays for a VerifyAI identity check (verifyai.llc). Paying does not verify your profile. The quiet badge appears only after VerifyAI succeeds.",
  paid:
    "Payment recorded. Your profile is not verified yet. Continue into the VerifyAI check.",
  notConfigured:
    "Verification checkout is not configured. Set STRIPE_VERIFYAI_PRICE_ID (and the existing Stripe keys) on Vercel.",
  wrongPrice:
    "STRIPE_VERIFYAI_PRICE_ID must be a one-time $4.99 Price (Checkout mode payment). Do not point it at the $9.99/mo messaging subscription.",
  startMissing:
    "Payment is on file, but the VerifyAI start URL is not configured. Set VERIFYAI_START_URL or VERIFYAI_API_URL. The badge stays off until VerifyAI succeeds.",
  already: "This profile is already verified.",
  photoRequired: "Add a profile photo before VerifyAI.",
} as const;

export const VERIFYAI_STATUSES = ["unverified", "pending", "verified", "failed", "revoked"] as const;

export type VerifyaiStatus = (typeof VERIFYAI_STATUSES)[number];

export const VERIFYAI_STATUS_COLUMN = "verifyai_status";
export const VERIFYAI_EXTERNAL_ID_COLUMN = "verifyai_external_id";
export const VERIFYAI_UPDATED_AT_COLUMN = "verifyai_updated_at";

export function isVerifyaiStatus(value: string): value is VerifyaiStatus {
  return (VERIFYAI_STATUSES as readonly string[]).includes(value);
}

/** Sai lock: VerifyAI Price must be one-time $4.99, not a recurring subscription Price. */
export function isOneTimeVerifyaiPrice(price: {
  type?: string | null;
  unit_amount?: number | null;
  recurring?: unknown;
}) {
  if (price.type === "recurring" || price.recurring) return false;
  if (typeof price.unit_amount === "number" && price.unit_amount !== VERIFYAI_PRICE_CENTS) return false;
  return price.type === "one_time" || !price.recurring;
}

/** Badge is on only for this exact status. Pending / failed / missing stay hidden. */
export function isVerifyaiVerified(status: unknown) {
  return typeof status === "string" && status.trim().toLowerCase() === "verified";
}

export function normalizeVerifyaiStatus(raw: unknown): VerifyaiStatus | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().toLowerCase();
  if (value === "success" || value === "complete" || value === "completed" || value === "pass") {
    return "verified";
  }
  if (value === "fail" || value === "rejected" || value === "denied") return "failed";
  if (value === "review" || value === "processing") return "pending";
  if (isVerifyaiStatus(value)) return value;
  return null;
}
