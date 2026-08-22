import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function makeClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  return createClient(url, key);
}

let client: SupabaseClient | undefined;

/** Lazy so `next build` can prerender pages when env is injected only at runtime. */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    if (!client) client = makeClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
