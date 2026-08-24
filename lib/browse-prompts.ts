/**
 * Earlier Browse prompts for the signed-in member.
 * Stores the raw prompt text plus the folded search q used to reopen results.
 * No caste, religion, or invented filter columns.
 */

export const BROWSE_PROMPTS_TABLE = "browse_prompts";
export const BROWSE_PROMPTS_SQL_FILE = "supabase/browse_prompts.sql";
export const BROWSE_PROMPTS_PATH = "/api/browse/prompts";
export const BROWSE_PROMPTS_STORAGE_KEY = "bandham.browsePrompts.recent";
export const BROWSE_PROMPTS_LIMIT = 8;
export const BROWSE_PROMPTS_MAX_LEN = 280;

export const BROWSE_PROMPTS_LABEL = "EARLIER SEARCHES";
export const BROWSE_PROMPTS_HINT = "Only you can see these on Bandham AI.";
export const BROWSE_PROMPTS_VIEW = "View results";
export const BROWSE_PROMPTS_RERUN = "Search again";
export const BROWSE_PROMPTS_NEW = "New search";
export const BROWSE_PROMPTS_MENU = "More on this search";
export const BROWSE_PROMPTS_EMPTY = "";

export type BrowsePromptItem = {
  id: string;
  prompt: string;
  searchQ: string;
  createdAt: string;
};

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function sanitizeBrowsePrompt(raw: unknown) {
  return asText(raw).replace(/\s+/g, " ").slice(0, BROWSE_PROMPTS_MAX_LEN);
}

export function normalizeBrowsePromptItem(raw: unknown): BrowsePromptItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const prompt = sanitizeBrowsePrompt(row.prompt);
  if (!prompt) return null;
  const searchQ = sanitizeBrowsePrompt(row.search_q ?? row.searchQ) || prompt;
  const createdAt =
    asText(row.created_at) || asText(row.createdAt) || new Date().toISOString();
  const id = asText(row.id) || createdAt + ":" + prompt;
  return { id, prompt, searchQ, createdAt };
}

export function dedupeBrowsePrompts(items: BrowsePromptItem[]) {
  const seen = new Set<string>();
  const out: BrowsePromptItem[] = [];
  items.forEach(function (item) {
    const key = item.prompt.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(item);
  });
  return out.slice(0, BROWSE_PROMPTS_LIMIT);
}

export function browsePromptWhen(iso: string, now = Date.now()) {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const delta = Math.max(0, now - then);
  const mins = Math.floor(delta / 60000);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 minute ago";
  if (mins < 60) return mins + " minutes ago";
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return hours + " hours ago";
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return days + " days ago";
  const d = new Date(then);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
}

export function readLocalBrowsePrompts(): BrowsePromptItem[] {
  try {
    const raw = sessionStorage.getItem(BROWSE_PROMPTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return dedupeBrowsePrompts(
      parsed
        .map(normalizeBrowsePromptItem)
        .filter(function (item): item is BrowsePromptItem {
          return !!item;
        })
    );
  } catch {
    return [];
  }
}

export function writeLocalBrowsePrompts(items: BrowsePromptItem[]) {
  try {
    sessionStorage.setItem(
      BROWSE_PROMPTS_STORAGE_KEY,
      JSON.stringify(dedupeBrowsePrompts(items))
    );
  } catch {
    /* private mode / quota */
  }
}

export function rememberLocalBrowsePrompt(prompt: string, searchQ: string) {
  const item = normalizeBrowsePromptItem({
    id: "local-" + Date.now(),
    prompt,
    search_q: searchQ,
    created_at: new Date().toISOString(),
  });
  if (!item) return readLocalBrowsePrompts();
  return dedupeBrowsePrompts([item].concat(readLocalBrowsePrompts()));
}

export function userFacingBrowsePromptCopy() {
  return [
    BROWSE_PROMPTS_LABEL,
    BROWSE_PROMPTS_HINT,
    BROWSE_PROMPTS_VIEW,
    BROWSE_PROMPTS_RERUN,
    BROWSE_PROMPTS_NEW,
    BROWSE_PROMPTS_MENU,
    browsePromptWhen(new Date().toISOString()),
    browsePromptWhen(new Date(Date.now() - 2 * 60 * 1000).toISOString()),
    browsePromptWhen(new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()),
    browsePromptWhen(new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()),
  ];
}
