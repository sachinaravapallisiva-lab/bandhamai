/**
 * Internal member aggregates. Signed in admin only.
 * Selects city + dob/age. Counts in memory. No PII rows.
 */
import { NextResponse } from "next/server";
import { ADMIN_NO_STORE, adminUnavailable, requireAdminRequest } from "../../../../lib/admin-server";
import {
  aggregateMemberMetrics,
  emptyMemberMetrics,
  type MetricsRow,
} from "../../../../lib/metrics";
import { getServiceSupabase, tableExists, tableHasColumn } from "../../../../lib/server-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 500;
const PAGE_LIMIT = 200;

function closed(reason: "missing_config" | "unreadable") {
  return NextResponse.json(
    { available: false, reason: reason, ...emptyMemberMetrics() },
    { status: 200, headers: ADMIN_NO_STORE }
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
    const gate = await requireAdminRequest(request);
    if ("response" in gate) return gate.response;

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
      { status: 200, headers: ADMIN_NO_STORE }
    );
  } catch {
    return adminUnavailable();
  }
}
