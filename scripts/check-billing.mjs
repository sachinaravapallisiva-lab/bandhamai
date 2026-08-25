import { readFileSync } from "node:fs";
import {
  BILLING_COPY,
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

const banned = /\b(most people upgrade|limited time|only \d+ left|act now|founding spots|discount|hurry)\b/i;
const copy = Object.values(BILLING_COPY).join(" ");

assert(MESSAGING_PRICE_LABEL === "$9.99/mo", "price lock is $9.99/mo");
assert(MESSAGING_PRICE_CENTS === 999, "price cents lock");
assert(MESSAGING_INTERVAL === "month", "monthly interval");
assert(SUBSCRIPTIONS_TABLE === "subscriptions", "use subscriptions table");
assert(SUBSCRIPTIONS_SQL_FILE === "supabase/subscriptions.sql", "sql path");
assert(STRIPE_ENV_KEYS.includes("STRIPE_SECRET_KEY"), "secret key env");
assert(STRIPE_ENV_KEYS.includes("STRIPE_WEBHOOK_SECRET"), "webhook secret env");
assert(STRIPE_ENV_KEYS.includes("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"), "publishable key env");
assert(STRIPE_ENV_KEYS.includes("STRIPE_PRICE_ID"), "price id env");
assert(!STRIPE_ENV_KEYS.includes("STRIPE_EVENT_PRICE_ID"), "event ticket is not required for messaging");
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
assert(BILLING_COPY.body === "Pay monthly. Cancel anytime in the Stripe customer portal.", "quiet body");
assert(BILLING_COPY.lawyer.includes("not a promise of a match"), "lawyer-safe copy");
assert(BILLING_COPY.subscribe === "Subscribe $9.99 a month", "subscribe CTA");
assert(BILLING_COPY.includedWhenAsked.toLowerCase().includes("messaging"), "asked-only include string");
assert(BILLING_COPY.notConfigured.toLowerCase().includes("billing is not configured"), "dev-safe copy");
assert(!/messaging plan|\$9\.99 for messaging/i.test(copy), "no messaging-plan phrasing");

const paywall = readFileSync(new URL("../app/components/MessagePaywall.tsx", import.meta.url), "utf8");
assert(paywall.includes("SUBSCRIPTION"), "paywall kicker is SUBSCRIPTION");
assert(!paywall.includes("MESSAGING"), "paywall kicker is not MESSAGING");
assert(paywall.includes("$9.99 a month. Cancel anytime in the Stripe customer portal"), "paywall footer lock");
assert(!/includes messaging/i.test(paywall), "paywall does not list includes");

console.log("billing copy ok", {
  price: MESSAGING_PRICE_LABEL,
  table: SUBSCRIPTIONS_TABLE,
  env: STRIPE_ENV_KEYS,
});
