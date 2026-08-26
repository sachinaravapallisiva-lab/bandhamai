/**
 * Hard split: Browse search finds people. The mic chip is the Bandham assistant.
 * These strings are the product copy that makes that split obvious.
 */

export const SEARCH_LABEL = "PROFILE SEARCH";

export const SEARCH_HINT =
  "Search for people. Type or tap to speak. Advice is in the Bandham assistant mic chip.";

export const SEARCH_FILTER_HELPER =
  "Add city, visa, and religion if you know them.";

export const SEARCH_PLACEHOLDER =
  "Search profiles: a pediatrician in Austin, raised in the UK";

export const SEARCH_SPEAK_IDLE = "Tap to speak";
export const SEARCH_SPEAK_LIVE = "Tap to stop";
export const SEARCH_SPEAK_BUSY = "One moment";
export const SEARCH_LISTEN_STATUS = "Listening for a person search...";
export const SEARCH_HEARING_STATUS = "Hearing that...";
export const SEARCH_LOOKING_STATUS = "Looking...";

export const GURU_PATH = "/api/guru";
export const GURU_TITLE = "Bandham assistant";
export const GURU_ORB_LABEL = "Open Bandham assistant";
export const GURU_SPEAKER = "ASSISTANT";

export const GURU_INTRO =
  "I'm the Bandham assistant. Serious suggestions and guidance: filters, honesty, and profile wording if you ask. I can also help open an app issue ticket. To send a product idea, use Send a feature idea. I don't look up people. Use the search box above for that.";

export const GURU_SUPPORT_NOTE =
  "Tickets are for app issues, not emergencies. If someone is harassing you, use Block or Report on their profile.";

export const BROWSE_EMPTY_INVENTORY_TITLE = "No live profiles yet.";
export const BROWSE_EMPTY_INVENTORY_BODY =
  "Submitted profiles stay under review until they are set live.";
export const BROWSE_EMPTY_RESULTS_TITLE = "No one fits these chips yet";
export const BROWSE_EMPTY_RESULTS_BODY = "Try another city, profession, or a shorter ask.";
export const BROWSE_SEE_MEETUP = "See the August meetup";

/** Honest shortlist count. Uses the real match count from search. Never invent a daily quota. */
export function browseMatchCountCopy(count: number) {
  if (!Number.isFinite(count) || count <= 0) return BROWSE_EMPTY_RESULTS_TITLE;
  return count + " people match this search";
}

export const MATCHES_EMPTY_TITLE = "No one yet.";
export const MATCHES_EMPTY_BODY =
  "Mark someone Interested on Browse and they will appear here. Speed Match starts from that profile.";
export const MATCHES_EMPTY_ACTION = "Browse profiles";
export const MATCHES_LIST_LABEL = "PEOPLE YOU MARKED INTERESTED";

export const GURU_PLACEHOLDER = "Ask for advice — not a person search";

export const GURU_STARTERS = [
  { id: "filters", label: "Honest filters", text: "What should I be honest about in filters: diet, location, timeline, family expectations?" },
  { id: "profile", label: "Profile wording", text: "Help me word my profile About section. Ask me what you need." },
  { id: "fit", label: "Evaluating fit", text: "How do I evaluate whether someone is a real fit?" },
  { id: "ticket", label: "Open a ticket", text: "I want to open a support ticket about an app issue. Ask me for a short summary." },
] as const;
