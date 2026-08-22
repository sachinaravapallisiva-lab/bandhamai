import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You help people write matrimony profiles on bandham ai.
Users describe someone in fragments — job, habits, family, what they want.
Turn it into one warm, natural paragraph in first person.
Keep it under 80 words. No clichés, no flowery language.
If they ask for a warmer or shorter version, rewrite the last one.`;

const CHAT_MODEL = "grok-4.6";

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

export async function POST(request: Request) {
  try {
    if (!process.env.XAI_API_KEY) {
      return NextResponse.json(
        { error: "XAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const messages = body?.messages;

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages must be an array" },
        { status: 400 }
      );
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 500,
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

    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
