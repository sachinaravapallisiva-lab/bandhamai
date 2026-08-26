import { existsSync, readFileSync } from "node:fs";
import {
  LOGIN_SIGN_UP_API,
  LOGIN_TERMS_AGREE,
  LOGIN_TERMS_NEED,
  LOGIN_TERMS_PATH,
  canCreateSignUpAccount,
  decideSignUpIntent,
} from "../lib/login-auth.ts";
import {
  TERMS_AGREE_LABEL,
  TERMS_NEED,
  TERMS_NEED_PROFILE,
  TERMS_NEED_VERIFYAI,
  TERMS_PATH,
  TERMS_PROFILE_DATA_BODY,
  TERMS_PROFILE_DATA_TITLE,
  TERMS_VERIFYAI_BIO_BODY,
  TERMS_VERIFYAI_BIO_TITLE,
  canStartVerifyai,
  canWriteProfile,
  hasAgreedTerms,
  termsUserCopy,
} from "../lib/terms-agree.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

assert(TERMS_PATH === "/terms", "Terms path");
assert(LOGIN_TERMS_PATH === "/terms", "login Terms path stays /terms");
assert(TERMS_AGREE_LABEL === "I agree to the Terms.", "agree copy lock");
assert(LOGIN_TERMS_AGREE === "I agree to the Terms.", "Sign up checkbox is I agree to the Terms.");
assert(!/privacy/i.test(LOGIN_TERMS_AGREE), "Sign up agree does not mention Privacy");
assert(TERMS_PROFILE_DATA_TITLE === "Profile data you submit", "profile data section title");
assert(TERMS_VERIFYAI_BIO_TITLE === "VerifyAI and biometrics on Bandham", "biometrics section title");
assert(TERMS_PROFILE_DATA_BODY.includes("name, gender, city"), "profile data names required fields");
assert(TERMS_PROFILE_DATA_BODY.includes("profile photo"), "profile data names photo");
assert(TERMS_PROFILE_DATA_BODY.includes("review the profile"), "profile data says why we use it");
assert(TERMS_PROFILE_DATA_BODY.includes("Reviewers"), "profile data says who sees it");
assert(TERMS_PROFILE_DATA_BODY.includes("do not sell"), "profile data says no sale");
assert(TERMS_PROFILE_DATA_BODY.includes("account is open"), "profile data says retention");
assert(TERMS_PROFILE_DATA_BODY.includes("18 or older"), "profile data says 18 and over");
assert(TERMS_PROFILE_DATA_BODY.includes("religion"), "profile data covers religion");
assert(TERMS_PROFILE_DATA_BODY.includes("community"), "profile data covers community");
assert(!/caste|income|aadhaar number, passport number/i.test(TERMS_PROFILE_DATA_BODY), "do not invent extra profile fields");
assert(TERMS_VERIFYAI_BIO_BODY.includes("$4.99 one time"), "VerifyAI is $4.99 one time");
assert(TERMS_VERIFYAI_BIO_BODY.toLowerCase().includes("paying does not verify"), "paying does not verify");
assert(TERMS_VERIFYAI_BIO_BODY.includes("verifyai.llc"), "handoff is the live VerifyAI path");
assert(TERMS_VERIFYAI_BIO_BODY.includes("Face ID"), "VerifyAI is device Face ID only");
assert(!/device biometrics/i.test(TERMS_VERIFYAI_BIO_BODY), "do not use a vague device biometrics line");
assert(TERMS_VERIFYAI_BIO_BODY.includes("refuse Face ID"), "refuse Face ID means no badge");
assert(TERMS_VERIFYAI_BIO_BODY.includes("do not get a badge"), "refuse = no badge");
assert(TERMS_VERIFYAI_BIO_BODY.includes("does not store a face map"), "do not invent face map storage");
assert(TERMS_VERIFYAI_BIO_BODY.toLowerCase().includes("badge"), "badge only after success");
assert(TERMS_VERIFYAI_BIO_BODY.includes("verified"), "stores verified status after success");
assert(!/470|640/.test(TERMS_VERIFYAI_BIO_BODY), "no invented prices");

termsUserCopy().forEach(function (text) {
  assert(!/[-–—]/.test(text), "terms agree copy has no hyphen or dash: " + text);
});

assert(hasAgreedTerms(false) === false, "unchecked is not agree");
assert(hasAgreedTerms(true) === true, "checked is agree");
assert(hasAgreedTerms("1") === true, "agreed=1 counts");
assert(canWriteProfile(false) === false, "profile write blocked without agree");
assert(canWriteProfile(true) === true, "profile write allowed with agree");
assert(canStartVerifyai(false) === false, "VerifyAI start blocked without agree");
assert(canStartVerifyai(true) === true, "VerifyAI start allowed with agree");
assert(canCreateSignUpAccount(false) === false, "Sign up create stays blocked without agree");
assert(decideSignUpIntent("signin", "", "") === "switch-to-signup", "empty Sign up still opens Sign up");

const terms = read("app/terms/page.tsx");
assert(terms.includes('title="What Bandham AI is"'), "keep existing What Bandham AI is");
assert(terms.includes('title="Eligibility"'), "keep existing Eligibility");
assert(terms.includes('title="Profiles and review"'), "keep existing Profiles and review");
assert(terms.includes('title="VerifyAI"'), "keep existing VerifyAI");
assert(terms.includes("TERMS_PROFILE_DATA_TITLE") || terms.includes(TERMS_PROFILE_DATA_TITLE), "adds Profile data you submit");
assert(terms.includes("TERMS_VERIFYAI_BIO_TITLE") || terms.includes(TERMS_VERIFYAI_BIO_TITLE), "adds VerifyAI and biometrics");
assert(!/face[- ]map storage|store a face map template|store face maps/i.test(terms) || terms.includes("does not store a face map"), "no invented face map storage");
assert(!terms.includes("470") && !terms.includes("640"), "terms has no invented 470 or 640");

const login = read("app/login/page.tsx");
assert(login.includes("canCreateSignUpAccount"), "Sign up checkbox lock stays");
assert(login.includes("LOGIN_TERMS_PATH") || login.includes('href="/terms"'), "Sign up Terms still links to /terms");
assert(/I agree to the/.test(login), "Sign up checkbox copy is on the page");
assert(!/and Privacy/.test(login), "Sign up checkbox is not I agree to the Terms and Privacy");
assert(login.includes("LOGIN_SIGN_UP_API") || login.includes("/api/signup"), "Sign up posts to the server");
assert(!login.includes("supabase.auth.signUp"), "skipping the checkbox cannot hit browser signUp");
assert(!existsSync(new URL("../app/signup/page.tsx", import.meta.url)), "do not invent a second signup");

assert(existsSync(new URL("../app/api/signup/route.ts", import.meta.url)), "server signup reject exists");
assert(LOGIN_SIGN_UP_API === "/api/signup", "server signup path");
assert(canCreateSignUpAccount(false) === false, "unchecked server agree is false");
assert(canCreateSignUpAccount({ agreed: false }) === false, "object without true agree is false");
const signupApi = read("app/api/signup/route.ts");
assert(signupApi.includes("canCreateSignUpAccount"), "POST /api/signup checks agree");
assert(signupApi.includes("LOGIN_TERMS_NEED") || signupApi.includes(LOGIN_TERMS_NEED), "POST /api/signup returns agree error");
assert(signupApi.includes("status: 400"), "POST /api/signup reject is 400");
const signupBeforeCreate = signupApi.slice(0, signupApi.indexOf("auth.signUp"));
assert(signupBeforeCreate.includes("canCreateSignUpAccount"), "server checks agree before create");
assert(signupBeforeCreate.includes("return"), "server returns without agree");
assert(signupBeforeCreate.indexOf("canCreateSignUpAccount") < signupApi.indexOf("auth.signUp"), "unchecked Sign up cannot create an account");

const profiles = read("app/api/profiles/route.ts");
const post = profiles.slice(profiles.indexOf("export async function POST"), profiles.indexOf("export async function PATCH"));
const patch = profiles.slice(profiles.indexOf("export async function PATCH"));
assert(post.includes("canWriteProfile"), "POST profile rejects without agree");
assert(post.includes("TERMS_NEED_PROFILE"), "POST profile returns agree error");
assert(post.includes("status: 400"), "POST profile agree reject is 400");
assert(patch.includes("canWriteProfile"), "PATCH profile rejects without agree");
assert(patch.includes("TERMS_NEED_PROFILE"), "PATCH profile returns agree error");

const create = read("app/profile/new/page.tsx");
assert(create.includes("TermsAgreeField"), "profile create shows Terms checkbox");
assert(create.includes("canWriteProfile"), "profile create client returns without agree");
assert(create.includes("TERMS_NEED_PROFILE"), "profile create shows agree error");
assert(create.includes("agreed: true"), "profile write sends agreed");
assert(/disabled=\{saving \|\| photoBusy \|\| !photos.photo_url \|\| !agreedTerms\}/.test(create), "create submit disabled without agree");
assert(create.includes("profile-save-agree-terms") || create.includes("profile-create-agree-terms"), "save surfaces also ask Terms");

const account = read("app/account/page.tsx");
assert(account.includes("TermsAgreeField"), "account save shows Terms checkbox");
assert(account.includes("canWriteProfile"), "account save returns without agree");
assert(account.includes("agreed: true"), "account save sends agreed");
assert(account.includes("!agreedTerms"), "account save disabled without agree");

const start = read("app/api/verifyai/start/route.ts");
assert(start.includes("canStartVerifyai"), "start rejects without agree");
assert(start.includes("TERMS_NEED_VERIFYAI"), "start agree error");
assert(start.includes("buildVerifyaiStartUrl"), "start still hands off to VerifyAI");
assert(!start.includes("face map") && !start.includes("face_map"), "start does not invent face map storage");

const confirm = read("app/api/verifyai/confirm/route.ts");
assert(confirm.includes("canStartVerifyai"), "confirm does not start VerifyAI without agree");
assert(confirm.includes("recordVerifyaiPayment"), "confirm still records payment");
assert(!confirm.includes('verifyai_status: "verified"'), "confirm still does not set verified");

const offer = read("app/components/VerifyOffer.tsx");
assert(offer.includes("TermsAgreeField"), "VerifyAI start asks Terms");
assert(offer.includes("canStartVerifyai"), "VerifyAI start client returns without agree");
assert(offer.includes("/api/verifyai/start?agreed=1") || offer.includes("agreed=1"), "start sends agree");
assert(offer.includes("TERMS_NEED_VERIFYAI"), "start shows agree error");
assert(offer.includes("!agreedTerms"), "Continue to VerifyAI disabled without agree");
assert(!/https?:\/\/verifyai/i.test(offer), "does not invent a VerifyAI start URL");

const field = read("app/components/TermsAgreeField.tsx");
assert(field.includes("TERMS_PATH") || field.includes('href="/terms"'), "checkbox Terms links to /terms");
assert(/I agree to the/.test(field), "checkbox copy is I agree to the Terms");
assert(!/[—–]/.test(field), "checkbox has no em or en dash");

console.log("terms agree lock ok", {
  emptySignUp: decideSignUpIntent("signin", "", ""),
  writeUnchecked: canWriteProfile(false),
  startUnchecked: canStartVerifyai(false),
});
