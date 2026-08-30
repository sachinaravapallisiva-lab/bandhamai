export const WELCOME_BRAND = "Bandham AI";
export const WELCOME_TAGLINE = "Find your vibe match?";
export const WELCOME_SUBJECT = "Welcome to Bandham AI";
export const WELCOME_CTA_LABEL = "Create your profile";
export const WELCOME_CTA_URL = "https://bandhamai.vercel.app/profile/new";
export const WELCOME_MARK_URL = "https://bandhamai.vercel.app/brand/bandham-jaimala.png";
export const WELCOME_LEAD = "Bandham AI is Indian matrimony for NRI and diaspora families.";
export const WELCOME_BODY = "You can create a profile and browse for free.";
export const WELCOME_FOOTER = "This is Bandham AI, Indian matrimony. Not LaughRank. Not VerifyAI.";

export const WELCOME_VIOLET = "#6D28D9";
export const WELCOME_CREAM = "#FDF8F1";
export const WELCOME_INK = "#1E1B36";
export const WELCOME_MUTED = "#7B6F8A";

const BLOCKED_FROM_HOST_BITS = ["laughrank", "verifyai", "resend.dev", "lol"] as const;

export type WelcomeSendCheck = { ok: true } | { ok: false; reason: string };

export type WelcomeEmailResult = {
  sent: boolean;
  error: string | null;
};

export type WelcomeEnv = {
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
};

function envValue(env: WelcomeEnv | NodeJS.ProcessEnv, key: "RESEND_API_KEY" | "RESEND_FROM_EMAIL") {
  const value = env[key];
  return typeof value === "string" ? value.trim() : "";
}

export function welcomeApiKey(env: WelcomeEnv | NodeJS.ProcessEnv = process.env) {
  return envValue(env, "RESEND_API_KEY");
}

/** Welcome never falls back to the Resend test sender. Empty means skip send. */
export function welcomeFromEmail(env: WelcomeEnv | NodeJS.ProcessEnv = process.env) {
  return envValue(env, "RESEND_FROM_EMAIL");
}

export function fromAddressHost(from: string) {
  const trimmed = from.trim();
  const angled = trimmed.match(/<([^>]+)>/);
  const address = (angled ? angled[1] : trimmed).replace(/^mailto:/i, "").trim();
  const at = address.lastIndexOf("@");
  if (at < 0) return "";
  return address.slice(at + 1).replace(/[>\s]/g, "").toLowerCase();
}

export function isBandhamWelcomeFromHost(host: string) {
  const value = host.toLowerCase();
  if (!value.includes("bandham")) return false;
  return BLOCKED_FROM_HOST_BITS.every(function (bit) {
    return !value.includes(bit);
  });
}

export function isSingleWelcomeRecipient(to: string) {
  const value = to.trim();
  if (!value) return false;
  if (/[,;]/.test(value)) return false;
  if (/\s/.test(value)) return false;
  const parts = value.split("@");
  if (parts.length !== 2) return false;
  return parts[0].length > 0 && parts[1].includes(".");
}

export function canSendWelcome(to: string, env: WelcomeEnv | NodeJS.ProcessEnv = process.env): WelcomeSendCheck {
  if (!welcomeApiKey(env)) {
    return { ok: false, reason: "RESEND_API_KEY is not set" };
  }
  const from = welcomeFromEmail(env);
  if (!from) {
    return { ok: false, reason: "RESEND_FROM_EMAIL is not set" };
  }
  const host = fromAddressHost(from);
  if (!isBandhamWelcomeFromHost(host)) {
    return { ok: false, reason: "from host is not a Bandham host" };
  }
  if (!isSingleWelcomeRecipient(to)) {
    return { ok: false, reason: "welcome needs exactly one member email" };
  }
  return { ok: true };
}

export function welcomeUserCopy() {
  return [
    WELCOME_BRAND,
    WELCOME_TAGLINE,
    WELCOME_SUBJECT,
    WELCOME_CTA_LABEL,
    WELCOME_LEAD,
    WELCOME_BODY,
    WELCOME_FOOTER,
  ];
}

export function welcomeEmailText() {
  return [
    WELCOME_SUBJECT,
    "",
    WELCOME_TAGLINE,
    "",
    WELCOME_LEAD,
    WELCOME_BODY,
    "",
    WELCOME_CTA_LABEL,
    WELCOME_CTA_URL,
    "",
    WELCOME_FOOTER,
  ].join("\n");
}

export function welcomeEmailHtml() {
  const serif = "font-family:Georgia,serif;";
  const button =
    '<a href="' +
    WELCOME_CTA_URL +
    '" style="display:inline-block;background:' +
    WELCOME_VIOLET +
    ";color:#FFFFFF;" +
    serif +
    'font-size:16px;font-weight:600;line-height:1;padding:14px 22px;border-radius:999px;text-decoration:none;">' +
    WELCOME_CTA_LABEL +
    "</a>";

  return [
    '<!DOCTYPE html><html><body style="margin:0;padding:0;background:' + WELCOME_CREAM + ';">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:' +
      WELCOME_CREAM +
      ';">',
    '<tr><td align="center" style="padding:32px 16px;">',
    '<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:' +
      WELCOME_CREAM +
      ';">',
    '<tr><td align="center" style="padding:0 0 16px;">',
    '<img src="' +
      WELCOME_MARK_URL +
      '" width="72" height="72" alt="" style="display:block;border:0;width:72px;height:72px;">',
    "</td></tr>",
    '<tr><td align="center" style="' +
      serif +
      "font-size:28px;line-height:1.2;color:" +
      WELCOME_INK +
      ';padding:0 0 6px;">' +
      WELCOME_BRAND +
      "</td></tr>",
    '<tr><td align="center" style="' +
      serif +
      "font-size:15px;line-height:1.4;color:" +
      WELCOME_MUTED +
      ';padding:0 0 24px;">' +
      WELCOME_TAGLINE +
      "</td></tr>",
    '<tr><td align="center" style="' +
      serif +
      "font-size:16px;line-height:1.5;color:" +
      WELCOME_INK +
      ';padding:0 12px 10px;">' +
      WELCOME_LEAD +
      "</td></tr>",
    '<tr><td align="center" style="' +
      serif +
      "font-size:16px;line-height:1.5;color:" +
      WELCOME_INK +
      ';padding:0 12px 28px;">' +
      WELCOME_BODY +
      "</td></tr>",
    '<tr><td align="center" style="padding:0 12px 28px;">' + button + "</td></tr>",
    '<tr><td align="center" style="' +
      serif +
      "font-size:12px;line-height:1.5;color:" +
      WELCOME_MUTED +
      ';padding:8px 12px 0;">' +
      WELCOME_FOOTER +
      "</td></tr>",
    "</table></td></tr></table></body></html>",
  ].join("");
}

export function welcomeEmailPayload(to: string, from: string) {
  return {
    from: from,
    to: [to.trim()],
    subject: WELCOME_SUBJECT,
    html: welcomeEmailHtml(),
    text: welcomeEmailText(),
  };
}

/**
 * Welcome the new member via Resend. Fail soft: a missing key, a
 * blocked from address, or a send error must not fail signup.
 */
export async function sendWelcomeEmail(to: string): Promise<WelcomeEmailResult> {
  const check = canSendWelcome(to);
  if (!check.ok) {
    console.error("welcome email skipped:", check.reason);
    return { sent: false, error: check.reason };
  }

  const apiKey = welcomeApiKey();
  const from = welcomeFromEmail();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(welcomeEmailPayload(to, from)),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("welcome email failed", res.status, detail.slice(0, 400));
      return { sent: false, error: "Resend returned " + res.status };
    }

    return { sent: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("welcome email error", message);
    return { sent: false, error: message };
  }
}
