"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function AssistantPanel({
  onUse,
}: {
  onUse: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages([
        ...next,
        {
          role: "assistant",
          content: data.reply ?? "Something went wrong. Try again.",
        },
      ]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Couldn't reach the assistant." },
      ]);
    }
    setLoading(false);
  }

  const lastReply = [...messages].reverse().find((m) => m.role === "assistant");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 rounded-full bg-black px-5 py-3 text-white shadow-lg"
      >
        bandham ai assistant
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 flex h-full w-full flex-col border-l bg-white sm:w-96">
      <div className="flex items-center justify-between border-b p-4">
        <span className="font-medium">bandham ai assistant</span>
        <button onClick={() => setOpen(false)}>✕</button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">HOW CAN I HELP?</p>
            <button
              onClick={() =>
                send(
                  "Help me write an About section. Ask me what you need to know."
                )
              }
              className="w-full rounded border p-2 text-left text-sm"
            >
              Help me write
            </button>
            <button
              onClick={() => send("What should I ask about a potential match?")}
              className="w-full rounded border p-2 text-left text-sm"
            >
              What should I ask?
            </button>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded bg-gray-100 p-2 text-sm"
                : "max-w-[85%] rounded bg-blue-50 p-2 text-sm"
            }
          >
            {m.content}
          </div>
        ))}

        {loading && <p className="text-sm text-gray-400">Thinking…</p>}

        {lastReply && !loading && (
          <div className="flex gap-2">
            <button
              onClick={() => onUse(lastReply.content)}
              className="rounded bg-black px-3 py-1 text-sm text-white"
            >
              Use this
            </button>
            <button
              onClick={() => send("Make that warmer.")}
              className="rounded border px-3 py-1 text-sm"
            >
              Make warmer
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Type or speak..."
          className="flex-1 rounded border p-2 text-sm"
        />
        <button
          onClick={() => send(input)}
          className="rounded bg-black px-3 text-white"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
