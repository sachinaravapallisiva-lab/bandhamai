/** Plans page. Costs live here, not on the Home dashboard. */

import { BILLING_COPY } from "./billing";
import { BROWSE_PIN_NOT_CONFIGURED, BROWSE_PIN_VOICE } from "./browse-pin";

export const PLANS_PATH = "/plans";
export const PLANS_TITLE = "Plans";
export const PLANS_KICKER = "PLANS";
export const PLANS_BODY = "Bandham AI, Priority, and VerifyAI are separate. Pick only what you need.";
export const GET_PRIORITY = "Get Priority";

export const PLANS_SUBSCRIBE_KICKER = "BANDHAM AI";
export const PLANS_SUBSCRIBE_HEADLINE = "Bandham AI subscription is $9.99 a month";
export const PLANS_SUBSCRIBE_BODY =
  "View numbers. Socials after they approve. Send unlimited messages. Call on the app. Browse, search, Speed Match, and profile stay free.";
export const PLANS_SUBSCRIBE_CTA = BILLING_COPY.subscribe;

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
