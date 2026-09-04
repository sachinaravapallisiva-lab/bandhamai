export const WELCOME_BRAND = "Bandham AI";
export const WELCOME_TAGLINE = "Find your vibe match?";
export const WELCOME_SUBJECT = "Welcome to Bandham AI";
export const WELCOME_GREETING_FALLBACK = "Hey,";
export const WELCOME_GREETING_FALLBACK_ALT = "Welcome,";
export const WELCOME_ABOARD = "Welcome aboard. We're glad you're here.";
export const WELCOME_PITCH =
  "Bandham AI is Indian matrimony for NRI and diaspora. Find your vibe match? Browse, search, Speed Match, and create a profile stay free. Messaging is $9.99 a month when you're ready. VerifyAI is a separate $4.99 one-time check that the person is who they say they are.";
export const WELCOME_COMMUNITY =
  "You're joining people looking for a serious match across the US, Australia, UK, Europe, and Ireland.";
export const WELCOME_START_HEAD = "Here's how to get started:";
export const WELCOME_STEP_1 = "1. Complete your profile so the right people can find you.";
export const WELCOME_STEP_2 =
  "2. Browse and search for your vibe match. Use Speed Match when you want a quick read.";
export const WELCOME_APP_HELP =
  "You'll find Plans, Browse, and Call us in the app. Support is also at +1 803 265 5233.";
export const WELCOME_NEED_HELP =
  "Need help? Reply to this email or open Help in Bandham AI. We're rooting for you.";
export const WELCOME_REGARDS = "Warm regards,";
export const WELCOME_SIGN_OFF_NAME = "Sai";
export const WELCOME_SIGN_OFF_TITLE = "Founder, Bandham AI";

export const WELCOME_MARK_URL = "https://bandhamai.vercel.app/brand/bandham-jaimala.png";
export const WELCOME_VIOLET = "#6D28D9";
export const WELCOME_CREAM = "#FDF8F1";
export const WELCOME_INK = "#1E1B36";
export const WELCOME_MUTED = "#7B6F8A";

const BLOCKED_FROM_HOST_BITS = ["laughrank", "verifyai", "resend.dev", "lol"] as const;

export type WelcomeSendCheck = { ok: true } | { ok: false; reason: string };

export type WelcomeEmailResult = {
  sent: boolean;
  mailed: boolean;
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

/** First token from signup. Empty when missing. Never invents a name. */
export function welcomeFirstName(raw: unknown) {
  if (typeof raw !== "string") return "";
  const token = raw.trim().split(/\s+/)[0] || "";
  return token.replace(/[^A-Za-z.']/g, "").slice(0, 40);
}

export function signupFirstName(body: Record<string, unknown> | null | undefined) {
  if (!body || typeof body !== "object") return "";
  if (typeof body.first_name === "string") return welcomeFirstName(body.first_name);
  if (typeof body.firstName === "string") return welcomeFirstName(body.firstName);
  return "";
}

/** Hey Priya, when signup gave a first name. Hey, (or Welcome,) when it did not. Never defaults to Sai. */
export function welcomeGreeting(raw?: unknown) {
  const name = welcomeFirstName(raw);
  if (name) return "Hey " + name + ",";
  return WELCOME_GREETING_FALLBACK;
}

export function welcomeUserCopy() {
  return [
    WELCOME_BRAND,
    WELCOME_TAGLINE,
    WELCOME_SUBJECT,
    WELCOME_GREETING_FALLBACK,
    WELCOME_GREETING_FALLBACK_ALT,
    WELCOME_ABOARD,
    WELCOME_PITCH,
    WELCOME_COMMUNITY,
    WELCOME_START_HEAD,
    WELCOME_STEP_1,
    WELCOME_STEP_2,
    WELCOME_APP_HELP,
    WELCOME_NEED_HELP,
    WELCOME_REGARDS,
    WELCOME_SIGN_OFF_NAME,
    WELCOME_SIGN_OFF_TITLE,
  ];
}

export function welcomeEmailText(firstName?: unknown) {
  return [
    welcomeGreeting(firstName),
    "",
    WELCOME_ABOARD,
    "",
    WELCOME_PITCH,
    "",
    WELCOME_COMMUNITY,
    "",
    WELCOME_START_HEAD,
    "",
    WELCOME_STEP_1,
    WELCOME_STEP_2,
    "",
    WELCOME_APP_HELP,
    "",
    WELCOME_NEED_HELP,
    "",
    WELCOME_REGARDS,
    WELCOME_SIGN_OFF_NAME,
    WELCOME_SIGN_OFF_TITLE,
  ].join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlLine(text: string, extraPad: string) {
  return (
    '<tr><td style="font-family:Georgia,serif;font-size:16px;line-height:1.55;color:' +
    WELCOME_INK +
    ";padding:0 12px " +
    extraPad +
    ';">' +
    escapeHtml(text) +
    "</td></tr>"
  );
}

export function welcomeEmailHtml(firstName?: unknown) {
  const serif = "font-family:Georgia,serif;";
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
      escapeHtml(WELCOME_BRAND) +
      "</td></tr>",
    '<tr><td align="center" style="' +
      serif +
      "font-size:15px;line-height:1.4;color:" +
      WELCOME_MUTED +
      ';padding:0 0 24px;">' +
      escapeHtml(WELCOME_TAGLINE) +
      "</td></tr>",
    htmlLine(welcomeGreeting(firstName), "18px"),
    htmlLine(WELCOME_ABOARD, "14px"),
    htmlLine(WELCOME_PITCH, "14px"),
    htmlLine(WELCOME_COMMUNITY, "14px"),
    htmlLine(WELCOME_START_HEAD, "8px"),
    htmlLine(WELCOME_STEP_1, "4px"),
    htmlLine(WELCOME_STEP_2, "14px"),
    htmlLine(WELCOME_APP_HELP, "14px"),
    htmlLine(WELCOME_NEED_HELP, "18px"),
    htmlLine(WELCOME_REGARDS, "4px"),
    htmlLine(WELCOME_SIGN_OFF_NAME, "2px"),
    htmlLine(WELCOME_SIGN_OFF_TITLE, "0"),
    "</table></td></tr></table></body></html>",
  ].join("");
}

export function welcomeEmailPayload(to: string, from: string, firstName?: unknown) {
  return {
    from: from,
    to: [to.trim()],
    subject: WELCOME_SUBJECT,
    html: welcomeEmailHtml(firstName),
    text: welcomeEmailText(firstName),
  };
}

function skippedWelcome(reason: string): WelcomeEmailResult {
  return { sent: false, mailed: false, error: reason };
}

/**
 * Welcome the new member via Resend. Fail closed on env: missing key,
 * missing from, or a blocked from host never sends. Fail soft on signup:
 * a skip or Resend error must not fail register. mailed stays false
 * until RESEND_FROM_EMAIL is a verified Bandham domain.
 */
export async function sendWelcomeEmail(to: string, firstName?: unknown): Promise<WelcomeEmailResult> {
  const check = canSendWelcome(to);
  if (!check.ok) {
    console.error("welcome email skipped:", check.reason);
    return skippedWelcome(check.reason);
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
      body: JSON.stringify(welcomeEmailPayload(to, from, firstName)),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("welcome email failed", res.status, detail.slice(0, 400));
      return skippedWelcome("Resend returned " + res.status);
    }

    return { sent: true, mailed: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("welcome email error", message);
    return skippedWelcome(message);
  }
}
