import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BIRTH_DETAILS_TABLE,
  birthChartCoordinates,
  birthChartDatetime,
  birthFingerprint,
  hasCompleteBirthDetails,
  parseBirthDetailsInput,
} from "./birth-details";
import {
  GUN_MILAN_API_ERROR,
  GUN_MILAN_NOT_CONFIGURED,
  GUN_MILAN_PROVIDER_ID,
  GUN_MILAN_REPORTS_TABLE,
  GUN_MILAN_SQL_FILE,
  assignChartSlots,
  decideGunMilanAccess,
  gunMilanKeysReady,
  pairProfileIds,
  presentGunMilanReport,
  type GunMilanView,
} from "./gun-milan";
import { getGunMilanProvider } from "./gun-milan-prokerala";
import { KUNDLI_SHARE_COLUMN, KUNDLI_UNAVAILABLE_ERROR, parseKundliShare } from "./kundli-share";
import { tableExists, tableHasColumn } from "./server-supabase";

export function pairBirthFingerprint(first: string, second: string) {
  const parts = [first, second].sort();
  return createHash("sha256").update(parts.join("||")).digest("hex");
}

export async function gunMilanTablesReady(supabase: SupabaseClient) {
  const [birth, reports, share] = await Promise.all([
    tableExists(supabase, BIRTH_DETAILS_TABLE),
    tableExists(supabase, GUN_MILAN_REPORTS_TABLE),
    tableHasColumn(supabase, "profiles", KUNDLI_SHARE_COLUMN),
  ]);
  return { birth, reports, share, ready: birth && reports && share };
}

export async function loadBirthDetails(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from(BIRTH_DETAILS_TABLE)
    .select("user_id, profile_id, birth_date, birth_time, place_name, latitude, longitude, timezone")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return { row: null, error: error.message };
  return { row: data as Record<string, unknown> | null, error: null };
}

export async function saveBirthDetails(
  supabase: SupabaseClient,
  options: {
    userId: string;
    profileId?: string | null;
    body: Record<string, unknown>;
  }
) {
  const parsed = parseBirthDetailsInput(options.body);
  if (!parsed.ok) return { ok: false as const, error: parsed.error, status: 400 as const };

  const row = {
    user_id: options.userId,
    profile_id: options.profileId || null,
    birth_date: parsed.birth_date,
    birth_time: parsed.birth_time,
    place_name: parsed.place_name,
    latitude: parsed.latitude,
    longitude: parsed.longitude,
    timezone: parsed.timezone,
    updated_at: new Date().toISOString(),
  };

  const saved = await supabase.from(BIRTH_DETAILS_TABLE).upsert(row, { onConflict: "user_id" }).select().maybeSingle();
  if (saved.error) {
    return { ok: false as const, error: saved.error.message, status: 400 as const };
  }

  if (options.profileId && (await tableHasColumn(supabase, "profiles", "dob"))) {
    await supabase.from("profiles").update({ dob: parsed.birth_date }).eq("id", options.profileId);
  }

  await supabase
    .from(GUN_MILAN_REPORTS_TABLE)
    .delete()
    .or("user_low.eq." + options.userId + ",user_high.eq." + options.userId);

  return { ok: true as const, details: saved.data };
}

function chartFromBirth(row: Record<string, unknown>) {
  const parsed = parseBirthDetailsInput(row);
  if (!parsed.ok) return null;
  const datetime = birthChartDatetime(parsed);
  const coordinates = birthChartCoordinates(parsed);
  if (!datetime || !coordinates) return null;
  return { datetime, coordinates, fingerprint: birthFingerprint(parsed) };
}

async function loadCachedReport(
  supabase: SupabaseClient,
  profileLow: string,
  profileHigh: string,
  fingerprint: string
) {
  const { data, error } = await supabase
    .from(GUN_MILAN_REPORTS_TABLE)
    .select("provider, raw, birth_fingerprint")
    .eq("profile_low", profileLow)
    .eq("profile_high", profileHigh)
    .maybeSingle();
  if (error || !data) return null;
  if (data.birth_fingerprint !== fingerprint) return null;
  return presentGunMilanReport(data.raw, typeof data.provider === "string" ? data.provider : GUN_MILAN_PROVIDER_ID);
}

async function storeReport(
  supabase: SupabaseClient,
  row: {
    profile_low: string;
    profile_high: string;
    user_low: string;
    user_high: string;
    provider: string;
    raw: unknown;
    birth_fingerprint: string;
  }
) {
  const now = new Date().toISOString();
  const saved = await supabase
    .from(GUN_MILAN_REPORTS_TABLE)
    .upsert(
      {
        ...row,
        updated_at: now,
      },
      { onConflict: "profile_low,profile_high" }
    )
    .select("raw, provider")
    .maybeSingle();
  if (saved.error) return { error: saved.error.message };
  return { error: null };
}

export async function loadStoredGunMilanReport(
  supabase: SupabaseClient,
  options: { viewerUserId: string; otherProfileId: string }
): Promise<GunMilanView | null> {
  const ready = await gunMilanTablesReady(supabase);
  if (!ready.reports) return null;

  const other = await supabase
    .from("profiles")
    .select("id, user_id, status, " + KUNDLI_SHARE_COLUMN)
    .eq("id", options.otherProfileId)
    .maybeSingle();
  if (other.error || !other.data) return null;
  const otherRow = other.data as unknown as Record<string, unknown>;

  const viewer = await supabase
    .from("profiles")
    .select("id, user_id")
    .eq("user_id", options.viewerUserId)
    .limit(1)
    .maybeSingle();
  if (viewer.error || !viewer.data) return null;
  const viewerRow = viewer.data as unknown as Record<string, unknown>;

  const [low, high] = pairProfileIds(String(viewerRow.id), String(otherRow.id));
  const cached = await supabase
    .from(GUN_MILAN_REPORTS_TABLE)
    .select("provider, raw, user_low, user_high")
    .eq("profile_low", low)
    .eq("profile_high", high)
    .maybeSingle();
  if (cached.error || !cached.data) return null;
  const cachedRow = cached.data as unknown as Record<string, unknown>;

  const parties = [cachedRow.user_low, cachedRow.user_high].map(function (id) {
    return id == null ? "" : String(id);
  });
  if (parties.indexOf(options.viewerUserId) < 0) return null;
  if (!parseKundliShare(otherRow[KUNDLI_SHARE_COLUMN])) return null;

  return presentGunMilanReport(
    cachedRow.raw,
    typeof cachedRow.provider === "string" ? cachedRow.provider : GUN_MILAN_PROVIDER_ID
  );
}

export type GunMilanLookup =
  | {
      ok: true;
      configured: boolean;
      cached: boolean;
      report: GunMilanView | null;
    }
  | {
      ok: false;
      status: number;
      error: string;
      configured: boolean;
      reason?: string;
    };

export async function lookupGunMilan(
  supabase: SupabaseClient,
  options: {
    viewerUserId: string;
    otherProfileId: string;
    run: boolean;
  }
): Promise<GunMilanLookup> {
  const configured = gunMilanKeysReady();
  const tables = await gunMilanTablesReady(supabase);
  if (!tables.ready) {
    return {
      ok: false,
      status: 503,
      error: "Run " + GUN_MILAN_SQL_FILE + " in the Supabase SQL editor to add Gun Milan.",
      configured,
      reason: "sql_missing",
    };
  }

  const other = await supabase
    .from("profiles")
    .select("id, user_id, status, gender, " + KUNDLI_SHARE_COLUMN)
    .eq("id", options.otherProfileId)
    .maybeSingle();
  if (other.error) {
    return { ok: false, status: 400, error: other.error.message, configured };
  }
  if (!other.data) {
    return { ok: false, status: 404, error: KUNDLI_UNAVAILABLE_ERROR, configured, reason: "unavailable" };
  }
  const otherRow = other.data as unknown as Record<string, unknown>;

  const viewer = await supabase
    .from("profiles")
    .select("id, user_id, gender")
    .eq("user_id", options.viewerUserId)
    .limit(1)
    .maybeSingle();
  if (viewer.error) {
    return { ok: false, status: 400, error: viewer.error.message, configured };
  }
  if (!viewer.data) {
    return { ok: false, status: 404, error: "Create a profile first.", configured, reason: "no_own_profile" };
  }
  const viewerRow = viewer.data as unknown as Record<string, unknown>;

  const otherUserId = typeof otherRow.user_id === "string" ? otherRow.user_id : "";
  const [ownBirth, otherBirth] = await Promise.all([
    loadBirthDetails(supabase, options.viewerUserId),
    otherUserId ? loadBirthDetails(supabase, otherUserId) : Promise.resolve({ row: null, error: null }),
  ]);
  if (ownBirth.error || otherBirth.error) {
    return { ok: false, status: 400, error: ownBirth.error || otherBirth.error || "Could not read birth details.", configured };
  }

  const access = decideGunMilanAccess({
    viewerUserId: options.viewerUserId,
    targetUserId: otherUserId,
    targetStatus: typeof otherRow.status === "string" ? otherRow.status : "",
    kundliShare: otherRow[KUNDLI_SHARE_COLUMN],
    viewerHasBirth: hasCompleteBirthDetails(ownBirth.row),
    otherHasBirth: hasCompleteBirthDetails(otherBirth.row),
  });
  if (!access.ok) {
    return {
      ok: false,
      status: access.status,
      error: access.error,
      configured,
      reason: access.reason,
    };
  }

  const ownChart = ownBirth.row ? chartFromBirth(ownBirth.row) : null;
  const otherChart = otherBirth.row ? chartFromBirth(otherBirth.row) : null;
  if (!ownChart || !otherChart) {
    return { ok: false, status: 409, error: "Birth details are not complete.", configured, reason: "missing_birth" };
  }

  const slots = assignChartSlots({
    viewerGender: viewerRow.gender,
    otherGender: otherRow.gender,
    viewer: ownChart,
    other: otherChart,
  });
  if (!slots.ok) {
    return { ok: false, status: 409, error: slots.error, configured, reason: "gender" };
  }

  const [profileLow, profileHigh] = pairProfileIds(String(viewerRow.id), String(otherRow.id));
  const [userLow, userHigh] =
    options.viewerUserId < otherUserId ? [options.viewerUserId, otherUserId] : [otherUserId, options.viewerUserId];
  const fingerprint = pairBirthFingerprint(ownChart.fingerprint, otherChart.fingerprint);
  const cached = await loadCachedReport(supabase, profileLow, profileHigh, fingerprint);
  if (cached) {
    return { ok: true, configured, cached: true, report: cached };
  }

  if (!options.run) {
    return { ok: true, configured, cached: false, report: null };
  }

  if (!configured) {
    return {
      ok: false,
      status: 503,
      error: GUN_MILAN_NOT_CONFIGURED,
      configured: false,
      reason: "not_configured",
    };
  }

  const provider = getGunMilanProvider();
  const girl = slots.girl as { datetime: string; coordinates: string };
  const boy = slots.boy as { datetime: string; coordinates: string };

  let raw: unknown;
  try {
    raw = await provider.fetchKundliMatching({ girl, boy });
  } catch (err) {
    const message = err instanceof Error ? err.message : GUN_MILAN_API_ERROR;
    if (message === "GUN_MILAN_NOT_CONFIGURED") {
      return {
        ok: false,
        status: 503,
        error: GUN_MILAN_NOT_CONFIGURED,
        configured: false,
        reason: "not_configured",
      };
    }
    return { ok: false, status: 502, error: GUN_MILAN_API_ERROR, configured, reason: "provider" };
  }

  const stored = await storeReport(supabase, {
    profile_low: profileLow,
    profile_high: profileHigh,
    user_low: userLow,
    user_high: userHigh,
    provider: provider.id,
    raw,
    birth_fingerprint: fingerprint,
  });
  if (stored.error) {
    return { ok: false, status: 400, error: stored.error, configured };
  }

  return {
    ok: true,
    configured,
    cached: false,
    report: presentGunMilanReport(raw, provider.id),
  };
}
