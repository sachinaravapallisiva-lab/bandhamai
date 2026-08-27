import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  identifyPersonProperties,
  isPostHogEnabled,
  PLANS_OPENED,
  POSTHOG_DEFAULTS,
  POSTHOG_DEFAULT_HOST,
  POSTHOG_HOST_ENV,
  POSTHOG_KEY_ENV,
  posthogHost,
  posthogKey,
  SUBSCRIBE_CHECKOUT_COMPLETED,
  SUBSCRIBE_CHECKOUT_STARTED,
} from "../lib/posthog.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

assert(POSTHOG_KEY_ENV === "NEXT_PUBLIC_POSTHOG_KEY", "public key env name");
assert(POSTHOG_HOST_ENV === "NEXT_PUBLIC_POSTHOG_HOST", "public host env name");
assert(POSTHOG_DEFAULT_HOST === "https://us.i.posthog.com", "US ingest host");
assert(POSTHOG_DEFAULTS === "2026-05-30", "PostHog defaults pin");
assert(PLANS_OPENED === "plans_opened", "plans opened event");
assert(SUBSCRIBE_CHECKOUT_STARTED === "subscribe_checkout_started", "checkout started event");
assert(SUBSCRIBE_CHECKOUT_COMPLETED === "subscribe_checkout_completed", "checkout completed event");

assert(isPostHogEnabled({}) === false, "empty env fails closed");
assert(isPostHogEnabled({ NEXT_PUBLIC_POSTHOG_KEY: "" }) === false, "blank key fails closed");
assert(isPostHogEnabled({ NEXT_PUBLIC_POSTHOG_KEY: "   " }) === false, "whitespace key fails closed");
assert(isPostHogEnabled({ NEXT_PUBLIC_POSTHOG_KEY: "phc_test" }) === true, "key enables SDK");
assert(posthogKey({}) === "", "missing key is empty");
assert(posthogHost({}) === POSTHOG_DEFAULT_HOST, "missing host uses US default");
assert(
  posthogHost({ NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com" }) === "https://eu.i.posthog.com",
  "host env wins"
);

const person = identifyPersonProperties("member@example.com");
assert(person.email === "member@example.com", "identify may include email");
assert(Object.keys(person).join(",") === "email", "identify person props are email only");
assert(Object.keys(identifyPersonProperties("")).length === 0, "blank email is omitted");
assert(Object.keys(identifyPersonProperties(null)).length === 0, "null email is omitted");

const pkg = JSON.parse(read("package.json"));
assert(pkg.dependencies["posthog-js"], "posthog-js is installed");
assert(!pkg.dependencies.resend, "do not add a mailer for this funnel");
assert(!pkg.dependencies["posthog-node"], "this PR stays on posthog-js");

const envExample = read(".env.example");
assert(envExample.includes("NEXT_PUBLIC_POSTHOG_KEY="), "key placeholder");
assert(envExample.includes("NEXT_PUBLIC_POSTHOG_HOST="), "host placeholder");
assert(!/phc_[A-Za-z0-9]+/.test(envExample), "do not commit a live PostHog key");
assert(envExample.includes("Vercel Production"), "Sai pastes Production env leftover");
const trackedEnv = execSync("git ls-files -- .env .env.local .env.production", { encoding: "utf8" }).trim();
assert(!trackedEnv, "do not commit a live .env");
assert(read(".gitignore").includes(".env*"), "env files stay gitignored");

const instrumentation = read("instrumentation-client.ts");
assert(instrumentation.includes("posthog.init"), "client SDK init");
assert(instrumentation.includes("isPostHogEnabled") || instrumentation.includes("posthogKey"), "fail closed before init");
assert(instrumentation.includes("capture_pageview: true"), "page views stay on");
assert(!/phc_/.test(instrumentation), "do not hardcode the token");

const provider = read("app/providers.tsx");
assert(provider.includes("PostHogProvider"), "App Router provider");
assert(provider.includes("isPostHogEnabled"), "provider fails closed");
assert(provider.includes("identifySignedInUser"), "identify on signed in session");
assert(provider.includes("resetPostHogUser"), "reset on sign out");
assert(!/phc_/.test(provider), "provider does not hardcode the token");

const layout = read("app/layout.tsx");
assert(layout.includes("PostHogProvider"), "root layout wraps the provider");

const login = read("app/login/page.tsx");
assert(login.includes("identifySignedInUser"), "identify on sign in and sign up");
assert(login.includes("user.id"), "distinct_id is the signed in user id");

const plans = read("app/components/PlansPanel.tsx");
assert(plans.includes("PLANS_OPENED"), "plans view captures plans_opened");
assert(plans.includes("capturePostHogEvent"), "plans uses the fail closed helper");

function exportFn(src, name) {
  const start = src.indexOf("export async function " + name);
  assert(start >= 0, name + " exists");
  const next = src.indexOf("export async function ", start + 1);
  return next >= 0 ? src.slice(start, next) : src.slice(start);
}

const billing = read("lib/client-billing.ts");
assert(exportFn(billing, "startCheckout").includes("SUBSCRIBE_CHECKOUT_STARTED"), "started fires from $9.99 checkout");
assert(!exportFn(billing, "startVerifyaiCheckout").includes("capturePostHogEvent"), "VerifyAI does not fire subscribe started");
assert(!exportFn(billing, "startEventTicketCheckout").includes("capturePostHogEvent"), "meetup ticket does not fire subscribe started");

const home = read("app/page.tsx");
assert(home.includes("SUBSCRIBE_CHECKOUT_COMPLETED"), "completed fires on success return");
assert(home.includes("confirmCheckoutSession"), "completed waits for a real Stripe confirm");
assert(home.includes("next.canMessage"), "completed is not the paywall view");

const identifySrc = read("lib/posthog.ts") + read("lib/posthog-browser.ts");
assert(identifySrc.includes("identifyPersonProperties"), "identify props are gated");
assert(/return \{ email: value \}/.test(identifySrc), "identify may set email");
assert(!/identify\([^)]*(photo_url|full_name|display_name|caste|religion|chat_text|message_body)/.test(identifySrc), "identify does not send extra profile fields");
assert(!(identifySrc + provider + instrumentation).includes("sachinnetwork8@gmail.com"), "do not invent that inbox");

const adminMetrics = read("app/admin/metrics/page.tsx") + read("app/components/MetricsView.tsx");
assert(!/posthog|plans_opened|subscribe_checkout/.test(adminMetrics), "admin metrics stay member city and age");

const paywall = read("app/components/MessagePaywall.tsx");
assert(!paywall.includes("SUBSCRIBE_CHECKOUT_COMPLETED"), "paywall view does not mark paid");

console.log("posthog funnel ok", {
  key: POSTHOG_KEY_ENV,
  host: POSTHOG_HOST_ENV,
  events: [PLANS_OPENED, SUBSCRIBE_CHECKOUT_STARTED, SUBSCRIBE_CHECKOUT_COMPLETED],
});
