import { readFileSync } from "node:fs";
import {
  ACCOUNT_MENU_FREE_CHIP,
  ACCOUNT_MENU_PAID_CHIP,
  ACCOUNT_MENU_UPGRADE,
} from "../lib/account-menu.ts";
import { BILLING_COPY, ENTITLED_STATUSES, SUBSCRIPTIONS_TABLE } from "../lib/billing.ts";
import {
  MEMBERSHIP_PREMIUM,
  MEMBERSHIP_PREMIUM_LABEL,
  MEMBERSHIP_REGULAR,
  MEMBERSHIP_REGULAR_LABEL,
  asProfileMembership,
  membershipFromStatus,
  membershipLabel,
} from "../lib/membership.ts";
import { toBrowseProfile } from "../lib/profile-search.ts";

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

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

assertEq(MEMBERSHIP_REGULAR_LABEL, "Regular", "Regular label lock");
assertEq(MEMBERSHIP_PREMIUM_LABEL, "Premium", "Premium label lock");
assertEq(MEMBERSHIP_REGULAR, "regular", "regular id");
assertEq(MEMBERSHIP_PREMIUM, "premium", "premium id");
assert(!/[-–—]/.test(MEMBERSHIP_REGULAR_LABEL + MEMBERSHIP_PREMIUM_LABEL), "labels have no hyphen or dash");
assertEq(membershipLabel(MEMBERSHIP_REGULAR), "Regular", "regular label helper");
assertEq(membershipLabel(MEMBERSHIP_PREMIUM), "Premium", "premium label helper");
assertEq(membershipFromStatus("active"), MEMBERSHIP_PREMIUM, "active is Premium");
assertEq(membershipFromStatus("trialing"), MEMBERSHIP_PREMIUM, "trialing is Premium");
assertEq(membershipFromStatus("canceled"), MEMBERSHIP_REGULAR, "canceled is Regular");
assertEq(membershipFromStatus("past_due"), MEMBERSHIP_REGULAR, "past_due is Regular");
assertEq(membershipFromStatus("none"), MEMBERSHIP_REGULAR, "none is Regular");
assertEq(membershipFromStatus(null), MEMBERSHIP_REGULAR, "missing status is Regular");
assertEq(asProfileMembership("premium"), MEMBERSHIP_PREMIUM, "premium maps");
assertEq(asProfileMembership("paid"), MEMBERSHIP_REGULAR, "Paid is not a membership");
assertEq(asProfileMembership("active"), MEMBERSHIP_REGULAR, "raw status is not a membership");
assertEq(asProfileMembership(undefined), MEMBERSHIP_REGULAR, "missing attach is Regular");

assertEq(toBrowseProfile({ id: "m1", full_name: "A" })?.membership, MEMBERSHIP_REGULAR, "mapper defaults Regular");
assertEq(
  toBrowseProfile({ id: "m2", full_name: "A", membership: "premium" })?.membership,
  MEMBERSHIP_PREMIUM,
  "mapper keeps attached Premium"
);
assertEq(
  toBrowseProfile({ id: "m3", full_name: "A", membership: "paid" })?.membership,
  MEMBERSHIP_REGULAR,
  "mapper does not treat paid as Premium"
);

assert(SUBSCRIPTIONS_TABLE === "subscriptions", "reuse public.subscriptions");
assert(ENTITLED_STATUSES.includes("active") && ENTITLED_STATUSES.includes("trialing"), "same entitled statuses");
assert(BILLING_COPY.subscribe === "Subscribe $9.99 a month", "subscribe button lock stays");

assert(ACCOUNT_MENU_PAID_CHIP === "Bandham AI", "self subscribed chip stays Bandham AI");
assert(ACCOUNT_MENU_FREE_CHIP === "Free", "self free chip stays Free");
assert(ACCOUNT_MENU_UPGRADE === "Subscribe $9.99 a month", "account CTA is not Upgrade");
assert(ACCOUNT_MENU_PAID_CHIP !== "Paid", "self chip is not Paid");
assert(ACCOUNT_MENU_PAID_CHIP !== "Premium", "self chip is not Premium");
assert(ACCOUNT_MENU_FREE_CHIP !== "Regular", "self chip is not Regular");

const lib = read("lib/membership.ts");
const server = read("lib/membership-server.ts");
const chip = read("app/components/MembershipChip.tsx");
const discover = read("app/components/DiscoverCard.tsx");
const match = read("app/components/MatchCard.tsx");
const search = read("app/api/profiles/search/route.ts");
const mapper = read("lib/profile-search.ts");
const drawer = read("app/components/AccountDrawer.tsx");
const accountMenu = read("lib/account-menu.ts");
const paywall = read("app/components/MessagePaywall.tsx");
const checkout = read("app/api/stripe/checkout/route.ts");

assert(server.includes("SUBSCRIPTIONS_TABLE"), "lookup uses subscriptions");
assert(server.includes("subscriptionsTableReady"), "missing table stays Regular");
assert(server.includes("ENTITLED_STATUSES"), "Premium is active or trialing only");
assert(server.includes("loadPremiumUserIds"), "batch lookup helper");
assert(server.includes("attachMembership"), "row attach helper");
assert(!/STRIPE_FOUNDING_PRICE|founding/.test(server), "no second paid SKU");

assert(search.includes("loadPremiumUserIds"), "Browse search attaches membership");
assert(search.includes("attachMembership"), "Browse rows get membership");
assert(!/stripe|checkout|price_/i.test(search), "search still has no Stripe");

const meetupServer = read("lib/meetup-server.ts");
assert(meetupServer.includes("loadPremiumUserIds"), "meetup cards reuse the same lookup");
assert(meetupServer.includes("attachMembership"), "meetup MatchCards get Regular or Premium");

assert(mapper.includes("membership:"), "BrowseProfile has membership");
assert(mapper.includes("asProfileMembership"), "mapper uses the locked helper");

assert(discover.includes("MembershipChip"), "Browse card shows the plan chip");
assert(match.includes("MembershipChip"), "Matches card shows the plan chip");
assert(discover.includes("membership={profile.membership}"), "Browse reads attached membership");
assert(match.includes("membership={profile.membership}"), "Matches reads attached membership");

assert(chip.includes("MEMBERSHIP_REGULAR") || chip.includes('"regular"'), "chip can render Regular");
assert(chip.includes("membershipLabel"), "chip uses locked labels");
assert(chip.includes("CREAM") || chip.includes("#FDF8F1"), "Regular sits on cream");
assert(chip.includes("VIOLET"), "Premium uses violet");
assert(!/\bGOLD\b/.test(chip), "chip is not a gold Paid stamp");
assert(!/#C4A36A/.test(chip), "chip has no gold hex");
assert(!/<svg/.test(chip), "chip is not a crown or boost icon");
assert(!/crown|boost/i.test(chip), "chip is not a crown or Boost");

const userFacing = [
  MEMBERSHIP_REGULAR_LABEL,
  MEMBERSHIP_PREMIUM_LABEL,
  stripComments(chip),
  stripComments(lib),
].join("\n");
assert(!/\bPaid\b/.test(userFacing), "membership copy is not Paid");
assert(!/\bUpgrade\b/.test(userFacing), "membership copy is not Upgrade");
assert(!/\bCrown\b/.test(userFacing), "membership copy is not Crown");
assert(!/\$9\.99 for messaging/i.test(userFacing), "do not say 9.99 for messaging");
assert(!/Bandham-AI|Bandham—AI|Bandham–AI/.test(userFacing), "product name is two words if used");

assert(paywall.includes("Subscribe $9.99 a month") || paywall.includes("BILLING_COPY.subscribe"), "paywall subscribe stays");
assert(checkout.includes("STRIPE_PRICE_ID") || checkout.includes("stripePriceId"), "checkout SKU unchanged");

assert(drawer.includes("ACCOUNT_MENU_PAID_CHIP"), "account self chip stays");
assert(drawer.includes("ACCOUNT_MENU_FREE_CHIP"), "account free chip stays");
assert(!drawer.includes("MembershipChip"), "account menu does not use the card chip");
assert(!accountMenu.includes("Regular"), "account menu does not add Regular");
assert(!accountMenu.includes("Premium"), "account menu does not add Premium");

const datingChrome = /\b(swipe|streaks?|hot near you|boost now|super[\s-]?like|crown|paid stamp)\b/i;
assert(!datingChrome.test(stripComments(chip)), "chip has no dating chrome");
assert(!datingChrome.test(stripComments(discover)), "Browse card still has no dating chrome");
assert(!datingChrome.test(stripComments(match)), "Matches card still has no dating chrome");

console.log("membership chips ok", {
  regular: MEMBERSHIP_REGULAR_LABEL,
  premium: MEMBERSHIP_PREMIUM_LABEL,
  table: SUBSCRIPTIONS_TABLE,
});
