import { handleGuruChat } from "../../../lib/guru";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleGuruChat(request);
}
