/**
 * Inbox list (GET) and send (POST). Sending needs an active subscription.
 * Browse / search / Speed Match / profile create stay on their own routes.
 */
import { NextResponse } from "next/server";
import {
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  tableExists,
  unauthorizedResponse,
} from "../../../lib/server-supabase";
import {
  BILLING_COPY,
  MESSAGES_TABLE,
  SUBSCRIPTIONS_SQL_FILE,
  SUBSCRIPTIONS_TABLE,
  isEntitledStatus,
} from "../../../lib/billing";
import { getSubscriptionRow } from "../../../lib/entitlement";
import { INBOX_BLOCKED_SEND, INBOX_MISSING, INBOX_SIGN_IN } from "../../../lib/inbox";
import { loadConversation, loadInboxThreads, messagingPairBlocked } from "../../../lib/inbox-server";
import { billingNotConfiguredResponse, isStripeConfigured } from "../../../lib/stripe";

export const runtime = "nodejs";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse(INBOX_SIGN_IN);
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || INBOX_SIGN_IN);

    if (!(await tableExists(supabase, MESSAGES_TABLE))) {
      return NextResponse.json({ error: INBOX_MISSING, code: "messages_missing", threads: [] }, { status: 503 });
    }

    const url = new URL(request.url);
    const peerId = asString(url.searchParams.get("peer") || url.searchParams.get("to"));
    if (peerId) {
      const conversation = await loadConversation(supabase, user.id, peerId);
      return NextResponse.json({
        messages: conversation.messages,
        blocked: conversation.blocked,
      });
    }

    const threads = await loadInboxThreads(supabase, user.id);
    return NextResponse.json({ threads });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load Inbox.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) return billingNotConfiguredResponse();

    if (!hasBearerToken(request)) {
      return unauthorizedResponse(BILLING_COPY.signIn);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Send a JSON message." }, { status: 400 });
    }

    const recipientId = asString(body.recipient_id);
    const text = asString(body.body);
    if (!recipientId || !text) {
      return NextResponse.json({ error: "Enter a recipient and a message." }, { status: 400 });
    }
    if (text.length > 4000) {
      return NextResponse.json({ error: "That message is too long." }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || BILLING_COPY.signIn);

    if (recipientId === user.id) {
      return NextResponse.json({ error: "Pick someone else to message." }, { status: 400 });
    }

    if (!(await tableExists(supabase, SUBSCRIPTIONS_TABLE))) {
      return NextResponse.json(
        { error: BILLING_COPY.tableMissing, code: "table_missing", sql: SUBSCRIPTIONS_SQL_FILE },
        { status: 503 }
      );
    }

    const row = await getSubscriptionRow(supabase, user.id);
    if (!isEntitledStatus(row?.status)) {
      return NextResponse.json(
        {
          error: BILLING_COPY.headline,
          code: "subscription_required",
          configured: true,
          canMessage: false,
        },
        { status: 402 }
      );
    }

    if (!(await tableExists(supabase, MESSAGES_TABLE))) {
      return NextResponse.json(
        { error: "Messages storage is not available yet.", code: "messages_missing" },
        { status: 503 }
      );
    }

    if (await messagingPairBlocked(supabase, user.id, recipientId)) {
      return NextResponse.json(
        { error: INBOX_BLOCKED_SEND, code: "blocked", canMessage: false },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from(MESSAGES_TABLE)
      .insert([{ sender_id: user.id, recipient_id: recipientId, body: text }])
      .select("*")
      .maybeSingle();

    if (error) {
      const message = error.message || "Send failed.";
      if (message.includes("messaging_requires_subscription")) {
        return NextResponse.json(
          { error: BILLING_COPY.headline, code: "subscription_required", canMessage: false },
          { status: 402 }
        );
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ message: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
