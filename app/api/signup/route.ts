/**
 * Same /login Sign up flow. Rejects without Terms agree before any account create.
 */
import { NextResponse } from "next/server";
import {
  LOGIN_EMPTY_FIELDS,
  LOGIN_SIGN_UP_UNREACHABLE,
  LOGIN_TERMS_NEED,
  canCreateSignUpAccount,
} from "../../../lib/login-auth";
import { getAnonSupabase, missingConfigResponse } from "../../../lib/server-supabase";
import { sendWelcomeEmail } from "../../../lib/welcome-email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: LOGIN_EMPTY_FIELDS }, { status: 400 });
    }

    if (!canCreateSignUpAccount(body.agreed)) {
      return NextResponse.json({ error: LOGIN_TERMS_NEED }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json({ error: LOGIN_EMPTY_FIELDS }, { status: 400 });
    }

    const supabase = getAnonSupabase();
    if (!supabase) return missingConfigResponse();

    const result = await supabase.auth.signUp({ email: email, password: password });
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    if (result.data.user) {
      try {
        await sendWelcomeEmail(email);
      } catch {
        console.error("welcome email skipped: send threw");
      }
    }

    return NextResponse.json({
      user: result.data.user,
      session: result.data.session,
    });
  } catch {
    return NextResponse.json({ error: LOGIN_SIGN_UP_UNREACHABLE }, { status: 500 });
  }
}
