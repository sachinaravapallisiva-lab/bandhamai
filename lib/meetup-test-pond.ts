/**
 * TEST ONLY preview meetup posts for Node check scripts.
 * Do not import this module from client components. SAMPLE copy must not ship in JS.
 * Live Home uses lib/meetup-pond.ts, which never reads these rows.
 */

import type { MeetupRailPost } from "./meetup-pond";

export { MEETUP_TEST_SEED_ENABLED, meetupRailPosts } from "./meetup-pond";
export type MeetupTestPost = MeetupRailPost;

export const MEETUP_RAIL_DEMO_LABEL = "This month demo";
export const MEETUP_TEST_KICKER = "SAMPLE";

export const MEETUP_TEST_POSTS: MeetupTestPost[] = [
  {
    id: "meetup-test-2026-09",
    kicker: MEETUP_TEST_KICKER,
    monthLabel: "September 2026",
    title: "Parents and values",
    body: "A virtual hour for NRI families. Talk through values, timelines, and what home means from overseas.",
  },
  {
    id: "meetup-test-2026-10",
    kicker: MEETUP_TEST_KICKER,
    monthLabel: "October 2026",
    title: "NRI parents questions",
    body: "An online room for members and parents. Ask about distance, visits, and how families meet each other.",
  },
  {
    id: "meetup-test-2026-11",
    kicker: MEETUP_TEST_KICKER,
    monthLabel: "November 2026",
    title: "Home and career plans",
    body: "A virtual conversation for people living abroad who want a clear path on work, visas, and a shared home.",
  },
  {
    id: "meetup-test-2026-12",
    kicker: MEETUP_TEST_KICKER,
    monthLabel: "December 2026",
    title: "Year end intention circle",
    body: "A quiet online meetup to name what you want in a partner and what you will not compromise.",
  },
  {
    id: "meetup-test-2027-01",
    kicker: MEETUP_TEST_KICKER,
    monthLabel: "January 2027",
    title: "From chat to meeting families",
    body: "A virtual session on when to involve parents and how to keep the first family call respectful.",
  },
];
