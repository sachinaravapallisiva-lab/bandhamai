/**
 * Inbox is received member mail. The home Chat Priya thread is a layout
 * preview and is not a real conversation.
 */

type BlockLookup = {
  profileIds: Set<string>;
  userIds: Set<string>;
};

function threadIsBlocked(blocked: BlockLookup, profileId: string | null, userId: string) {
  if (profileId && blocked.profileIds.has(profileId)) return true;
  if (userId && blocked.userIds.has(userId)) return true;
  return false;
}

export const INBOX_PATH = "/inbox";
export const INBOX_CHAT_PATH = "/chat";
export const INBOX_TITLE = "Inbox";
export const INBOX_KICKER = "INBOX";
export const INBOX_SIGN_IN = "Sign in to open Inbox.";
export const INBOX_EMPTY_TITLE = "No messages yet.";
export const INBOX_EMPTY_BODY = "When someone writes to you, it will show here.";
export const INBOX_FALLBACK_NAME = "Member";
export const INBOX_OPEN_LABEL = "Open";
export const INBOX_MISSING = "Inbox is not available yet.";
export const INBOX_PREVIEW_NOTE = "This tab is a layout preview, not received mail.";
export const INBOX_PREVIEW_OPEN = "Open Inbox for real messages.";
export const INBOX_BLOCKED_SEND = "You cannot message this person.";

export const CHATS_TITLE = "Chats";
export const CHATS_SIGN_IN = "Sign in to see your chats.";
export const CHATS_EMPTY_TITLE = "No chats yet.";
export const CHATS_EMPTY_BODY = "When someone writes to you, it will show here.";
export const CHATS_OPEN_INBOX = "Open Inbox";
export const CHATS_BROWSE = "Browse";
export const CHATS_SCOPE = "conversations";
/** Short drawer height. Extra threads scroll inside the card. */
export const CHATS_RAIL_MAX_HEIGHT = 228;

export type InboxMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
};

export type InboxThread = {
  userId: string;
  profileId: string | null;
  name: string;
  lastBody: string;
  lastAt: string;
};

export function inboxChatHref(userId: string) {
  return INBOX_CHAT_PATH + "?to=" + encodeURIComponent(userId);
}

export function conversationPeerId(row: InboxMessage, viewerId: string) {
  if (!viewerId) return "";
  if (row.sender_id === viewerId) return row.recipient_id;
  if (row.recipient_id === viewerId) return row.sender_id;
  return "";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Short rail timestamp. Avoids hyphens and dating chrome. */
export function inboxTimeLabel(iso: string, now = Date.now()) {
  if (!iso) return "";
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const diff = now - then;
  if (diff < 45 * 1000) return "Now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return String(mins) + "m";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return String(hours) + "h";
  const days = Math.floor(hours / 24);
  if (days < 7) return String(days) + "d";
  const date = new Date(then);
  const month = MONTHS[date.getUTCMonth()] || "";
  const day = date.getUTCDate();
  if (!month || !day) return "";
  return month + " " + day;
}

export function inboxDisplayName(fullName: unknown) {
  if (typeof fullName !== "string") return INBOX_FALLBACK_NAME;
  const token = fullName.trim().split(/\s+/)[0] || "";
  return token || INBOX_FALLBACK_NAME;
}

export function asInboxMessage(row: Record<string, unknown>): InboxMessage | null {
  const id = typeof row.id === "string" ? row.id : "";
  const senderId = typeof row.sender_id === "string" ? row.sender_id : "";
  const recipientId = typeof row.recipient_id === "string" ? row.recipient_id : "";
  const body = typeof row.body === "string" ? row.body : "";
  if (!senderId || !recipientId) return null;
  return {
    id: id || senderId + ":" + recipientId + ":" + body,
    sender_id: senderId,
    recipient_id: recipientId,
    body: body,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
  };
}

/** Latest received message per sender. Blocked people are omitted. */
export function groupReceivedThreads(
  messages: InboxMessage[],
  viewerId: string,
  blocked: BlockLookup,
  names: Record<string, { name: string; profileId: string | null }>
): InboxThread[] {
  const latest = new Map<string, InboxMessage>();

  messages.forEach(function (row) {
    if (!viewerId || row.recipient_id !== viewerId) return;
    if (row.sender_id === viewerId) return;
    const profileId = names[row.sender_id]?.profileId || null;
    if (threadIsBlocked(blocked, profileId, row.sender_id)) return;
    const prev = latest.get(row.sender_id);
    if (!prev) {
      latest.set(row.sender_id, row);
      return;
    }
    if (row.created_at && prev.created_at && row.created_at > prev.created_at) {
      latest.set(row.sender_id, row);
    }
  });

  return Array.from(latest.entries())
    .map(function (entry) {
      const userId = entry[0];
      const row = entry[1];
      return {
        userId: userId,
        profileId: names[userId]?.profileId || null,
        name: names[userId]?.name || INBOX_FALLBACK_NAME,
        lastBody: row.body,
        lastAt: row.created_at,
      };
    })
    .sort(function (a, b) {
      if (a.lastAt && b.lastAt && a.lastAt !== b.lastAt) {
        return a.lastAt < b.lastAt ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });
}

/** Latest message per peer, sent or received. Blocked people are omitted. */
export function groupConversationThreads(
  messages: InboxMessage[],
  viewerId: string,
  blocked: BlockLookup,
  names: Record<string, { name: string; profileId: string | null }>
): InboxThread[] {
  const latest = new Map<string, InboxMessage>();

  messages.forEach(function (row) {
    const peerId = conversationPeerId(row, viewerId);
    if (!peerId) return;
    const profileId = names[peerId]?.profileId || null;
    if (threadIsBlocked(blocked, profileId, peerId)) return;
    const prev = latest.get(peerId);
    if (!prev) {
      latest.set(peerId, row);
      return;
    }
    if (row.created_at && prev.created_at && row.created_at > prev.created_at) {
      latest.set(peerId, row);
    }
  });

  return Array.from(latest.entries())
    .map(function (entry) {
      const userId = entry[0];
      const row = entry[1];
      return {
        userId: userId,
        profileId: names[userId]?.profileId || null,
        name: names[userId]?.name || INBOX_FALLBACK_NAME,
        lastBody: row.body,
        lastAt: row.created_at,
      };
    })
    .sort(function (a, b) {
      if (a.lastAt && b.lastAt && a.lastAt !== b.lastAt) {
        return a.lastAt < b.lastAt ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });
}
