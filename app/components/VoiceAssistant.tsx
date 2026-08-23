"use client";

import { useState, useRef, useEffect } from "react";
import {
  GURU_INTRO,
  GURU_ORB_LABEL,
  GURU_PATH,
  GURU_PLACEHOLDER,
  GURU_SPEAKER,
  GURU_STARTERS,
  GURU_TITLE,
} from "../../lib/surfaces";

/* ------------------------------------------------------------------ *
   Bandham AI — Bandham assistant (mic chip)
   Serious suggestions and guidance only. Never searches profiles.
   Voice goes STT → /api/guru. Search lives in the box above.
 * ------------------------------------------------------------------ */

const SHELL = "#FDF8F1";
const LINE = "#E8DFD2";
const TEXT = "#1E1B36";
const MUTED = "#7B6F8A";
const VIOLET = "#6D28D9";

type Line = { who: "you" | "bm"; text: string };

const FALLBACK_ERROR = "Couldn't reach Bandham right now. Try again?";

function shortServerError(error: unknown): string {
  if (typeof error !== "string") return FALLBACK_ERROR;
  const trimmed = error.trim();
  if (!trimmed || trimmed.length > 140 || trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return FALLBACK_ERROR;
  }
  return trimmed;
}

function toChatMessages(history: Line[]) {
  return history.map(function (l) {
    return { role: l.who === "you" ? "user" : "assistant", content: l.text };
  });
}

export default function VoiceAssistant() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([
    { who: "bm", text: GURU_INTRO },
  ]);
  const [state, setState] = useState("idle"); // idle | listening | thinking
  const [amps, setAmps] = useState<number[]>(Array(14).fill(0.2));
  const [draft, setDraft] = useState("");

  const recorderRef = useRef<any>(null);
  const streamRef = useRef<any>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const linesRef = useRef<Line[]>(lines);
  linesRef.current = lines;

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
              if (data && data.text) {
                addUserAndAsk(data.text);
              } else {
                setState("idle");
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

  function addUserAndAsk(text: string) {
    const next = linesRef.current.concat({ who: "you", text: text });
    linesRef.current = next;
    setLines(next);
    askGuru(next);
  }

  function askGuru(history: Line[]) {
    setState("thinking");
    fetch(GURU_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: toChatMessages(history) }),
    })
      .then(function (r) {
        return r.json().then(function (data: any) {
          return { ok: r.ok, data: data };
        });
      })
      .then(function (result: any) {
        const reply = result.data && result.data.reply;
        if (result.ok && typeof reply === "string" && reply.trim()) {
          setLines(function (p) {
            return p.concat({ who: "bm", text: reply.trim() });
          });
          return;
        }
        setLines(function (p) {
          return p.concat({
            who: "bm",
            text: shortServerError(result.data && result.data.error),
          });
        });
      })
      .catch(function () {
        setLines(function (p) {
          return p.concat({ who: "bm", text: FALLBACK_ERROR });
        });
      })
      .then(function () {
        setState("idle");
      });
  }

  function sendTyped() {
    const text = draft.trim();
    if (!text || state !== "idle") return;
    setDraft("");
    addUserAndAsk(text);
  }

  function onKey(e: any) {
    if (e.key === "Enter") sendTyped();
  }

  const live = state === "listening";
  const busy = state === "thinking";

  /* ---------------- collapsed mic chip ---------------- */
  if (!open) {
    return (
      <>
        <style>{css}</style>
        <button
          onClick={() => setOpen(true)}
          aria-label={GURU_ORB_LABEL}
          className="ba-orb ba-focus"
          style={{
            position: "fixed",
            right: "calc(16px + env(safe-area-inset-right, 0px))",
            bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
            zIndex: 50,
            height: 36,
            padding: "0 12px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            background: VIOLET,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            boxShadow: "0 4px 14px rgba(109,40,217,.22)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="9" y="3.5" width="6" height="10" rx="3" stroke="#FFFFFF" strokeWidth="1.7" />
            <path d="M7 11.5a5 5 0 0 0 10 0M12 16.5v3.2" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <span className="ba-sans" style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 600 }}>
            {GURU_TITLE}
          </span>
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
          <span className="ba-serif" style={{ fontSize: 16, flex: 1 }}>{GURU_TITLE}</span>
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
                  {mine ? "YOU" : GURU_SPEAKER}
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

          {lines.length === 1 && state === "idle" ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {GURU_STARTERS.map(function (starter) {
                return (
                  <button
                    key={starter.id}
                    type="button"
                    onClick={function () { addUserAndAsk(starter.text); }}
                    className="ba-sans ba-focus"
                    style={{
                      background: "#F7F1E8",
                      color: VIOLET,
                      border: "1px solid " + LINE,
                      borderRadius: 999,
                      padding: "7px 11px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {starter.label}
                  </button>
                );
              })}
            </div>
          ) : null}

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
              placeholder={GURU_PLACEHOLDER}
              className="ba-sans ba-input ba-focus"
              style={{
                flex: 1,
                minWidth: 0,
                padding: "9px 13px",
                border: "1px solid " + LINE,
                borderRadius: 999,
                fontSize: 13,
                color: TEXT,
                background: "#F7F1E8",
                outline: "none",
              }}
            />
            <button
              onClick={sendTyped}
              aria-label="Send"
              disabled={!draft.trim() || busy || live}
              className="ba-send ba-focus ba-sans"
              style={{
                background: draft.trim() ? VIOLET : "#F7F1E8",
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
  ".ba-orb:hover{transform:scale(1.03)}" +
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
  ".ba-input:focus{border-color:#6D28D9;background:#FDF8F1}" +
  ".ba-send{transition:transform .15s ease,background .18s ease}" +
  ".ba-send:active{transform:scale(.92)}" +
  ".ba-focus:focus-visible{outline:2px solid #6D28D9;outline-offset:2px}" +
  ".ba-feed::-webkit-scrollbar{width:3px}" +
  ".ba-feed::-webkit-scrollbar-thumb{background:#E6E3F5;border-radius:3px}" +
  "@media (prefers-reduced-motion:reduce){.ba-panel,.ba-line,.ba-dot.on,.ba-tick,.ba-orb{animation:none!important;transition:none!important}}";
