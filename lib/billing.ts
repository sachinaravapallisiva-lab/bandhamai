/** Messaging subscription: $9.99/mo. Browse, search, Speed Match, and profile create stay free. */

export const MESSAGING_PRICE_LABEL = "$9.99/mo";
export const MESSAGING_PRICE_CENTS = 999;
export const MESSAGING_INTERVAL = "month";

export const SUBSCRIPTIONS_TABLE = "subscriptions";
export const SUBSCRIPTIONS_SQL_FILE = "supabase/subscriptions.sql";
export const MESSAGES_TABLE = "messages";

export const STRIPE_ENV_KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_PRICE_ID",
] as const;

/** Optional later. Messaging checkout does not use this. */
export const STRIPE_FOUNDING_PRICE_ENV = "STRIPE_FOUNDING_PRICE_ID";

/** Required for $9.99/mo Subscribe checkout. Fail closed if missing. */
export const DODO_SUBSCRIBE_ENV_KEYS = ["DODO_PAYMENTS_API_KEY", "DODO_SUBSCRIBE_PRODUCT_ID"] as const;

export const DODO_WEBHOOK_ENV_KEY = "DODO_PAYMENTS_WEBHOOK_KEY";
export const DODO_VERIFYAI_PRODUCT_ENV = "DODO_VERIFYAI_PRODUCT_ID";
export const DODO_ENVIRONMENT_ENV = "DODO_PAYMENTS_ENVIRONMENT";
export const SUBSCRIPTIONS_DODO_SQL_FILE = "supabase/subscriptions_dodo.sql";
export const MESSAGING_PURPOSE = "messaging";

export const ENTITLED_STATUSES = ["active", "trialing"] as const;

export const BILLING_COPY = {
  headline: "Bandham AI subscription is $9.99 a month",
  body: "Pay monthly. Cancel anytime in the customer portal.",
  lawyer: "Bandham AI does not guarantee matches. A subscription is not a promise of a match, a meeting, or a marriage.",
  notConfigured: "Billing is not configured. Checkout is not live on this environment.",
  tableMissing: "Subscription storage is not applied yet. Run " + SUBSCRIPTIONS_SQL_FILE + " in the Supabase SQL editor.",
  signIn: "Sign in to subscribe or send a message.",
  subscribe: "Subscribe $9.99 a month",
  manage: "Manage subscription",
  returning: "If you just paid, wait a few seconds for billing to confirm. Then try Send again.",
  active: "Bandham AI is active on this account. Cancel anytime in the customer portal.",
  includedWhenAsked:
    "Messaging. Browse, search, Speed Match, and creating a profile stay free. VerifyAI and meetup are separate.",
} as const;

export type Entitlement = {
  configured: boolean;
  canMessage: boolean;
  status: string | null;
  priceLabel: string;
  stripeCustomerId: string | null;
  dodoCustomerId: string | null;
  currentPeriodEnd: string | null;
  code?: string;
  error?: string;
  sql?: string;
};

export type SubscriptionRow = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  dodo_customer_id: string | null;
  dodo_subscription_id: string | null;
  dodo_product_id: string | null;
  provider: string | null;
  status: string;
  current_period_end: string | null;
  updated_at?: string;
};

export function isEntitledStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export function emptyEntitlement(partial?: Partial<Entitlement>): Entitlement {
  return {
    configured: false,
    canMessage: false,
    status: null,
    priceLabel: MESSAGING_PRICE_LABEL,
    stripeCustomerId: null,
    dodoCustomerId: null,
    currentPeriodEnd: null,
    ...partial,
  };
}
