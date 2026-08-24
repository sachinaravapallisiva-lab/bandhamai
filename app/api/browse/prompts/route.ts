/**
 * Earlier Browse prompts for the signed-in member.
 *
 * GET lists that member's latest prompts. POST stores the raw prompt plus
 * the folded search q. Other members' rows never leave this handler.
 *
 * If `browse_prompts` is missing, the UI still keeps session-local prompts.
 * Run supabase/browse_prompts.sql to persist.
 */
import { NextResponse } from "next/server";
import {
  getAnonSupabase,
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  tableExists,
  unauthorizedResponse,
} from "../../../../lib/server-supabase";
import {
  BROWSE_PROMPTS_LIMIT,
  BROWSE_PROMPTS_SQL_FILE,
  BROWSE_PROMPTS_TABLE,
  normalizeBrowsePromptItem,
  sanitizeBrowsePrompt,
} from "../../../../lib/browse-prompts";

export const runtime = "nodejs";

function dataClient() {
  return getServiceSupabase() || getAnonSupabase();
}

function tableMissingResponse() {
  return NextResponse.json(
    {
      persisted: false,
      code: "table_missing",
      error: "Earlier search storage is not applied yet. Run " + BROWSE_PROMPTS_SQL_FILE + " in the Supabase SQL editor.",
      sql: BROWSE_PROMPTS_SQL_FILE,
    },
    { status: 503 }
  );
}

export async function GET(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to see your earlier searches.");
    }

    const supabase = dataClient();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    if (!(await tableExists(supabase, BROWSE_PROMPTS_TABLE))) {
      return tableMissingResponse();
    }

    const { data, error } = await supabase
      .from(BROWSE_PROMPTS_TABLE)
      .select("id, prompt, search_q, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(BROWSE_PROMPTS_LIMIT * 2);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const items = (Array.isArray(data) ? data : [])
      .map(normalizeBrowsePromptItem)
      .filter(function (item) {
        return !!item;
      });

    return NextResponse.json({
      persisted: true,
      prompts: items,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to save an earlier search.");
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Send a JSON Browse prompt." }, { status: 400 });
    }

    const prompt = sanitizeBrowsePrompt(body.prompt);
    const searchQ = sanitizeBrowsePrompt(body.search_q ?? body.searchQ) || prompt;
    if (!prompt || !searchQ) {
      return NextResponse.json({ error: "Send the Browse prompt you searched." }, { status: 400 });
    }

    const verifier = dataClient();
    if (!verifier) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, verifier);
    if (!user) return unauthorizedResponse(authError || "Sign in to save an earlier search.");

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is missing SUPABASE_SERVICE_KEY, which is required to save earlier searches." },
        { status: 500 }
      );
    }

    if (!(await tableExists(supabase, BROWSE_PROMPTS_TABLE))) {
      return tableMissingResponse();
    }

    const { data, error } = await supabase
      .from(BROWSE_PROMPTS_TABLE)
      .insert([
        {
          user_id: user.id,
          prompt,
          search_q: searchQ,
        },
      ])
      .select("id, prompt, search_q, created_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      persisted: true,
      prompt: normalizeBrowsePromptItem(data),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
