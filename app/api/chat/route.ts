import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You help people write matrimony profiles on bandham ai.
Users describe someone in fragments — job, habits, family, what they want.
Turn it into one warm, natural paragraph in first person.
Keep it under 80 words. No clichés, no flowery language.
If they ask for a warmer or shorter version, rewrite the last one.`;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:`Bearer ${process.env.XAI_API_KEY}` ,
      },
      body: JSON.stringify({
        model: "grok-4.6",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json({ error: detail }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
