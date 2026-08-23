import { readFileSync } from "node:fs";
import {
  VISA_STATUS_ALIASES,
  VISA_STATUS_GROUPS,
  VISA_STATUS_OPTIONS,
  VISA_STATUS_UNGROUPED,
  isVisaStatusOption,
  visaKeywordVariants,
  visaLooksLike,
} from "../lib/visa-status.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function assertEq(got, expected, label) {
  if (got !== expected) {
    throw new Error(label + ": expected " + JSON.stringify(expected) + ", got " + JSON.stringify(got));
  }
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

function headings() {
  return VISA_STATUS_GROUPS.map(function (group) {
    return group.heading;
  });
}

assertEq(
  headings().join(" | "),
  "United States | United Kingdom | Australia | Europe (EU/EEA) | Ireland",
  "country headings"
);

assertEq(
  VISA_STATUS_GROUPS[0].options.join(" | "),
  "US Citizen | Green Card (LPR) | H-1B | F-1 / OPT / STEM OPT | L-1 | Other US status",
  "US options"
);

const uk = VISA_STATUS_GROUPS[1];
assert(uk.options.length <= 8, "UK stays a flat list until it grows past ~8");
assertEq(
  uk.options.join(" | "),
  "UK Citizen | ILR / Settled status | Skilled Worker | Student (UK) | Other UK status",
  "UK options"
);

assertEq(
  VISA_STATUS_GROUPS[2].options.join(" | "),
  "Australian Citizen | Permanent Resident (AU) | Temporary skilled (AU) | Student (AU) | Other AU status",
  "AU options"
);

assertEq(
  VISA_STATUS_GROUPS[3].options.join(" | "),
  "EU/EEA Citizen | Permanent / long-term EU resident | Work visa (EU) | Student (EU) | Other EU status",
  "EU options"
);

assertEq(
  VISA_STATUS_GROUPS[4].options.join(" | "),
  "Irish Citizen | Stamp 4 / long-term resident | Critical Skills / work permission | Student (IE) | Other Ireland status",
  "Ireland options"
);

assertEq(
  VISA_STATUS_UNGROUPED.join(" | "),
  "Indian citizen (living abroad) | Prefer not to say",
  "ungrouped tail"
);
assert(VISA_STATUS_OPTIONS.includes("H-1B"), "flat option list includes H-1B");
assert(isVisaStatusOption("H-1B") && isVisaStatusOption("Prefer not to say"), "known labels");
assert(!isVisaStatusOption("H1B"), "legacy free text is not a form option");

assertEq(VISA_STATUS_ALIASES.h1b, "H-1B", "h1b alias");
assertEq(VISA_STATUS_ALIASES.f1, "F-1 / OPT / STEM OPT", "f1 alias");
assertEq(VISA_STATUS_ALIASES.ilr, "ILR / Settled status", "ilr alias");
assertEq(VISA_STATUS_ALIASES["skilled worker"], "Skilled Worker", "skilled worker alias");
assertEq(VISA_STATUS_ALIASES["green card"], "Green Card (LPR)", "green card alias");

assert(visaLooksLike("H-1B", "h1b"), "H-1B looks like h1b");
assert(visaLooksLike("H1B", "H-1B"), "legacy H1B looks like stored H-1B");
assert(visaLooksLike("F-1 / OPT / STEM OPT", "f1"), "F-1 label looks like f1");
assert(visaLooksLike("ILR / Settled status", "ilr"), "ILR label looks like ilr");
assert(!visaLooksLike("US Citizen", "h1b"), "US Citizen is not H-1B");

assert(visaKeywordVariants("h1b").includes("H-1B"), "h1b variants include stored H-1B");
assert(
  visaKeywordVariants("H-1B").some(function (term) {
    return term.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase() === "h1b";
  }),
  "H-1B variants include compact h1b"
);

const fields = read("lib/profile-fields.ts");
assert(fields.includes('key: "visa_status"'), "visa_status stays a profile write field");
assert(fields.includes("kind: \"select\"") || fields.includes('kind: "select"'), "visa field is a select");
assert(fields.includes("optionGroups: VISA_STATUS_GROUPS"), "visa field uses grouped headings");
assert(fields.includes("VISA_STATUS_UNGROUPED"), "visa field keeps the ungrouped tail");
assert(fields.includes('key: "gender"'), "gender field remains");
assert(fields.includes('options: ["Female", "Male", "Other"]'), "gender stays a flat select");

const formPage = read("app/profile/new/page.tsx");
assert(formPage.includes("<optgroup"), "profile create renders optgroup headings");
assert(formPage.includes("optionGroups"), "profile create reads grouped visa options");
assert(!formPage.includes("Citizen, H1B, Green Card"), "free-text visa placeholder is gone");

const aliases = read("lib/desi-search-aliases.ts");
assert(aliases.includes("VISA_STATUS_ALIASES"), "browse aliases include the visa pack");

const search = read("lib/profile-search.ts");
assert(search.includes("visaLooksLike"), "browse scoring uses visaLooksLike");

const api = read("app/api/profiles/route.ts");
assert(api.includes("PROFILE_WRITE_FIELDS"), "profile POST still writes visa_status via existing fields");
assert(!api.includes("visa_country"), "no extra visa column");

const searchApi = read("app/api/profiles/search/route.ts");
assert(searchApi.includes("visaKeywordVariants"), "search ILIKE expands visa shorthand");

console.log("visa status taxonomy ok", {
  headings: headings(),
  optionCount: VISA_STATUS_OPTIONS.length,
});
