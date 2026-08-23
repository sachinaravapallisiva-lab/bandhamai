import { authJsonHeaders } from "./client-auth";
import { emptyEntitlement, type Entitlement } from "./billing";

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
