import type { SupabaseClient } from "@supabase/supabase-js";
import { MESSAGES_TABLE } from "./billing";
import {
  asInboxMessage,
  conversationPeerId,
  groupConversationThreads,
  groupReceivedThreads,
  inboxDisplayName,
  type InboxMessage,
  type InboxThread,
} from "./inbox";
import { emptyBlockedSet, loadBlockedSet, pairIsBlocked, resolveUserProfileId } from "./safety-server";
import { tableExists } from "./server-supabase";

export { groupConversationThreads, groupReceivedThreads };
export type { InboxMessage, InboxThread };

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}

async function loadNames(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Record<string, { name: string; profileId: string | null }>> {
  const out: Record<string, { name: string; profileId: string | null }> = {};
  const ids = uniqueIds(userIds);
  if (!ids.length) return out;

  const named = await supabase.from("profiles").select("id, user_id, full_name").in("user_id", ids);
  const rows = Array.isArray(named.data)
    ? named.data
    : ((await supabase.from("profiles").select("id, user_id").in("user_id", ids)).data || []);
  if (!Array.isArray(rows)) return out;

  rows.forEach(function (row: { id?: unknown; user_id?: unknown; full_name?: unknown }) {
    const userId = typeof row.user_id === "string" ? row.user_id : "";
    const profileId = typeof row.id === "string" ? row.id : "";
    if (!userId) return;
    out[userId] = {
      name: inboxDisplayName(row.full_name),
      profileId: profileId || null,
    };
  });
  return out;
}

export async function messagesTableReady(supabase: SupabaseClient) {
  return tableExists(supabase, MESSAGES_TABLE);
}

export async function loadInboxThreads(
  supabase: SupabaseClient,
  viewerId: string
): Promise<InboxThread[]> {
  if (!(await messagesTableReady(supabase))) return [];

  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .select("id, sender_id, recipient_id, body, created_at")
    .eq("recipient_id", viewerId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !Array.isArray(data)) return [];

  const messages = data
    .map(function (row) {
      return asInboxMessage(row as unknown as Record<string, unknown>);
    })
    .filter(function (row): row is InboxMessage {
      return !!row;
    });

  const senderIds = uniqueIds(
    messages.map(function (row) {
      return row.sender_id;
    })
  );
  const [names, blocked] = await Promise.all([
    loadNames(supabase, senderIds),
    loadBlockedSet(supabase, viewerId),
  ]);

  return groupReceivedThreads(messages, viewerId, blocked, names);
}

export async function loadConversationThreads(
  supabase: SupabaseClient,
  viewerId: string
): Promise<InboxThread[]> {
  if (!(await messagesTableReady(supabase))) return [];

  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .select("id, sender_id, recipient_id, body, created_at")
    .or("sender_id.eq." + viewerId + ",recipient_id.eq." + viewerId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !Array.isArray(data)) return [];

  const messages = data
    .map(function (row) {
      return asInboxMessage(row as unknown as Record<string, unknown>);
    })
    .filter(function (row): row is InboxMessage {
      return !!row;
    });

  const peerIds = uniqueIds(
    messages.map(function (row) {
      return conversationPeerId(row, viewerId);
    })
  );
  const [names, blocked] = await Promise.all([
    loadNames(supabase, peerIds),
    loadBlockedSet(supabase, viewerId),
  ]);

  return groupConversationThreads(messages, viewerId, blocked, names);
}

export async function loadConversation(
  supabase: SupabaseClient,
  viewerId: string,
  peerId: string
): Promise<{ messages: InboxMessage[]; blocked: boolean }> {
  if (!peerId || peerId === viewerId) return { messages: [], blocked: false };

  const profileId = await resolveUserProfileId(supabase, peerId);
  const blocked = await loadBlockedSet(supabase, viewerId);
  if (pairIsBlocked(blocked, profileId, peerId)) {
    return { messages: [], blocked: true };
  }

  if (!(await messagesTableReady(supabase))) return { messages: [], blocked: false };

  const { data, error } = await supabase
    .from(MESSAGES_TABLE)
    .select("id, sender_id, recipient_id, body, created_at")
    .or(
      "and(sender_id.eq." +
        viewerId +
        ",recipient_id.eq." +
        peerId +
        "),and(sender_id.eq." +
        peerId +
        ",recipient_id.eq." +
        viewerId +
        ")"
    )
    .order("created_at", { ascending: true })
    .limit(200);
  if (error || !Array.isArray(data)) return { messages: [], blocked: false };

  return {
    blocked: false,
    messages: data
      .map(function (row) {
        return asInboxMessage(row as unknown as Record<string, unknown>);
      })
      .filter(function (row): row is InboxMessage {
        return !!row;
      }),
  };
}

export async function messagingPairBlocked(
  supabase: SupabaseClient,
  viewerId: string,
  peerId: string
) {
  if (!peerId || peerId === viewerId) return false;
  const profileId = await resolveUserProfileId(supabase, peerId);
  const blocked = (await loadBlockedSet(supabase, viewerId)) || emptyBlockedSet();
  return pairIsBlocked(blocked, profileId, peerId);
}
