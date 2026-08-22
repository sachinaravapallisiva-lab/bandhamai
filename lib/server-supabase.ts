import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function supabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export function getServiceSupabase(): SupabaseClient | null {
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export function getAnonSupabase(): SupabaseClient | null {
  const url = supabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function getRequestUser(
  request: Request,
  supabase?: SupabaseClient | null
): Promise<{ user: User | null; error: string | null }> {
  const header = request.headers.get("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  if (!token) {
    return { user: null, error: "Sign in to continue." };
  }

  const client = supabase || getServiceSupabase() || getAnonSupabase();
  if (!client) {
    return { user: null, error: "Server is missing Supabase configuration." };
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return { user: null, error: "Sign in to continue." };
  }
  return { user: data.user, error: null };
}

export function missingConfigResponse() {
  return NextResponse.json(
    { error: "Server is missing Supabase configuration." },
    { status: 500 }
  );
}

export function unauthorizedResponse(message = "Sign in to continue.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function hasBearerToken(request: Request) {
  const header = request.headers.get("authorization") || "";
  return header.toLowerCase().startsWith("bearer ") && header.slice(7).trim().length > 0;
}

/** PostgREST returns 42703 when a column is not on the table. */
export async function tableHasColumn(
  supabase: SupabaseClient,
  table: string,
  column: string
): Promise<boolean> {
  const { error } = await supabase.from(table).select(column).limit(0);
  if (!error) return true;
  const code = "code" in error ? String(error.code) : "";
  const message = (error.message || "").toLowerCase();
  if (code === "42703") return false;
  if (message.includes("does not exist") || message.includes("could not find")) {
    return false;
  }
  return true;
}
