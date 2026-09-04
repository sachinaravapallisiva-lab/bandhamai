import DodoPayments from "dodopayments";
import { NextResponse } from "next/server";
import { BILLING_COPY, DODO_SUBSCRIBE_ENV_KEYS } from "./billing";

let client: DodoPayments | undefined;

export function dodoApiKey() {
  return (process.env.DODO_PAYMENTS_API_KEY || "").trim();
}

export function dodoWebhookKey() {
  return (process.env.DODO_PAYMENTS_WEBHOOK_KEY || "").trim();
}

export function dodoSubscribeProductId() {
  return (process.env.DODO_SUBSCRIBE_PRODUCT_ID || "").trim();
}

export function dodoVerifyaiProductId() {
  return (process.env.DODO_VERIFYAI_PRODUCT_ID || "").trim();
}

export function dodoEnvironment(): "live_mode" | "test_mode" {
  return process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";
}

export function missingDodoSubscribeEnv() {
  return DODO_SUBSCRIBE_ENV_KEYS.filter(function (key) {
    return !(process.env[key] || "").trim();
  });
}

export function isDodoSubscribeConfigured() {
  return !!(dodoApiKey() && dodoSubscribeProductId());
}

export function isDodoVerifyaiConfigured() {
  return !!(dodoApiKey() && dodoVerifyaiProductId());
}

export function isDodoWebhookConfigured() {
  return !!(dodoApiKey() && dodoWebhookKey());
}

export function getDodo(): DodoPayments | null {
  const key = dodoApiKey();
  if (!key) return null;
  if (!client) {
    client = new DodoPayments({
      bearerToken: key,
      environment: dodoEnvironment(),
    });
  }
  return client;
}

export function billingNotConfiguredResponse() {
  return NextResponse.json(
    {
      configured: false,
      canMessage: false,
      code: "billing_not_configured",
      error: BILLING_COPY.notConfigured,
      missing: missingDodoSubscribeEnv(),
    },
    { status: 503 }
  );
}

export function asMetaString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return "";
}

export function userIdFromMetadata(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  return asMetaString((value as { user_id?: unknown }).user_id);
}

export function purposeFromMetadata(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  return asMetaString((value as { purpose?: unknown }).purpose);
}

export function productIdsFromPayment(value: { product_cart?: Array<{ product_id?: string }> | null }): string[] {
  const cart = value.product_cart;
  if (!Array.isArray(cart)) return [];
  return cart
    .map(function (item) {
      return typeof item?.product_id === "string" ? item.product_id.trim() : "";
    })
    .filter(Boolean);
}

export function dodoWebhookHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const name of ["webhook-id", "webhook-signature", "webhook-timestamp"]) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }
  return headers;
}

export function isPaidIntentStatus(status: string | null | undefined) {
  return status === "succeeded";
}

export function mapDodoSubscriptionStatus(status: string | null | undefined) {
  if (status === "active") return "active";
  if (status === "pending") return "pending";
  if (status === "on_hold") return "on_hold";
  if (status === "failed") return "failed";
  if (status === "cancelled") return "canceled";
  if (status === "expired") return "expired";
  return status || "none";
}
