/** Internal redirects only. Used by /login?next= — never send people off-site. */

export const ALLOWED_NEXT_PATHS = [
  "/",
  "/matches",
  "/chat",
  "/inbox",
  "/profile/new",
  "/account",
  "/preferences",
  "/plans",
  "/meetup",
  "/safety",
  "/contact",
  "/login",
  "/logout",
  "/terms",
  "/privacy",
  "/verifyai/start",
  "/metrics",
  "/admin",
  "/admin/metrics",
] as const;

export type AllowedNextPath = (typeof ALLOWED_NEXT_PATHS)[number];

const ALLOWED = new Set<string>(ALLOWED_NEXT_PATHS);

const HOME_TABS = new Set(["browse", "matches", "chat"]);

export function isAllowedNextPath(pathname: string) {
  return ALLOWED.has(pathname);
}

/**
 * Allow only known in-app paths. Reject protocol-relative URLs, backslashes,
 * whitespace, and anything that is not on the allowlist.
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/") {
  if (!raw) return fallback;

  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\")) return fallback;
  if (trimmed.includes("://")) return fallback;
  if (/[\s\r\n\t\0]/.test(trimmed)) return fallback;
  if (trimmed.includes("@")) return fallback;

  const hashIndex = trimmed.indexOf("#");
  const withoutHash = hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed;
  const qIndex = withoutHash.indexOf("?");
  const pathname = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash;
  const search = qIndex >= 0 ? withoutHash.slice(qIndex + 1) : "";

  if (!ALLOWED.has(pathname)) return fallback;

  if (pathname === "/" && search) {
    const tab = new URLSearchParams(search).get("tab");
    if (tab && HOME_TABS.has(tab)) return "/?tab=" + tab;
  }

  return pathname;
}

export function homeTabFromSearch(raw: string | null | undefined): "browse" | "matches" | "chat" | null {
  if (!raw) return null;
  if (raw === "browse" || raw === "matches" || raw === "chat") return raw;
  return null;
}

export function loginHref(nextPath: string) {
  return "/login?next=" + encodeURIComponent(safeNextPath(nextPath));
}
