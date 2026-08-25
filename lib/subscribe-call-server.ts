import type { SupabaseClient } from "@supabase/supabase-js";
import { ENTITLED_STATUSES, SUBSCRIPTIONS_TABLE, isEntitledStatus } from "./billing";
import { tableExists, tableHasColumn } from "./server-supabase";
import {
  SUBSCRIBE_CALL_LAST_AT_COLUMN,
  SUBSCRIBE_CALL_OPT_IN_COLUMN,
  SUBSCRIBE_CALL_OPTED_AT_COLUMN,
  SUBSCRIBE_CALL_PHONE_COLUMN,
  SUBSCRIBE_CALL_SQL_FILE,
  decideSubscribeCallEligibility,
  publicEligibleMember,
  type SubscribeCallProfileRow,
} from "./subscribe-call";

export const SUBSCRIBE_CALL_SELECT = [
  "id",
  "user_id",
  "full_name",
  "phone",
  "mother_tongue",
  "status",
  SUBSCRIBE_CALL_OPT_IN_COLUMN,
  SUBSCRIBE_CALL_OPTED_AT_COLUMN,
  SUBSCRIBE_CALL_LAST_AT_COLUMN,
].join(", ");

export async function subscribeCallColumnsReady(supabase: SupabaseClient) {
  const phone = await tableHasColumn(supabase, "profiles", SUBSCRIBE_CALL_PHONE_COLUMN);
  const optIn = await tableHasColumn(supabase, "profiles", SUBSCRIBE_CALL_OPT_IN_COLUMN);
  const lastAt = await tableHasColumn(supabase, "profiles", SUBSCRIBE_CALL_LAST_AT_COLUMN);
  return phone && optIn && lastAt;
}

export async function loadEntitledUserIds(supabase: SupabaseClient) {
  const entitled = new Set<string>();
  if (!(await tableExists(supabase, SUBSCRIPTIONS_TABLE))) return entitled;

  const { data, error } = await supabase
    .from(SUBSCRIPTIONS_TABLE)
    .select("user_id, status")
    .in("status", [...ENTITLED_STATUSES]);

  if (error || !Array.isArray(data)) return entitled;
  for (const row of data) {
    const userId = row && typeof row.user_id === "string" ? row.user_id.trim() : "";
    const status = row && typeof row.status === "string" ? row.status : "";
    if (userId && isEntitledStatus(status)) entitled.add(userId);
  }
  return entitled;
}

function asProfileRow(raw: unknown): SubscribeCallProfileRow | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as SubscribeCallProfileRow;
  if (typeof row.id !== "string" || !row.id) return null;
  return row;
}

export async function listEligibleSubscribeCalls(
  supabase: SupabaseClient,
  now = new Date()
) {
  if (!(await subscribeCallColumnsReady(supabase))) {
    return {
      ready: false as const,
      sql: SUBSCRIBE_CALL_SQL_FILE,
      count: 0,
      members: [] as ReturnType<typeof publicEligibleMember>[],
    };
  }

  const hasDob = await tableHasColumn(supabase, "profiles", "dob");
  const select = hasDob ? SUBSCRIBE_CALL_SELECT + ", dob" : SUBSCRIBE_CALL_SELECT;

  const { data, error } = await supabase.from("profiles").select(select);
  if (error) {
    return {
      ready: true as const,
      sql: SUBSCRIBE_CALL_SQL_FILE,
      count: 0,
      members: [] as ReturnType<typeof publicEligibleMember>[],
      error: error.message,
    };
  }

  const entitled = await loadEntitledUserIds(supabase);
  const members: ReturnType<typeof publicEligibleMember>[] = [];

  for (const raw of Array.isArray(data) ? data : []) {
    const row = asProfileRow(raw);
    if (!row) continue;
    const userId = typeof row.user_id === "string" ? row.user_id.trim() : "";
    const decision = decideSubscribeCallEligibility(row, {
      entitled: !!userId && entitled.has(userId),
      now,
    });
    if (!decision.eligible) continue;
    members.push(publicEligibleMember(row));
  }

  return {
    ready: true as const,
    sql: SUBSCRIBE_CALL_SQL_FILE,
    count: members.length,
    members,
  };
}

export async function optOutSubscribeCall(
  supabase: SupabaseClient,
  profileId: string
) {
  const id = profileId.trim();
  if (!id) return { ok: false as const, error: "Pass a profile id." };
  if (!(await subscribeCallColumnsReady(supabase))) {
    return { ok: false as const, error: "Subscribe call columns are not applied yet.", sql: SUBSCRIBE_CALL_SQL_FILE };
  }

  const updated = await supabase
    .from("profiles")
    .update({ [SUBSCRIBE_CALL_OPT_IN_COLUMN]: false })
    .eq("id", id)
    .select("id, " + SUBSCRIBE_CALL_OPT_IN_COLUMN)
    .maybeSingle();

  if (updated.error) return { ok: false as const, error: updated.error.message };
  if (!updated.data) return { ok: false as const, error: "No profile matched." };
  return { ok: true as const, profile_id: id };
}
