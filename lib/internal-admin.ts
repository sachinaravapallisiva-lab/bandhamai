import { SUPPORT_INBOX_EMAIL_DEFAULT } from "./support";

/** Founder inbox already used for support. Not a new auth vendor. */
export function founderAdminEmails() {
  const emails = [SUPPORT_INBOX_EMAIL_DEFAULT];
  const fromEnv = (process.env.SUPPORT_INBOX_EMAIL || "").trim();
  if (fromEnv) emails.push(fromEnv);
  return emails.map(function (email) {
    return email.toLowerCase();
  });
}

/** Signed in founder only. Empty email fails closed. */
export function isFounderAdminEmail(email: string | null | undefined) {
  const got = (email || "").trim().toLowerCase();
  if (!got) return false;
  return founderAdminEmails().includes(got);
}
