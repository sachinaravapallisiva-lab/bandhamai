import { isEntitledStatus } from "./billing";

/** Other people's live cards. Self account chip stays Free / Bandham AI. */
export const MEMBERSHIP_REGULAR = "regular";
export const MEMBERSHIP_PREMIUM = "premium";

export const MEMBERSHIP_REGULAR_LABEL = "Regular";
export const MEMBERSHIP_PREMIUM_LABEL = "Premium";

export type ProfileMembership = typeof MEMBERSHIP_REGULAR | typeof MEMBERSHIP_PREMIUM;

export function asProfileMembership(value: unknown): ProfileMembership {
  return value === MEMBERSHIP_PREMIUM ? MEMBERSHIP_PREMIUM : MEMBERSHIP_REGULAR;
}

export function membershipFromEntitled(entitled: boolean): ProfileMembership {
  return entitled ? MEMBERSHIP_PREMIUM : MEMBERSHIP_REGULAR;
}

/** Premium only for an existing subscriptions row that is active or trialing. */
export function membershipFromStatus(status: string | null | undefined): ProfileMembership {
  return membershipFromEntitled(isEntitledStatus(status));
}

export function membershipLabel(membership: ProfileMembership) {
  return membership === MEMBERSHIP_PREMIUM ? MEMBERSHIP_PREMIUM_LABEL : MEMBERSHIP_REGULAR_LABEL;
}
