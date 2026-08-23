import { readFileSync } from "node:fs";
import {
  PROFILE_FORM_FIELDS,
  PROFILE_GENDER_CODES,
  PROFILE_GENDER_ERROR,
  PROFILE_GENDER_OPTIONS,
  normalizeProfileGender,
  selectOptionLabel,
  selectOptionValue,
} from "../lib/profile-fields.ts";

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

assertEq(normalizeProfileGender("Male"), "M", "Male → M");
assertEq(normalizeProfileGender("M"), "M", "M → M");
assertEq(normalizeProfileGender("male"), "M", "male → M");
assertEq(normalizeProfileGender("  Male  "), "M", "padded Male → M");
assertEq(normalizeProfileGender("Female"), "F", "Female → F");
assertEq(normalizeProfileGender("F"), "F", "F → F");
assertEq(normalizeProfileGender("female"), "F", "female → F");
assertEq(normalizeProfileGender("Other"), null, "Other is rejected");
assertEq(normalizeProfileGender("other"), null, "other is rejected");
assertEq(normalizeProfileGender(""), null, "empty is rejected");
assertEq(normalizeProfileGender("   "), null, "whitespace is rejected");
assertEq(normalizeProfileGender(null), null, "null is rejected");
assertEq(PROFILE_GENDER_ERROR, "Please choose Male or Female.", "friendly gender error");
assertEq(PROFILE_GENDER_CODES.join("|"), "M|F", "stored codes stay M/F");

const labels = PROFILE_GENDER_OPTIONS.map(selectOptionLabel);
const values = PROFILE_GENDER_OPTIONS.map(selectOptionValue);
assert(labels.includes("Female") && labels.includes("Male"), "UI labels stay Male/Female");
assert(values.includes("F") && values.includes("M"), "option values are F/M");
assert(!labels.includes("Other") && !values.includes("Other"), "Other is not a form option");

const genderField = PROFILE_FORM_FIELDS.find(function (field) {
  return field.key === "gender";
});
assert(genderField && genderField.required && genderField.kind === "select", "gender stays required select");
assertEq(
  (genderField.options || []).map(selectOptionValue).join("|"),
  values.join("|"),
  "form uses PROFILE_GENDER_OPTIONS"
);

const fields = read("lib/profile-fields.ts");
assert(fields.includes("normalizeProfileGender"), "shared normalize helper");
assert(!/options:\s*\["Female",\s*"Male",\s*"Other"\]/.test(fields), "old Female/Male/Other values are gone");

const api = read("app/api/profiles/route.ts");
assert(api.includes("normalizeProfileGender"), "POST normalizes gender before insert");
assert(api.includes("PROFILE_GENDER_ERROR"), "POST returns the friendly gender error");
assert(api.includes("fields.gender = gender"), "POST writes the M/F code");
assert(!/profiles_gender_check/.test(api), "POST does not surface the Postgres constraint name");

const form = read("app/profile/new/page.tsx");
assert(form.includes("normalizeProfileGender"), "create form validates gender client-side");
assert(form.includes("PROFILE_GENDER_ERROR"), "create form shows the friendly gender error");
assert(form.includes("selectOptionValue"), "create form posts option values");
assert(form.includes("selectOptionLabel"), "create form shows option labels");

const search = read("lib/profile-search.ts");
assert(search.includes("normalizeProfileGender"), "browse scoring compares M/F codes");

const searchApi = read("app/api/profiles/search/route.ts");
assert(searchApi.includes("normalizeProfileGender"), "browse query maps Female/Male to F/M");
assert(searchApi.includes('eq("gender", genderCode)'), "browse filters stored M/F, not Female/Male");

console.log("profile gender normalize ok", {
  male: normalizeProfileGender("Male"),
  female: normalizeProfileGender("Female"),
  other: normalizeProfileGender("Other"),
  labels,
  values,
});
