import Stripe from "stripe";
import { STRIPE_ENV_KEYS } from "./billing";

let stripe: Stripe | undefined;

export function stripeSecretKey() {
  return (process.env.STRIPE_SECRET_KEY || "").trim();
}

export function stripeWebhookSecret() {
  return (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
}

export function stripePublishableKey() {
  return (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").trim();
}

export function stripePriceId() {
  return (process.env.STRIPE_PRICE_ID || "").trim();
}

/** One-time $4.99 VerifyAI SKU. Separate from STRIPE_PRICE_ID ($9.99/mo messaging). */
export function stripeVerifyaiPriceId() {
  return (process.env.STRIPE_VERIFYAI_PRICE_ID || "").trim();
}

/** One time meetup event ticket. Separate from messaging and VerifyAI. Amount is unnamed. */
export function stripeEventPriceId() {
  return (process.env.STRIPE_EVENT_PRICE_ID || "").trim();
}

export function isEventTicketConfigured() {
  return !!(stripeSecretKey() && stripeEventPriceId());
}

export function isStripeSignatureConfigured() {
  return !!(stripeSecretKey() && stripeWebhookSecret());
}

export function missingStripeEnv() {
  return STRIPE_ENV_KEYS.filter(function (key) {
    return !(process.env[key] || "").trim();
  });
}

export function isStripeConfigured() {
  return missingStripeEnv().length === 0;
}

export function getStripe(): Stripe | null {
  const key = stripeSecretKey();
  if (!key) return null;
  if (!stripe) {
    stripe = new Stripe(key);
  }
  return stripe;
}

export function appOrigin(request: Request) {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
  if (configured) return configured;

  const origin = (request.headers.get("origin") || "").trim();
  if (origin && /^https?:\/\//i.test(origin)) return origin.replace(/\/$/, "");

  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").trim();
  const proto = (request.headers.get("x-forwarded-proto") || "https").split(",")[0].trim();
  if (host) return proto + "://" + host;

  return "https://bandhamai.vercel.app";
}

export function subscriptionPeriodEnd(subscription: Stripe.Subscription): string | null {
  const itemEnd = subscription.items?.data?.[0]?.current_period_end;
  const rootEnd = (subscription as { current_period_end?: number }).current_period_end;
  const seconds = typeof itemEnd === "number" ? itemEnd : typeof rootEnd === "number" ? rootEnd : null;
  if (!seconds) return null;
  return new Date(seconds * 1000).toISOString();
}

export function subscriptionPriceId(subscription: Stripe.Subscription): string | null {
  return subscription.items?.data?.[0]?.price?.id || null;
}

export function asStripeId(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof (value as { id: unknown }).id === "string") {
    return (value as { id: string }).id;
  }
  return "";
}
