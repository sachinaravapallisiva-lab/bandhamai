import type { SupabaseClient } from "@supabase/supabase-js";
import {
  VERIFYAI_EXTERNAL_ID_COLUMN,
  VERIFYAI_PAYMENTS_TABLE,
  VERIFYAI_PRICE_CENTS,
  VERIFYAI_PURPOSE,
  VERIFYAI_SESSIONS_TABLE,
  VERIFYAI_SQL_FILE,
  VERIFYAI_STATUS_COLUMN,
  VERIFYAI_UPDATED_AT_COLUMN,
  VERIFYAI_COPY,
  isVerifyaiVerified,
  type VerifyaiStatus,
} from "./verifyai";
import { tableExists, tableHasColumn } from "./server-supabase";
import { asId, resolveUserProfileId } from "./safety-server";
import { stripeSecretKey, stripeVerifyaiPriceId } from "./stripe";
import { hasProfilePhotoUrl } from "./profile-photos";

export type VerifyaiPaymentState = {
  paid: boolean;
  verified: boolean;
  status: string | null;
  profileId: string | null;
  hasPhoto: boolean;
  startUrl: string | null;
  startConfigured: boolean;
  checkoutConfigured: boolean;
};

export function verifyaiPhotoRequiredBody() {
  return {
    error: VERIFYAI_COPY.photoRequired,
    code: "photo_required",
    verified: false,
    hasPhoto: false,
  };
}

export function verifyaiStartConfigured() {
  return !!(verifyaiHostedStartUrl() || (verifyaiApiUrl() && verifyaiApiKey()));
}

export function verifyaiHostedStartUrl() {
  return (process.env.VERIFYAI_START_URL || "").trim();
}

export function verifyaiApiUrl() {
  return (process.env.VERIFYAI_API_URL || "").trim();
}

export function verifyaiApiKey() {
  return (process.env.VERIFYAI_API_KEY || "").trim();
}

export async function profileHasRequiredPhoto(
  supabase: SupabaseClient,
  profileId?: string | null
) {
  if (!profileId) return false;
  if (!(await tableHasColumn(supabase, "profiles", "photo_url"))) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select("photo_url")
    .eq("id", profileId)
    .limit(1)
    .maybeSingle();
  if (error || !data) return false;
  return hasProfilePhotoUrl((data as { photo_url?: unknown }).photo_url);
}

export async function hasPaidVerifyai(
  supabase: SupabaseClient,
  userId: string,
  profileId?: string | null
) {
  if (!(await tableExists(supabase, VERIFYAI_PAYMENTS_TABLE))) return false;
  void profileId;
  const { data } = await supabase
    .from(VERIFYAI_PAYMENTS_TABLE)
    .select("id")
    .eq("user_id", userId)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();
  return !!data;
}

export async function recordVerifyaiPayment(
  supabase: SupabaseClient,
  input: {
    userId: string;
    profileId?: string | null;
    checkoutSessionId: string;
    paymentIntentId?: string | null;
    amountCents?: number;
  }
) {
  if (!(await tableExists(supabase, VERIFYAI_PAYMENTS_TABLE))) {
    return { error: "Run " + VERIFYAI_SQL_FILE + " to store VerifyAI payments.", sql: VERIFYAI_SQL_FILE };
  }

  const profileId = input.profileId || (await resolveUserProfileId(supabase, input.userId));
  const now = new Date().toISOString();

  const { error } = await supabase.from(VERIFYAI_PAYMENTS_TABLE).upsert(
    {
      user_id: input.userId,
      profile_id: profileId,
      stripe_checkout_session_id: input.checkoutSessionId,
      stripe_payment_intent_id: input.paymentIntentId || null,
      amount_cents: input.amountCents || VERIFYAI_PRICE_CENTS,
      status: "paid",
      paid_at: now,
    },
    { onConflict: "stripe_checkout_session_id" }
  );
  if (error) return { error: error.message };

  if (profileId && (await tableHasColumn(supabase, "profiles", VERIFYAI_STATUS_COLUMN))) {
    const current = await supabase
      .from("profiles")
      .select(VERIFYAI_STATUS_COLUMN)
      .eq("id", profileId)
      .maybeSingle();
    const currentRow = current.data as unknown as Record<string, unknown> | null;
    const status = currentRow ? asId(currentRow[VERIFYAI_STATUS_COLUMN]) : "";
    if (!isVerifyaiVerified(status)) {
      const patch: Record<string, string> = { [VERIFYAI_STATUS_COLUMN]: "pending" };
      if (await tableHasColumn(supabase, "profiles", VERIFYAI_UPDATED_AT_COLUMN)) {
        patch[VERIFYAI_UPDATED_AT_COLUMN] = now;
      }
      await supabase.from("profiles").update(patch).eq("id", profileId);
    }
  }

  if (await tableExists(supabase, VERIFYAI_SESSIONS_TABLE)) {
    const existing = await supabase
      .from(VERIFYAI_SESSIONS_TABLE)
      .select("id")
      .eq("stripe_checkout_session_id", input.checkoutSessionId)
      .limit(1)
      .maybeSingle();
    if (!existing.data) {
      await supabase.from(VERIFYAI_SESSIONS_TABLE).insert([
        {
          user_id: input.userId,
          profile_id: profileId,
          stripe_checkout_session_id: input.checkoutSessionId,
          status: "awaiting_verifyai",
        },
      ]);
    }
  }

  return { error: null as string | null, profileId };
}

export async function rememberVerifyaiExternalId(
  supabase: SupabaseClient,
  input: { userId: string; profileId?: string | null; externalId: string }
) {
  if (!input.externalId) return;
  if (input.profileId && (await tableHasColumn(supabase, "profiles", VERIFYAI_EXTERNAL_ID_COLUMN))) {
    await supabase
      .from("profiles")
      .update({ [VERIFYAI_EXTERNAL_ID_COLUMN]: input.externalId })
      .eq("id", input.profileId);
  }
  if (await tableExists(supabase, VERIFYAI_SESSIONS_TABLE)) {
    let q = supabase
      .from(VERIFYAI_SESSIONS_TABLE)
      .update({ verifyai_external_id: input.externalId })
      .eq("user_id", input.userId)
      .in("status", ["awaiting_verifyai", "pending"]);
    if (input.profileId) q = q.eq("profile_id", input.profileId);
    await q;
  }
}

export async function markVerifyaiSessionResult(
  supabase: SupabaseClient,
  input: {
    userId?: string | null;
    profileId: string;
    status: VerifyaiStatus;
    externalId?: string | null;
  }
) {
  if (isVerifyaiVerified(input.status) && !(await profileHasRequiredPhoto(supabase, input.profileId))) {
    return { error: VERIFYAI_COPY.photoRequired };
  }

  const now = new Date().toISOString();
  const patch: Record<string, string | null> = {
    [VERIFYAI_STATUS_COLUMN]: input.status,
  };
  if (await tableHasColumn(supabase, "profiles", VERIFYAI_UPDATED_AT_COLUMN)) {
    patch[VERIFYAI_UPDATED_AT_COLUMN] = now;
  }
  if (input.externalId && (await tableHasColumn(supabase, "profiles", VERIFYAI_EXTERNAL_ID_COLUMN))) {
    patch[VERIFYAI_EXTERNAL_ID_COLUMN] = input.externalId;
  }
  const { error } = await supabase.from("profiles").update(patch).eq("id", input.profileId);
  if (error) return { error: error.message };

  if (await tableExists(supabase, VERIFYAI_SESSIONS_TABLE)) {
    let q = supabase
      .from(VERIFYAI_SESSIONS_TABLE)
      .update({
        status: input.status,
        verifyai_external_id: input.externalId || null,
        completed_at: now,
      })
      .eq("profile_id", input.profileId)
      .in("status", ["awaiting_verifyai", "pending"]);
    if (input.userId) q = q.eq("user_id", input.userId);
    await q;
  }
  return { error: null as string | null };
}

export async function buildVerifyaiStartUrl(input: {
  origin: string;
  userId: string;
  email?: string | null;
  profileId?: string | null;
  checkoutSessionId?: string | null;
}): Promise<{ url: string | null; externalId: string | null }> {
  const returnUrl = input.origin + "/account?verify=done";
  const webhookUrl = input.origin + "/api/verifyai/webhook";
  const apiUrl = verifyaiApiUrl();
  const apiKey = verifyaiApiKey();

  if (apiUrl && apiKey) {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purpose: VERIFYAI_PURPOSE,
          user_id: input.userId,
          email: input.email || undefined,
          profile_id: input.profileId || undefined,
          checkout_session_id: input.checkoutSessionId || undefined,
          return_url: returnUrl,
          webhook_url: webhookUrl,
        }),
      });
      const data = (await res.json().catch(function () {
        return {};
      })) as { url?: unknown; start_url?: unknown; id?: unknown; verification_id?: unknown };
      const url = asId(data.url) || asId(data.start_url) || null;
      const externalId = asId(data.verification_id) || asId(data.id) || null;
      if (url) return { url, externalId };
    } catch {
      // fall through to hosted URL
    }
  }

  const hosted = verifyaiHostedStartUrl();
  if (!hosted) return { url: null, externalId: null };

  try {
    const url = new URL(hosted);
    url.searchParams.set("bandham_user_id", input.userId);
    if (input.email) url.searchParams.set("email", input.email);
    if (input.profileId) url.searchParams.set("profile_id", input.profileId);
    if (input.checkoutSessionId) url.searchParams.set("checkout_session_id", input.checkoutSessionId);
    url.searchParams.set("return_url", returnUrl);
    url.searchParams.set("webhook_url", webhookUrl);
    return { url: url.toString(), externalId: null };
  } catch {
    return { url: hosted, externalId: null };
  }
}

export async function loadVerifyaiState(
  supabase: SupabaseClient,
  userId: string
): Promise<VerifyaiPaymentState> {
  const profileId = await resolveUserProfileId(supabase, userId);
  let status: string | null = null;
  let hasPhoto = false;
  if (profileId) {
    const cols: string[] = [];
    if (await tableHasColumn(supabase, "profiles", VERIFYAI_STATUS_COLUMN)) {
      cols.push(VERIFYAI_STATUS_COLUMN);
    }
    if (await tableHasColumn(supabase, "profiles", "photo_url")) {
      cols.push("photo_url");
    }
    if (cols.length) {
      const row = await supabase.from("profiles").select(cols.join(", ")).eq("id", profileId).maybeSingle();
      const data = row.data as Record<string, unknown> | null;
      if (data) {
        status = asId(data[VERIFYAI_STATUS_COLUMN]) || null;
        hasPhoto = hasProfilePhotoUrl(data.photo_url);
      }
    }
  }
  const paid = await hasPaidVerifyai(supabase, userId, profileId);
  return {
    paid,
    verified: isVerifyaiVerified(status),
    status,
    profileId,
    hasPhoto,
    startUrl: null,
    startConfigured: verifyaiStartConfigured(),
    checkoutConfigured: !!(stripeSecretKey() && stripeVerifyaiPriceId()),
  };
}
