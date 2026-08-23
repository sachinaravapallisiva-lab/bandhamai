/** Owner opt-in for other signed-in members to download biodata. Default off. */

export const BIODATA_SHARE_COLUMN = "biodata_share";
export const BIODATA_SHARE_SQL_FILE = "supabase/biodata_share.sql";
export const BIODATA_SHARE_DEFAULT = false;

export const BIODATA_SHARE_LABEL = "Allow others to download my biodata";
export const BIODATA_SHARE_HINT =
  "Off by default. Other members can download your biodata only if you turn this on.";
export const BIODATA_SHARE_SAVE_LABEL = "Save biodata choice";
export const BIODATA_SHARE_SAVING_LABEL = "Saving…";

export const BIODATA_NOT_SHARED_ERROR =
  "This member has not allowed others to download their biodata.";
export const BIODATA_UNAVAILABLE_ERROR = "That profile is not available.";
export const BIODATA_OTHER_SIGNED_IN_ERROR = "Sign in to download this biodata.";
export const BIODATA_SHARE_SQL_HINT =
  "Run supabase/biodata_share.sql in the Supabase SQL editor to add profiles.biodata_share.";

/** True only for explicit opt-in values. Everything else stays off. */
export function parseBiodataShare(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const raw = value.trim().toLowerCase();
    return raw === "true" || raw === "1" || raw === "on" || raw === "yes";
  }
  return false;
}

export function readBiodataTargetId(searchParams: URLSearchParams): string {
  const raw = searchParams.get("id") || searchParams.get("profile_id") || "";
  return raw.trim();
}

export function biodataDownloadPath(profileId?: string) {
  const id = typeof profileId === "string" ? profileId.trim() : "";
  if (!id) return "/api/profiles/biodata";
  return "/api/profiles/biodata?id=" + encodeURIComponent(id);
}

export function canShowOtherBiodataDownload(options: {
  signedIn: boolean;
  biodataShare: unknown;
}) {
  return !!options.signedIn && parseBiodataShare(options.biodataShare);
}

export type BiodataAccess =
  | { ok: true; kind: "own" | "other" }
  | { ok: false; status: 403 | 404; error: string };

/**
 * Own profile: always allowed (no id, or id belongs to the viewer).
 * Other profile: live and opted in. Missing/pending looks like 404.
 */
export function decideBiodataAccess(options: {
  viewerUserId: string;
  targetUserId?: string | null;
  targetStatus?: string | null;
  biodataShare?: unknown;
  isOwnLookup: boolean;
}): BiodataAccess {
  const viewer = typeof options.viewerUserId === "string" ? options.viewerUserId.trim() : "";
  const owner = typeof options.targetUserId === "string" ? options.targetUserId.trim() : "";
  if (options.isOwnLookup) return { ok: true, kind: "own" };
  if (viewer && owner && viewer === owner) return { ok: true, kind: "own" };

  const status = typeof options.targetStatus === "string" ? options.targetStatus.trim().toLowerCase() : "";
  if (status !== "live") {
    return { ok: false, status: 404, error: BIODATA_UNAVAILABLE_ERROR };
  }
  if (!parseBiodataShare(options.biodataShare)) {
    return { ok: false, status: 403, error: BIODATA_NOT_SHARED_ERROR };
  }
  return { ok: true, kind: "other" };
}
