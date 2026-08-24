import { NextResponse } from "next/server";
import { GUN_MILAN_NOT_CONFIGURED, gunMilanKeysReady, readGunMilanTargetId } from "../../../lib/gun-milan";
import { lookupGunMilan } from "../../../lib/gun-milan-server";
import {
  getAnonSupabase,
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  missingConfigResponse,
  unauthorizedResponse,
} from "../../../lib/server-supabase";

export const runtime = "nodejs";

function dataClient() {
  return getServiceSupabase() || getAnonSupabase();
}

async function handle(request: Request, run: boolean) {
  if (!hasBearerToken(request)) {
    return unauthorizedResponse("Sign in to run Gun Milan.");
  }

  const supabase = dataClient();
  if (!supabase) return missingConfigResponse();

  const { user, error: authError } = await getRequestUser(request, supabase);
  if (!user) return unauthorizedResponse(authError || "Sign in to run Gun Milan.");

  const url = new URL(request.url);
  let targetId = readGunMilanTargetId(url.searchParams);
  if (!targetId && request.method !== "GET") {
    try {
      const body = (await request.json()) as { id?: unknown; profile_id?: unknown };
      targetId =
        (typeof body.id === "string" && body.id.trim()) ||
        (typeof body.profile_id === "string" && body.profile_id.trim()) ||
        "";
    } catch {
      targetId = "";
    }
  }
  if (!targetId) {
    return NextResponse.json({ error: "Choose a profile for Gun Milan." }, { status: 400 });
  }

  const result = await lookupGunMilan(supabase, {
    viewerUserId: user.id,
    otherProfileId: targetId,
    run,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        configured: result.configured,
        reason: result.reason,
        report: null,
      },
      { status: result.status }
    );
  }

  if (run && !result.report && !result.configured) {
    return NextResponse.json(
      { error: GUN_MILAN_NOT_CONFIGURED, configured: false, report: null },
      { status: 503 }
    );
  }

  return NextResponse.json({
    configured: result.configured,
    cached: result.cached,
    report: result.report,
    keysReady: gunMilanKeysReady(),
  });
}

export async function GET(request: Request) {
  try {
    return await handle(request, false);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    return await handle(request, true);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
