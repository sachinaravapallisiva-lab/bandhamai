import type { SupabaseClient, User } from "@supabase/supabase-js";
import { tableHasColumn } from "./server-supabase";
import { SUPPORT_TICKETS_TABLE } from "./support";
import {
  firstNameOnly,
  phonesMatch,
  type VoiceCaller,
} from "./voice-support";

const AUTH_PAGE_SIZE = 200;
const AUTH_PAGE_LIMIT = 10;

export type VoiceMember = {
  userId: string;
  firstName: string;
  matchedOn: "email" | "phone";
};

type AuthLookup = {
  user: User;
  matchedOn: "email" | "phone";
};

async function listAuthPages(supabase: SupabaseClient) {
  const found: User[] = [];
  for (let page = 1; page <= AUTH_PAGE_LIMIT; page++) {
    const result = await supabase.auth.admin.listUsers({ page, perPage: AUTH_PAGE_SIZE });
    const users = result.data?.users || [];
    found.push(...users);
    if (users.length < AUTH_PAGE_SIZE) break;
  }
  return found;
}

function emailOf(user: User) {
  return (user.email || "").trim().toLowerCase();
}

function phoneOf(user: User) {
  return (user.phone || "").trim();
}

async function findAuthUser(supabase: SupabaseClient, caller: VoiceCaller): Promise<AuthLookup | null> {
  if (!caller.email && !caller.phone) return null;
  const users = await listAuthPages(supabase);
  const emailMatch = caller.email
    ? users.find(function (row) {
        return emailOf(row) === caller.email;
      })
    : undefined;
  const phoneMatch = caller.phone
    ? users.find(function (row) {
        return phonesMatch(phoneOf(row), caller.phone);
      })
    : undefined;
  if (emailMatch && phoneMatch && emailMatch.id !== phoneMatch.id) {
    return null;
  }
  if (emailMatch) return { user: emailMatch, matchedOn: "email" };
  if (phoneMatch) return { user: phoneMatch, matchedOn: "phone" };
  return null;
}

async function findProfileUserId(
  supabase: SupabaseClient,
  caller: VoiceCaller
): Promise<{ userId: string; matchedOn: "email" | "phone" } | null> {
  const hasEmail = await tableHasColumn(supabase, "profiles", "email");
  const hasPhone = await tableHasColumn(supabase, "profiles", "phone");
  if (caller.email && hasEmail) {
    const { data } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", caller.email)
      .limit(2);
    const rows = (data || []) as Array<{ user_id?: unknown }>;
    const ids = rows
      .map(function (row) {
        return typeof row.user_id === "string" ? row.user_id : "";
      })
      .filter(Boolean);
    if (ids.length === 1) return { userId: ids[0], matchedOn: "email" };
  }
  if (caller.phone && hasPhone) {
    const { data } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("phone", caller.phone)
      .limit(2);
    const rows = (data || []) as Array<{ user_id?: unknown }>;
    const ids = rows
      .map(function (row) {
        return typeof row.user_id === "string" ? row.user_id : "";
      })
      .filter(Boolean);
    if (ids.length === 1) return { userId: ids[0], matchedOn: "phone" };
  }
  return null;
}

async function firstNameForUser(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return firstNameOnly((data as { full_name?: unknown } | null)?.full_name);
}

/**
 * Identify the caller only. Never returns about text, photos, Instagram,
 * other members, or a profile list.
 */
export async function identifyVoiceMember(
  supabase: SupabaseClient,
  caller: VoiceCaller
): Promise<VoiceMember | null> {
  const authMatch = await findAuthUser(supabase, caller);
  if (authMatch) {
    return {
      userId: authMatch.user.id,
      firstName: await firstNameForUser(supabase, authMatch.user.id),
      matchedOn: authMatch.matchedOn,
    };
  }
  const profileMatch = await findProfileUserId(supabase, caller);
  if (!profileMatch) return null;
  return {
    userId: profileMatch.userId,
    firstName: await firstNameForUser(supabase, profileMatch.userId),
    matchedOn: profileMatch.matchedOn,
  };
}

export async function voiceTicketsReady(supabase: SupabaseClient) {
  const hasPhone = await tableHasColumn(supabase, SUPPORT_TICKETS_TABLE, "caller_phone");
  return hasPhone;
}
