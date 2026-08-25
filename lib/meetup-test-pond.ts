/**
 * TEST ONLY preview meetup posts for the right cream stack.
 * Strip this module before merging to main. Do not treat these as live events.
 * No ticket price. No STRIPE_EVENT_PRICE_ID. Virtual NRI matrimony tone.
 */

export const MEETUP_TEST_SEED_ENABLED = true;

export type MeetupTestPost = {
  id: string;
  kicker: string;
  monthLabel: string;
  title: string;
  body: string;
};

export const MEETUP_TEST_POSTS: MeetupTestPost[] = [
  {
    id: "meetup-test-2026-09",
    kicker: "COMING UP",
    monthLabel: "September 2026",
    title: "Parents and values",
    body: "A virtual hour for NRI families. Talk through values, timelines, and what home means from overseas.",
  },
  {
    id: "meetup-test-2026-10",
    kicker: "COMING UP",
    monthLabel: "October 2026",
    title: "NRI parents questions",
    body: "An online room for members and parents. Ask about distance, visits, and how families meet each other.",
  },
  {
    id: "meetup-test-2026-11",
    kicker: "COMING UP",
    monthLabel: "November 2026",
    title: "Home and career plans",
    body: "A virtual conversation for people living abroad who want a clear path on work, visas, and a shared home.",
  },
  {
    id: "meetup-test-2026-12",
    kicker: "COMING UP",
    monthLabel: "December 2026",
    title: "Year end intention circle",
    body: "A quiet online meetup to name what you want in a partner and what you will not compromise.",
  },
  {
    id: "meetup-test-2027-01",
    kicker: "COMING UP",
    monthLabel: "January 2027",
    title: "From chat to meeting families",
    body: "A virtual session on when to involve parents and how to keep the first family call respectful.",
  },
];
