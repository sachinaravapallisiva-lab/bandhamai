import type { SupabaseClient } from "@supabase/supabase-js";
import { PRESENCE_TABLE, isRecentlySeen } from "./presence";
import { tableExists, tableHasColumn } from "./server-supabase";

export async function loadPresenceByUserIds(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const ids = Array.from(
    new Set(
      userIds.filter(function (id) {
        return typeof id === "string" && id.trim().length > 0;
      })
    )
  );
  if (ids.length === 0) return map;
  if (!(await tableExists(supabase, PRESENCE_TABLE))) return map;

  const { data, error } = await supabase.from(PRESENCE_TABLE).select("user_id, last_seen_at").in("user_id", ids);
  if (error || !Array.isArray(data)) return map;

  for (const row of data) {
    const userId = typeof row.user_id === "string" ? row.user_id : "";
    if (!userId || row.last_seen_at == null) continue;
    map.set(userId, String(row.last_seen_at));
  }
  return map;
}

export function attachLastSeen(
  row: Record<string, unknown>,
  presenceByUser: Map<string, string>
): Record<string, unknown> {
  const userId = typeof row.user_id === "string" ? row.user_id : "";
  const last_seen_at = userId ? presenceByUser.get(userId) || null : null;
  return {
    ...row,
    last_seen_at,
    online: isRecentlySeen(last_seen_at),
  };
}

export async function resolveOwnProfileId(supabase: SupabaseClient, userId: string) {
  if (!(await tableHasColumn(supabase, "profiles", "user_id"))) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data || data.id == null) return null;
  return String(data.id);
}
