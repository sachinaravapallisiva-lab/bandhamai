import type { SupabaseClient } from "@supabase/supabase-js";
import { ENTITLED_STATUSES, SUBSCRIPTIONS_TABLE } from "./billing";
import { subscriptionsTableReady } from "./entitlement";
import { membershipFromEntitled } from "./membership";
import { getServiceSupabase } from "./server-supabase";

/**
 * User ids with an existing subscriptions row in active or trialing.
 * Missing table, failed read, or no row stays Regular. Never invent Premium.
 */
export async function loadPremiumUserIds(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Set<string>> {
  const premium = new Set<string>();
  const ids = Array.from(
    new Set(
      userIds.filter(function (id) {
        return typeof id === "string" && id.trim().length > 0;
      })
    )
  );
  if (!ids.length) return premium;

  const reader = getServiceSupabase() || supabase;
  if (!(await subscriptionsTableReady(reader))) return premium;

  const { data, error } = await reader
    .from(SUBSCRIPTIONS_TABLE)
    .select("user_id, status")
    .in("user_id", ids)
    .in("status", Array.from(ENTITLED_STATUSES));

  if (error || !Array.isArray(data)) return premium;

  for (const row of data) {
    const userId = typeof row.user_id === "string" ? row.user_id : "";
    if (userId) premium.add(userId);
  }
  return premium;
}

export function attachMembership(
  row: Record<string, unknown>,
  premiumUserIds: Set<string>
): Record<string, unknown> {
  const userId = typeof row.user_id === "string" ? row.user_id : "";
  return {
    ...row,
    membership: membershipFromEntitled(!!userId && premiumUserIds.has(userId)),
  };
}
