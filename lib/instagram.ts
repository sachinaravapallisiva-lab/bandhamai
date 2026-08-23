/** Instagram-only social connect. No OAuth, no posting, no other networks. */

export const INSTAGRAM_COLUMN = "instagram";
export const INSTAGRAM_MAX_HANDLE = 30;
export const INSTAGRAM_SQL_FILE = "supabase/instagram.sql";

export const INSTAGRAM_ONLY_ERROR =
  "Use an Instagram username or instagram.com profile URL. Other socials are not accepted.";

export const INSTAGRAM_HANDLE_ERROR = "That does not look like an Instagram username.";

export const INSTAGRAM_SQL_HINT =
  "Run supabase/instagram.sql in the Supabase SQL editor to add profiles.instagram.";

const OTHER_SOCIAL_HOSTS = [
  "facebook.com",
  "fb.com",
  "fb.me",
  "linkedin.com",
  "lnkd.in",
  "x.com",
  "twitter.com",
  "t.co",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "snapchat.com",
  "threads.net",
  "pinterest.com",
  "reddit.com",
];

/** Instagram username: 1–30 chars, letters/numbers/._, no leading/trailing or doubled dots. */
const HANDLE_RE = /^(?!.*\.\.)[A-Za-z0-9](?:[A-Za-z0-9._]{0,28}[A-Za-z0-9])?$/;

const RESERVED_PATHS = new Set([
  "p",
  "reel",
  "reels",
  "stories",
  "explore",
  "accounts",
  "direct",
  "tv",
  "about",
  "legal",
  "developer",
  "directory",
  "emails",
  "nametag",
  "popular",
  "privacy",
  "session",
  "web",
  "api",
  "graphql",
  "lite",
  "login",
  "signup",
  "tags",
  "locations",
  "youractivity",
  "your_activity",
]);

function normalizeHost(host: string) {
  return host.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
}

function isInstagramHost(host: string) {
  const h = normalizeHost(host);
  return h === "instagram.com" || h.endsWith(".instagram.com");
}

function isOtherSocialHost(host: string) {
  const h = normalizeHost(host);
  return OTHER_SOCIAL_HOSTS.some(function (domain) {
    return h === domain || h.endsWith("." + domain);
  });
}

function looksLikeWebAddress(value: string) {
  if (/^https?:\/\//i.test(value) || value.startsWith("//")) return true;
  if (/\s/.test(value)) return false;
  const hostPart = value.split("/")[0].split("?")[0].toLowerCase();
  return isInstagramHost(hostPart) || isOtherSocialHost(hostPart);
}

function handleFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "_u" && parts[1]) return parts[1];
  return parts[0] || "";
}

function normalizeHandle(raw: string): { handle: string | null; error: string | null } {
  const cleaned = raw.replace(/^@+/, "").replace(/\/+$/, "").trim();
  if (!cleaned) return { handle: null, error: INSTAGRAM_HANDLE_ERROR };
  if (cleaned.length > INSTAGRAM_MAX_HANDLE || !HANDLE_RE.test(cleaned)) {
    return { handle: null, error: INSTAGRAM_HANDLE_ERROR };
  }
  if (RESERVED_PATHS.has(cleaned.toLowerCase())) {
    return { handle: null, error: INSTAGRAM_HANDLE_ERROR };
  }
  return { handle: cleaned, error: null };
}

/** Empty is fine (optional). Returns a clean handle without `@`, or an error. */
export function parseInstagramInput(raw: unknown): { handle: string | null; error: string | null } {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return { handle: null, error: null };

  if (looksLikeWebAddress(value)) {
    let url: URL;
    try {
      const withProto = /^https?:\/\//i.test(value)
        ? value
        : value.startsWith("//")
          ? "https:" + value
          : "https://" + value;
      url = new URL(withProto);
    } catch {
      return { handle: null, error: INSTAGRAM_ONLY_ERROR };
    }

    if (isOtherSocialHost(url.hostname)) {
      return { handle: null, error: INSTAGRAM_ONLY_ERROR };
    }
    if (!isInstagramHost(url.hostname)) {
      return { handle: null, error: INSTAGRAM_ONLY_ERROR };
    }

    return normalizeHandle(handleFromPath(url.pathname));
  }

  return normalizeHandle(value);
}

export function instagramProfileUrl(handle: string) {
  return "https://instagram.com/" + encodeURIComponent(handle);
}

export function displayInstagramHandle(handle: string) {
  const cleaned = handle.replace(/^@+/, "").trim();
  return cleaned ? "@" + cleaned : "";
}
