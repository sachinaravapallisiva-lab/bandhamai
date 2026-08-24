import { NextResponse } from "next/server";
import { BIRTH_DETAILS_TABLE, BIRTH_SQL_HINT, readBirthDetails } from "../../../lib/birth-details";
import { GUN_MILAN_NOT_CONFIGURED, gunMilanKeysReady } from "../../../lib/gun-milan";
import { gunMilanTablesReady, loadBirthDetails, saveBirthDetails } from "../../../lib/gun-milan-server";
import {
  getAnonSupabase,
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  tableExists,
  tableHasColumn,
  unauthorizedResponse,
} from "../../../lib/server-supabase";

export const runtime = "nodejs";

function dataClient() {
  return getServiceSupabase() || getAnonSupabase();
}

export async function GET(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to continue.");
    }

    const supabase = dataClient();
    if (!supabase) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, supabase);
    if (!user) return unauthorizedResponse(authError || "Sign in to continue.");

    const tables = await gunMilanTablesReady(supabase);
    if (!tables.birth) {
      return NextResponse.json(
        { error: BIRTH_SQL_HINT, configured: gunMilanKeysReady(), details: null },
        { status: 503 }
      );
    }

    const loaded = await loadBirthDetails(supabase, user.id);
    if (loaded.error) {
      return NextResponse.json({ error: loaded.error }, { status: 400 });
    }

    let dob = "";
    if (await tableHasColumn(supabase, "profiles", "dob")) {
      const profile = await supabase
        .from("profiles")
        .select("dob")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (profile.data && typeof profile.data.dob === "string") {
        dob = profile.data.dob;
      }
    }

    const details = readBirthDetails(loaded.row || (dob ? { birth_date: dob } : null));

    return NextResponse.json({
      details,
      configured: gunMilanKeysReady(),
      table: BIRTH_DETAILS_TABLE,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!hasBearerToken(request)) {
      return unauthorizedResponse("Sign in to save birth details.");
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Send JSON birth details." }, { status: 400 });
    }

    const verifier = dataClient();
    if (!verifier) return missingConfigResponse();

    const { user, error: authError } = await getRequestUser(request, verifier);
    if (!user) return unauthorizedResponse(authError || "Sign in to save birth details.");

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is missing SUPABASE_SERVICE_KEY, which is required to save birth details." },
        { status: 500 }
      );
    }

    if (!(await tableExists(supabase, BIRTH_DETAILS_TABLE))) {
      return NextResponse.json({ error: BIRTH_SQL_HINT }, { status: 503 });
    }

    const linked = await tableHasColumn(supabase, "profiles", "user_id");
    let profileId: string | null = null;
    if (linked) {
      const existing = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (existing.data && existing.data.id != null) {
        profileId = String(existing.data.id);
      }
    }

    const saved = await saveBirthDetails(supabase, {
      userId: user.id,
      profileId,
      body,
    });
    if (!saved.ok) {
      return NextResponse.json({ error: saved.error }, { status: saved.status });
    }

    return NextResponse.json({
      success: true,
      details: readBirthDetails(saved.details as Record<string, unknown>),
      configured: gunMilanKeysReady(),
      message: GUN_MILAN_NOT_CONFIGURED && !gunMilanKeysReady() ? GUN_MILAN_NOT_CONFIGURED : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
