import { SUPPORT_INBOX_EMAIL_DEFAULT } from "./support";

/** Server only. Comma separated emails in BANDHAM_ADMIN_EMAILS. */
export function envAdminEmails() {
  return (process.env.BANDHAM_ADMIN_EMAILS || "")
    .split(",")
    .map(function (email) {
      return email.trim().toLowerCase();
    })
    .filter(Boolean);
}

/** Personal Gmail used to sign in. Same inbox as SUPPORT_INBOX_EMAIL_DEFAULT, extra dot. */
export const FOUNDER_SIGNIN_ADMIN_EMAIL = "sachin.aravapalli.siva@gmail.com";

/** Founder inbox plus the personal Gmail used to sign in. Not a new auth vendor. */
export function founderAdminEmails() {
  const emails = [SUPPORT_INBOX_EMAIL_DEFAULT, FOUNDER_SIGNIN_ADMIN_EMAIL];
  const fromEnv = (process.env.SUPPORT_INBOX_EMAIL || "").trim();
  if (fromEnv) emails.push(fromEnv);
  return emails.map(function (email) {
    return email.toLowerCase();
  });
}

/** Env allowlist plus hardcoded founder admin emails. Empty list fails closed. */
export function adminAllowlistEmails() {
  const seen = new Set<string>();
  envAdminEmails().concat(founderAdminEmails()).forEach(function (email) {
    if (email) seen.add(email);
  });
  return Array.from(seen);
}

/** Signed in admin only. Empty email or empty allowlist fails closed. */
export function isAdminEmail(email: string | null | undefined) {
  const got = (email || "").trim().toLowerCase();
  if (!got) return false;
  const allowed = adminAllowlistEmails();
  if (allowed.length === 0) return false;
  return allowed.includes(got);
}

/** Same gate. Kept so older checks still read a founder helper. */
export function isFounderAdminEmail(email: string | null | undefined) {
  return isAdminEmail(email);
}
