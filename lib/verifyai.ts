export const VERIFYAI_SQL_FILE = "supabase/verifyai.sql";
export const VERIFYAI_STATUSES = ["unverified", "pending", "verified", "failed", "revoked"] as const;

export type VerifyaiStatus = (typeof VERIFYAI_STATUSES)[number];

export const VERIFYAI_STATUS_COLUMN = "verifyai_status";
export const VERIFYAI_EXTERNAL_ID_COLUMN = "verifyai_external_id";
export const VERIFYAI_UPDATED_AT_COLUMN = "verifyai_updated_at";

export function isVerifyaiStatus(value: string): value is VerifyaiStatus {
  return (VERIFYAI_STATUSES as readonly string[]).includes(value);
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
