export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const incoming = await req.formData();
    const file = incoming.get("file");

    if (!file) {
      return Response.json({ error: "No audio file" }, { status: 400 });
    }

    const form = new FormData();
    form.append("language", "en");
    form.append("format", "true");
    form.append("file", file);

    const res = await fetch("https://api.x.ai/v1/stt", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}` },
      body: form,
    });

    if (!res.ok) {
      const detail = await res.text();
      return Response.json({ error: "STT failed", detail }, { status: 502 });
    }

    const data = await res.json();
    return Response.json({ text: data.text });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
