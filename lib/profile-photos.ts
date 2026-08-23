/** Storage bucket name. Not a secret — create it with supabase/profile_photos.sql. */
export const PROFILE_PHOTO_BUCKET = "profile-photos";

export const PROFILE_PHOTO_COLUMNS = ["photo_url", "photo_blurred_url"] as const;
export type ProfilePhotoColumn = (typeof PROFILE_PHOTO_COLUMNS)[number];

export const PHOTO_MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const PHOTO_MAX_SIDE = 1600;

export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

export const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
]);

export type ProfilePhotoUrls = {
  photo_url: string;
  photo_blurred_url: string;
};

export function emptyPhotoUrls(): ProfilePhotoUrls {
  return { photo_url: "", photo_blurred_url: "" };
}

export const PROFILE_PHOTO_REQUIRED_ERROR = "Add a profile photo before you submit.";

/** True when the profile row has a non-empty stored photo_url. */
export function hasProfilePhotoUrl(url: unknown) {
  return typeof url === "string" && url.trim().length > 0;
}

/** Accept only URLs this user just stored under profile-photos/{userId}/. */
export function isOwnStoredPhotoUrl(url: string, userId: string) {
  if (!url || !userId) return false;
  try {
    const parsed = new URL(url);
    const path = decodeURIComponent(parsed.pathname);
    return path.includes("/" + PROFILE_PHOTO_BUCKET + "/") && path.includes("/" + userId + "/");
  } catch {
    return false;
  }
}
