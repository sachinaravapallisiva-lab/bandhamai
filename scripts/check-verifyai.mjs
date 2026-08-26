import { readFileSync } from "node:fs";
import { STRIPE_ENV_KEYS } from "../lib/billing.ts";
import {
  VERIFYAI_COPY,
  VERIFYAI_DEFAULT_RETURN_PATH,
  VERIFYAI_PRICE_CENTS,
  VERIFYAI_PRICE_LABEL,
  VERIFYAI_PRICE_ENV,
  VERIFYAI_PURPOSE,
  VERIFYAI_RETURN_PATHS,
  isOneTimeVerifyaiPrice,
  isVerifyaiVerified,
  normalizeVerifyaiStatus,
  safeVerifyaiReturnPath,
  verifyaiCheckoutReturnUrls,
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

assert(VERIFYAI_DEFAULT_RETURN_PATH === "/account", "checkout return defaults to /account");
assert(VERIFYAI_RETURN_PATHS.includes("/account"), "account is an allowed return");
assert(VERIFYAI_RETURN_PATHS.includes("/profile/new"), "profile create is an allowed return");
assert(safeVerifyaiReturnPath("/account") === "/account", "account return stays");
assert(safeVerifyaiReturnPath("/profile/new") === "/profile/new", "profile create return stays");
assert(safeVerifyaiReturnPath("/profile/new/review") === "/profile/new/review", "child of profile create is allowed");
assert(safeVerifyaiReturnPath("/account/settings") === "/account/settings", "child of account is allowed");
assert(safeVerifyaiReturnPath("/matches") === "/account", "unknown path defaults to /account");
assert(safeVerifyaiReturnPath(null) === "/account", "missing next defaults to /account");
assert(safeVerifyaiReturnPath("//evil.com") === "/account", "protocol-relative return blocked");
assert(safeVerifyaiReturnPath("https://evil.com") === "/account", "absolute return blocked");
assert(safeVerifyaiReturnPath("/account-evil") === "/account", "account prefix must be a path segment");
assert(safeVerifyaiReturnPath("/profile/newer") === "/account", "profile/new prefix must be a path segment");
assert(safeVerifyaiReturnPath("/profile/new?foo=1") === "/profile/new", "query is dropped from return path");
assert(safeVerifyaiReturnPath("/profile/new?next=https://evil.com") === "/account", "embedded :// in return path is rejected");
assert(safeVerifyaiReturnPath("/account/../login") === "/account", "dot-dot return blocked");

const origin = "https://bandhamai.vercel.app";
const profileUrls = verifyaiCheckoutReturnUrls(origin, "/profile/new");
assert(
  profileUrls.success_url === origin + "/profile/new?verify=paid&session_id={CHECKOUT_SESSION_ID}",
  "success returns to the starter page with verify=paid"
);
assert(profileUrls.cancel_url === origin + "/profile/new?verify=cancel", "cancel returns to the starter page");
assert(
  verifyaiCheckoutReturnUrls(origin, "/matches").success_url ===
    origin + "/account?verify=paid&session_id={CHECKOUT_SESSION_ID}",
  "unsafe next still lands on /account"
);

const checkout = read("app/api/verifyai/checkout/route.ts");
assert(checkout.includes('mode: "payment"'), "VerifyAI checkout is one-time payment");
assert(checkout.includes("STRIPE_VERIFYAI_PRICE_ID") || checkout.includes("stripeVerifyaiPriceId"), "uses VerifyAI Price");
assert(!checkout.includes('mode: "subscription"'), "do not bill VerifyAI on messaging subscription");
assert(checkout.includes("isOneTimeVerifyaiPrice"), "reject a recurring Price on VerifyAI checkout");
assert(checkout.includes("safeVerifyaiReturnPath"), "checkout sanitizes next/return_path");
assert(checkout.includes("verifyaiCheckoutReturnUrls"), "checkout builds success/cancel from return path");
assert(checkout.includes("return_path") && checkout.includes("next"), "checkout reads next or return_path");
assert(checkout.includes("success_url: returnUrls.success_url"), "success_url comes from the sanitized return path");
assert(checkout.includes("cancel_url: returnUrls.cancel_url"), "cancel_url comes from the sanitized return path");
assert(!checkout.includes('success_url: origin + "/account?verify=paid'), "success_url is not hard-coded to /account");
assert(!checkout.includes('cancel_url: origin + "/account?verify=cancel"'), "cancel_url is not hard-coded to /account");

const verifyaiLib = read("lib/verifyai.ts");
assert(verifyaiLib.includes("verify=paid"), "success still uses verify=paid");
assert(verifyaiLib.includes("session_id={CHECKOUT_SESSION_ID}"), "success still passes session_id for confirm");
assert(verifyaiLib.includes("verify=cancel"), "cancel still uses verify=cancel");

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
assert(start.includes("hasPhoto") || start.includes("photoRequired"), "start requires a profile photo");
assert(VERIFYAI_COPY.photoRequired.toLowerCase().includes("photo"), "photo required copy");
assert(checkout.includes("hasPhoto") || checkout.includes("photoRequired"), "checkout requires a profile photo");

const operator = read("app/api/verifyai/route.ts");
assert(operator.includes("hasPaidVerifyai"), "operator cannot fake-verify without pay");

const clientBilling = read("lib/client-billing.ts");
assert(clientBilling.includes("/api/verifyai/checkout"), "client helper posts to existing VerifyAI checkout");
assert(clientBilling.includes("VERIFYAI_DEFAULT_RETURN_PATH"), "VerifyAI return stays on an allowed path");
assert(!/price_[a-zA-Z0-9]+/.test(clientBilling), "client billing does not invent a VerifyAI Price ID");

const plansPanel = read("app/components/PlansPanel.tsx");
assert(plansPanel.includes("startVerifyaiCheckout"), "Plans Get verified starts VerifyAI checkout");
assert(plansPanel.includes("beginVerifyai"), "Plans wires Get verified to checkout, not a mash link");
assert(!/price_[a-zA-Z0-9]+/.test(plansPanel), "Plans does not invent a VerifyAI Price ID");

const offer = read("app/components/VerifyOffer.tsx");
assert(offer.includes("$4.99") || offer.includes("VERIFYAI_PRICE_LABEL"), "offer shows $4.99");
assert(offer.includes("/api/verifyai/checkout"), "offer uses real Checkout");
assert(offer.includes("loginHref(nextPath)"), "auth gap reuses loginHref(nextPath)");
assert(offer.includes("Retry"), "auth gap has a Retry that re-runs load");
assert(offer.includes("401"), "401 from /api/verifyai/me is a sign-in path");
assert(offer.includes("setNeedsAuth(true)"), "missing auth headers do not stay on One moment");
assert(offer.includes("VERIFYAI_COPY.startMissing"), "start-missing copy is shown");
assert(offer.includes("startConfigured"), "offer reads startConfigured");
assert(offer.includes("startMissing"), "paid + missing start is a dedicated empty state");
assert(offer.includes("return_path") && /next:\s*returnPath/.test(offer), "checkout POST sends next/return_path");
assert(offer.includes("safeVerifyaiReturnPath"), "client sanitizes the checkout return path");
assert(offer.includes('params.get("verify") === "paid"'), "confirm still reads verify=paid on both pages");
assert(offer.includes("session_id"), "confirm still reads session_id");
assert(!/https?:\/\/verifyai/i.test(offer), "does not invent a VerifyAI start URL");
assert(!/window\.location\.assign\(\s*["']https?:\/\//.test(offer), "does not hard-code an off-site VerifyAI URL");

assert(VERIFYAI_COPY.badgeLabel === "Verified", "visible badge word is Verified");
assert(VERIFYAI_COPY.badgePhrase === "Verified with VerifyAI.", "tap / title / name lock");

const badge = read("app/components/VerifyBadge.tsx");
assert(badge.includes("if (!verified) return null"), "badge still only renders when verified");
assert(badge.includes("<button"), "badge is tappable, not icon-only");
assert(badge.includes("VERIFYAI_COPY.badgeLabel") || badge.includes(">Verified<"), "visible Verified label");
assert(
  badge.includes("VERIFYAI_COPY.badgePhrase") || badge.includes("Verified with VerifyAI."),
  "title and accessible name use Verified with VerifyAI."
);
assert(badge.includes("title={phrase}") || badge.includes('title="Verified with VerifyAI."'), "title lock");
assert(badge.includes("aria-label={phrase}") || badge.includes('aria-label="Verified with VerifyAI."'), "aria-label lock");
assert(badge.includes("VIOLET"), "badge uses theme VIOLET");
assert(badge.includes("VIOLET_DEEP"), "badge uses theme VIOLET_DEEP");
assert(!/\bGOLD\b/.test(badge), "badge is not gold");
assert(!/#C4A36A|#FFD700|#F5C518/i.test(badge), "no gold hex on the badge");
assert(!/#16[Aa]34[Aa]|#22[Cc]55[Ee]|#15803[Dd]|#10[Bb]981/i.test(badge), "badge is not green");
assert(!/#1[Dd]9[Bb][Ff]0|#1[Dd][Aa]1[Ff]2|#1877[Ff]2|#0[Aa]66[Cc]2/i.test(badge), "badge is not a blue tick");
assert(!badge.includes('title="VerifyAI"'), "old icon-only title is gone");
assert(!badge.includes('aria-label="VerifyAI"'), "old icon-only name is gone");

const sql = read("supabase/verifyai.sql");
assert(sql.includes("verifyai_payments"), "payments table");
assert(sql.includes("499"), "default amount is 499 cents");

console.log("verifyai violet badge + $4.99 checkout rules ok");
