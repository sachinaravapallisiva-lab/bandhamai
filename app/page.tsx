"use client";

import { useState } from "react";

export default function Home() {
  const [forWhom, setForWhom] = useState<"myself" | "child">("myself");
  const [query, setQuery] = useState("");
  const [visaStatus, setVisaStatus] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center px-5 py-10 sm:py-16">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <h1 className="text-xl font-medium text-center mb-12 tracking-wide text-gray-800">
          bandham ai
        </h1>

        {/* Headline */}
        <h2 className="text-[28px] sm:text-4xl font-serif text-center leading-snug mb-3 text-gray-900">
          Say who you&apos;re hoping to find.
        </h2>

        <p className="text-center text-gray-500 text-[15px] mb-8">
          One honest paragraph does more than thirty filters.
        </p>

        {/* Toggle */}
        <div className="flex gap-2 justify-center mb-7">
          <button
            onClick={() => setForWhom("myself")}
            className={`px-5 py-2.5 rounded-full text-sm transition ${
              forWhom === "myself"
                ? "bg-black text-white"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            For myself
          </button>
          <button
            onClick={() => setForWhom("child")}
            className={`px-5 py-2.5 rounded-full text-sm transition ${
              forWhom === "child"
                ? "bg-black text-white"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            For my child
          </button>
        </div>

        {/* Text area */}
        <div className="relative mb-7">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Someone who cooks on Sundays, argues about films, and won't ask me to move back to India..."
            className="w-full h-40 p-4 bg-white border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-1 focus:ring-black text-[15px] text-gray-800 leading-relaxed"
          />
          <button className="absolute bottom-3 right-4 text-sm text-gray-400">
            Speak
          </button>
        </div>

        {/* Status */}
        <div className="mb-9">
          <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-3">
            Status in US
          </p>
          <div className="flex flex-wrap gap-2">
            {["Citizen", "Green card", "H1B", "In India"].map((status) => (
              <button
                key={status}
                onClick={() => setVisaStatus(status)}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  visaStatus === status
                    ? "bg-black text-white"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Button */}
        <button className="w-full bg-black text-white py-4 rounded-full text-[16px] font-medium active:scale-[0.98] transition">
          Find matches
        </button>
      </div>
    </div>
  );
}