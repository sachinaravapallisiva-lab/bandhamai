/** Preview pin row. Show Priority cost. Paid Stripe checkout stays fail closed. */

export const BROWSE_PIN_CAP = 10;
export const BROWSE_PRIORITY_MARK = "Priority";
export const BROWSE_PINNED_LABEL = "PINNED";

/** Plain words on the pin row and CTA. No boost. No crown. No Featured. */
export const BROWSE_PIN_VOICE = "Priority $4.99 for 7 days";
export const BROWSE_PIN_CAP_NOTE = "Cap 10 pins per week.";
export const BROWSE_PIN_RENEW_NOTE = "Pay again to renew the same or a new profile.";
export const BROWSE_PIN_SEPARATE_NOTE =
  "Separate from Bandham AI $9.99 a month and VerifyAI $4.99 one time.";
export const BROWSE_PIN_NOT_CONFIGURED =
  "Priority checkout is not live. Paid pin stays parked.";
export const PIN_CHECKOUT_PATH = "/api/pins/checkout";
export const PIN_CHECKOUT_CODE = "pin_checkout_not_configured";

/** Compact pin card. Tall enough for photo, Priority, name, and city. Not a 240 roll card. */
export const BROWSE_PIN_CARD_WIDTH = 168;
export const BROWSE_PIN_PHOTO_HEIGHT = 150;
export const BROWSE_PIN_PHOTO_DIR = "/preview/pins";

export function pinCheckoutNotConfiguredPayload() {
  return {
    error: BROWSE_PIN_NOT_CONFIGURED,
    code: PIN_CHECKOUT_CODE,
  };
}

export function takePinnedIds(ids: string[], cap = BROWSE_PIN_CAP) {
  if (!Array.isArray(ids) || cap <= 0) return [];
  return ids.filter(Boolean).slice(0, cap);
}
