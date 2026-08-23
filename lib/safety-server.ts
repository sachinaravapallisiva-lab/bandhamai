import type { SupabaseClient } from "@supabase/supabase-js";
import { BLOCKS_TABLE, emptyBlockedSet, pairIsBlocked, tableMissingHint, type BlockedSet } from "./safety";
import { tableExists } from "./server-supabase";

export { emptyBlockedSet, pairIsBlocked, tableMissingHint };
export type { BlockedSet };

export type BlockRow = {
  id: string;
  blocked_profile_id: string | null;
  blocked_user_id: string | null;
  created_at: string;
};

export function asId(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function safetyTablesReady(supabase: SupabaseClient) {
  return tableExists(supabase, BLOCKS_TABLE);
}

export async function resolveProfileUserId(
  supabase: SupabaseClient,
  profileId: string
): Promise<string | null> {
  if (!profileId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("id", profileId)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const userId = asId((data as { user_id?: unknown }).user_id);
  return userId || null;
}

export async function resolveUserProfileId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const id = asId((data as { id?: unknown }).id);
  return id || null;
}

/** Profiles / accounts this viewer hid, plus people who hid this viewer. */
export async function loadBlockedSet(
  supabase: SupabaseClient,
  viewerId: string
): Promise<BlockedSet> {
  const empty = emptyBlockedSet();
  if (!(await tableExists(supabase, BLOCKS_TABLE))) return empty;

  const [mine, against] = await Promise.all([
    supabase
      .from(BLOCKS_TABLE)
      .select("blocked_profile_id, blocked_user_id")
      .eq("blocker_id", viewerId),
    supabase
      .from(BLOCKS_TABLE)
      .select("blocker_id, blocked_profile_id")
      .eq("blocked_user_id", viewerId),
  ]);

  const out = emptyBlockedSet();

  if (Array.isArray(mine.data)) {
    mine.data.forEach(function (row: { blocked_profile_id?: unknown; blocked_user_id?: unknown }) {
      const profileId = asId(row.blocked_profile_id);
      const userId = asId(row.blocked_user_id);
      if (profileId) out.profileIds.add(profileId);
      if (userId) out.userIds.add(userId);
    });
  }

  if (Array.isArray(against.data)) {
    const blockerIds: string[] = [];
    against.data.forEach(function (row: { blocker_id?: unknown; blocked_profile_id?: unknown }) {
      const blockerId = asId(row.blocker_id);
      if (blockerId) {
        out.userIds.add(blockerId);
        blockerIds.push(blockerId);
      }
    });
    if (blockerIds.length) {
      const profiles = await supabase.from("profiles").select("id, user_id").in("user_id", blockerIds);
      if (Array.isArray(profiles.data)) {
        profiles.data.forEach(function (row: { id?: unknown }) {
          const id = asId(row.id);
          if (id) out.profileIds.add(id);
        });
      }
    }
  }

  return out;
}

export function applyBlockedFilter<T extends { id?: string; user_id?: string | null }>(
  rows: T[],
  blocked: BlockedSet
) {
  return rows.filter(function (row) {
    const id = asId(row.id);
    const userId = asId(row.user_id);
    return !pairIsBlocked(blocked, id, userId);
  });
}
