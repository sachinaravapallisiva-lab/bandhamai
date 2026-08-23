import type { SupabaseClient } from "@supabase/supabase-js";
import { INSTAGRAM_COLUMN } from "./instagram";
import {
  INSTAGRAM_SHARES_TABLE,
  cleanInstagramHandle,
} from "./instagram-shares";
import { asId, resolveProfileUserId } from "./safety-server";
import { tableExists, tableHasColumn } from "./server-supabase";

export async function instagramSharesReady(supabase: SupabaseClient) {
  return tableExists(supabase, INSTAGRAM_SHARES_TABLE);
}

export async function loadInstagramGrantedOwnerIds(
  supabase: SupabaseClient,
  viewerId: string,
  ownerIds: string[]
): Promise<Set<string>> {
  const granted = new Set<string>();
  const viewer = asId(viewerId);
  const ids = Array.from(
    new Set(
      ownerIds.filter(function (id) {
        return typeof id === "string" && id.trim().length > 0 && id !== viewer;
      })
    )
  );
  if (!viewer || !ids.length) return granted;
  if (!(await instagramSharesReady(supabase))) return granted;

  const { data, error } = await supabase
    .from(INSTAGRAM_SHARES_TABLE)
    .select("owner_user_id")
    .eq("viewer_user_id", viewer)
    .in("owner_user_id", ids);

  if (error || !Array.isArray(data)) return granted;

  for (const row of data) {
    const owner = asId((row as { owner_user_id?: unknown }).owner_user_id);
    if (owner) granted.add(owner);
  }
  return granted;
}

export async function resolveSharePeerUserId(
  supabase: SupabaseClient,
  profileId: string,
  userId: string
): Promise<string | null> {
  const direct = asId(userId);
  if (direct) return direct;
  const fromProfile = asId(profileId);
  if (!fromProfile) return null;
  return resolveProfileUserId(supabase, fromProfile);
}

export async function loadOwnInstagramHandle(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  if (!(await tableHasColumn(supabase, "profiles", INSTAGRAM_COLUMN))) return "";
  const { data, error } = await supabase
    .from("profiles")
    .select(INSTAGRAM_COLUMN)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return "";
  return cleanInstagramHandle((data as { instagram?: unknown }).instagram);
}

export async function loadPeerInstagramHandle(
  supabase: SupabaseClient,
  ownerUserId: string
): Promise<string> {
  return loadOwnInstagramHandle(supabase, ownerUserId);
}

export async function findInstagramShare(
  supabase: SupabaseClient,
  ownerUserId: string,
  viewerUserId: string
) {
  const { data, error } = await supabase
    .from(INSTAGRAM_SHARES_TABLE)
    .select("id, owner_user_id, viewer_user_id, created_at")
    .eq("owner_user_id", ownerUserId)
    .eq("viewer_user_id", viewerUserId)
    .maybeSingle();
  if (error || !data) return null;
  return data as {
    id: string;
    owner_user_id: string;
    viewer_user_id: string;
    created_at: string;
  };
}
