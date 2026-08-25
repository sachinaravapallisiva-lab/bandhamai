import { hasProfilePhotoUrl, isOwnStoredPhotoUrl } from "./profile-photos";

/** 28 to 32px circle beside Bandham AI and Account. Not a hero photo. */
export const SIDEBAR_AVATAR_SIZE = 30;

export const SIDEBAR_AVATAR_MARK = "sidebar-own-photo";

/** Decorative when empty. Spoken only when the signed in person has their own photo. */
export const SIDEBAR_AVATAR_ALT = "Your profile photo";

/** Accept only a non empty photo_url stored under this signed in user. */
export function sidebarOwnPhotoUrl(photoUrl: unknown, userId: string) {
  if (!userId || !hasProfilePhotoUrl(photoUrl)) return "";
  const url = String(photoUrl).trim();
  return isOwnStoredPhotoUrl(url, userId) ? url : "";
}

/** One quiet initial. Empty string means an empty cream circle, not a stock face. */
export function sidebarAvatarInitial(name: unknown) {
  if (typeof name !== "string") return "";
  const text = name.trim();
  if (!text) return "";
  const first = text[0] || "";
  return first.toUpperCase();
}
