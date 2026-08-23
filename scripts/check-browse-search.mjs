import {
  cityMatchValues,
  needsLlmAssist,
  parseSearchQuery,
  pickShortlist,
  scoreBrowseRow,
  toBrowseProfile,
} from "../lib/profile-search.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function assertEq(got, expected, label) {
  if (got !== expected) throw new Error(label + ": expected " + JSON.stringify(expected) + ", got " + JSON.stringify(got));
}

function assertHas(list, value, label) {
  if (!list.includes(value)) {
    throw new Error(label + ": expected " + JSON.stringify(value) + " in " + JSON.stringify(list));
  }
}

function assertNoInjectedDesi(criteria, label) {
  const injected = ["telugu", "tamil", "nri", "iyengar", "reddy", "nair", "manglik", "joint family"];
  injected.forEach(function (word) {
    if (criteria.keywords.includes(word)) {
      throw new Error(label + ": must not invent desi keyword " + word + " from an English prompt");
    }
  });
}

const doctor = parseSearchQuery("doctor in Hyderabad");
assertEq(doctor.city, "Hyderabad", "doctor city");
assertHas(doctor.keywords, "doctor", "doctor keywords");
assertEq(doctor.gender, null, "doctor gender");

const woman = parseSearchQuery("a woman in Dallas, vegetarian");
assertEq(woman.city, "Dallas", "woman city");
assertEq(woman.gender, "Female", "woman gender");
assertHas(woman.keywords, "vegetarian", "woman keywords");

const englishAustin = parseSearchQuery("software engineer in Austin");
assertEq(englishAustin.city, "Austin", "English Austin city");
assertHas(englishAustin.keywords, "software", "English software");
assertHas(englishAustin.keywords, "engineer", "English engineer");
assertNoInjectedDesi(englishAustin, "software engineer in Austin");
assert(!needsLlmAssist("software engineer in Austin", englishAustin), "complete English prompt skips LLM");

const englishDallas = parseSearchQuery("doctor in Dallas");
assertEq(englishDallas.city, "Dallas", "English Dallas city");
assertHas(englishDallas.keywords, "doctor", "English doctor");
assertNoInjectedDesi(englishDallas, "doctor in Dallas");

const englishKind = parseSearchQuery("a kind teacher who likes hiking");
assertHas(englishKind.keywords, "kind", "English kind");
assertHas(englishKind.keywords, "teacher", "English teacher");
assertHas(englishKind.keywords, "hiking", "English hiking");
assertNoInjectedDesi(englishKind, "kind teacher hiking");

const hyd = parseSearchQuery("Telugu doctor in Hyd");
assertEq(hyd.city, "Hyderabad", "Hyd → Hyderabad");
assertHas(hyd.keywords, "telugu", "Hyd telugu");
assertHas(hyd.keywords, "doctor", "Hyd doctor");
assert(!hyd.keywords.includes("hyd"), "Hyd must not stay as a leftover keyword");
assert(!needsLlmAssist("Telugu doctor in Hyd", hyd), "desi city+keywords must skip LLM");

const nri = parseSearchQuery("NRI vegetarian joint family");
assertEq(nri.city, null, "NRI query has no city");
assertHas(nri.keywords, "nri", "NRI");
assertHas(nri.keywords, "vegetarian", "NRI vegetarian");
assertHas(nri.keywords, "joint family", "NRI joint family phrase");
assert(!nri.keywords.includes("joint") || nri.keywords.includes("joint family"), "prefer joint family phrase");
assert(!needsLlmAssist("NRI vegetarian joint family", nri), "lifestyle keywords must skip LLM");

const blr = parseSearchQuery("Iyengar in Blr");
assertEq(blr.city, "Bengaluru", "Blr → Bengaluru");
assertHas(blr.keywords, "iyengar", "Iyengar is a keyword, not a hate filter");

const madras = parseSearchQuery("Tamil woman in Madras");
assertEq(madras.city, "Chennai", "Madras → Chennai");
assertEq(madras.gender, "Female", "Madras gender");
assertHas(madras.keywords, "tamil", "Madras tamil");

const vizag = parseSearchQuery("Kannada engineer in Vizag");
assertEq(vizag.city, "Visakhapatnam", "Vizag → Visakhapatnam");
assertHas(vizag.keywords, "kannada", "Vizag kannada");
assertHas(vizag.keywords, "engineer", "Vizag engineer");

const dietVisa = parseSearchQuery("eggetarian H1B Reddy in Jersey");
assertEq(dietVisa.city, "New Jersey", "Jersey → New Jersey");
assertHas(dietVisa.keywords, "eggetarian", "eggetarian");
assertHas(dietVisa.keywords, "h1b", "H1B");
assertHas(dietVisa.keywords, "reddy", "Reddy community keyword");

const nonveg = parseSearchQuery("nonveg Malayalam in Kochi");
assertEq(nonveg.city, "Kochi", "Kochi");
assertHas(nonveg.keywords, "non-veg", "nonveg → non-veg");
assertHas(nonveg.keywords, "malayalam", "Malayalam");

const dowry = parseSearchQuery("no dowry nuclear family Nair");
assertHas(dowry.keywords, "no dowry", "dowry refuse");
assertHas(dowry.keywords, "nuclear family", "nuclear family");
assertHas(dowry.keywords, "nair", "Nair");

const teluguNotCity = parseSearchQuery("looking for someone Telugu");
assertEq(teluguNotCity.city, null, "Telugu is a language keyword, not a city");
assertHas(teluguNotCity.keywords, "telugu", "Telugu leftover");

const greenCard = parseSearchQuery("green card doctor");
assertHas(greenCard.keywords, "green card", "green card phrase");
assertHas(greenCard.keywords, "doctor", "green card doctor");

assert(cityMatchValues("Hyderabad").includes("Hyderabad"), "city match includes canonical");
assert(
  cityMatchValues("Hyd").some(function (value) {
    return value.toLowerCase() === "hyd" || value === "Hyderabad";
  }),
  "city match expands Hyd"
);

const thin = parseSearchQuery("someone kind");
assert(needsLlmAssist("someone kind", thin), "thin leftover prompt may ask xAI in parallel");
assert(!needsLlmAssist("", parseSearchQuery("")), "empty query never asks xAI");
assert(!needsLlmAssist("Telugu doctor in Hyd", hyd), "complete desi-enriched prompt skips LLM");
assert(!needsLlmAssist("doctor in Dallas", englishDallas), "complete English prompt skips LLM");

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
  mother_tongue: "Telugu",
  diet: "Vegetarian",
  visa_status: "NRI",
  about: "Joint family. Asked her own questions back.",
};
const englishOnlyProfile = {
  id: "live-en",
  full_name: "Maya L",
  city: "Dallas",
  profession: "Doctor",
  education: "MD",
  about: "I like hiking and live music.",
};
const englishCards = pickShortlist([englishOnlyProfile, live], englishDallas);
assert(
  englishCards.some(function (card) { return card.id === "live-en"; }),
  "English doctor in Dallas must surface a profile with no desi vocabulary"
);
const cards = pickShortlist([live], doctor);
assert(cards.length === 1 && cards[0].id === "live-1", "shortlist should keep the live row");
assert(toBrowseProfile(pending)?.name === "Should not leak", "mapper still maps a raw row; status filter is the API's job");
assert(!toBrowseProfile({ full_name: "No id" }), "rows without id are dropped");

const hydRowScore = scoreBrowseRow({ ...live, city: "Hyd" }, hyd);
const missScore = scoreBrowseRow({ ...live, city: "Chicago", mother_tongue: "Hindi", profession: "Teacher" }, hyd);
assert(hydRowScore > missScore, "Hyd search should rank a Hyd/Telugu doctor above a miss");

const vegScore = scoreBrowseRow(live, nri);
const nonVegScore = scoreBrowseRow({ ...live, diet: "Non-vegetarian", visa_status: "H1B", about: "" }, nri);
assert(vegScore > nonVegScore, "vegetarian keyword should not reward non-veg diet");

const withPhotos = toBrowseProfile({
  id: "live-2",
  full_name: "Priya S",
  photo_url: "https://example.com/full.webp",
  photo_blurred_url: "https://example.com/blur.webp",
});
assert(withPhotos?.photoUrl === "https://example.com/full.webp", "Browse must use photo_url, not the blur derivative");
assert(withPhotos && !("verified" in withPhotos), "do not invent VerifyAI on Browse cards");

console.log("browse search parser ok", {
  doctor,
  woman,
  hyd,
  nri,
  blr,
  madras,
  vizag,
  dietVisa,
  shortlist: cards.map((c) => c.name),
});
