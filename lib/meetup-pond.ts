/**
 * Live meetup rail helper. Fail closed.
 * This module must never import SAMPLE copy or meetup-test-pond.
 */

export type MeetupRailPost = {
  id: string;
  kicker: string;
  monthLabel: string;
  title: string;
  body: string;
};

/** Live Home stays fail closed. Keep this false so SAMPLE posts never render. */
export const MEETUP_TEST_SEED_ENABLED = false;

export function meetupRailPosts(live: MeetupRailPost[] = []) {
  if (MEETUP_TEST_SEED_ENABLED) return [];
  return Array.isArray(live) ? live : [];
}
