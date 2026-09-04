import { existsSync, readFileSync } from "node:fs";
import { LOGIN_PRODUCT, LOGIN_TAGLINE } from "../lib/login-auth.ts";
import { SUPPORT_PHONE_DISPLAY } from "../lib/site.ts";
import {
  WELCOME_ABOARD,
  WELCOME_APP_HELP,
  WELCOME_BRAND,
  WELCOME_COMMUNITY,
  WELCOME_GREETING_FALLBACK,
  WELCOME_GREETING_FALLBACK_ALT,
  WELCOME_MARK_URL,
  WELCOME_NEED_HELP,
  WELCOME_PITCH,
  WELCOME_REGARDS,
  WELCOME_SIGN_OFF_NAME,
  WELCOME_SIGN_OFF_TITLE,
  WELCOME_START_HEAD,
  WELCOME_STEP_1,
  WELCOME_STEP_2,
  WELCOME_SUBJECT,
  WELCOME_TAGLINE,
  WELCOME_VIOLET,
  canSendWelcome,
  fromAddressHost,
  isBandhamWelcomeFromHost,
  isSingleWelcomeRecipient,
  signupFirstName,
  welcomeEmailHtml,
  welcomeEmailPayload,
  welcomeEmailText,
  welcomeFirstName,
  welcomeFromEmail,
  welcomeGreeting,
  welcomeUserCopy,
} from "../lib/welcome-email.ts";
import { VIOLET } from "../lib/theme.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

const DATING_WORDS = /\b(dating|swipe|crush|hookup|hook-up)\b/i;
const BANNED_PITCH = /\b(guru|parents?|coaching parents|talking to parents)\b/i;
const BANNED_FROM = /hello@laughrank|laughrank\.lol|verifyai\.llc/i;
const GOOD_FROM = "Bandham AI <hello@bandhamai.vercel.app>";
const MEMBER = "new.member@example.com";
const MEMBER_NAME = "Priya";
const GOOD_ENV = {
  RESEND_API_KEY: "re_test_key",
  RESEND_FROM_EMAIL: GOOD_FROM,
};

assert(WELCOME_BRAND === "Bandham AI", "brand is Bandham AI two words");
assert(WELCOME_BRAND === LOGIN_PRODUCT, "welcome brand matches login product");
assert(!/Bandhamai|bandhamAI|Bandhan\b/.test(WELCOME_BRAND), "never Bandhamai, bandhamAI, or Bandhan");
assert(WELCOME_TAGLINE === "Find your vibe match?", "tagline lock with question mark");
assert(WELCOME_TAGLINE === LOGIN_TAGLINE, "welcome tagline matches login");
assert(WELCOME_TAGLINE.endsWith("?"), "tagline uses ? not bang");
assert(!WELCOME_TAGLINE.endsWith("!"), "tagline is not a bang");
assert(WELCOME_SUBJECT === "Welcome to Bandham AI", "subject lock");
assert(WELCOME_MARK_URL === "https://bandhamai.vercel.app/brand/bandham-jaimala.png", "mark is the public jaimala");
assert(WELCOME_ABOARD === "Welcome aboard. We're glad you're here.", "aboard lock");
assert(WELCOME_PITCH.includes("Bandham AI is Indian matrimony for NRI and diaspora."), "pitch names Indian matrimony");
assert(WELCOME_PITCH.includes("Find your vibe match?"), "pitch keeps the tagline question mark");
assert(WELCOME_PITCH.includes("Browse, search, Speed Match"), "pitch names Browse search Speed Match");
assert(WELCOME_PITCH.includes("create a profile stay free"), "pitch lock: profile stay free");
assert(WELCOME_PITCH.includes("Messaging is $9.99 a month"), "pitch lock: messaging is $9.99");
assert(WELCOME_PITCH.includes("VerifyAI is a separate $4.99 one-time check"), "pitch lock: VerifyAI $4.99");
assert(WELCOME_COMMUNITY.includes("US, Australia, UK, Europe, and Ireland"), "community lock");
assert(WELCOME_START_HEAD === "Here's how to get started:", "start head lock");
assert(WELCOME_STEP_1.startsWith("1. Complete your profile"), "step 1 lock");
assert(WELCOME_STEP_2.startsWith("2. Browse and search"), "step 2 lock");
assert(WELCOME_STEP_2.includes("Speed Match"), "step 2 names Speed Match");
assert(WELCOME_APP_HELP.includes("Plans, Browse, and Call us"), "app help names Plans Browse Call us");
assert(WELCOME_APP_HELP.includes(SUPPORT_PHONE_DISPLAY), "app help uses the live support number");
assert(WELCOME_APP_HELP.includes("+1 803 265 5233"), "app help number lock");
assert(WELCOME_NEED_HELP.includes("Reply to this email"), "need help asks them to reply");
assert(WELCOME_NEED_HELP.includes("Help in Bandham AI"), "need help names Help in Bandham AI");
assert(WELCOME_REGARDS === "Warm regards,", "regards lock");
assert(WELCOME_SIGN_OFF_NAME === "Sai", "sign-off name is Sai");
assert(WELCOME_SIGN_OFF_TITLE === "Founder, Bandham AI", "sign-off title lock");
assert(WELCOME_GREETING_FALLBACK === "Hey,", "missing name falls back to Hey,");
assert(WELCOME_GREETING_FALLBACK_ALT === "Welcome,", "alternate missing-name fallback is Welcome,");
assert(WELCOME_VIOLET === VIOLET, "HTML uses brand violet");

assert(welcomeFirstName("Priya Sharma") === "Priya", "first name is the first token");
assert(welcomeFirstName("") === "", "empty first name stays empty");
assert(welcomeFirstName(undefined) === "", "missing first name stays empty");
assert(signupFirstName({ first_name: "Arjun Kumar" }) === "Arjun", "signup first_name is used");
assert(signupFirstName({ firstName: "Meera" }) === "Meera", "signup firstName camelCase is used");
assert(signupFirstName({ email: MEMBER }) === "", "signup without a name is empty");
assert(welcomeGreeting("Priya") === "Hey Priya,", "named greeting uses the member first name");
assert(welcomeGreeting("") === "Hey,", "empty greeting is Hey,");
assert(welcomeGreeting() === "Hey,", "missing greeting is Hey,");
assert(welcomeGreeting(undefined) !== "Hey Sai,", "do not hardcode Sai as the recipient");
assert(welcomeGreeting("") !== "Hey Sai,", "fallback greeting is not Hey Sai");

welcomeUserCopy().forEach(function (text) {
  assert(!DATING_WORDS.test(text), "welcome copy has no dating words: " + text);
  assert(!BANNED_PITCH.test(text), "welcome copy has no guru/parents pitch: " + text);
  assert(!/Bandhamai|bandhamAI|Bandhan\b/.test(text), "never Bandhamai: " + text);
});

const html = welcomeEmailHtml();
const text = welcomeEmailText();
const namedHtml = welcomeEmailHtml(MEMBER_NAME);
const namedText = welcomeEmailText(MEMBER_NAME);
const both = html + "\n" + text;
const namedBoth = namedHtml + "\n" + namedText;

assert(html.includes("<table"), "HTML uses a table layout");
assert(html.includes("style="), "HTML uses inline CSS");
assert(html.includes(WELCOME_TAGLINE), "HTML has the tagline");
assert(html.includes(WELCOME_BRAND), "HTML has Bandham AI");
assert(html.includes(WELCOME_ABOARD), "HTML has aboard");
assert(html.includes(WELCOME_PITCH), "HTML has the locked pitch");
assert(html.includes("Messaging is $9.99 a month"), "HTML names messaging $9.99");
assert(html.includes("VerifyAI is a separate $4.99"), "HTML names VerifyAI $4.99");
assert(html.includes(SUPPORT_PHONE_DISPLAY), "HTML has the support number");
assert(html.includes(WELCOME_SIGN_OFF_NAME), "HTML signs off Sai");
assert(html.includes(WELCOME_SIGN_OFF_TITLE), "HTML signs Founder, Bandham AI");
assert(html.includes("Hey,"), "HTML fallback greeting is Hey,");
assert(!html.includes("Hey Sai,"), "HTML default is not Hey Sai");
assert(namedHtml.includes("Hey Priya,"), "HTML named greeting uses signup first name");
assert(text.includes(WELCOME_TAGLINE), "plain text has the tagline");
assert(text.includes(WELCOME_ABOARD), "plain text has aboard");
assert(text.includes(WELCOME_PITCH), "plain text has the locked pitch");
assert(text.includes("Messaging is $9.99 a month"), "plain text names messaging $9.99");
assert(text.startsWith("Hey,\n"), "plain text fallback greeting is Hey,");
assert(!text.startsWith("Hey Sai,"), "plain text default is not Hey Sai");
assert(namedText.startsWith("Hey Priya,\n"), "plain text named greeting uses signup first name");
assert(text.includes(WELCOME_SIGN_OFF_NAME), "plain text signs off Sai");
assert(text.includes(WELCOME_SIGN_OFF_TITLE), "plain text signs Founder, Bandham AI");
assert(!DATING_WORDS.test(both + "\n" + namedBoth), "HTML and text have no dating words");
assert(!BANNED_PITCH.test(both + "\n" + namedBoth), "HTML and text have no guru/parents pitch");
assert(!BANNED_FROM.test(both), "mail body has no LaughRank or VerifyAI inbox");

const payload = welcomeEmailPayload(MEMBER, GOOD_FROM, MEMBER_NAME);
assert(Array.isArray(payload.to) && payload.to.length === 1, "exactly one recipient");
assert(payload.to[0] === MEMBER, "recipient is the new member");
assert(payload.to[0] !== "Sai", "recipient is not hardcoded Sai");
assert(!("bcc" in payload), "no BCC list");
assert(!("cc" in payload), "no CC list");
assert(payload.subject === WELCOME_SUBJECT, "payload subject");
assert(typeof payload.html === "string" && payload.html.length > 0, "payload has HTML");
assert(typeof payload.text === "string" && payload.text.length > 0, "payload has plain text");
assert(payload.text.includes("Hey Priya,"), "payload text uses the member first name");

assert(fromAddressHost(GOOD_FROM) === "bandhamai.vercel.app", "parses angled from host");
assert(fromAddressHost("hello@bandhamai.vercel.app") === "bandhamai.vercel.app", "parses bare from host");
assert(isBandhamWelcomeFromHost("bandhamai.vercel.app") === true, "public Bandham host is allowed");
assert(isBandhamWelcomeFromHost("resend.dev") === false, "resend.dev host is blocked");
assert(isBandhamWelcomeFromHost("laughrank.lol") === false, "laughrank.lol host is blocked");
assert(isBandhamWelcomeFromHost("verifyai.llc") === false, "verifyai.llc host is blocked");
assert(isSingleWelcomeRecipient(MEMBER) === true, "one member email is allowed");
assert(isSingleWelcomeRecipient("a@b.com,c@d.com") === false, "comma list is blocked");
assert(isSingleWelcomeRecipient("") === false, "empty recipient is blocked");

assert(canSendWelcome(MEMBER, GOOD_ENV).ok === true, "allowed when key, Bandham from, and one member");
assert(canSendWelcome(MEMBER, { RESEND_API_KEY: "", RESEND_FROM_EMAIL: GOOD_FROM }).ok === false, "empty key skips");
assert(canSendWelcome(MEMBER, { RESEND_API_KEY: "re_test_key" }).ok === false, "missing from skips");
assert(
  canSendWelcome(MEMBER, { RESEND_API_KEY: "re_test_key", RESEND_FROM_EMAIL: "" }).ok === false,
  "blank from skips"
);
assert(
  canSendWelcome(MEMBER, {
    RESEND_API_KEY: "re_test_key",
    RESEND_FROM_EMAIL: "Bandham AI <onboarding@resend.dev>",
  }).ok === false,
  "onboarding@resend.dev is not a welcome from"
);
assert(
  canSendWelcome(MEMBER, {
    RESEND_API_KEY: "re_test_key",
    RESEND_FROM_EMAIL: "LaughRank <hello@laughrank.lol>",
  }).ok === false,
  "hello@laughrank.lol is rejected hard"
);
assert(
  canSendWelcome(MEMBER, {
    RESEND_API_KEY: "re_test_key",
    RESEND_FROM_EMAIL: "VerifyAI <hello@verifyai.llc>",
  }).ok === false,
  "verifyai.llc from is rejected"
);
assert(canSendWelcome("a@b.com,c@d.com", GOOD_ENV).ok === false, "two recipients skip");
assert(welcomeFromEmail({}) === "", "welcome from has no onboarding fallback");
assert(welcomeFromEmail({ RESEND_FROM_EMAIL: "  " }) === "", "whitespace from is empty");

const lib = read("lib/welcome-email.ts");
assert(lib.includes("canSendWelcome"), "exports canSendWelcome");
assert(lib.includes("sendWelcomeEmail"), "exports sendWelcomeEmail");
assert(lib.includes("https://api.resend.com/emails"), "uses the same Resend fetch URL");
assert(lib.includes("RESEND_API_KEY"), "reads RESEND_API_KEY");
assert(lib.includes("RESEND_FROM_EMAIL"), "reads RESEND_FROM_EMAIL");
assert(lib.includes("mailed"), "tracks mailed false until a real Bandham from");
assert(lib.includes("welcomeGreeting"), "exports greeting helper");
assert(lib.includes("signupFirstName"), "exports signup first name helper");
assert(!lib.includes("supportFromEmail"), "welcome does not reuse founder from fallback");
assert(!lib.includes("SUPPORT_FROM_EMAIL_DEFAULT"), "welcome does not use onboarding default");
assert(!lib.includes("onboarding@"), "welcome has no onboarding@ fallback");
assert(!lib.includes("from \"resend\"") && !lib.includes("from 'resend'"), "no resend npm import");
assert(!lib.includes("hello@laughrank"), "welcome sender has no hello@laughrank");
assert(!lib.includes("laughrank.lol"), "welcome sender has no laughrank.lol");
assert(!lib.includes("verifyai.llc"), "welcome sender has no verifyai.llc");
assert(lib.includes("sent: false"), "welcome send is fail soft");
assert(lib.includes("mailed: false"), "mailed stays false until env is a Bandham domain");
assert(lib.includes("console.error"), "skips and failures are logged");
assert(lib.includes("try {"), "send catches Resend errors");
assert(!lib.includes("bcc"), "welcome payload builder has no BCC");
assert(!BANNED_PITCH.test(lib.replace(/BANNED|guru\/parents|no guru/g, "")), "lib copy has no guru/parents pitch");

const signup = read("app/api/signup/route.ts");
assert(signup.includes("sendWelcomeEmail"), "signup route sends welcome");
assert(signup.includes("signupFirstName"), "signup reads first name from the body");
assert(signup.includes('from "../../../lib/welcome-email"'), "signup imports welcome sender");
const afterCreate = signup.slice(signup.indexOf("auth.signUp"));
assert(afterCreate.includes("sendWelcomeEmail"), "send is after signUp");
assert(afterCreate.indexOf("result.error") < afterCreate.indexOf("sendWelcomeEmail"), "no send when signUp errors");
assert(afterCreate.includes("result.data.user"), "send only when the user object is present");
assert(afterCreate.includes("sendWelcomeEmail(email, firstName)"), "recipient is the signup email plus first name");
assert(afterCreate.includes("try {"), "signup send is fail soft");
assert(afterCreate.includes("catch"), "signup send catch does not fail register");
assert(afterCreate.includes("mailed"), "signup JSON reports mailed");
const jsonReturn = afterCreate.lastIndexOf("user: result.data.user");
assert(jsonReturn > afterCreate.indexOf("sendWelcomeEmail"), "normal signup JSON still returns after send");
assert(signup.includes("mailed: mailed"), "signup JSON includes mailed");
assert(!signup.includes("email_sent"), "signup JSON uses mailed, not email_sent");
assert(!signup.includes("bcc"), "signup does not BCC");
assert(!signup.includes("SUPPORT_INBOX"), "signup does not mail the founder inbox");

const loginApi = existsSync(new URL("../app/api/login/route.ts", import.meta.url));
assert(!loginApi, "do not invent a login mail route");
const resetFiles = ["app/api/reset/route.ts", "app/api/welcome/route.ts", "app/api/admin/welcome/route.ts"];
resetFiles.forEach(function (path) {
  assert(!existsSync(new URL("../" + path, import.meta.url)), "no blast or extra mail route: " + path);
});

const loginPage = read("app/login/page.tsx");
assert(!loginPage.includes("sendWelcomeEmail"), "login page does not send welcome");
assert(!loginPage.includes("supabase.auth.signUp"), "browser still does not create accounts");
assert(loginPage.includes("first_name"), "Sign up posts the member first name");
assert(loginPage.includes("setFirstName"), "Sign up collects first name");
assert(loginPage.includes('mode === "signup"'), "first name field is Sign up only");
assert(!loginPage.includes("803 265 5233"), "login page does not show the support number");

const support = read("lib/support-email.ts");
assert(support.includes("https://api.resend.com/emails"), "founder mailer fetch style stays");

const env = read(".env.example");
assert(env.includes("RESEND_API_KEY"), "env example lists RESEND_API_KEY");
assert(env.includes("RESEND_FROM_EMAIL"), "env example lists RESEND_FROM_EMAIL");
assert(env.toLowerCase().includes("welcome"), "env example says welcome needs a Bandham from");
assert(env.includes("verified Bandham domain"), "env example asks for a verified Bandham domain");
assert(env.includes("welcome is skipped"), "env example says welcome is skipped until then");
assert(!/RESEND_FROM_EMAIL=\S+/.test(env), "do not invent a from domain in env example");
assert(!BANNED_FROM.test(env), "env example has no LaughRank or VerifyAI inbox");

const pkg = JSON.parse(read("package.json"));
assert(!pkg.dependencies.resend, "do not add a resend npm package");
assert(!pkg.devDependencies?.resend, "do not add a resend dev dependency");
assert(pkg.scripts["check:welcome-email"], "check:welcome-email script exists");
assert(pkg.scripts["check:welcome-email"].includes("check-welcome-email.mjs"), "check script path");

const posthogCheck = read("scripts/check-posthog.mjs");
assert(posthogCheck.includes("!pkg.dependencies.resend"), "posthog check still forbids a resend package");

console.log("welcome email ok", {
  brand: WELCOME_BRAND,
  tagline: WELCOME_TAGLINE,
  subject: WELCOME_SUBJECT,
  greetingNamed: welcomeGreeting(MEMBER_NAME),
  greetingFallback: welcomeGreeting(""),
  mailedUntilDomain: false,
});
