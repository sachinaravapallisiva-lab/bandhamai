import {
  DELETE_CONFIRM_WORD,
  REPORT_REASONS,
  emptyBlockedSet,
  isReportReason,
  isReportSurface,
  pairIsBlocked,
} from "../lib/safety.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

assert(DELETE_CONFIRM_WORD === "DELETE", "typed confirm stays explicit");
assert(REPORT_REASONS.length >= 5 && REPORT_REASONS.length <= 6, "keep the five reasons, at most one extra");
assert(isReportReason("fake") && isReportReason("money"), "known reasons");
assert(isReportReason("harassment") && isReportReason("underage") && isReportReason("other"), "core reasons stay");
assert(isReportReason("photo"), "optional matrimony photo reason");
assert(!isReportReason("spam-marketing"), "do not invent extra reasons");
assert(isReportSurface("profile") && isReportSurface("chat"), "surfaces");
assert(!isReportSurface("email"), "contact stub is not a report surface");

const blocked = emptyBlockedSet();
blocked.profileIds.add("p1");
blocked.userIds.add("u2");
assert(pairIsBlocked(blocked, "p1", null) === true, "blocked profile");
assert(pairIsBlocked(blocked, null, "u2") === true, "blocked user");
assert(pairIsBlocked(blocked, "p9", "u9") === false, "unblocked pair");

console.log("safety helpers ok", { reasons: REPORT_REASONS.map(function (r) { return r.id; }) });
