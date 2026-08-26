import { NextResponse } from "next/server";
import { ADMIN_NO_STORE, requireAdminRequest } from "../../../../lib/admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gate = await requireAdminRequest(request);
  if ("response" in gate) return gate.response;
  return NextResponse.json({ admin: true }, { status: 200, headers: ADMIN_NO_STORE });
}
