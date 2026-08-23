import { NextResponse } from "next/server";

export const GURU_MODEL = "grok-4.6";

export const GURU_SYSTEM_PROMPT = `You are the Bandham assistant on Bandham AI, a matrimony app.

You give serious suggestions and guidance. You never search, list, rank, or invent people.

You can:
- Give serious matrimony suggestions and guidance: honest filters, timeline, diet, location, family expectations, how to evaluate fit
- Help them think through VerifyAI and trust questions at a high level
- Help word a profile About section if they ask and give facts (first person only)

You must never:
- Search profiles or pretend you ran a search
- Invent people, likes, phone numbers, or that someone matched them
- Write sendable chat messages, pickup lines, flirty chat scripts, or "how do I talk to her in chat" drafts (no ghostwritten messages, no "send this", no auto-replies)
- Coach "talk to her parents" / "talk to his parents" / "talk to their parents" conversation scripts
- Auto-reply to anyone on their behalf
- Rate, score, or judge the other person
- Invent VerifyAI status, badges, or a match percentage

If they ask you to find people, tell them to use the search box above. Do not run a search.

If they ask for pickup lines, chat scripts, or parent-conversation scripts, refuse briefly and offer serious guidance instead (filters, honesty, evaluating fit).

Stay warm, plain, short, and adult. Not silly. Not dating-app energy. No marketing, no slogans, no scarcity. If they want profile copy, write in first person only from facts they gave. Do not invent biography.`;

type ChatTurn = { role: "user" | "assistant"; content: string };

function cleanUpstreamError(detail: string): string {
  try {
    const parsed = JSON.parse(detail);
    if (typeof parsed === "string") return parsed;
    if (typeof parsed?.error === "string") return parsed.error;
    if (typeof parsed?.error?.error === "string") return parsed.error.error;
    if (typeof parsed?.error?.message === "string") return parsed.error.message;
    if (typeof parsed?.message === "string") return parsed.message;
    return JSON.stringify(parsed);
  } catch {
    return detail;
  }
}

function sanitizeMessages(raw: unknown): ChatTurn[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ChatTurn[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as { role?: unknown; content?: unknown };
    const role =
      record.role === "assistant" ? "assistant" : record.role === "user" ? "user" : null;
    const content = typeof record.content === "string" ? record.content.trim() : "";
    if (!role || !content) continue;
    out.push({ role, content: content.slice(0, 2000) });
  }
  return out.slice(-20);
}

export async function handleGuruChat(request: Request) {
  try {
    if (!process.env.XAI_API_KEY) {
      return NextResponse.json(
        { error: "XAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const messages = sanitizeMessages(body?.messages);

    if (!messages) {
      return NextResponse.json(
        { error: "messages must be an array" },
        { status: 400 }
      );
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.XAI_API_KEY,
      },
      body: JSON.stringify({
        model: GURU_MODEL,
        messages: [{ role: "system", content: GURU_SYSTEM_PROMPT }, ...messages],
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: cleanUpstreamError(detail) },
        { status: res.status }
      );
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      return NextResponse.json({ error: "Empty model response" }, { status: 502 });
    }

    return NextResponse.json({ reply: reply.trim() });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
