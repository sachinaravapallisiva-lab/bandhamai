/**
 * Internal member aggregates. Signed in founder only.
 * Selects city + dob/age. Counts in memory. No PII rows.
 */
import { NextResponse } from "next/server";
import { isFounderAdminEmail } from "../../../lib/internal-admin";
import {
  aggregateMemberMetrics,
  emptyMemberMetrics,
  type MetricsRow,
} from "../../../lib/metrics";
import {
  getAnonSupabase,
  getRequestUser,
  getServiceSupabase,
  hasBearerToken,
  tableExists,
  tableHasColumn,
} from "../../../lib/server-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 500;
const PAGE_LIMIT = 200;
const UNAVAILABLE = { error: "This page is not available." };
const NO_STORE = { "Cache-Control": "private, no-store" };

function unavailable() {
  return NextResponse.json(UNAVAILABLE, { status: 404, headers: NO_STORE });
}

function closed(reason: "missing_config" | "unreadable") {
  return NextResponse.json(
    { available: false, reason: reason, ...emptyMemberMetrics() },
    { status: 200, headers: NO_STORE }
  );
}

function asRow(raw: Record<string, unknown>): MetricsRow {
  return {
    city: raw.city,
    dob: raw.dob,
    age: raw.age,
  };
}

export async function GET(request: Request) {
  try {
    if (!hasBearerToken(request)) return unavailable();

    const verifier = getServiceSupabase() || getAnonSupabase();
    if (!verifier) return unavailable();

    const { user } = await getRequestUser(request, verifier);
    if (!user || !isFounderAdminEmail(user.email)) return unavailable();

    const supabase = getServiceSupabase();
    if (!supabase) return closed("missing_config");

    if (!(await tableExists(supabase, "profiles"))) {
      return closed("unreadable");
    }
    if (!(await tableHasColumn(supabase, "profiles", "user_id"))) {
      return closed("unreadable");
    }
    if (!(await tableHasColumn(supabase, "profiles", "city"))) {
      return closed("unreadable");
    }

    const columns = ["city"];
    if (await tableHasColumn(supabase, "profiles", "dob")) columns.push("dob");
    if (await tableHasColumn(supabase, "profiles", "age")) columns.push("age");

    const rows: MetricsRow[] = [];
    for (let page = 0; page < PAGE_LIMIT; page++) {
      const from = page * PAGE_SIZE;
      const result = await supabase
        .from("profiles")
        .select(columns.join(","))
        .not("user_id", "is", null)
        .range(from, from + PAGE_SIZE - 1);

      if (result.error) return closed("unreadable");

      const batch = Array.isArray(result.data) ? result.data : [];
      batch.forEach(function (item) {
        rows.push(asRow(item as unknown as Record<string, unknown>));
      });
      if (batch.length < PAGE_SIZE) break;
    }

    return NextResponse.json(
      { available: true, ...aggregateMemberMetrics(rows) },
      { status: 200, headers: NO_STORE }
    );
  } catch {
    return closed("unreadable");
  }
}
