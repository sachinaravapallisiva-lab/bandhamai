import { readFileSync } from "node:fs";
import { STRIPE_ENV_KEYS } from "../lib/billing.ts";
import {
  VERIFYAI_COPY,
  VERIFYAI_PRICE_CENTS,
  VERIFYAI_PRICE_LABEL,
  VERIFYAI_PRICE_ENV,
  VERIFYAI_PURPOSE,
  isOneTimeVerifyaiPrice,
  isVerifyaiVerified,
  normalizeVerifyaiStatus,
} from "../lib/verifyai.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

assert(isVerifyaiVerified("verified") === true, "verified is the only badge");
assert(isVerifyaiVerified("VERIFIED") === true, "case-insensitive stored value");
assert(isVerifyaiVerified("pending") === false, "pending hidden");
assert(isVerifyaiVerified("failed") === false, "failed hidden");
assert(isVerifyaiVerified("revoked") === false, "revoked hidden");
assert(isVerifyaiVerified("unverified") === false, "unverified hidden");
assert(isVerifyaiVerified("") === false, "empty hidden");
assert(isVerifyaiVerified(null) === false, "null hidden");
assert(isVerifyaiVerified(true) === false, "boolean true is not a badge");

assert(normalizeVerifyaiStatus("completed") === "verified", "webhook completed maps to verified");
assert(normalizeVerifyaiStatus("fail") === "failed", "fail maps");
assert(normalizeVerifyaiStatus("nope") === null, "unknown status rejected");

assert(VERIFYAI_PRICE_CENTS === 499, "one-time price is $4.99");
assert(VERIFYAI_PRICE_LABEL === "$4.99", "label has no fake discount");
assert(VERIFYAI_PURPOSE === "verifyai", "checkout metadata purpose");
assert(VERIFYAI_PRICE_ENV === "STRIPE_VERIFYAI_PRICE_ID", "separate Price env");
assert(!STRIPE_ENV_KEYS.includes("STRIPE_VERIFYAI_PRICE_ID"), "do not require VerifyAI Price for messaging");
assert(VERIFYAI_COPY.wrongPrice.includes("one-time"), "wrong-price copy names one-time");
assert(isOneTimeVerifyaiPrice({ type: "one_time", unit_amount: 499, recurring: null }) === true, "accept $4.99 one-time");
assert(isOneTimeVerifyaiPrice({ type: "recurring", unit_amount: 999, recurring: { interval: "month" } }) === false, "reject messaging subscription Price");
assert(isOneTimeVerifyaiPrice({ type: "one_time", unit_amount: 999, recurring: null }) === false, "reject a one-time Price that is not $4.99");

const checkout = read("app/api/verifyai/checkout/route.ts");
assert(checkout.includes('mode: "payment"'), "VerifyAI checkout is one-time payment");
assert(checkout.includes("STRIPE_VERIFYAI_PRICE_ID") || checkout.includes("stripeVerifyaiPriceId"), "uses VerifyAI Price");
assert(!checkout.includes('mode: "subscription"'), "do not bill VerifyAI on messaging subscription");
assert(checkout.includes("isOneTimeVerifyaiPrice"), "reject a recurring Price on VerifyAI checkout");

const messaging = read("app/api/stripe/checkout/route.ts");
assert(messaging.includes('mode: "subscription"'), "messaging stays a $9.99/mo subscription");
assert(!messaging.includes("STRIPE_VERIFYAI_PRICE_ID"), "messaging checkout does not use the VerifyAI Price");

const confirm = read("app/api/verifyai/confirm/route.ts");
assert(!confirm.includes('verifyai_status: "verified"'), "confirm does not set verified");
assert(confirm.includes("recordVerifyaiPayment"), "confirm records payment only");

const stripeHook = read("app/api/stripe/webhook/route.ts");
assert(stripeHook.includes('purpose === "verifyai"') || stripeHook.includes("VERIFYAI_PURPOSE"), "Stripe webhook records VerifyAI pay");
assert(!stripeHook.includes('verifyai_status: "verified"'), "Stripe webhook does not set verified");

const verifyHook = read("app/api/verifyai/webhook/route.ts");
assert(verifyHook.includes("hasPaidVerifyai"), "VerifyAI webhook requires paid row for verified");
assert(verifyHook.includes("409"), "unpaid verified is 409");

const start = read("app/api/verifyai/start/route.ts");
assert(start.includes("402"), "start requires payment");
assert(start.includes("buildVerifyaiStartUrl"), "start hands off to VerifyAI");

const operator = read("app/api/verifyai/route.ts");
assert(operator.includes("hasPaidVerifyai"), "operator cannot fake-verify without pay");

const offer = read("app/components/VerifyOffer.tsx");
assert(offer.includes("$4.99") || offer.includes("VERIFYAI_PRICE_LABEL"), "offer shows $4.99");
assert(offer.includes("/api/verifyai/checkout"), "offer uses real Checkout");

const sql = read("supabase/verifyai.sql");
assert(sql.includes("verifyai_payments"), "payments table");
assert(sql.includes("499"), "default amount is 499 cents");

console.log("verifyai badge + $4.99 checkout rules ok");
