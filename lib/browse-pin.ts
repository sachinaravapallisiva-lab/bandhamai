/** Preview pin row. Paid Stripe pin is parked. Cap only. Not Featured. */

export const BROWSE_PIN_CAP = 10;
export const BROWSE_PRIORITY_MARK = "Priority";
export const BROWSE_PINNED_LABEL = "PINNED";

export function takePinnedIds(ids: string[], cap = BROWSE_PIN_CAP) {
  if (!Array.isArray(ids) || cap <= 0) return [];
  return ids.filter(Boolean).slice(0, cap);
}
