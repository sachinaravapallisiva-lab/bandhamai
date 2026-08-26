/** Plans page. Costs live here, not on the Home dashboard. */

import { BILLING_COPY } from "./billing";
import { BROWSE_PIN_NOT_CONFIGURED, BROWSE_PIN_VOICE } from "./browse-pin";

export const PLANS_PATH = "/plans";
export const PLANS_TITLE = "Plans";
export const PLANS_KICKER = "PLANS";
export const PLANS_BODY =
  "Bandham AI, Priority, and VerifyAI are separate. Meetup this month is a feature demo.";
export const GET_PRIORITY = "Get Priority";

export const PLANS_SUBSCRIBE_KICKER = "BANDHAM AI";
export const PLANS_SUBSCRIBE_HEADLINE = "Bandham AI subscription is $9.99 a month";
export const PLANS_SUBSCRIBE_BODY = BILLING_COPY.body;
export const PLANS_SUBSCRIBE_CTA = BILLING_COPY.subscribe;
export const PLANS_INCLUDED_CTA = "What's included";
export const PLANS_INCLUDED_BODY =
  "View numbers and socials. Send unlimited messages. Call on the app. Browse, search, Speed Match, and profile stay free.";

export const PLANS_PRIORITY_KICKER = "PRIORITY";
export const PLANS_PRIORITY_HEADLINE = BROWSE_PIN_VOICE;
export const PLANS_PRIORITY_BODY =
  "Puts your profile on top of Home and Browse for 7 days. Cap 10 pins a week. Pay again to stay on top.";
export const PLANS_PRIORITY_NOTE = BROWSE_PIN_NOT_CONFIGURED;

export const PLANS_VERIFY_KICKER = "VERIFYAI";
export const PLANS_VERIFY_HEADLINE = "VerifyAI $4.99 one time";
export const PLANS_VERIFY_BODY = "Profile verification. Adds a verification badge on your Bandham profile.";
export const PLANS_VERIFY_CTA = "Get verified";
export const PLANS_VERIFY_HREF = "/account#verify";

export const PLANS_MEETUP_KICKER = "MEETUP THIS MONTH";
export const PLANS_MEETUP_HEADLINE = "Meetup this month";
export const PLANS_MEETUP_BODY = "This is a feature demo. It is not on sale.";
export const PLANS_MEETUP_CTA = "Open meetup";
export const PLANS_MEETUP_HREF = "/meetup";
