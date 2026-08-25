/**
 * Home / Browse middle slot: a live pond carousel.
 * Profiles come from /api/profiles/search only. Never invent names or faces.
 */

export const BROWSE_CAROUSEL_ADVANCE_MS = 5200;
export const BROWSE_CAROUSEL_PEEK = 22;
export const BROWSE_CAROUSEL_GAP = 12;
export const BROWSE_CAROUSEL_ARIA = "Live profiles";
export const BROWSE_CAROUSEL_PREV = "Previous";
export const BROWSE_CAROUSEL_NEXT = "Next";
export const BROWSE_CAROUSEL_EMPTY_TITLE = "No matches yet.";
export const BROWSE_CAROUSEL_EMPTY_BODY = "Photo coming soon. Live profiles will appear here when they are approved.";

export function nextCarouselIndex(index: number, length: number) {
  if (!Number.isFinite(index) || !Number.isFinite(length) || length <= 0) return 0;
  return (Math.max(0, Math.floor(index)) + 1) % Math.floor(length);
}

export function prevCarouselIndex(index: number, length: number) {
  if (!Number.isFinite(index) || !Number.isFinite(length) || length <= 0) return 0;
  const size = Math.floor(length);
  return (Math.max(0, Math.floor(index)) - 1 + size) % size;
}

export function clampCarouselIndex(index: number, length: number) {
  if (!Number.isFinite(length) || length <= 0) return 0;
  if (!Number.isFinite(index) || index < 0) return 0;
  return Math.min(Math.floor(index), Math.floor(length) - 1);
}

export function shouldAutoAdvance(opts: { reduceMotion: boolean; count: number; paused?: boolean }) {
  return !opts.reduceMotion && !opts.paused && opts.count > 1;
}
