/** PostHog public env and funnel event names. Fail closed without a key. */

export const POSTHOG_KEY_ENV = "NEXT_PUBLIC_POSTHOG_KEY";
export const POSTHOG_HOST_ENV = "NEXT_PUBLIC_POSTHOG_HOST";
export const POSTHOG_DEFAULT_HOST = "https://us.i.posthog.com";
export const POSTHOG_DEFAULTS = "2026-05-30";

export const PLANS_OPENED = "plans_opened";
export const SUBSCRIBE_CHECKOUT_STARTED = "subscribe_checkout_started";
export const SUBSCRIBE_CHECKOUT_COMPLETED = "subscribe_checkout_completed";

type EnvBag = Record<string, string | undefined>;

export function posthogKey(env: EnvBag = process.env) {
  return (env[POSTHOG_KEY_ENV] || "").trim();
}

export function isPostHogEnabled(env: EnvBag = process.env) {
  return posthogKey(env).length > 0;
}

export function posthogHost(env: EnvBag = process.env) {
  return (env[POSTHOG_HOST_ENV] || "").trim() || POSTHOG_DEFAULT_HOST;
}

/** Person properties allowed on identify. Email only. */
export function identifyPersonProperties(email?: string | null) {
  const value = typeof email === "string" ? email.trim() : "";
  if (!value) return {};
  return { email: value };
}
