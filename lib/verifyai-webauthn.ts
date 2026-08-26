import { VERIFYAI_COPY } from "./verifyai";

function b64urlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToB64url(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < view.length; i += 1) binary += String.fromCharCode(view[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function verifyaiWebAuthnSupported() {
  return typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;
}

export type VerifyaiDevicePublicKey = {
  challenge: string;
  rp: { name: string; id?: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: { type: "public-key"; alg: number }[];
  authenticatorSelection: {
    authenticatorAttachment?: "platform";
    userVerification: "required";
    residentKey?: "discouraged";
  };
  timeout: number;
  attestation: "none";
};

export async function runVerifyaiDeviceCheck(publicKey: VerifyaiDevicePublicKey) {
  if (!verifyaiWebAuthnSupported()) {
    return { error: VERIFYAI_COPY.deviceUnsupported, canceled: false, clientDataJSON: "", authenticatorData: "" };
  }

  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: b64urlToBytes(publicKey.challenge),
        rp: publicKey.rp,
        user: {
          id: b64urlToBytes(publicKey.user.id),
          name: publicKey.user.name,
          displayName: publicKey.user.displayName,
        },
        pubKeyCredParams: publicKey.pubKeyCredParams,
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: publicKey.authenticatorSelection.residentKey || "discouraged",
        },
        timeout: publicKey.timeout,
        attestation: "none",
      },
    });
    if (!cred || cred.type !== "public-key") {
      return { error: VERIFYAI_COPY.deviceFailed, canceled: false, clientDataJSON: "", authenticatorData: "" };
    }
    const response = (cred as PublicKeyCredential).response as AuthenticatorAttestationResponse;
    const authData =
      typeof response.getAuthenticatorData === "function"
        ? response.getAuthenticatorData()
        : new Uint8Array();
    if (!response.clientDataJSON || !authData.byteLength) {
      return { error: VERIFYAI_COPY.deviceFailed, canceled: false, clientDataJSON: "", authenticatorData: "" };
    }
    return {
      error: "",
      canceled: false,
      clientDataJSON: bytesToB64url(response.clientDataJSON),
      authenticatorData: bytesToB64url(authData),
    };
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    const canceled = name === "NotAllowedError" || name === "AbortError";
    return {
      error: canceled ? VERIFYAI_COPY.deviceCanceled : VERIFYAI_COPY.deviceFailed,
      canceled,
      clientDataJSON: "",
      authenticatorData: "",
    };
  }
}
