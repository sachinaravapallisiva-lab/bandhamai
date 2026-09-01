/**
 * Live Home shortlist and pin helpers. Fail closed.
 * This module must never import seed names or browse-test-pond.
 */
import type { BrowseProfile } from "./profile-search";

/** Live Home stays fail closed. Keep this false so seed people never render. */
export const BROWSE_TEST_SEED_ENABLED = false;

export function browseShortlistPond(live: BrowseProfile[]) {
  if (BROWSE_TEST_SEED_ENABLED) return [];
  return Array.isArray(live) ? live : [];
}

export function browsePinnedPreview() {
  return [];
}
