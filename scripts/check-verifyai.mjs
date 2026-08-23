import { isVerifyaiVerified, normalizeVerifyaiStatus } from "../lib/verifyai.ts";
import { toBrowseProfile } from "../lib/profile-search.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

assert(isVerifyaiVerified("verified") === true, "verified is the only badge");
assert(isVerifyaiVerified("VERIFIED") === true, "case-insensitive stored value");
assert(isVerifyaiVerified("pending") === false, "pending hidden");
assert(isVerifyaiVerified("failed") === false, "failed hidden");
assert(isVerifyaiVerified("") === false, "empty hidden");
assert(isVerifyaiVerified(null) === false, "null hidden");
assert(isVerifyaiVerified(true) === false, "boolean true is not a badge");

assert(normalizeVerifyaiStatus("completed") === "verified", "webhook completed maps to verified");
assert(normalizeVerifyaiStatus("fail") === "failed", "fail maps");
assert(normalizeVerifyaiStatus("nope") === null, "unknown status rejected");

const card = toBrowseProfile({ id: "1", full_name: "Test", verifyai_status: "verified" });
assert(card && card.verified === true, "browse mapper honors verified");
const quiet = toBrowseProfile({ id: "2", full_name: "Test" });
assert(quiet && quiet.verified === false, "missing column is not verified");

console.log("verifyai badge rules ok");
