import { supabase } from "./supabase";

export function safeNextPath(raw: string | null | undefined, fallback = "/") {
  if (!raw) return fallback;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return fallback;
}

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

export async function authJsonHeaders() {
  const token = await getAccessToken();
  if (!token) return null;
  return {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  };
}
