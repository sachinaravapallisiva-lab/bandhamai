import { emptyEntitlement, type Entitlement } from "./billing";
import { authJsonHeaders } from "./client-auth";
import { VERIFYAI_COPY, VERIFYAI_DEFAULT_RETURN_PATH } from "./verifyai";

export type { Entitlement };

async function readJson(res: Response) {
  return res.json().catch(function () {
    return {};
  });
}

export async function fetchEntitlement(): Promise<Entitlement> {
  const headers = await authJsonHeaders();

  try {
    const res = await fetch("/api/stripe/entitlement", headers ? { headers } : undefined);
    const data = await readJson(res);
    return emptyEntitlement({
      configured: data.configured !== false,
      canMessage: !!data.canMessage,
      status: data.status || null,
      stripeCustomerId: data.stripeCustomerId || null,
      currentPeriodEnd: data.currentPeriodEnd || null,
      code: data.code,
      error: data.error,
      sql: data.sql,
    });
  } catch {
    return emptyEntitlement({
      configured: true,
      error: "Could not check messaging access. Try again.",
    });
  }
}

export async function startEventTicketCheckout() {
  const headers = await authJsonHeaders();
  if (!headers) {
    return { url: "", error: "Sign in to get a ticket.", code: "signed_out", alreadyPaid: false };
  }

  try {
    const res = await fetch("/api/meetup/checkout", { method: "POST", headers });
    const data = await readJson(res);
    if (data.alreadyPaid) {
      return { url: "", error: "", code: "already_paid", alreadyPaid: true };
    }
    if (!res.ok || !data.url) {
      return {
        url: "",
        error: data.error || "Could not start event ticket checkout.",
        code: data.code || "",
        alreadyPaid: false,
      };
    }
    return { url: String(data.url), error: "", code: "", alreadyPaid: false };
  } catch {
    return { url: "", error: "Could not start event ticket checkout.", code: "network", alreadyPaid: false };
  }
}

export async function confirmEventTicket(sessionId: string) {
  const headers = await authJsonHeaders();
  if (!headers || !sessionId) {
    return { ok: false, rsvped: false, ticketPaid: false, error: "Sign in to confirm the ticket." };
  }

  try {
    const res = await fetch("/api/meetup/confirm", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await readJson(res);
    if (!res.ok) {
      return {
        ok: false,
        rsvped: false,
        ticketPaid: false,
        error: data.error || "Could not confirm the event ticket.",
      };
    }
    return {
      ok: true,
      rsvped: !!data.rsvped,
      ticketPaid: !!data.ticketPaid,
      error: "",
    };
  } catch {
    return {
      ok: false,
      rsvped: false,
      ticketPaid: false,
      error: "Payment may have succeeded. Wait a moment, then refresh.",
    };
  }
}

export async function startVerifyaiCheckout() {
  const headers = await authJsonHeaders();
  if (!headers) {
    return { url: "", error: "Sign in to pay for VerifyAI.", code: "signed_out" };
  }

  try {
    const res = await fetch("/api/verifyai/checkout", {
      method: "POST",
      headers,
      body: JSON.stringify({
        next: VERIFYAI_DEFAULT_RETURN_PATH,
        return_path: VERIFYAI_DEFAULT_RETURN_PATH,
      }),
    });
    const data = await readJson(res);
    if (!res.ok || !data.url) {
      return {
        url: "",
        error: data.error || VERIFYAI_COPY.notConfigured,
        code: data.code || "",
      };
    }
    return { url: String(data.url), error: "", code: "" };
  } catch {
    return { url: "", error: "Could not start VerifyAI checkout.", code: "network" };
  }
}

export async function startCheckout() {
  const headers = await authJsonHeaders();
  if (!headers) {
    return { url: "", error: "Sign in to subscribe.", code: "signed_out" };
  }

  try {
    const res = await fetch("/api/stripe/checkout", { method: "POST", headers });
    const data = await readJson(res);
    if (!res.ok || !data.url) {
      return {
        url: "",
        error: data.error || "Could not start checkout.",
        code: data.code || "",
      };
    }
    return { url: String(data.url), error: "", code: "" };
  } catch {
    return { url: "", error: "Could not start checkout.", code: "network" };
  }
}

export async function openBillingPortal() {
  const headers = await authJsonHeaders();
  if (!headers) {
    return { url: "", error: "Sign in to manage your subscription.", code: "signed_out" };
  }

  try {
    const res = await fetch("/api/stripe/portal", { method: "POST", headers });
    const data = await readJson(res);
    if (!res.ok || !data.url) {
      return {
        url: "",
        error: data.error || "Could not open the billing portal.",
        code: data.code || "",
      };
    }
    return { url: String(data.url), error: "", code: "" };
  } catch {
    return { url: "", error: "Could not open the billing portal.", code: "network" };
  }
}

export async function confirmCheckoutSession(sessionId: string) {
  const headers = await authJsonHeaders();
  if (!headers || !sessionId) return emptyEntitlement({ configured: true });

  try {
    const res = await fetch("/api/stripe/confirm", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ session_id: sessionId }),
    });
    const data = await readJson(res);
    return emptyEntitlement({
      configured: data.configured !== false,
      canMessage: !!data.canMessage,
      status: data.status || null,
      stripeCustomerId: data.stripeCustomerId || null,
      currentPeriodEnd: data.currentPeriodEnd || null,
      code: data.code,
      error: data.error,
      sql: data.sql,
    });
  } catch {
    return emptyEntitlement({
      configured: true,
      error: "Payment may have succeeded. Wait a moment, then refresh.",
    });
  }
}

export async function sendPaidMessage(recipientId: string, body: string) {
  const headers = await authJsonHeaders();
  if (!headers) {
    return { ok: false, error: "Sign in to send a message.", code: "signed_out", status: 401 };
  }

  try {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ recipient_id: recipientId, body: body }),
    });
    const data = await readJson(res);
    if (!res.ok) {
      return {
        ok: false,
        error: data.error || "Send failed.",
        code: data.code || "",
        status: res.status,
      };
    }
    return { ok: true, error: "", code: "", status: res.status, message: data.message };
  } catch {
    return { ok: false, error: "Could not send that message.", code: "network", status: 0 };
  }
}
