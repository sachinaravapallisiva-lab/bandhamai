"use client";

import { useState } from "react";

export default function Home() {
  const [forWhom, setForWhom] = useState<"myself" | "child">("myself");
  const [query, setQuery] = useState("");
  const [visaStatus, setVisaStatus] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Logo / Title */}
        <h1 className="text-2xl font-serif text-center mb-10 tracking-tight">
          bandhamai
        </h1>

        {/* Main headline */}
        <h2 className="text-3xl md:text-4xl font-serif text-center leading-tight mb-3">
          Say who you&apos;re hoping to find.
        </h2>

        <p className="text-center text-gray-500 mb-8">
          One honest paragraph does more than thirty filters.
        </p>

        {/* For myself / For my child */}
        <div className="flex gap-3 justify-center mb-6">
          <button
            onClick={() => setForWhom("myself")}
            className={`px-5 py-2 rounded-full border text-sm transition ${
              forWhom === "myself"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            For myself
          </button>
          <button
            onClick={() => setForWhom("child")}
            className={`px-5 py-2 rounded-full border text-sm transition ${
              forWhom === "child"
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            For my child
          </button>
        </div>

        {/* Text area */}
        <div className="relative mb-6">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Someone who cooks on Sundays, argues about films, and won't ask me to move back to India..."
            className="w-full h-36 p-4 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-black text-gray-800"
          />
          <button className="absolute bottom-3 right-3 text-sm text-gray-400 hover:text-black">
            Speak
          </button>
        </div>

        {/* Visa status chips */}
        <div className="mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
            Status in US
          </p>
          <div className="flex flex-wrap gap-2">
            {["Citizen", "Green card", "H1B", "In India"].map((status) => (
              <button
                key={status}
                onClick={() => setVisaStatus(status)}
                className={`px-4 py-1.5 rounded-full border text-sm transition ${
                  visaStatus === status
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Find matches button */}
        <button className="w-full bg-black text-white py-4 rounded-full text-lg font-medium hover:bg-gray-900 transition">
          Find matches
        </button>
      </div>
    </div>
  );
}