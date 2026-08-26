import { authJsonHeaders } from "./client-auth";
import { ADMIN_ME_PATH } from "./admin";

export async function fetchAdminAccess() {
  const headers = await authJsonHeaders();
  if (!headers) return { signedIn: false, admin: false };
  try {
    const res = await fetch(ADMIN_ME_PATH, { headers, cache: "no-store" });
    if (!res.ok) return { signedIn: true, admin: false };
    const data = (await res.json()) as { admin?: unknown };
    return { signedIn: true, admin: data.admin === true };
  } catch {
    return { signedIn: true, admin: false };
  }
}
