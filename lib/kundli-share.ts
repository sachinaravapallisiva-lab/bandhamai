/** Owner opt-in for other signed-in members to run Gun Milan. Default off. */

export const KUNDLI_SHARE_COLUMN = "kundli_share";
export const KUNDLI_SHARE_SQL_FILE = "supabase/gun_milan.sql";
export const KUNDLI_SHARE_DEFAULT = false;

export const KUNDLI_SHARE_LABEL = "Allow others to run Gun Milan with me";
export const KUNDLI_SHARE_HINT =
  "Off by default. Other members can run Gun Milan with you only if you turn this on.";
export const KUNDLI_SHARE_SAVE_LABEL = "Save Gun Milan choice";
export const KUNDLI_SHARE_SAVING_LABEL = "Saving…";

export const KUNDLI_NOT_ALLOWED_ERROR = "This member has not allowed Gun Milan.";
export const KUNDLI_UNAVAILABLE_ERROR = "That profile is not available.";
export const KUNDLI_SIGNED_IN_ERROR = "Sign in to run Gun Milan.";
export const KUNDLI_SHARE_SQL_HINT =
  "Run supabase/gun_milan.sql in the Supabase SQL editor to add Gun Milan.";

/** True only for explicit opt-in values. Everything else stays off. */
export function parseKundliShare(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const raw = value.trim().toLowerCase();
    return raw === "true" || raw === "1" || raw === "on" || raw === "yes";
  }
  return false;
}

export function canShowGunMilanAction(options: {
  signedIn: boolean;
  kundliShare: unknown;
}) {
  return !!options.signedIn && parseKundliShare(options.kundliShare);
}
