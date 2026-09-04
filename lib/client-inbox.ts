import { authJsonHeaders } from "./client-auth";
import { CHATS_SCOPE, INBOX_MISSING, INBOX_SIGN_IN, type InboxMessage, type InboxThread } from "./inbox";

async function readJson(res: Response) {
  return res.json().catch(function () {
    return {};
  });
}

export async function fetchInboxThreads(options?: { conversations?: boolean }): Promise<{
  threads: InboxThread[];
  error: string;
  code: string;
}> {
  const headers = await authJsonHeaders();
  if (!headers) {
    return { threads: [], error: INBOX_SIGN_IN, code: "signed_out" };
  }

  try {
    const path = options && options.conversations ? "/api/messages?scope=" + CHATS_SCOPE : "/api/messages";
    const res = await fetch(path, { headers });
    const data = await readJson(res);
    if (!res.ok) {
      return {
        threads: [],
        error: data.error || INBOX_MISSING,
        code: data.code || "",
      };
    }
    return {
      threads: Array.isArray(data.threads) ? data.threads : [],
      error: "",
      code: "",
    };
  } catch {
    return { threads: [], error: INBOX_MISSING, code: "network" };
  }
}

export async function fetchConversation(peerId: string): Promise<{
  messages: InboxMessage[];
  blocked: boolean;
  error: string;
  code: string;
}> {
  const headers = await authJsonHeaders();
  if (!headers) {
    return { messages: [], blocked: false, error: INBOX_SIGN_IN, code: "signed_out" };
  }

  try {
    const res = await fetch("/api/messages?peer=" + encodeURIComponent(peerId), { headers });
    const data = await readJson(res);
    if (!res.ok) {
      return {
        messages: [],
        blocked: !!data.blocked,
        error: data.error || "Could not load this conversation.",
        code: data.code || "",
      };
    }
    return {
      messages: Array.isArray(data.messages) ? data.messages : [],
      blocked: !!data.blocked,
      error: "",
      code: "",
    };
  } catch {
    return { messages: [], blocked: false, error: "Could not load this conversation.", code: "network" };
  }
}
