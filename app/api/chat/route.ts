import { handleGuruChat } from "../../../lib/guru";

/**
 * Legacy path. The violet orb uses /api/guru.
 * This stays as the same love-guru handler so leftover clients
 * cannot get a profile-search or ghostwritten-chat prompt.
 */
export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleGuruChat(request);
}
