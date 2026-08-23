/**
 * Hard split: Browse search finds people. The mic chip is the love guru.
 * These strings are the product copy that makes that split obvious.
 */

export const SEARCH_LABEL = "PROFILE SEARCH";

export const SEARCH_HINT =
  "Search for people. Type or tap to speak. Advice is in the mic chip.";

export const SEARCH_PLACEHOLDER =
  "Search profiles: a doctor in Hyderabad, vegetarian...";

export const SEARCH_SPEAK_IDLE = "Tap to speak";
export const SEARCH_SPEAK_LIVE = "Tap to stop";
export const SEARCH_SPEAK_BUSY = "One moment";
export const SEARCH_LISTEN_STATUS = "Listening for a person search...";
export const SEARCH_HEARING_STATUS = "Hearing that...";
export const SEARCH_LOOKING_STATUS = "Looking...";

export const GURU_PATH = "/api/guru";
export const GURU_TITLE = "Love guru";
export const GURU_ORB_LABEL = "Open love guru";

export const GURU_INTRO =
  "I'm the Bandham AI love guru. Coaching, talking to parents, and profile wording if you ask. I don't look up people — use the search box above for that.";

export const GURU_PLACEHOLDER = "Ask for advice — not a person search";

export const GURU_STARTERS = [
  { id: "parents", label: "Talk to her parents", text: "How do I talk to her parents about us?" },
  { id: "profile", label: "Profile wording", text: "Help me word my profile About section. Ask me what you need." },
  { id: "ask", label: "What to ask", text: "What should I ask before we meet families?" },
] as const;
