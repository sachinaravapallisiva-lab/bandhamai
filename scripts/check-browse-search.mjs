import { parseSearchQuery, pickShortlist, toBrowseProfile } from "../lib/profile-search.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

const doctor = parseSearchQuery("doctor in Hyderabad");
assert(doctor.city === "Hyderabad", "expected Hyderabad, got " + doctor.city);
assert(doctor.keywords.includes("doctor"), "expected doctor keyword, got " + doctor.keywords.join(","));
assert(doctor.gender === null, "doctor query should not invent gender");

const woman = parseSearchQuery("a woman in Dallas, vegetarian");
assert(woman.city === "Dallas", "expected Dallas, got " + woman.city);
assert(woman.gender === "Female", "expected Female, got " + woman.gender);
assert(woman.keywords.includes("vegetarian"), "expected vegetarian keyword");

const pending = {
  id: "pending-1",
  full_name: "Should not leak",
  city: "Hyderabad",
  profession: "Doctor",
  status: "pending",
};
const live = {
  id: "live-1",
  full_name: "Priya S",
  city: "Hyderabad",
  profession: "Paediatrician",
  about: "Asked her own questions back.",
};
const cards = pickShortlist([live], doctor);
assert(cards.length === 1 && cards[0].id === "live-1", "shortlist should keep the live row");
assert(toBrowseProfile(pending)?.name === "Should not leak", "mapper still maps a raw row; status filter is the API's job");
assert(!toBrowseProfile({ full_name: "No id" }), "rows without id are dropped");

const withPhotos = toBrowseProfile({
  id: "live-2",
  full_name: "Priya S",
  photo_url: "https://example.com/full.webp",
  photo_blurred_url: "https://example.com/blur.webp",
});
assert(withPhotos?.photoUrl === "https://example.com/full.webp", "Browse must use photo_url, not the blur derivative");
assert(withPhotos?.verified === false, "no VerifyAI badge without verifyai_status=verified");
assert(toBrowseProfile({ id: "v1", full_name: "A", verifyai_status: "verified" })?.verified === true, "badge only when verified");
assert(toBrowseProfile({ id: "v2", full_name: "A", verifyai_status: "pending" })?.verified === false, "pending is not a badge");
assert(toBrowseProfile({ id: "v3", full_name: "A", verifyai_status: "unverified" })?.verified === false, "unverified is not a badge");

console.log("browse search parser ok", { doctor, woman, shortlist: cards.map((c) => c.name) });
