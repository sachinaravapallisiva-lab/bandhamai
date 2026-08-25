export const SAFETY_SQL_FILE = "supabase/safety.sql";
export const BLOCKS_TABLE = "blocks";
export const REPORTS_TABLE = "reports";
export const DELETION_REQUESTS_TABLE = "account_deletion_requests";

export const REPORT_REASONS = [
  { id: "fake", label: "Fake profile or stolen photos" },
  { id: "harassment", label: "Harassment, threats, or will not stop" },
  { id: "money", label: "Asked for money, dowry, tickets, or papers" },
  { id: "underage", label: "Looks under 18" },
  { id: "photo", label: "Inappropriate photo" },
  { id: "other", label: "Something else" },
] as const;

export type ReportReasonId = (typeof REPORT_REASONS)[number]["id"];

export const REPORT_COPY = {
  action: "Report",
  submit: "Submit report",
  cancel: "Cancel",
  reasonKicker: "REASON",
  detailsKicker: "DETAILS",
  detailsPlaceholder: "What happened, and about when",
  intro: "This creates a review row. It does not call the police.",
  pickReason: "Pick a report reason.",
  saved:
    "Report saved. We will look at it. If someone is in immediate danger, contact local authorities. We are not an emergency service.",
} as const;

export const REPORT_SURFACES = ["profile", "chat"] as const;
export type ReportSurface = (typeof REPORT_SURFACES)[number];

export const DELETE_CONFIRM_WORD = "DELETE";

export function tableMissingHint() {
  return "Safety storage is not applied yet. Run " + SAFETY_SQL_FILE + " in the Supabase SQL editor.";
}

export function isReportReason(value: string): value is ReportReasonId {
  return REPORT_REASONS.some(function (row) {
    return row.id === value;
  });
}

export function isReportSurface(value: string): value is ReportSurface {
  return value === "profile" || value === "chat";
}

export function reportReasonLabel(id: string) {
  const row = REPORT_REASONS.find(function (item) {
    return item.id === id;
  });
  return row ? row.label : "";
}

export function reportNeedsDetails(reason: string) {
  return reason === "other";
}

export type BlockedSet = {
  profileIds: Set<string>;
  userIds: Set<string>;
};

export function emptyBlockedSet(): BlockedSet {
  return { profileIds: new Set(), userIds: new Set() };
}

export function pairIsBlocked(
  blocked: BlockedSet,
  profileId?: string | null,
  userId?: string | null
) {
  if (profileId && blocked.profileIds.has(profileId)) return true;
  if (userId && blocked.userIds.has(userId)) return true;
  return false;
}
