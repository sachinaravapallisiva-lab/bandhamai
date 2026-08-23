/**
 * Public Browse search for live profiles only.
 *
 * Auth: listing approved (`status = live`) cards is public — Browse is the
 * landing surface. Own-profile GET /api/profiles stays signed-in. Pending
 * rows never leave this handler. An optional Bearer token is used only to
 * hide the viewer's own row when `user_id` exists.
 */
import { NextResponse } from "next/server";
import {
  getAnonSupabase,
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  tableHasColumn,
} from "../../../../lib/server-supabase";
import {
  BROWSE_SHORTLIST_SIZE,
  LIVE_PROFILE_STATUS,
  browseSelectColumns,
  cityMatchValues,
  ilikeContains,
  mergeCriteria,
  needsLlmAssist,
  parseSearchQuery,
  pickShortlist,
  safeOrValue,
  type SearchCriteria,
} from "../../../../lib/profile-search";

export const runtime = "nodejs";

const KEYWORD_COLUMNS = [
  "profession",
  "education",
  "about",
  "wants",
  "mother_tongue",
  "visa_status",
  "full_name",
] as const;

const LLM_ASSIST_MS = 400;

function dataClient() {
  return getServiceSupabase() || getAnonSupabase();
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseLlmCriteria(raw: string): SearchCriteria | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as {
      city?: unknown;
      gender?: unknown;
      keywords?: unknown;
    };
    const genderRaw = asString(parsed.gender);
    const gender =
      genderRaw === "Female" || genderRaw === "Male" || genderRaw === "Other" ? genderRaw : null;
    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords
          .filter(function (word): word is string {
            return typeof word === "string" && word.trim().length > 1;
          })
          .map(function (word) {
            return word.trim().toLowerCase();
          })
      : [];
    return {
      city: asString(parsed.city) || null,
      gender,
      keywords,
    };
  } catch {
    return null;
  }
}

/** Optional xAI pass. Failures and the short timeout return null. */
async function extractCriteriaWithLlm(query: string): Promise<SearchCriteria | null> {
  const key = process.env.XAI_API_KEY;
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(function () {
    controller.abort();
  }, LLM_ASSIST_MS);

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "grok-4.6",
        temperature: 0,
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content:
              'Extract matrimony Browse filters from the user\'s words only. Reply with JSON only: {"city":string|null,"gender":"Female"|"Male"|"Other"|null,"keywords":string[]}. Keep normal English cities and professions. If they used Indian shorthand, expand Hyd→Hyderabad, Blr→Bengaluru, Madras→Chennai, Vizag→Visakhapatnam. Do not invent language, community, diet, or visa keywords they did not say. Ignore age. No commentary.',
          },
          { role: "user", content: query },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;
    return parseLlmCriteria(content);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Use an in-flight LLM result only if it already settled. Never wait on it. */
async function takeIfReady<T>(promise: Promise<T>): Promise<T | null> {
  const pending = { pending: true };
  const winner = await Promise.race([promise, Promise.resolve(pending)]);
  if (winner && typeof winner === "object" && "pending" in winner) return null;
  return winner as T;
}

export async function GET(request: Request) {
  try {
    const supabase = dataClient();
    if (!supabase) return missingConfigResponse();

    const url = new URL(request.url);
    const query = asString(url.searchParams.get("q")).slice(0, 280);

    const parsed = parseSearchQuery(query);
    const llmPromise = needsLlmAssist(query, parsed) ? extractCriteriaWithLlm(query) : null;

    const hasStatus = await tableHasColumn(supabase, "profiles", "status");
    if (!hasStatus) {
      return NextResponse.json({
        profiles: [],
        empty: "inventory",
        criteria: parsed,
        source: "live",
        parse: "deterministic",
        llm: false,
      });
    }

    const [photo_url, diet, user_id, created_at, inventory] = await Promise.all([
      tableHasColumn(supabase, "profiles", "photo_url"),
      tableHasColumn(supabase, "profiles", "diet"),
      tableHasColumn(supabase, "profiles", "user_id"),
      tableHasColumn(supabase, "profiles", "created_at"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", LIVE_PROFILE_STATUS),
    ]);
    const flags = { photo_url, diet, user_id, created_at };

    let criteria = parsed;
    let usedLlm = false;
    if (llmPromise) {
      const extra = await takeIfReady(llmPromise);
      if (extra) {
        criteria = mergeCriteria(parsed, extra);
        usedLlm = true;
      }
    }

    if (inventory.error) {
      return NextResponse.json({ error: inventory.error.message }, { status: 400 });
    }

    const liveCount = inventory.count ?? 0;
    if (liveCount === 0) {
      return NextResponse.json({
        profiles: [],
        empty: "inventory",
        criteria,
        source: "live",
        parse: "deterministic",
        llm: usedLlm,
      });
    }

    let viewerId: string | null = null;
    if (flags.user_id && hasBearerToken(request)) {
      const { user } = await getRequestUser(request, supabase);
      viewerId = user?.id || null;
    }

    const select = browseSelectColumns(flags);
    let q = supabase.from("profiles").select(select).eq("status", LIVE_PROFILE_STATUS);

    if (viewerId) q = q.neq("user_id", viewerId);
    if (criteria.city) {
      const cities = cityMatchValues(criteria.city)
        .map(safeOrValue)
        .filter(Boolean);
      if (cities.length === 1) {
        q = q.ilike("city", ilikeContains(cities[0]));
      } else if (cities.length > 1) {
        q = q.or(
          cities
            .map(function (city) {
              return "city.ilike." + ilikeContains(city);
            })
            .join(",")
        );
      }
    }
    if (criteria.gender) q = q.ilike("gender", criteria.gender);

    const keywordColumns: string[] = KEYWORD_COLUMNS.slice();
    if (flags.diet) keywordColumns.push("diet");

    for (const keyword of criteria.keywords) {
      const safe = safeOrValue(keyword);
      if (!safe) continue;
      const pattern = ilikeContains(safe);
      q = q.or(
        keywordColumns
          .map(function (col) {
            return col + ".ilike." + pattern;
          })
          .join(",")
      );
    }

    if (flags.created_at) q = q.order("created_at", { ascending: false });
    q = q.limit(Math.max(12, BROWSE_SHORTLIST_SIZE * 4));

    const { data, error } = await q;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const rows = (Array.isArray(data) ? data : []) as unknown as Record<string, unknown>[];
    const profiles = pickShortlist(rows, criteria);
    const empty = profiles.length === 0 ? (liveCount === 0 ? "inventory" : "matches") : null;

    return NextResponse.json({
      profiles,
      empty,
      criteria,
      source: "live",
      parse: "deterministic",
      llm: usedLlm,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
