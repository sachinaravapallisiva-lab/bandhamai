import type { SupabaseClient } from "@supabase/supabase-js";
import { LIVE_PROFILE_STATUS } from "./profile-search";
import {
  PROFILE_VIEWS_TABLE,
  type ProfileViewer,
  isPreviewProfileId,
  shouldRecordProfileView,
} from "./profile-views";
import { resolveOwnProfileId } from "./presence-server";
import { applyBlockedFilter, loadBlockedSet, resolveProfileUserId } from "./safety-server";
import { tableExists } from "./server-supabase";

export async function profileViewsReady(supabase: SupabaseClient) {
  return tableExists(supabase, PROFILE_VIEWS_TABLE);
}

export async function loadOutgoingViewedIds(
  supabase: SupabaseClient,
  viewerId: string,
  profileIds: string[]
): Promise<Set<string>> {
  const ids = Array.from(
    new Set(
      profileIds.filter(function (id) {
        return typeof id === "string" && id.trim().length > 0;
      })
    )
  );
  const found = new Set<string>();
  if (!viewerId || ids.length === 0) return found;
  if (!(await profileViewsReady(supabase))) return found;

  const { data, error } = await supabase
    .from(PROFILE_VIEWS_TABLE)
    .select("profile_id")
    .eq("viewer_id", viewerId)
    .in("profile_id", ids);
  if (error || !Array.isArray(data)) return found;

  for (const row of data) {
    const id = typeof row.profile_id === "string" ? row.profile_id : "";
    if (id) found.add(id);
  }
  return found;
}

export async function recordProfileView(
  supabase: SupabaseClient,
  input: {
    viewerId: string;
    profileId: string;
  }
): Promise<{ ok: boolean; error?: string; code?: string }> {
  const profileId = input.profileId.trim();
  const ownProfileId = await resolveOwnProfileId(supabase, input.viewerId);
  const viewedUserId = await resolveProfileUserId(supabase, profileId);

  if (
    !shouldRecordProfileView({
      signedIn: true,
      profileId,
      viewerUserId: input.viewerId,
      viewedUserId,
      viewerProfileId: ownProfileId,
    })
  ) {
    return { ok: false, error: "This profile view is not recorded.", code: "skipped" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, user_id")
    .eq("id", profileId)
    .maybeSingle();
  if (profileError || !profile || profile.id == null) {
    return { ok: false, error: "That profile was not found.", code: "not_found" };
  }

  const now = new Date().toISOString();
  const row: Record<string, string | null> = {
    viewer_id: input.viewerId,
    profile_id: profileId,
    viewed_user_id: viewedUserId,
    created_at: now,
  };

  const { error } = await supabase.from(PROFILE_VIEWS_TABLE).upsert(row, {
    onConflict: "viewer_id,profile_id",
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function loadIncomingViewers(
  supabase: SupabaseClient,
  viewedUserId: string
): Promise<ProfileViewer[]> {
  if (!(await profileViewsReady(supabase))) return [];

  const ownProfileId = await resolveOwnProfileId(supabase, viewedUserId);
  let query = supabase
    .from(PROFILE_VIEWS_TABLE)
    .select("viewer_id, profile_id, viewed_user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (ownProfileId) {
    query = query.or("viewed_user_id.eq." + viewedUserId + ",profile_id.eq." + ownProfileId);
  } else {
    query = query.eq("viewed_user_id", viewedUserId);
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data) || data.length === 0) return [];

  const viewerIds = Array.from(
    new Set(
      data
        .map(function (row) {
          return typeof row.viewer_id === "string" ? row.viewer_id : "";
        })
        .filter(Boolean)
    )
  );
  if (viewerIds.length === 0) return [];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, city, photo_url, status")
    .in("user_id", viewerIds)
    .eq("status", LIVE_PROFILE_STATUS);
  if (profileError || !Array.isArray(profiles)) return [];

  let rows = profiles.map(function (row) {
    return {
      ...row,
      id: row.id == null ? "" : String(row.id),
      user_id: typeof row.user_id === "string" ? row.user_id : null,
    };
  });
  const blocked = await loadBlockedSet(supabase, viewedUserId);
  rows = applyBlockedFilter(rows, blocked);

  const byUser = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (row.user_id && !byUser.has(row.user_id)) byUser.set(row.user_id, row);
  }

  const viewers: ProfileViewer[] = [];
  for (const view of data) {
    const viewerId = typeof view.viewer_id === "string" ? view.viewer_id : "";
    if (!viewerId || isPreviewProfileId(viewerId)) continue;
    const profile = byUser.get(viewerId);
    if (!profile || !profile.id) continue;
    viewers.push({
      profileId: profile.id,
      name: typeof profile.full_name === "string" ? profile.full_name.trim() : "",
      city: typeof profile.city === "string" ? profile.city.trim() : "",
      photoUrl: typeof profile.photo_url === "string" ? profile.photo_url.trim() : "",
      viewedAt: view.created_at ? String(view.created_at) : "",
    });
  }
  return viewers;
}
