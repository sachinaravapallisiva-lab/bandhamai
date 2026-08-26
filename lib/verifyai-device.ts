import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { VERIFYAI_COPY, VERIFYAI_FIRST_PARTY_START_PATH, firstPartyVerifyaiStartUrl } from "./verifyai";

export const VERIFYAI_DEVICE_USER_VERIFICATION = "required" as const;
export const VERIFYAI_DEVICE_RP_NAME = "Bandham";
export const VERIFYAI_DEVICE_TIMEOUT_MS = 60_000;
export const VERIFYAI_DEVICE_CHALLENGE_TTL_MS = 10 * 60 * 1000;

export function verifyaiDeviceSecret() {
  return (
    process.env.VERIFYAI_WEBHOOK_SECRET ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.STRIPE_SECRET_KEY ||
    ""
  ).trim();
}

function b64urlEncode(bytes: Uint8Array | Buffer) {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64urlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

function signDeviceToken(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function safeEqualHex(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createVerifyaiDeviceChallenge(input: { userId: string; profileId?: string | null }) {
  const secret = verifyaiDeviceSecret();
  const challenge = b64urlEncode(randomBytes(32));
  const exp = Date.now() + VERIFYAI_DEVICE_CHALLENGE_TTL_MS;
  const body = JSON.stringify({
    v: 1,
    user_id: input.userId,
    profile_id: input.profileId || "",
    challenge,
    exp,
  });
  const token = b64urlEncode(Buffer.from(body, "utf8")) + "." + (secret ? signDeviceToken(body, secret) : "unsigned");
  return { challenge, token, exp };
}

export function readVerifyaiDeviceChallenge(
  token: string,
  userId: string
): { challenge: string; profileId: string } | { error: string } {
  const parts = token.split(".");
  if (parts.length !== 2) return { error: "The device check expired. Retry." };
  let body: {
    user_id?: unknown;
    profile_id?: unknown;
    challenge?: unknown;
    exp?: unknown;
  };
  try {
    body = JSON.parse(b64urlDecode(parts[0]).toString("utf8")) as typeof body;
  } catch {
    return { error: "The device check expired. Retry." };
  }
  const secret = verifyaiDeviceSecret();
  const expected = secret ? signDeviceToken(b64urlDecode(parts[0]).toString("utf8"), secret) : "unsigned";
  if (!safeEqualHex(expected, parts[1])) return { error: "The device check expired. Retry." };
  if (typeof body.exp !== "number" || body.exp < Date.now()) return { error: "The device check expired. Retry." };
  if (body.user_id !== userId) return { error: "The device check belongs to another account." };
  if (typeof body.challenge !== "string" || !body.challenge) return { error: "The device check expired. Retry." };
  return {
    challenge: body.challenge,
    profileId: typeof body.profile_id === "string" ? body.profile_id : "",
  };
}

export function parseWebAuthnClientData(clientDataJSON: string) {
  try {
    const json = Buffer.from(b64urlDecode(clientDataJSON)).toString("utf8");
    const data = JSON.parse(json) as { type?: unknown; challenge?: unknown; origin?: unknown };
    return {
      type: typeof data.type === "string" ? data.type : "",
      challenge: typeof data.challenge === "string" ? data.challenge : "",
      origin: typeof data.origin === "string" ? data.origin : "",
    };
  } catch {
    return { type: "", challenge: "", origin: "" };
  }
}

/** UV flag is bit 2 of the flags byte at offset 32. */
export function authenticatorUserVerified(authenticatorData: string) {
  try {
    const bytes = b64urlDecode(authenticatorData);
    if (bytes.length < 33) return false;
    return (bytes[32] & 0x04) !== 0;
  } catch {
    return false;
  }
}

export function originsMatch(clientOrigin: string, expectedOrigin: string) {
  try {
    const left = new URL(clientOrigin);
    const right = new URL(expectedOrigin);
    return left.origin === right.origin;
  } catch {
    return false;
  }
}

export function verifyaiDevicePublicKeyOptions(input: {
  challenge: string;
  origin: string;
  userId: string;
  email?: string | null;
}) {
  let rpId = "";
  try {
    rpId = new URL(input.origin).hostname;
  } catch {
    rpId = "";
  }
  return {
    challenge: input.challenge,
    rp: { name: VERIFYAI_DEVICE_RP_NAME, id: rpId || undefined },
    user: {
      id: b64urlEncode(Buffer.from(input.userId, "utf8")),
      name: input.email || input.userId,
      displayName: input.email || input.userId,
    },
    pubKeyCredParams: [
      { type: "public-key" as const, alg: -7 },
      { type: "public-key" as const, alg: -257 },
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform" as const,
      userVerification: VERIFYAI_DEVICE_USER_VERIFICATION,
      residentKey: "discouraged" as const,
    },
    timeout: VERIFYAI_DEVICE_TIMEOUT_MS,
    attestation: "none" as const,
  };
}

export function verifyaiTermsRequiredBody() {
  return {
    error: VERIFYAI_COPY.termsRequired,
    code: "terms_required",
    verified: false,
  };
}

export function verifyaiUnderageBody() {
  return {
    error: VERIFYAI_COPY.underage,
    code: "underage",
    verified: false,
  };
}

export function verifyaiDeviceFailedBody(canceled: boolean) {
  return {
    error: canceled ? VERIFYAI_COPY.deviceCanceled : VERIFYAI_COPY.deviceFailed,
    code: canceled ? "device_canceled" : "device_failed",
    verified: false,
    status: canceled ? "pending" : "failed",
  };
}

export { VERIFYAI_FIRST_PARTY_START_PATH, firstPartyVerifyaiStartUrl };
