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
assert(!banned.test(copy), "no scarcity or fake-discount copy");
assert(BILLING_COPY.headline.includes("$9.99/mo"), "honest headline");
assert(BILLING_COPY.body.includes("not a promise of a match"), "lawyer-safe body");
assert(BILLING_COPY.notConfigured.toLowerCase().includes("billing is not configured"), "dev-safe copy");

console.log("billing copy ok", {
  price: MESSAGING_PRICE_LABEL,
  table: SUBSCRIPTIONS_TABLE,
  env: STRIPE_ENV_KEYS,
});
