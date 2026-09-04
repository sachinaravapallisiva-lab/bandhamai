import { readFileSync } from "node:fs";
import {
  BILLING_COPY,
  DODO_SUBSCRIBE_ENV_KEYS,
  MESSAGING_INTERVAL,
  MESSAGING_PRICE_CENTS,
  MESSAGING_PRICE_LABEL,
  STRIPE_ENV_KEYS,
  STRIPE_FOUNDING_PRICE_ENV,
  SUBSCRIPTIONS_SQL_FILE,
  SUBSCRIPTIONS_TABLE,
} from "../lib/billing.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

const banned = /\b(most people upgrade|limited time|only \d+ left|act now|founding spots|discount|hurry)\b/i;
const copy = Object.values(BILLING_COPY).join(" ");

assert(MESSAGING_PRICE_LABEL === "$9.99/mo", "price lock is $9.99/mo");
assert(MESSAGING_PRICE_CENTS === 999, "price cents lock");
assert(MESSAGING_INTERVAL === "month", "monthly interval");
assert(SUBSCRIPTIONS_TABLE === "subscriptions", "use subscriptions table");
assert(SUBSCRIPTIONS_SQL_FILE === "supabase/subscriptions.sql", "sql path");
assert(DODO_SUBSCRIBE_ENV_KEYS.includes("DODO_PAYMENTS_API_KEY"), "Dodo API key env");
assert(DODO_SUBSCRIBE_ENV_KEYS.includes("DODO_SUBSCRIBE_PRODUCT_ID"), "Dodo subscribe product env");
assert(!DODO_SUBSCRIBE_ENV_KEYS.includes("STRIPE_SECRET_KEY"), "Stripe secret is not required for messaging");
assert(!DODO_SUBSCRIBE_ENV_KEYS.includes("STRIPE_EVENT_PRICE_ID"), "event ticket is not required for messaging");
assert(!STRIPE_ENV_KEYS.includes("STRIPE_EVENT_PRICE_ID"), "event ticket is not required for messaging stripe list");
assert(STRIPE_FOUNDING_PRICE_ENV === "STRIPE_FOUNDING_PRICE_ID", "optional founding env name");
const defaultCopy = [
  BILLING_COPY.headline,
  BILLING_COPY.body,
  BILLING_COPY.lawyer,
  BILLING_COPY.subscribe,
  BILLING_COPY.manage,
  BILLING_COPY.notConfigured,
  BILLING_COPY.signIn,
  BILLING_COPY.returning,
  BILLING_COPY.active,
].join(" ");

assert(!banned.test(copy), "no scarcity or fake-discount copy");
assert(BILLING_COPY.headline === "Bandham AI subscription is $9.99 a month", "honest headline");
assert(BILLING_COPY.headline.includes("Bandham AI subscription is $9.99 a month"), "headline lock");
assert(!/includes/i.test(BILLING_COPY.headline), "headline does not list includes");
assert(!/\$9\.99\/mo to message/.test(BILLING_COPY.headline), "no old messaging headline");
assert(!/includes messaging|browse, search|speed match/i.test(defaultCopy), "default copy does not list includes");
assert(BILLING_COPY.body === "Pay monthly. Cancel anytime in the customer portal.", "quiet body");
assert(!/Stripe customer portal/i.test(copy), "do not name Stripe on the paywall");
assert(BILLING_COPY.lawyer.includes("not a promise of a match"), "lawyer-safe copy");
assert(BILLING_COPY.subscribe === "Subscribe $9.99 a month", "subscribe CTA");
assert(BILLING_COPY.includedWhenAsked.toLowerCase().includes("messaging"), "asked-only include string");
assert(BILLING_COPY.notConfigured.toLowerCase().includes("billing is not configured"), "dev-safe copy");
assert(!/messaging plan|\$9\.99 for messaging/i.test(copy), "no messaging-plan phrasing");
assert(!/LaughRank/i.test(copy), "do not mix LaughRank into Bandham billing");

const LOCKED_PLANS_INCLUDED =
  "View numbers and socials. Send unlimited messages. Call on the app. Browse, search, Speed Match, and profile stay free.";
const LOCKED_PLANS_VERIFY = "Profile verification. Adds a verification badge on your Bandham profile.";

const plansLib = read("lib/plans.ts");
const plansPanel = read("app/components/PlansPanel.tsx");
assert(
  /PLANS_SUBSCRIBE_BODY\s*=\s*BILLING_COPY\.body/.test(plansLib),
  "plans default body is the quiet pay monthly line"
);
assert(plansLib.includes(LOCKED_PLANS_INCLUDED), "tapped Bandham include is the locked two sentence list");
assert(plansLib.includes("PLANS_INCLUDED_BODY"), "Plans keeps a tapped include constant");
assert(plansLib.includes(LOCKED_PLANS_VERIFY), "VerifyAI default body is the locked badge sentences");
assert(
  plansLib.includes('PLANS_VERIFY_BODY = "' + LOCKED_PLANS_VERIFY + '"'),
  "VerifyAI default body assignment is exact"
);
assert(!/Messaging\./.test(plansLib), "tapped include does not start with Messaging");
assert(!/That is messaging/i.test(plansLib + plansPanel), "do not say That is messaging");
assert(plansPanel.includes("PLANS_INCLUDED_CTA"), "Plans has an explicit What's included tap");
assert(plansPanel.includes("PLANS_INCLUDED_BODY"), "tapped include is rendered from the locked constant");
assert(plansPanel.includes("PLANS_VERIFY_BODY"), "VerifyAI card uses the locked body");
assert(plansPanel.includes("<details"), "inclusions stay closed until tapped");
assert(plansPanel.includes("BILLING_COPY.lawyer"), "Plans keeps the lawyer line");
assert(plansPanel.includes("startVerifyaiCheckout"), "VerifyAI uses existing checkout");
assert(plansPanel.includes('data-plan-card="meetup"'), "Meetup this month is its own card");
assert(!/startEventTicketCheckout|\/api\/meetup\/checkout/.test(plansPanel), "meetup card does not charge");
assert(!/STRIPE_PIN_PRICE_ID|price_[a-zA-Z0-9]+/.test(plansLib + plansPanel), "plans do not invent Price IDs");

const paywall = read("app/components/MessagePaywall.tsx");
assert(paywall.includes("SUBSCRIPTION"), "paywall kicker is SUBSCRIPTION");
assert(!paywall.includes("MESSAGING"), "paywall kicker is not MESSAGING");
assert(paywall.includes("$9.99 a month. Cancel anytime in the customer portal"), "paywall footer lock");
assert(!/Stripe customer portal/i.test(paywall), "paywall does not name Stripe");
assert(!/includes messaging/i.test(paywall), "paywall does not list includes");

const checkout = read("app/api/stripe/checkout/route.ts");
assert(checkout.includes("dodoSubscribeProductId") || checkout.includes("DODO_SUBSCRIBE_PRODUCT_ID"), "messaging uses Dodo product");
assert(checkout.includes("checkoutSessions.create"), "messaging creates a Dodo checkout session");
assert(checkout.includes("billing_not_configured") || checkout.includes("billingNotConfiguredResponse"), "fail closed without Dodo");
assert(!checkout.includes("getStripe"), "messaging checkout does not require Stripe");
assert(!checkout.includes("STRIPE_EVENT_PRICE_ID"), "messaging checkout does not use event Price");

const dodoSql = read("supabase/subscriptions_dodo.sql");
assert(dodoSql.includes("dodo_customer_id"), "Dodo SQL adds customer id");
assert(dodoSql.includes("dodo_subscription_id"), "Dodo SQL adds subscription id");
assert(!/drop column stripe_/i.test(dodoSql), "do not drop stripe columns");

console.log("billing copy ok", {
  price: MESSAGING_PRICE_LABEL,
  table: SUBSCRIPTIONS_TABLE,
  env: DODO_SUBSCRIBE_ENV_KEYS,
});
