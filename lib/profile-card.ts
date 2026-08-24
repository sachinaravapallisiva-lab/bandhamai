/** Soft Minimal presentation locks for Browse + Matches profile cards. */
export const PROFILE_CARD_RADIUS = 22;
export const PROFILE_PHOTO_HEIGHT = 280;
export const PROFILE_ACTION_MIN = 44;
export const PROFILE_PHOTO_BG = "#EDE4D4";
/** Cream wash only. Do not use a gradient that reads as a fake face. */
export const PROFILE_PHOTO_FALLBACK = "#FDF8F1";
export const PROFILE_PHOTO_SOON = "Photo coming soon";
export const PROFILE_BODY_PAD = "18px 18px 16px";

export function profileInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] || "" : "";
  return (first + last).toUpperCase();
}
