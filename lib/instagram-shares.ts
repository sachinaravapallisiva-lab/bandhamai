/** Owner-initiated Instagram visibility. Handles stay hidden until a share row exists. */

export const INSTAGRAM_SHARES_TABLE = "instagram_shares";
export const INSTAGRAM_SHARES_SQL_FILE = "supabase/instagram_shares.sql";
export const INSTAGRAM_SHARE_PATH = "/api/instagram/share";

export const INSTAGRAM_SHARE_SQL_HINT =
  "Run supabase/instagram_shares.sql in the Supabase SQL editor to turn on Instagram sharing.";

export const INSTAGRAM_HIDDEN_DISCLAIMER =
  "Optional. Your Instagram stays hidden until you choose to show it to someone.";

export function cleanInstagramHandle(value: unknown) {
  return typeof value === "string" ? value.replace(/^@+/, "").trim() : "";
}

export function instagramSharesTableMissingHint() {
  return INSTAGRAM_SHARE_SQL_HINT;
}

/**
 * Return a handle only for self or an explicit share. Public Browse
 * and unmatched Like/match must get an empty string.
 */
export function revealInstagramHandle(options: {
  handle: unknown;
  viewerUserId?: string | null;
  ownerUserId?: string | null;
  granted: boolean;
}) {
  const handle = cleanInstagramHandle(options.handle);
  if (!handle) return "";
  const viewer = typeof options.viewerUserId === "string" ? options.viewerUserId.trim() : "";
  const owner = typeof options.ownerUserId === "string" ? options.ownerUserId.trim() : "";
  if (viewer && owner && viewer === owner) return handle;
  if (options.granted && viewer && owner && viewer !== owner) return handle;
  return "";
}

/** Strip `instagram` from list rows unless the viewer was granted that owner. */
export function applyInstagramVisibility(
  rows: Record<string, unknown>[],
  viewerUserId: string | null,
  grantedOwnerIds: Iterable<string>
): Record<string, unknown>[] {
  const granted = new Set(
    Array.from(grantedOwnerIds).filter(function (id) {
      return typeof id === "string" && id.trim().length > 0;
    })
  );
  const viewer = viewerUserId && viewerUserId.trim() ? viewerUserId.trim() : null;

  return rows.map(function (row) {
    const owner = typeof row.user_id === "string" ? row.user_id : "";
    const handle = revealInstagramHandle({
      handle: row.instagram,
      viewerUserId: viewer,
      ownerUserId: owner,
      granted: !!(owner && granted.has(owner)),
    });
    if (handle) return { ...row, instagram: handle };
    const next = { ...row };
    delete next.instagram;
    return next;
  });
}
