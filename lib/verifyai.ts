export const VERIFYAI_SQL_FILE = "supabase/verifyai.sql";
export const VERIFYAI_PAYMENTS_TABLE = "verifyai_payments";
export const VERIFYAI_SESSIONS_TABLE = "verifyai_sessions";
export const VERIFYAI_PURPOSE = "verifyai";
export const VERIFYAI_PRICE_CENTS = 499;
export const VERIFYAI_PRICE_LABEL = "$4.99";
export const VERIFYAI_PRICE_ENV = "DODO_VERIFYAI_PRODUCT_ID";

export const VERIFYAI_FIRST_PARTY_START_PATH = "/account#verify";

export const VERIFYAI_COPY = {
  headline: "Get verified · $4.99",
  body: "One time $4.99. That pays for a VerifyAI identity check on this device. Paying does not verify your profile. The quiet badge appears only after the check succeeds.",
  paid:
    "Payment recorded. Your profile is not verified yet. Continue into the VerifyAI check.",
  notConfigured:
    "Verification checkout is not configured. Set DODO_VERIFYAI_PRODUCT_ID and DODO_PAYMENTS_API_KEY on Vercel.",
  wrongPrice:
    "DODO_VERIFYAI_PRODUCT_ID must be the $4.99 one-time VerifyAI product. Do not point it at the $9.99/mo messaging subscription.",
  startMissing:
    "Payment is on file, but the VerifyAI start URL is not configured. Set VERIFYAI_START_URL or VERIFYAI_API_URL. The badge stays off until VerifyAI succeeds.",
  already: "This profile is already verified.",
  photoRequired: "Add a profile photo before VerifyAI.",
  termsAgree: "I agree to the Terms",
  termsRequired: "Agree to the Terms before the check starts.",
  deviceHint:
    "This check uses Face ID, a fingerprint, or your device passcode. We store pass or fail only.",
  deviceStart: "Start the device check",
  deviceFailed: "The device check did not succeed. Your profile is not verified. You can retry.",
  deviceCanceled: "The device check was canceled. Your profile is not verified. You can retry.",
  deviceUnsupported: "This device cannot run the VerifyAI check.",
  underage: "VerifyAI is for people 18 or older.",
  badgeLabel: "Verified",
  badgePhrase: "Profile has been verified biometrically.",
} as const;

export const VERIFYAI_STATUSES = ["unverified", "pending", "verified", "failed", "revoked"] as const;

export type VerifyaiStatus = (typeof VERIFYAI_STATUSES)[number];

/** Checkout may only send people back to Account or profile create (or a child of those). */
export const VERIFYAI_RETURN_PATHS = ["/account", "/profile/new"] as const;
export const VERIFYAI_DEFAULT_RETURN_PATH = "/account";

function isAllowedVerifyaiReturnPathname(pathname: string) {
  for (const allowed of VERIFYAI_RETURN_PATHS) {
    if (pathname === allowed) return true;
    if (pathname.startsWith(allowed + "/")) return true;
  }
  return false;
}

/**
 * Allow only /account, /profile/new, or paths under those. Default /account.
 * Reject protocol-relative URLs, backslashes, and off-site next values.
 */
export function safeVerifyaiReturnPath(raw: string | null | undefined, fallback = VERIFYAI_DEFAULT_RETURN_PATH) {
  if (!raw) return fallback;

  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\")) return fallback;
  if (trimmed.includes("://")) return fallback;
  if (/[\s\r\n\t\0]/.test(trimmed)) return fallback;
  if (trimmed.includes("@")) return fallback;

  const hashIndex = trimmed.indexOf("#");
  const withoutHash = hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed;
  const qIndex = withoutHash.indexOf("?");
  const pathname = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash;

  if (pathname.includes("..")) return fallback;
  if (!isAllowedVerifyaiReturnPathname(pathname)) return fallback;
  return pathname;
}

export function verifyaiCheckoutReturnUrls(origin: string, rawPath: string | null | undefined) {
  const path = safeVerifyaiReturnPath(rawPath);
  const base = origin.replace(/\/$/, "");
  return {
    success_url: base + path + "?verify=paid",
    cancel_url: base + path + "?verify=cancel",
  };
}

export function firstPartyVerifyaiStartUrl(origin: string) {
  return origin.replace(/\/$/, "") + VERIFYAI_FIRST_PARTY_START_PATH;
}

export function isFirstPartyVerifyaiStartUrl(url: string | null | undefined, origin?: string) {
  const value = (url || "").trim();
  if (!value) return false;
  if (value === VERIFYAI_FIRST_PARTY_START_PATH || value === "/verifyai/start") return true;
  try {
    const parsed = new URL(value, origin || "https://bandhamai.vercel.app");
    const path = parsed.pathname + (parsed.hash || "");
    if (path === VERIFYAI_FIRST_PARTY_START_PATH || parsed.pathname === "/verifyai/start") return true;
    return parsed.pathname === "/account" && parsed.hash === "#verify";
  } catch {
    return false;
  }
}

/** Years from profiles.dob, including under 18. Null if missing or not a date. */
export function yearsFromDobValue(dob: unknown, now = new Date()): number | null {
  let raw = "";
  if (typeof dob === "string") raw = dob.trim();
  else if (dob instanceof Date && !Number.isNaN(dob.getTime())) {
    raw = dob.toISOString().slice(0, 10);
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const todayY = now.getUTCFullYear();
  const todayM = now.getUTCMonth() + 1;
  const todayD = now.getUTCDate();
  let age = todayY - year;
  if (todayM < month || (todayM === month && todayD < day)) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

export function yearsFromAgeField(age: unknown): number | null {
  if (typeof age === "number" && Number.isFinite(age)) {
    const years = Math.floor(age);
    if (years >= 0 && years <= 120) return years;
    return null;
  }
  if (typeof age === "string") {
    const years = Number.parseInt(age.trim(), 10);
    if (Number.isFinite(years) && years >= 0 && years <= 120) return years;
  }
  return null;
}

/** True only when a present dob or age field says the person is under 18. */
export function profileSaysUnder18(row: { dob?: unknown; age?: unknown } | null | undefined, now = new Date()) {
  if (!row) return false;
  const fromDob = row.dob == null || row.dob === "" ? null : yearsFromDobValue(row.dob, now);
  if (fromDob != null && fromDob < 18) return true;
  const fromAge = row.age == null || row.age === "" ? null : yearsFromAgeField(row.age);
  if (fromAge != null && fromAge < 18) return true;
  return false;
}

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
