import {
  GUN_MILAN_NOT_CONFIGURED,
  GUN_MILAN_PROVIDER_ID,
  PROKERALA_API_BASE,
  PROKERALA_KUNDLI_MATCHING_PATH,
  PROKERALA_TOKEN_URL,
  gunMilanKeysReady,
} from "./gun-milan";
import {
  createMissingKeysError,
  type GunMilanMatchInput,
  type GunMilanProvider,
} from "./gun-milan-provider";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

async function readError(res: Response) {
  const text = await res.text();
  try {
    const parsed = JSON.parse(text) as { message?: unknown; error?: unknown };
    if (typeof parsed.message === "string" && parsed.message.trim()) return parsed.message;
    if (typeof parsed.error === "string" && parsed.error.trim()) return parsed.error;
  } catch {
    /* keep text */
  }
  return text.slice(0, 280) || "Prokerala request failed.";
}

async function fetchAccessToken(): Promise<string> {
  if (!gunMilanKeysReady()) {
    throw createMissingKeysError();
  }
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }

  const res = await fetch(PROKERALA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.PROKERALA_CLIENT_ID || "",
      client_secret: process.env.PROKERALA_CLIENT_SECRET || "",
    }),
  });

  if (!res.ok) {
    throw new Error(await readError(res));
  }

  const data = (await res.json()) as { access_token?: unknown; expires_in?: unknown };
  const accessToken = typeof data.access_token === "string" ? data.access_token : "";
  if (!accessToken) {
    throw new Error("Prokerala token response had no access_token.");
  }
  const ttlSec = typeof data.expires_in === "number" && data.expires_in > 0 ? data.expires_in : 3600;
  tokenCache = {
    accessToken,
    expiresAt: Date.now() + Math.max(30, ttlSec - 60) * 1000,
  };
  return accessToken;
}

export function createProkeralaProvider(): GunMilanProvider {
  return {
    id: GUN_MILAN_PROVIDER_ID,
    isConfigured: function () {
      return gunMilanKeysReady();
    },
    fetchKundliMatching: async function (input: GunMilanMatchInput) {
      if (!gunMilanKeysReady()) {
        throw createMissingKeysError();
      }
      const token = await fetchAccessToken();
      const params = new URLSearchParams({
        ayanamsa: "1",
        girl_coordinates: input.girl.coordinates,
        girl_dob: input.girl.datetime,
        boy_coordinates: input.boy.coordinates,
        boy_dob: input.boy.datetime,
      });
      const res = await fetch(
        PROKERALA_API_BASE + PROKERALA_KUNDLI_MATCHING_PATH + "?" + params.toString(),
        {
          method: "GET",
          headers: { Authorization: "Bearer " + token },
        }
      );
      if (!res.ok) {
        throw new Error(await readError(res));
      }
      return res.json();
    },
  };
}

export function getGunMilanProvider(): GunMilanProvider {
  return createProkeralaProvider();
}

export { GUN_MILAN_NOT_CONFIGURED };
