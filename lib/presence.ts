/** Heartbeat presence — signed-in activity, not VerifyAI and not a match %. */

export const PRESENCE_TABLE = "presence";
export const PRESENCE_SQL_FILE = "supabase/presence.sql";
export const PRESENCE_HEARTBEAT_PATH = "/api/presence/heartbeat";
export const PRESENCE_LOOKUP_PATH = "/api/presence";

/** Treat last_seen within this window as online. */
export const PRESENCE_ONLINE_WINDOW_MS = 3 * 60 * 1000;

/** Client ping while the signed-in shell is visible. */
export const PRESENCE_HEARTBEAT_MS = 35 * 1000;

/** Green is only for this online mark. Brand stays violet / white. */
export const PRESENCE_ONLINE_COLOR = "#16A34A";
export const PRESENCE_ONLINE_TEXT = "#15803D";
export const PRESENCE_OFFLINE_COLOR = "#C4C1D6";

export function presenceTableMissingHint() {
  return "Presence storage is not applied yet. Run " + PRESENCE_SQL_FILE + " in the Supabase SQL editor.";
}

export function isRecentlySeen(
  lastSeenAt: unknown,
  nowMs = Date.now(),
  windowMs = PRESENCE_ONLINE_WINDOW_MS
) {
  if (lastSeenAt instanceof Date) {
    const ts = lastSeenAt.getTime();
    return Number.isFinite(ts) && nowMs - ts >= 0 && nowMs - ts <= windowMs;
  }
  if (typeof lastSeenAt !== "string" || !lastSeenAt.trim()) return false;
  const ts = Date.parse(lastSeenAt);
  return Number.isFinite(ts) && nowMs - ts >= 0 && nowMs - ts <= windowMs;
}

export function presenceFromRow(row: Record<string, unknown> | null | undefined, nowMs = Date.now()) {
  const last_seen_at =
    row && (typeof row.last_seen_at === "string" || row.last_seen_at instanceof Date)
      ? row.last_seen_at instanceof Date
        ? row.last_seen_at.toISOString()
        : row.last_seen_at
      : null;
  return {
    online: isRecentlySeen(last_seen_at, nowMs),
    last_seen_at,
  };
}
