"use client";

import { useState, useRef, useEffect } from "react";

/* ------------------------------------------------------------------ *
   Bandhamai — floating voice assistant
   Small orb bottom-right. Tap to open a compact panel.
   Records real audio and posts it to /api/transcribe (Grok STT).
 * ------------------------------------------------------------------ */

const SHELL = "#FFFFFF";
const LINE = "#E6E3F5";
const TEXT = "#1E1B36";
const MUTED = "#7B77A8";
const VIOLET = "#6D28D9";

type Line = { who: "you" | "bm"; text: string };

export default function VoiceAssistant() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([
    { who: "bm", text: "Tell me who you're hoping to meet." },
  ]);
  const [state, setState] = useState("idle"); // idle | listening | thinking
  const [amps, setAmps] = useState<number[]>(Array(14).fill(0.2));
  const [draft, setDraft] = useState("");

  const recorderRef = useRef<any>(null);
  const streamRef = useRef<any>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);

  /* keep the transcript pinned to the bottom */
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [lines, state]);

  /* waveform jitter while listening */
  useEffect(() => {
    if (state !== "listening") {
      setAmps(Array(14).fill(0.18));
      return;
    }
    const id = setInterval(() => {
      setAmps(Array.from({ length: 14 }, () => 0.25 + Math.random() * 0.75));
    }, 110);
    return () => clearInterval(id);
  }, [state]);

  function startListening() {
    const nav: any = navigator;
    const win: any = window;
    if (!nav.mediaDevices || !win.MediaRecorder) {
      setLines((p) => p.concat({ who: "bm", text: "This browser can't record audio." }));
      return;
    }

    nav.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream: any) {
        streamRef.current = stream;
        const chunks: any[] = [];
        const rec = new win.MediaRecorder(stream);
        recorderRef.current = rec;

        rec.ondataavailable = function (e: any) {
          if (e.data.size > 0) chunks.push(e.data);
        };

        rec.onstop = function () {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(function (t: any) { t.stop(); });
            streamRef.current = null;
          }
          setState("thinking");

          const form = new FormData();
          form.append("file", new Blob(chunks, { type: "audio/webm" }), "audio.webm");

          fetch("/api/transcribe", { method: "POST", body: form })
            .then(function (r) { return r.json(); })
            .then(function (data: any) {
              setState("idle");
              if (data && data.text) {
                setLines(function (p) {
                  return p.concat({ who: "you", text: data.text });
                });
              } else {
                setLines(function (p) {
                  return p.concat({ who: "bm", text: "I didn't catch that. Try again?" });
                });
              }
            })
            .catch(function () {
              setState("idle");
              setLines(function (p) {
                return p.concat({ who: "bm", text: "Network trouble. Try again?" });
              });
            });
        };

        rec.start();
        setState("listening");
      })
      .catch(function () {
        setLines((p) =>
          p.concat({ who: "bm", text: "Microphone is blocked. Allow it in the address bar." })
        );
      });
  }

  function stopListening() {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }

  function toggleMic() {
    if (state === "listening") stopListening();
    else if (state === "idle") startListening();
  }

  function sendTyped() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setLines(function (p) { return p.concat({ who: "you", text: text }); });
  }

  function onKey(e: any) {
    if (e.key === "Enter") sendTyped();
  }

  const live = state === "listening";
  const busy = state === "thinking";

  /* ---------------- collapsed orb ---------------- */
  if (!open) {
    return (
      <>
        <style>{css}</style>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open voice assistant"
          className="ba-orb ba-focus"
          style={{
            position: "fixed",
            right: "calc(22px + env(safe-area-inset-right, 0px))",
            bottom: "calc(22px + env(safe-area-inset-bottom, 0px))",
            zIndex: 50,
            width: 58,
            height: 58,
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            background: VIOLET,
            display: "grid",
            placeItems: "center",
            boxShadow: "0 8px 26px rgba(109,40,217,.32)",
          }}
        >
          <span className="ba-ping" />
          <span
            style={{
              width: 15,
              height: 15,
              borderRadius: 999,
              background: "#FFFFFF",
              display: "block",
              position: "relative",
            }}
          />
        </button>
      </>
    );
  }

  /* ---------------- expanded panel ---------------- */
  return (
    <>
      <style>{css}</style>
      <div
        className="ba-panel"
        style={{
          position: "fixed",
          right: "calc(22px + env(safe-area-inset-right, 0px))",
          bottom: "calc(22px + env(safe-area-inset-bottom, 0px))",
          zIndex: 50,
          width: "min(340px, calc(100vw - 32px))",
          height: "min(470px, calc(100vh - 48px))",
          background: SHELL,
          color: TEXT,
          borderRadius: 16,
          border: "1px solid " + LINE,
          boxShadow: "0 18px 50px rgba(30,27,54,.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: "14px 15px",
            borderBottom: "1px solid " + LINE,
          }}
        >
          <span className={"ba-dot" + (live || busy ? " on" : "")} style={{ background: live ? VIOLET : busy ? MUTED : LINE }} />
          <span className="ba-serif" style={{ fontSize: 16, flex: 1 }}>Bandhamai</span>
          <span className="ba-sans" style={{ fontSize: 9.5, letterSpacing: ".15em", color: MUTED }}>
            {live ? "LISTENING" : busy ? "THINKING" : "READY"}
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="ba-focus ba-x"
            style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 19, lineHeight: 1, padding: 2 }}
          >
            ×
          </button>
        </div>

        {/* transcript */}
        <div
          ref={feedRef}
          className="ba-feed"
          style={{ flex: 1, overflowY: "auto", padding: "16px 15px", display: "flex", flexDirection: "column", gap: 15 }}
        >
          {lines.map(function (l, i) {
            const mine = l.who === "you";
            return (
              <div key={i} className="ba-line">
                <div
                  className="ba-sans"
                  style={{ fontSize: 9, letterSpacing: ".16em", color: mine ? MUTED : VIOLET, marginBottom: 5 }}
                >
                  {mine ? "YOU" : "BANDHAMAI"}
                </div>
                <p
                  className="ba-serif"
                  style={{
                    margin: 0,
                    fontSize: mine ? 16.5 : 15,
                    lineHeight: 1.45,
                    color: mine ? TEXT : "rgba(30,27,54,.72)",
                    paddingLeft: mine ? 0 : 11,
                    borderLeft: mine ? "none" : "1px solid " + LINE,
                  }}
                >
                  {l.text}
                </p>
              </div>
            );
          })}

          {busy && (
            <div className="ba-line ba-sans" style={{ fontSize: 12, color: MUTED, display: "flex", gap: 5, alignItems: "center" }}>
              <span className="ba-tick" />
              <span className="ba-tick d2" />
              <span className="ba-tick d3" />
            </div>
          )}
        </div>

        {/* mic */}
        <div style={{ borderTop: "1px solid " + LINE, padding: "13px 15px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 3, height: 20, marginBottom: 11, justifyContent: "center" }}>
            {amps.map(function (a, i) {
              return (
                <span
                  key={i}
                  style={{
                    width: 2,
                    height: 18,
                    background: live ? VIOLET : LINE,
                    transformOrigin: "center",
                    transform: "scaleY(" + (live ? a : 0.16) + ")",
                    transition: "transform .12s ease",
                  }}
                />
              );
            })}
          </div>

          <button
            onClick={toggleMic}
            disabled={busy}
            className="ba-talk ba-focus ba-sans"
            style={{
              width: "100%",
              background: live ? "#4C1D95" : VIOLET,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 999,
              padding: "12px",
              fontSize: 14,
              fontWeight: 600,
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.5 : 1,
              marginBottom: 10,
            }}
          >
            {live ? "Tap to stop" : busy ? "One moment" : "Tap to speak"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <input
              value={draft}
              onChange={function (e) { setDraft(e.target.value); }}
              onKeyDown={onKey}
              placeholder="or type it here"
              className="ba-sans ba-input ba-focus"
              style={{
                flex: 1,
                minWidth: 0,
                padding: "9px 13px",
                border: "1px solid " + LINE,
                borderRadius: 999,
                fontSize: 13,
                color: TEXT,
                background: "#FAF9FE",
                outline: "none",
              }}
            />
            <button
              onClick={sendTyped}
              aria-label="Send"
              disabled={!draft.trim()}
              className="ba-send ba-focus ba-sans"
              style={{
                background: draft.trim() ? VIOLET : "#FAF9FE",
                color: draft.trim() ? "#FFFFFF" : MUTED,
                border: draft.trim() ? "none" : "1px solid " + LINE,
                borderRadius: 999,
                width: 34,
                height: 34,
                flexShrink: 0,
                fontSize: 15,
                lineHeight: 1,
                cursor: draft.trim() ? "pointer" : "default",
                display: "grid",
                placeItems: "center",
              }}
            >
              &#8593;
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const css =
  "@import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400&family=Schibsted+Grotesk:wght@400;500;600&display=swap');" +
  ".ba-serif{font-family:'Newsreader',Georgia,serif}" +
  ".ba-sans{font-family:'Schibsted Grotesk',system-ui,sans-serif}" +
  ".ba-panel{animation:baIn .3s cubic-bezier(.2,.7,.3,1)}" +
  "@keyframes baIn{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}" +
  ".ba-line{animation:baRise .35s ease}" +
  "@keyframes baRise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}" +
  ".ba-orb{position:relative;transition:transform .2s ease}" +
  ".ba-orb:hover{transform:scale(1.06)}" +
  ".ba-ping{position:absolute;inset:0;border-radius:999px;border:1px solid #6D28D9;opacity:.5;animation:baPing 2.4s cubic-bezier(.2,.6,.3,1) infinite}" +
  "@keyframes baPing{0%{transform:scale(.7);opacity:.55}100%{transform:scale(1.35);opacity:0}}" +
  ".ba-dot{width:8px;height:8px;border-radius:999px;display:block}" +
  ".ba-dot.on{animation:baPulse 1.3s ease-in-out infinite}" +
  "@keyframes baPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.35);opacity:.65}}" +
  ".ba-tick{width:5px;height:5px;border-radius:999px;background:#7B77A8;display:inline-block;animation:baBob .9s ease-in-out infinite}" +
  ".ba-tick.d2{animation-delay:.15s}.ba-tick.d3{animation-delay:.3s}" +
  "@keyframes baBob{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-4px);opacity:1}}" +
  ".ba-talk{transition:transform .16s ease,background .2s ease}" +
  ".ba-talk:active{transform:scale(.98)}" +
  ".ba-x:hover{color:#1E1B36}" +
  ".ba-input::placeholder{color:#A9A5C8}" +
  ".ba-input:focus{border-color:#6D28D9;background:#FFFFFF}" +
  ".ba-send{transition:transform .15s ease,background .18s ease}" +
  ".ba-send:active{transform:scale(.92)}" +
  ".ba-focus:focus-visible{outline:2px solid #6D28D9;outline-offset:2px}" +
  ".ba-feed::-webkit-scrollbar{width:3px}" +
  ".ba-feed::-webkit-scrollbar-thumb{background:#E6E3F5;border-radius:3px}" +
  "@media (prefers-reduced-motion:reduce){.ba-panel,.ba-line,.ba-ping,.ba-dot.on,.ba-tick,.ba-orb{animation:none!important;transition:none!important}}";
