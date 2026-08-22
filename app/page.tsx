"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import VoiceAssistant from "./components/VoiceAssistant";
import VerifyBadge from "./components/VerifyBadge";
import { supabase } from "../lib/supabase";
import { authJsonHeaders } from "../lib/client-auth";

/* ------------------------------------------------------------------ *
   Bandhamai — main app
   Browse (voice search) / Matches / Chat
   Voice runs through /api/transcribe (Grok STT).
 * ------------------------------------------------------------------ */

const VIOLET = "#6D28D9";
const VIOLET_DEEP = "#4C1D95";
const INK = "#1E1B36";
const MUTED = "#7B77A8";
const LINE = "#E6E3F5";
const WASH = "#FAF9FE";

const PROFILES = [
  { id: 1, name: "Ananya R.", age: 27, city: "Hyderabad", work: "Paediatrician, Rainbow Hospitals", diet: "Vegetarian", langs: "Telugu, English, Hindi", note: "Asked her own questions back.", fit: 94, verified: true },
  { id: 2, name: "Divya K.", age: 28, city: "Secunderabad", work: "Dentist, own practice", diet: "Vegetarian", langs: "Telugu, English", note: "Wants to stay near family.", fit: 91, verified: false },
  { id: 3, name: "Sruthi M.", age: 26, city: "Hyderabad", work: "Radiologist, AIG", diet: "Vegetarian", langs: "Telugu, Tamil, English", note: "Runs half marathons.", fit: 88, verified: false },
];

const THREAD = [
  { who: "them", text: "Hey! How are you doing?", at: "10:30 AM" },
  { who: "me", text: "I am doing great! How about you?", at: "10:35 AM" },
  { who: "them", text: "All good! Wanna grab coffee sometime?", at: "10:40 AM" },
];

export default function Home() {
  const [tab, setTab] = useState("browse");
  const [query, setQuery] = useState("");
  const [micState, setMicState] = useState("idle"); // idle | listening | thinking
  const [note, setNote] = useState("");
  const [liked, setLiked] = useState<number[]>([]);
  const [amps, setAmps] = useState<number[]>(Array(16).fill(0.18));
  const [draft, setDraft] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [profileLinked, setProfileLinked] = useState(false);

  const recorderRef = useRef<any>(null);
  const streamRef = useRef<any>(null);

  useEffect(() => {
    function applySession(session: { user?: { email?: string }; access_token?: string } | null) {
      if (!session) {
        setSignedIn(false);
        setUserEmail("");
        setMyStatus(null);
        setProfileLinked(false);
        return;
      }
      setSignedIn(true);
      setUserEmail(session.user?.email || "");
      authJsonHeaders().then(function (headers) {
        if (!headers) return;
        fetch("/api/profiles", { headers })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            setProfileLinked(!!data.linked);
            setMyStatus(data.profile?.status || null);
          })
          .catch(function () { /* keep browse usable */ });
      });
    }

    supabase.auth.getSession().then(function (result) {
      applySession(result.data.session);
    });
    const { data } = supabase.auth.onAuthStateChange(function (_event, session) {
      applySession(session);
    });
    return function () {
      data.subscription.unsubscribe();
    };
  }, []);

  /* waveform */
  useEffect(() => {
    if (micState !== "listening") {
      setAmps(Array(16).fill(0.16));
      return;
    }
    const id = setInterval(() => {
      setAmps(Array.from({ length: 16 }, () => 0.25 + Math.random() * 0.75));
    }, 110);
    return () => clearInterval(id);
  }, [micState]);

  function startListening() {
    const nav: any = navigator;
    const win: any = window;
    if (!nav.mediaDevices || !win.MediaRecorder) {
      setNote("This browser can't record audio. Type instead.");
      return;
    }
    setNote("");

    nav.mediaDevices.getUserMedia({ audio: true }).then(function (stream: any) {
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
        setMicState("thinking");

        const form = new FormData();
        form.append("file", new Blob(chunks, { type: "audio/webm" }), "audio.webm");

        fetch("/api/transcribe", { method: "POST", body: form })
          .then(function (r) { return r.json(); })
          .then(function (data: any) {
            setMicState("idle");
            if (data && data.text) {
              setQuery(function (prev) { return (prev + " " + data.text).trim(); });
              setNote("");
            } else {
              setNote("Didn't catch that. Try again?");
            }
          })
          .catch(function () {
            setMicState("idle");
            setNote("Network trouble. Try again?");
          });
      };

      rec.start();
      setMicState("listening");
    }).catch(function () {
      setNote("Microphone is blocked. Allow it in the address bar.");
    });
  }

  function stopListening() {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }

  function toggleMic() {
    if (micState === "listening") stopListening();
    else if (micState === "idle") startListening();
  }

  function toggleLike(id: number) {
    setLiked(function (prev) {
      return prev.indexOf(id) > -1 ? prev.filter(function (x) { return x !== id; }) : prev.concat(id);
    });
  }

  const live = micState === "listening";
  const busy = micState === "thinking";
  const matches = PROFILES.filter(function (p) { return liked.indexOf(p.id) > -1; });

  return (
    <div style={{ minHeight: "100vh", background: WASH, color: INK }}>
      <style>{css}</style>

      {/* masthead */}
      <header style={{ background: "#FFFFFF", borderBottom: "1px solid " + LINE }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <h1 className="bm-serif" style={{ margin: 0, fontSize: 27, fontWeight: 400, letterSpacing: "-.01em" }}>
                Bandhamai
              </h1>
              <p className="bm-sans" style={{ margin: "3px 0 0", fontSize: 12, color: MUTED, letterSpacing: ".01em" }}>
                Ask, don&apos;t swipe
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              {signedIn ? (
                <>
                  {!myStatus || !profileLinked ? (
                    <Link
                      href="/profile/new"
                      className="bm-sans bm-talk bm-focus"
                      style={{
                        background: VIOLET,
                        color: "#FFFFFF",
                        borderRadius: 999,
                        padding: "8px 14px",
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      Create profile
                    </Link>
                  ) : myStatus === "pending" ? (
                    <Link
                      href="/profile/new"
                      className="bm-sans bm-ghost bm-focus"
                      style={{
                        color: VIOLET,
                        border: "1px solid " + LINE,
                        borderRadius: 999,
                        padding: "8px 14px",
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      Under review
                    </Link>
                  ) : null}
                  <span className="bm-sans" style={{ fontSize: 11, color: MUTED, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {userEmail}
                  </span>
                </>
              ) : (
                <Link
                  href="/login?next=/"
                  className="bm-sans bm-ghost bm-focus"
                  style={{
                    color: VIOLET,
                    border: "1px solid " + LINE,
                    borderRadius: 999,
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>

          <nav className="bm-sans" style={{ display: "flex", gap: 4, marginTop: 18 }}>
            {[["browse", "Browse"], ["matches", "Matches"], ["chat", "Chat"]].map(function (t) {
              const on = tab === t[0];
              return (
                <button
                  key={t[0]}
                  onClick={function () { setTab(t[0]); }}
                  className="bm-tab bm-focus"
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom: on ? "2px solid " + VIOLET : "2px solid transparent",
                    color: on ? VIOLET : MUTED,
                    padding: "9px 15px",
                    fontSize: 14,
                    fontWeight: on ? 600 : 500,
                    cursor: "pointer",
                  }}
                >
                  {t[1]}
                  {t[0] === "matches" && matches.length > 0 ? " (" + matches.length + ")" : ""}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 110px" }}>

        {/* ---------------- BROWSE ---------------- */}
        {tab === "browse" && (
          <>
            {signedIn && (!profileLinked || !myStatus) ? (
              <section
                className="bm-card"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid " + LINE,
                  borderRadius: 14,
                  padding: "18px",
                  marginBottom: 18,
                }}
              >
                <p className="bm-serif" style={{ margin: "0 0 6px", fontSize: 20 }}>
                  {profileLinked ? "You don't have a profile yet." : "Add your profile."}
                </p>
                <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 13.5, color: MUTED }}>
                  Create one and a reviewer will put it live. It won&apos;t appear on Browse until then.
                </p>
                <Link
                  href="/profile/new"
                  className="bm-sans bm-talk bm-focus"
                  style={{
                    display: "inline-block",
                    background: VIOLET,
                    color: "#FFFFFF",
                    borderRadius: 999,
                    padding: "11px 18px",
                    fontSize: 13.5,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Create your profile
                </Link>
              </section>
            ) : null}

            {signedIn && profileLinked && myStatus === "pending" ? (
              <section
                className="bm-card"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid " + LINE,
                  borderRadius: 14,
                  padding: "16px 18px",
                  marginBottom: 18,
                }}
              >
                <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: MUTED }}>
                  Your profile was submitted for review. It is not live yet.
                </p>
              </section>
            ) : null}

            <section
              style={{
                background: "#FFFFFF",
                border: "1px solid " + LINE,
                borderRadius: 14,
                padding: "20px 18px",
                marginBottom: 26,
              }}
            >
              <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 12.5, color: MUTED }}>
                Say it the way you'd say it out loud. In noisy places, type instead.
              </p>

              <input
                value={query}
                onChange={function (e) { setQuery(e.target.value); }}
                placeholder="A doctor in Hyderabad, vegetarian, under thirty..."
                className="bm-sans bm-input bm-focus"
                style={{
                  width: "100%",
                  padding: "13px 15px",
                  border: "1px solid " + LINE,
                  borderRadius: 10,
                  fontSize: 14.5,
                  color: INK,
                  background: WASH,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              {/* waveform */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, height: 20, margin: "15px 0 13px" }}>
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

              <div style={{ display: "flex", gap: 9 }}>
                <button
                  onClick={toggleMic}
                  disabled={busy}
                  className="bm-sans bm-talk bm-focus"
                  style={{
                    flex: 1,
                    background: live ? VIOLET_DEEP : VIOLET,
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 999,
                    padding: "13px",
                    fontSize: 14.5,
                    fontWeight: 600,
                    cursor: busy ? "default" : "pointer",
                    opacity: busy ? 0.55 : 1,
                  }}
                >
                  {live ? "Tap to stop" : busy ? "One moment" : "Tap to speak"}
                </button>
                <button
                  className="bm-sans bm-ghost bm-focus"
                  style={{
                    background: "transparent",
                    color: VIOLET,
                    border: "1px solid " + LINE,
                    borderRadius: 999,
                    padding: "13px 22px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Search
                </button>
              </div>

              <div className="bm-sans" style={{ minHeight: 18, marginTop: 11, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: busy ? VIOLET : MUTED }}>
                  {live ? "Listening..." : busy ? "Thinking..." : note}
                </span>
                {query ? (
                  <button
                    onClick={function () { setQuery(""); setNote(""); }}
                    className="bm-focus"
                    style={{ background: "none", border: "none", color: MUTED, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </section>

            <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 14px" }}>
              {PROFILES.length} PEOPLE — A SHORTLIST, NOT A STACK
            </p>

            <div style={{ display: "grid", gap: 14 }}>
              {PROFILES.map(function (p) {
                const isLiked = liked.indexOf(p.id) > -1;
                return (
                  <article
                    key={p.id}
                    className="bm-card"
                    style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "20px 18px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 13 }}>
                      <h2 className="bm-serif" style={{ margin: 0, fontSize: 23, fontWeight: 400 }}>
                        {p.name}
                        <VerifyBadge verified={p.verified} />
                      </h2>
                      <span className="bm-sans" style={{ fontSize: 12, fontWeight: 600, color: VIOLET }}>{p.fit}%</span>
                    </div>

                    <div style={{ display: "grid", gap: 6, marginBottom: 13 }}>
                      {[["AGE", String(p.age)], ["CITY", p.city], ["WORK", p.work], ["DIET", p.diet], ["SPEAKS", p.langs]].map(function (row) {
                        return (
                          <div key={row[0]} style={{ display: "flex", gap: 11, alignItems: "baseline" }}>
                            <span className="bm-sans" style={{ fontSize: 9.5, letterSpacing: ".14em", color: MUTED, width: 54, flexShrink: 0 }}>{row[0]}</span>
                            <span className="bm-sans" style={{ fontSize: 13.5, lineHeight: 1.45 }}>{row[1]}</span>
                          </div>
                        );
                      })}
                    </div>

                    <p className="bm-serif" style={{ margin: "0 0 15px", paddingTop: 12, borderTop: "1px solid " + LINE, fontSize: 14, fontStyle: "italic", color: MUTED }}>
                      {p.note}
                    </p>

                    <div style={{ display: "flex", gap: 9 }}>
                      <button
                        className="bm-sans bm-ghost bm-focus"
                        style={{ flex: 1, background: "transparent", color: MUTED, border: "1px solid " + LINE, borderRadius: 999, padding: "11px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
                      >
                        Pass
                      </button>
                      <button
                        onClick={function () { toggleLike(p.id); }}
                        className="bm-sans bm-talk bm-focus"
                        style={{
                          flex: 1,
                          background: isLiked ? VIOLET_DEEP : VIOLET,
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: 999,
                          padding: "11px",
                          fontSize: 13.5,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {isLiked ? "Liked" : "Like"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {/* ---------------- MATCHES ---------------- */}
        {tab === "matches" && (
          <div>
            {matches.length === 0 ? (
              <div style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "44px 22px", textAlign: "center" }}>
                <p className="bm-serif" style={{ margin: "0 0 7px", fontSize: 20 }}>No one yet.</p>
                <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: MUTED }}>
                  Like someone on Browse and they'll appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {matches.map(function (p) {
                  return (
                    <article key={p.id} className="bm-card" style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
                        <h2 className="bm-serif" style={{ margin: 0, fontSize: 21, fontWeight: 400 }}>
                          {p.name}
                          <VerifyBadge verified={p.verified} />
                        </h2>
                        <span className="bm-sans" style={{ fontSize: 12, fontWeight: 600, color: VIOLET }}>{p.fit}%</span>
                      </div>
                      <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 13, color: MUTED }}>{p.work} — {p.city}</p>
                      <button
                        onClick={function () { setTab("chat"); }}
                        className="bm-sans bm-talk bm-focus"
                        style={{ width: "100%", background: VIOLET, color: "#FFFFFF", border: "none", borderRadius: 999, padding: "11px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
                      >
                        Start Speed Match
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------- CHAT ---------------- */}
        {tab === "chat" && (
          <div style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "15px 17px", borderBottom: "1px solid " + LINE }}>
              <span style={{ width: 34, height: 34, borderRadius: 999, background: VIOLET, display: "block" }} />
              <span className="bm-serif" style={{ fontSize: 18 }}>Priya</span>
            </div>

            <div style={{ padding: "18px 17px", display: "flex", flexDirection: "column", gap: 13, minHeight: 240 }}>
              {THREAD.map(function (m, i) {
                const mine = m.who === "me";
                return (
                  <div key={i} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "78%" }}>
                    <div
                      className="bm-sans"
                      style={{
                        background: mine ? VIOLET : WASH,
                        color: mine ? "#FFFFFF" : INK,
                        border: mine ? "none" : "1px solid " + LINE,
                        borderRadius: 13,
                        padding: "10px 14px",
                        fontSize: 14,
                        lineHeight: 1.45,
                      }}
                    >
                      {m.text}
                    </div>
                    <div className="bm-sans" style={{ fontSize: 10.5, color: MUTED, marginTop: 4, textAlign: mine ? "right" : "left" }}>
                      {m.at}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 9, padding: "13px 15px", borderTop: "1px solid " + LINE }}>
              <input
                value={draft}
                onChange={function (e) { setDraft(e.target.value); }}
                placeholder="Type a message"
                className="bm-sans bm-input bm-focus"
                style={{ flex: 1, padding: "11px 14px", border: "1px solid " + LINE, borderRadius: 999, fontSize: 14, background: WASH, color: INK, outline: "none" }}
              />
              <button
                onClick={function () { setDraft(""); }}
                className="bm-sans bm-talk bm-focus"
                style={{ background: VIOLET, color: "#FFFFFF", border: "none", borderRadius: 999, padding: "11px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </main>

      <VoiceAssistant />
    </div>
  );
}

const css =
  "@import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400&family=Schibsted+Grotesk:wght@400;500;600&display=swap');" +
  ".bm-serif{font-family:'Newsreader',Georgia,serif}" +
  ".bm-sans{font-family:'Schibsted Grotesk',system-ui,sans-serif}" +
  "body{margin:0}" +
  ".bm-card{transition:border-color .2s ease,box-shadow .2s ease}" +
  ".bm-card:hover{border-color:#D6D0F0;box-shadow:0 6px 22px rgba(30,27,54,.06)}" +
  ".bm-tab{transition:color .18s ease}" +
  ".bm-talk{transition:transform .16s ease,background .2s ease}" +
  ".bm-talk:active{transform:scale(.985)}" +
  ".bm-ghost{transition:background .18s ease,border-color .18s ease}" +
  ".bm-ghost:hover{background:#F3F0FD;border-color:#D6D0F0}" +
  ".bm-input::placeholder{color:#A9A5C8}" +
  ".bm-input:focus{border-color:#6D28D9;background:#FFFFFF}" +
  ".bm-focus:focus-visible{outline:2px solid #6D28D9;outline-offset:2px}" +
  "@media (prefers-reduced-motion:reduce){.bm-card,.bm-talk,.bm-ghost,.bm-tab{transition:none!important}}";
