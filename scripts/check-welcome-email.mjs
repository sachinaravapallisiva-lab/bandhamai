import { existsSync, readFileSync } from "node:fs";
import { LOGIN_PRODUCT, LOGIN_TAGLINE } from "../lib/login-auth.ts";
import {
  WELCOME_BODY,
  WELCOME_BRAND,
  WELCOME_CTA_LABEL,
  WELCOME_CTA_URL,
  WELCOME_FOOTER,
  WELCOME_LEAD,
  WELCOME_MARK_URL,
  WELCOME_SUBJECT,
  WELCOME_TAGLINE,
  WELCOME_VIOLET,
  canSendWelcome,
  fromAddressHost,
  isBandhamWelcomeFromHost,
  isSingleWelcomeRecipient,
  welcomeEmailHtml,
  welcomeEmailPayload,
  welcomeEmailText,
  welcomeFromEmail,
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
const BANNED_FROM = /hello@laughrank|laughrank\.lol|verifyai\.llc/i;
const GOOD_FROM = "Bandham AI <hello@bandhamai.vercel.app>";
const MEMBER = "new.member@example.com";
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
assert(WELCOME_CTA_LABEL === "Create your profile", "CTA label lock");
assert(WELCOME_CTA_URL === "https://bandhamai.vercel.app/profile/new", "CTA is profile create");
assert(WELCOME_MARK_URL === "https://bandhamai.vercel.app/brand/bandham-jaimala.png", "mark is the public jaimala");
assert(WELCOME_LEAD.toLowerCase().includes("indian matrimony"), "lead names Indian matrimony");
assert(WELCOME_BODY.toLowerCase().includes("create a profile"), "body allows a free profile");
assert(WELCOME_BODY.toLowerCase().includes("browse for free"), "body allows free browse");
assert(WELCOME_FOOTER.includes("Bandham AI"), "footer names Bandham AI");
assert(WELCOME_FOOTER.includes("Indian matrimony"), "footer names Indian matrimony");
assert(WELCOME_FOOTER.includes("Not LaughRank"), "footer is not LaughRank");
assert(WELCOME_FOOTER.includes("Not VerifyAI"), "footer is not VerifyAI");
assert(WELCOME_VIOLET === VIOLET, "button uses brand violet");

welcomeUserCopy().forEach(function (text) {
  assert(!/[-–—]/.test(text), "welcome copy has no hyphen or dash: " + text);
  assert(!DATING_WORDS.test(text), "welcome copy has no dating words: " + text);
  assert(!/\$9\.99/.test(text), "do not say $9.99 is for messaging");
  assert(!/\bmessaging\b/i.test(text), "do not list messaging as a paid inclusion");
});

const html = welcomeEmailHtml();
const text = welcomeEmailText();
assert(html.includes("<table"), "HTML uses a table layout");
assert(html.includes("style="), "HTML uses inline CSS");
assert(html.includes(WELCOME_TAGLINE), "HTML has the tagline");
assert(html.includes(WELCOME_BRAND), "HTML has Bandham AI");
assert(html.includes(WELCOME_CTA_URL), "HTML links profile create");
assert(html.includes(WELCOME_CTA_LABEL), "HTML has the CTA label");
assert(html.includes(VIOLET) || html.includes(WELCOME_VIOLET), "HTML CTA is violet");
assert(html.includes(WELCOME_FOOTER), "HTML has the footer");
assert(text.includes(WELCOME_TAGLINE), "plain text has the tagline");
assert(text.includes(WELCOME_CTA_URL), "plain text has the profile URL");
assert(text.includes(WELCOME_FOOTER), "plain text has the footer");
assert(!DATING_WORDS.test(html + "\n" + text), "HTML and text have no dating words");
assert(!BANNED_FROM.test(html + "\n" + text), "mail body has no LaughRank or VerifyAI inbox");

const payload = welcomeEmailPayload(MEMBER, GOOD_FROM);
assert(Array.isArray(payload.to) && payload.to.length === 1, "exactly one recipient");
assert(payload.to[0] === MEMBER, "recipient is the new member");
assert(!("bcc" in payload), "no BCC list");
assert(!("cc" in payload), "no CC list");
assert(payload.subject === WELCOME_SUBJECT, "payload subject");
assert(typeof payload.html === "string" && payload.html.length > 0, "payload has HTML");
assert(typeof payload.text === "string" && payload.text.length > 0, "payload has plain text");

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
assert(
  canSendWelcome("a@b.com,c@d.com", GOOD_ENV).ok === false,
  "two recipients skip"
);
assert(welcomeFromEmail({}) === "", "welcome from has no onboarding fallback");
assert(welcomeFromEmail({ RESEND_FROM_EMAIL: "  " }) === "", "whitespace from is empty");

const lib = read("lib/welcome-email.ts");
assert(lib.includes("canSendWelcome"), "exports canSendWelcome");
assert(lib.includes("sendWelcomeEmail"), "exports sendWelcomeEmail");
assert(lib.includes("https://api.resend.com/emails"), "uses the same Resend fetch URL");
assert(lib.includes("RESEND_API_KEY"), "reads RESEND_API_KEY");
assert(lib.includes("RESEND_FROM_EMAIL"), "reads RESEND_FROM_EMAIL");
assert(!lib.includes("supportFromEmail"), "welcome does not reuse founder from fallback");
assert(!lib.includes("SUPPORT_FROM_EMAIL_DEFAULT"), "welcome does not use onboarding default");
assert(!lib.includes("onboarding@"), "welcome has no onboarding@ fallback");
assert(!lib.includes("from \"resend\"") && !lib.includes("from 'resend'"), "no resend npm import");
assert(!lib.includes("hello@laughrank"), "welcome sender has no hello@laughrank");
assert(!lib.includes("laughrank.lol"), "welcome sender has no laughrank.lol");
assert(!lib.includes("verifyai.llc"), "welcome sender has no verifyai.llc");
assert(lib.includes("sent: false"), "welcome send is fail soft");
assert(lib.includes("console.error"), "skips and failures are logged");
assert(lib.includes("try {"), "send catches Resend errors");
assert(!lib.includes("bcc"), "welcome payload builder has no BCC");

const signup = read("app/api/signup/route.ts");
assert(signup.includes("sendWelcomeEmail"), "signup route sends welcome");
assert(signup.includes('from "../../../lib/welcome-email"'), "signup imports welcome sender");
const afterCreate = signup.slice(signup.indexOf("auth.signUp"));
assert(afterCreate.includes("sendWelcomeEmail"), "send is after signUp");
assert(afterCreate.indexOf("result.error") < afterCreate.indexOf("sendWelcomeEmail"), "no send when signUp errors");
assert(afterCreate.includes("result.data.user"), "send only when the user object is present");
assert(afterCreate.includes("sendWelcomeEmail(email)"), "recipient is the signup email");
assert(afterCreate.includes("try {"), "signup send is fail soft");
assert(afterCreate.includes("catch"), "signup send catch does not fail register");
const jsonReturn = afterCreate.lastIndexOf("user: result.data.user");
assert(jsonReturn > afterCreate.indexOf("sendWelcomeEmail"), "normal signup JSON still returns after send");
assert(!signup.includes("email_sent"), "signup JSON stays user and session");
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
  cta: WELCOME_CTA_URL,
});
