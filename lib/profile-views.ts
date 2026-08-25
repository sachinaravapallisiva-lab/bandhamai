/** Quiet in-app profile opens. Not swipe feedback. Not a chat read receipt. */

export const PROFILE_VIEWS_TABLE = "profile_views";
export const PROFILE_VIEWS_SQL_FILE = "supabase/profile_views.sql";
export const PROFILE_VIEWS_PATH = "/api/profile-views";

export const SEEN_CHIP_LABEL = "Seen";
export const WHO_VIEWED_YOU_TITLE = "Who viewed you";
export const WHO_VIEWED_YOU_KICKER = "YOUR HISTORY";
export const WHO_VIEWED_YOU_BODY =
  "People who opened your profile. Only you can see this. Newest first.";
export const WHO_VIEWED_YOU_EMPTY = "No one has viewed your profile yet.";
export const WHO_VIEWED_YOU_SIGN_IN = "Sign in to see who viewed you.";
export const WHO_VIEWED_YOU_SECTION_ID = "viewed";

export const PREVIEW_PROFILE_IDS = ["priya", "preview", "demo"] as const;

export type ProfileViewer = {
  profileId: string;
  name: string;
  city: string;
  photoUrl: string;
  viewedAt: string;
};

export function profileViewsTableMissingHint() {
  return (
    "Profile views are not applied yet. Run " +
    PROFILE_VIEWS_SQL_FILE +
    " in the Supabase SQL editor."
  );
}

export function isPreviewProfileId(profileId: string) {
  const key = profileId.trim().toLowerCase();
  return (PREVIEW_PROFILE_IDS as readonly string[]).includes(key);
}

/** Record only a signed in member opening a real other profile. */
export function shouldRecordProfileView(input: {
  signedIn: boolean;
  preview?: boolean;
  profileId?: string | null;
  viewerUserId?: string | null;
  viewedUserId?: string | null;
  viewerProfileId?: string | null;
}) {
  if (!input.signedIn) return false;
  if (input.preview) return false;
  const profileId = typeof input.profileId === "string" ? input.profileId.trim() : "";
  if (!profileId) return false;
  if (isPreviewProfileId(profileId)) return false;
  if (input.viewerProfileId && input.viewerProfileId === profileId) return false;
  if (input.viewerUserId && input.viewedUserId && input.viewerUserId === input.viewedUserId) {
    return false;
  }
  return true;
}

export function attachSeen<T extends { id: string }>(profiles: T[], viewedIds: Iterable<string>) {
  const set = new Set(viewedIds);
  return profiles.map(function (profile) {
    return { ...profile, seen: set.has(profile.id) };
  });
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Quiet relative time. No hyphens or dashes in the returned label. */
export function viewedAtLabel(iso: string, nowMs = Date.now()) {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const delta = nowMs - then;
  if (delta < 60 * 1000) return "Just now";
  if (delta < 60 * 60 * 1000) {
    const minutes = Math.max(1, Math.floor(delta / (60 * 1000)));
    return minutes === 1 ? "1 minute ago" : minutes + " minutes ago";
  }
  if (delta < 24 * 60 * 60 * 1000) {
    const hours = Math.max(1, Math.floor(delta / (60 * 60 * 1000)));
    return hours === 1 ? "1 hour ago" : hours + " hours ago";
  }
  const days = Math.floor(delta / (24 * 60 * 60 * 1000));
  if (days === 1) return "Yesterday";
  if (days < 7) return days + " days ago";
  const date = new Date(then);
  return date.getUTCDate() + " " + MONTHS[date.getUTCMonth()] + " " + date.getUTCFullYear();
}
