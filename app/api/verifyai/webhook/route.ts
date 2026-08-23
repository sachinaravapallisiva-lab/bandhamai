/**
 * VerifyAI → Bandham webhook.
 *
 * verifyai.llc does not publish a public API in this repo. This handler accepts
 * a signed POST and writes profiles.verifyai_status. Badge stays hidden unless
 * the stored status is exactly `verified`.
 *
 * Auth (first match):
 *   1. Authorization: Bearer VERIFYAI_WEBHOOK_SECRET
 *   2. X-VerifyAI-Signature = hex HMAC-SHA256(raw body, VERIFYAI_WEBHOOK_SECRET)
 *      with optional X-VerifyAI-Timestamp (unix seconds, 5 minute skew)
 */
import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getServiceSupabase, missingConfigResponse, tableHasColumn } from "../../../../lib/server-supabase";
import {
  VERIFYAI_SQL_FILE,
  VERIFYAI_STATUS_COLUMN,
  isVerifyaiVerified,
  normalizeVerifyaiStatus,
} from "../../../../lib/verifyai";
import { asId, resolveProfileUserId } from "../../../../lib/safety-server";
import {
  hasPaidVerifyai,
  markVerifyaiSessionResult,
  profileHasRequiredPhoto,
  verifyaiPhotoRequiredBody,
} from "../../../../lib/verifyai-checkout";

export const runtime = "nodejs";

const MAX_SKEW_MS = 5 * 60 * 1000;

function webhookSecret() {
  return (process.env.VERIFYAI_WEBHOOK_SECRET || "").trim();
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function authorized(request: Request, raw: string) {
  const secret = webhookSecret();
  if (!secret) return false;

  const header = request.headers.get("authorization") || "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (bearer && safeEqual(bearer, secret)) return true;

  const signature = (request.headers.get("x-verifyai-signature") || "").trim().toLowerCase();
  const timestamp = (request.headers.get("x-verifyai-timestamp") || "").trim();
  if (!signature) return false;

  if (timestamp) {
    const ts = Number(timestamp) * (timestamp.length > 12 ? 1 : 1000);
    if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > MAX_SKEW_MS) return false;
  }

  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  return safeEqual(expected, signature);
}

export async function POST(request: Request) {
  try {
    if (!webhookSecret()) {
      return NextResponse.json(
        {
          error: "VERIFYAI_WEBHOOK_SECRET is not set. Live VerifyAI deliveries cannot be accepted yet.",
          sql: VERIFYAI_SQL_FILE,
        },
        { status: 503 }
      );
    }

    const raw = await request.text();
    if (!authorized(request, raw)) {
      return NextResponse.json({ error: "Invalid VerifyAI signature." }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw || "{}") as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Send a JSON event." }, { status: 400 });
    }

    const data =
      body.data && typeof body.data === "object" && !Array.isArray(body.data)
        ? (body.data as Record<string, unknown>)
        : body;

    const status = normalizeVerifyaiStatus(
      data.status ?? data.verifyai_status ?? data.verdict ?? body.type
    );
    if (!status) {
      return NextResponse.json({ error: "Event is missing a verification status we can store." }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();
    if (!(await tableHasColumn(supabase, "profiles", VERIFYAI_STATUS_COLUMN))) {
      return NextResponse.json(
        { error: "VerifyAI columns are missing. Run " + VERIFYAI_SQL_FILE + ".", sql: VERIFYAI_SQL_FILE },
        { status: 503 }
      );
    }

    const profileId = asId(data.profile_id) || asId(data.bandham_profile_id);
    const userId = asId(data.user_id) || asId(data.bandham_user_id);
    const email = asId(data.email).toLowerCase();
    const externalId =
      asId(data.external_id) || asId(data.verification_id) || asId(data.id) || asId(body.id) || null;

    let targetId = profileId;
    if (!targetId && userId) {
      const found = await supabase.from("profiles").select("id").eq("user_id", userId).limit(1).maybeSingle();
      targetId = asId((found.data as { id?: unknown } | null)?.id);
    }
    if (!targetId && email) {
      const users = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      const match = users.data.users.find(function (row) {
        return (row.email || "").toLowerCase() === email;
      });
      if (match) {
        const found = await supabase.from("profiles").select("id").eq("user_id", match.id).limit(1).maybeSingle();
        targetId = asId((found.data as { id?: unknown } | null)?.id);
      }
    }

    if (!targetId) {
      return NextResponse.json({ error: "No Bandham profile matched this verification event." }, { status: 404 });
    }

    const ownerId = userId || (await resolveProfileUserId(supabase, targetId)) || "";
    if (isVerifyaiVerified(status)) {
      if (!ownerId || !(await hasPaidVerifyai(supabase, ownerId, targetId))) {
        return NextResponse.json(
          {
            error: "A paid $4.99 VerifyAI checkout is required before a verified badge. Payment alone is not enough; this event also needs a matching paid row.",
            verified: false,
          },
          { status: 409 }
        );
      }
      if (!(await profileHasRequiredPhoto(supabase, targetId))) {
        return NextResponse.json(verifyaiPhotoRequiredBody(), { status: 409 });
      }
    }

    const marked = await markVerifyaiSessionResult(supabase, {
      userId: ownerId || null,
      profileId: targetId,
      status,
      externalId,
    });
    if (marked.error) {
      return NextResponse.json({ error: marked.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      profile_id: targetId,
      status,
      verified: isVerifyaiVerified(status),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
