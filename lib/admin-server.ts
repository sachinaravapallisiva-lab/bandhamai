import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { isAdminEmail } from "./internal-admin";
import {
  getAnonSupabase,
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
} from "./server-supabase";

const UNAVAILABLE = { error: "This page is not available." };
export const ADMIN_NO_STORE = { "Cache-Control": "private, no-store" };

export function adminUnavailable() {
  return NextResponse.json(UNAVAILABLE, { status: 404, headers: ADMIN_NO_STORE });
}

export async function requireAdminRequest(
  request: Request
): Promise<{ user: User } | { response: NextResponse }> {
  if (!hasBearerToken(request)) return { response: adminUnavailable() };

  const verifier = getServiceSupabase() || getAnonSupabase();
  if (!verifier) return { response: adminUnavailable() };

  const { user } = await getRequestUser(request, verifier);
  if (!user || !isAdminEmail(user.email)) return { response: adminUnavailable() };

  return { user };
}
