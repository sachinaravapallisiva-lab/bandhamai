/** Plans page. Costs live here, not on the Home dashboard. */

import { BILLING_COPY } from "./billing";
import {
  BROWSE_PIN_CAP_NOTE,
  BROWSE_PIN_NOT_CONFIGURED,
  BROWSE_PIN_RENEW_NOTE,
  BROWSE_PIN_VOICE,
} from "./browse-pin";
import { VERIFYAI_PRICE_LABEL } from "./verifyai";

export const PLANS_PATH = "/plans";
export const PLANS_TITLE = "Plans";
export const PLANS_KICKER = "PLANS";
export const PLANS_BODY = "Bandham AI, Priority, and VerifyAI are separate. Pick only what you need.";
export const GET_PRIORITY = "Get Priority";

export const PLANS_SUBSCRIBE_HEADLINE = BILLING_COPY.headline;
export const PLANS_SUBSCRIBE_CTA = BILLING_COPY.subscribe;
export const PLANS_PRIORITY_HEADLINE = BROWSE_PIN_VOICE;
export const PLANS_PRIORITY_CAP = BROWSE_PIN_CAP_NOTE;
export const PLANS_PRIORITY_RENEW = BROWSE_PIN_RENEW_NOTE;
export const PLANS_PRIORITY_NOTE = BROWSE_PIN_NOT_CONFIGURED;
export const PLANS_VERIFY_HEADLINE = "VerifyAI " + VERIFYAI_PRICE_LABEL + " one time";
export const PLANS_VERIFY_CTA = "Get verified";
export const PLANS_VERIFY_HREF = "/account#verify";
