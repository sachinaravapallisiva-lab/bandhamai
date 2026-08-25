"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VoiceAssistant from "./components/VoiceAssistant";
import SiteFooter from "./components/SiteFooter";
import SpeedMatch from "./components/SpeedMatch";
import MessagePaywall from "./components/MessagePaywall";
import BrowseCarousel from "./components/BrowseCarousel";
import PinnedRow from "./components/PinnedRow";
import EmptyState, { EmptyStateAction } from "./components/EmptyState";
import MatchCard from "./components/MatchCard";
import AccountDrawer, { AccountMenuControl } from "./components/AccountDrawer";
import MeetupCard from "./components/MeetupCard";
import MeetupRail from "./components/MeetupRail";
import BandhamMark from "./components/BandhamMark";
import { supabase } from "../lib/supabase";
import { INBOX_PATH, INBOX_PREVIEW_NOTE, INBOX_PREVIEW_OPEN } from "../lib/inbox";
import { MEETUP_PATH } from "../lib/meetup";
import { BANDHAM_MARK_HEADER_SIZE } from "../lib/bandham-mark";
import { BM_CSS, CREAM, INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../lib/theme";
import { authJsonHeaders } from "../lib/client-auth";
import { homeTabFromSearch, loginHref } from "../lib/next-path";
import {
  confirmCheckoutSession,
  fetchEntitlement,
  openBillingPortal,
  startCheckout,
} from "../lib/client-billing";
import { BILLING_COPY, emptyEntitlement } from "../lib/billing";
import type { BrowseProfile, SearchCriteria } from "../lib/profile-search";
import { emptyCriteria } from "../lib/profile-search";
import { browsePinnedPreview, browseShortlistPond } from "../lib/browse-test-pond";
import {
  BROWSE_EMPTY_INVENTORY_BODY,
  BROWSE_EMPTY_INVENTORY_TITLE,
  BROWSE_EMPTY_RESULTS_BODY,
  BROWSE_EMPTY_RESULTS_TITLE,
  BROWSE_SEE_MEETUP,
  MATCHES_EMPTY_ACTION,
  MATCHES_EMPTY_BODY,
  MATCHES_EMPTY_TITLE,
  MATCHES_LIST_LABEL,
  SEARCH_HEARING_STATUS,
  SEARCH_HINT,
  SEARCH_LABEL,
  SEARCH_LISTEN_STATUS,
  SEARCH_LOOKING_STATUS,
  SEARCH_PLACEHOLDER,
  SEARCH_SPEAK_BUSY,
  SEARCH_SPEAK_IDLE,
  SEARCH_SPEAK_LIVE,
  browseMatchCountCopy,
} from "../lib/surfaces";

/* ------------------------------------------------------------------ *
   Bandham AI — main app
   Browse (profile search only) / Matches / Chat
   Top box + Tap to speak: STT → desi/English parse → /api/profiles/search.
   Never opens the Bandham assistant from this path. Assistant is the mic chip.
 * ------------------------------------------------------------------ */

const THREAD = [
  { who: "them", text: "Hey! How are you doing?", at: "10:30 AM" },
  { who: "me", text: "I am doing great! How about you?", at: "10:35 AM" },
  { who: "them", text: "All good! Wanna grab coffee sometime?", at: "10:40 AM" },
];

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState("browse");
  const [query, setQuery] = useState("");
  const [micState, setMicState] = useState("idle"); // idle | listening | thinking
  const [note, setNote] = useState("");
  const [liked, setLiked] = useState<BrowseProfile[]>([]);
  const [saved, setSaved] = useState<BrowseProfile[]>([]);
  const [speedPartner, setSpeedPartner] = useState<BrowseProfile | null>(null);
  const [profiles, setProfiles] = useState<BrowseProfile[]>([]);
  const [emptyKind, setEmptyKind] = useState<"inventory" | "matches" | null>(null);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [criteria, setCriteria] = useState<SearchCriteria>(emptyCriteria());
  const [searching, setSearching] = useState(true);
  const [amps, setAmps] = useState<number[]>(Array(16).fill(0.18));
  const [draft, setDraft] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [profileLinked, setProfileLinked] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [entitlement, setEntitlement] = useState(emptyEntitlement({ configured: true }));
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingNote, setBillingNote] = useState("");

  const recorderRef = useRef<any>(null);
  const streamRef = useRef<any>(null);
  const searchRef = useRef<((text?: string) => void) | null>(null);

  function runSearch(text?: string) {
    const q = typeof text === "string" ? text : query;
    setSearching(true);
    setNote("");

    const url = "/api/profiles/search" + (q.trim() ? "?q=" + encodeURIComponent(q.trim()) : "");
    authJsonHeaders()
      .then(function (headers) {
        return fetch(url, headers ? { headers } : undefined);
      })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, data };
        });
      })
      .then(function (result) {
        setSearching(false);
        setLoadedOnce(true);
        if (!result.ok || result.data.error) {
          setProfiles([]);
          setEmptyKind("inventory");
          setMatchCount(null);
          setCriteria(emptyCriteria());
          setNote(result.data.error || "Couldn't load profiles. Try again?");
          return;
        }
        const nextProfiles = Array.isArray(result.data.profiles) ? result.data.profiles : [];
        setProfiles(nextProfiles);
        setEmptyKind(result.data.empty === "matches" || result.data.empty === "inventory" ? result.data.empty : null);
        setMatchCount(typeof result.data.matchCount === "number" ? result.data.matchCount : nextProfiles.length);
        setCriteria(
          result.data.criteria && typeof result.data.criteria === "object"
            ? {
                city: result.data.criteria.city || null,
                gender: result.data.criteria.gender || null,
                keywords: Array.isArray(result.data.criteria.keywords) ? result.data.criteria.keywords : [],
              }
            : emptyCriteria()
        );
        setNote("");
      })
      .catch(function () {
        setSearching(false);
        setLoadedOnce(true);
        setProfiles([]);
        setEmptyKind("inventory");
        setMatchCount(null);
        setCriteria(emptyCriteria());
        setNote("Couldn't load profiles. Try again?");
      });
  }

  searchRef.current = runSearch;

  useEffect(() => {
    function applySession(session: { user?: { email?: string }; access_token?: string } | null) {
      if (!session) {
        setSignedIn(false);
        setUserEmail("");
        setMyStatus(null);
        setProfileLinked(false);
        fetchEntitlement().then(function (next) {
          setEntitlement(next);
        });
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
      fetchEntitlement().then(function (next) {
        setEntitlement(next);
      });
    }

    supabase.auth.getSession().then(function (result) {
      applySession(result.data.session);
    }).catch(function () {
      applySession(null);
    });
    const { data } = supabase.auth.onAuthStateChange(function (_event, session) {
      applySession(session);
    });
    return function () {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fromQuery = homeTabFromSearch(new URLSearchParams(window.location.search).get("tab"));
    if (fromQuery && fromQuery !== "browse") {
      // URL is the source for /login?next=/matches → /?tab=matches.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab(fromQuery);
    }
    if (searchRef.current) searchRef.current("");
  }, []);

  useEffect(function () {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const billing = params.get("billing");
    const sessionId = params.get("session_id") || "";
    if (!billing) return;

    const id = window.setTimeout(function () {
      setTab("chat");
      if (billing === "cancel") {
        setBillingNote("Checkout was canceled. Browse stays free.");
        return;
      }
      if (billing === "success") {
        setBillingNote(BILLING_COPY.returning);
        if (sessionId) {
          confirmCheckoutSession(sessionId).then(function (next) {
            setEntitlement(next);
            if (next.canMessage) {
              setBillingNote(BILLING_COPY.active);
            }
          });
        } else {
          fetchEntitlement().then(function (next) {
            setEntitlement(next);
          });
        }
      }
    }, 0);
    return function () {
      window.clearTimeout(id);
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

        // Search-only: STT → runSearch → /api/profiles/search. Never /api/guru.
        fetch("/api/transcribe", { method: "POST", body: form })
          .then(function (r) { return r.json(); })
          .then(function (data: any) {
            setMicState("idle");
            if (data && data.text) {
              setQuery(function (prev) {
                const next = (prev + " " + data.text).trim();
                queueMicrotask(function () { runSearch(next); });
                return next;
              });
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

  function markInterested(profile: BrowseProfile) {
    setLiked(function (prev) {
      return prev.some(function (p) { return p.id === profile.id; })
        ? prev
        : prev.concat(profile);
    });
    passProfile(profile.id);
  }

  function toggleSave(profile: BrowseProfile) {
    setSaved(function (prev) {
      return prev.some(function (p) { return p.id === profile.id; })
        ? prev.filter(function (p) { return p.id !== profile.id; })
        : prev.concat(profile);
    });
  }

  function goLoginForChat() {
    router.push("/login?next=/");
  }

  function beginCheckout() {
    if (!signedIn) {
      goLoginForChat();
      return;
    }
    setBillingBusy(true);
    setBillingNote("");
    startCheckout().then(function (result) {
      setBillingBusy(false);
      if (result.url) {
        window.location.assign(result.url);
        return;
      }
      setBillingNote(result.error || BILLING_COPY.notConfigured);
      if (result.code === "billing_not_configured" || result.code === "table_missing") {
        fetchEntitlement().then(function (next) {
          setEntitlement(next);
        });
      }
    });
  }

  function beginPortal() {
    setBillingBusy(true);
    setBillingNote("");
    openBillingPortal().then(function (result) {
      setBillingBusy(false);
      if (result.url) {
        window.location.assign(result.url);
        return;
      }
      setBillingNote(result.error || "Could not open the billing portal.");
    });
  }

  function trySendChat() {
    if (!signedIn) {
      goLoginForChat();
      return;
    }
    if (!entitlement.canMessage) {
      setTab("chat");
      setBillingNote(entitlement.configured ? BILLING_COPY.headline : BILLING_COPY.notConfigured);
      return;
    }
    setDraft("");
    setBillingNote("This tab is a preview thread. Use a real recipient conversation to send.");
  }

  function passProfile(id: string) {
    setProfiles(function (prev) {
      return prev.filter(function (p) { return p.id !== id; });
    });
  }

  const live = micState === "listening";
  const busy = micState === "thinking" || searching;
  const matches = liked;
  const pond = browseShortlistPond(profiles);
  const pinned = browsePinnedPreview();
  const hasProfiles = pond.length > 0;
  const searched = query.trim().length > 0;
  const searchChips = [criteria.city, criteria.gender].concat(criteria.keywords).filter(Boolean) as string[];
  const showMatchCount = loadedOnce && !searching && searched && matchCount !== null;

  return (
    <div className="bm-shell" data-home-shell="true" style={{ minHeight: "100vh", background: CREAM, color: INK, display: "flex", flexWrap: "nowrap", alignItems: "stretch" }}>
      <style>{BM_CSS}</style>
      <AccountDrawer />
      <div className="bm-dash">

      {/* masthead — keep the existing Bandham AI wordmark */}
      <header style={{ background: CREAM, borderBottom: "1px solid " + LINE }}>
        <div className="bm-dash-inner" style={{ padding: "20px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <AccountMenuControl />
                  <h1 className="bm-serif bm-home-wordmark" style={{ margin: 0, fontSize: 27, fontWeight: 400, letterSpacing: "-.01em" }}>
                    Bandham AI
                  </h1>
                  <BandhamMark size={BANDHAM_MARK_HEADER_SIZE} className="bm-header-mark" />
                </div>
                <p className="bm-sans" style={{ margin: "3px 0 0", fontSize: 12, color: MUTED, letterSpacing: ".01em" }}>
                  Find your vibe match?
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
                  ) : (
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
                      Profile
                    </Link>
                  )}
                  <span className="bm-sans" style={{ fontSize: 11, color: MUTED, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {userEmail}
                  </span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <Link href="/account" className="bm-sans bm-focus" style={{ fontSize: 11, color: VIOLET, fontWeight: 600, textDecoration: "none" }}>
                      Account
                    </Link>
                    <Link href="/logout" className="bm-sans bm-focus" style={{ fontSize: 11, color: MUTED, fontWeight: 600, textDecoration: "none" }}>
                      Sign out
                    </Link>
                  </div>
                </>
              ) : (
                <Link
                  href={loginHref(tab === "matches" ? "/matches" : tab === "chat" ? "/chat" : "/")}
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
                  onClick={function () {
                    setTab(t[0]);
                    if (t[0] !== "matches") setSpeedPartner(null);
                  }}
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

      <main className="bm-dash-inner" style={{ padding: "24px 20px 24px" }}>

        {/* ---------------- BROWSE ---------------- */}
        {tab === "browse" && (
          <>
            {signedIn && (!profileLinked || !myStatus) ? (
              <section
                className="bm-card"
                style={{
                  background: CREAM,
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
                  background: CREAM,
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
                background: CREAM,
                border: "1px solid " + LINE,
                borderRadius: 14,
                padding: "14px 14px 12px",
                marginBottom: 18,
              }}
            >
              <p className="bm-sans" style={{ margin: "0 0 4px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
                {SEARCH_LABEL}
              </p>
              <p className="bm-sans" style={{ margin: "0 0 10px", fontSize: 12, color: MUTED }}>
                {SEARCH_HINT}
              </p>

              <input
                value={query}
                onChange={function (e) { setQuery(e.target.value); }}
                onKeyDown={function (e) {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    runSearch();
                  }
                }}
                placeholder={SEARCH_PLACEHOLDER}
                aria-label="Search profiles"
                className="bm-sans bm-input bm-focus"
                style={{
                  width: "100%",
                  padding: "11px 13px",
                  border: "1px solid " + LINE,
                  borderRadius: 10,
                  fontSize: 14,
                  color: INK,
                  background: WASH,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={toggleMic}
                  disabled={busy}
                  aria-label="Search profiles by voice"
                  className="bm-sans bm-talk bm-focus"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    background: live ? VIOLET_DEEP : VIOLET,
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 999,
                    padding: "8px 12px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: busy ? "default" : "pointer",
                    opacity: busy ? 0.55 : 1,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="9" y="3.5" width="6" height="10" rx="3" stroke="#FFFFFF" strokeWidth="1.7" />
                    <path d="M7 11.5a5 5 0 0 0 10 0M12 16.5v3.2" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                  {live ? SEARCH_SPEAK_LIVE : busy ? SEARCH_SPEAK_BUSY : SEARCH_SPEAK_IDLE}
                </button>
                <button
                  onClick={function () { runSearch(); }}
                  disabled={searching}
                  className="bm-sans bm-ghost bm-focus"
                  style={{
                    background: "transparent",
                    color: VIOLET,
                    border: "1px solid " + LINE,
                    borderRadius: 999,
                    padding: "8px 14px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: searching ? "default" : "pointer",
                    opacity: searching ? 0.55 : 1,
                  }}
                >
                  Search
                </button>
                {live ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 2, height: 16, marginLeft: 2 }}>
                    {amps.slice(0, 8).map(function (a, i) {
                      return (
                        <span
                          key={i}
                          style={{
                            width: 2,
                            height: 14,
                            background: VIOLET,
                            transformOrigin: "center",
                            transform: "scaleY(" + a + ")",
                            transition: "transform .12s ease",
                          }}
                        />
                      );
                    })}
                  </span>
                ) : null}
              </div>

              <div className="bm-sans" style={{ minHeight: 18, marginTop: 11, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: busy ? VIOLET : MUTED }}>
                  {live ? SEARCH_LISTEN_STATUS : micState === "thinking" ? SEARCH_HEARING_STATUS : searching ? SEARCH_LOOKING_STATUS : note}
                </span>
                {query ? (
                  <button
                    onClick={function () { setQuery(""); setNote(""); runSearch(""); }}
                    className="bm-focus"
                    style={{ background: "none", border: "none", color: MUTED, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </section>

            <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 14px" }}>
              {searching && !loadedOnce ? "LOOKING…" : "A SHORTLIST, NOT A STACK"}
            </p>

            {showMatchCount && searchChips.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "0 0 10px" }}>
                {searchChips.map(function (chip) {
                  return (
                    <span
                      key={chip}
                      className="bm-sans"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "5px 10px",
                        borderRadius: 999,
                        background: CREAM,
                        border: "1px solid " + LINE,
                        fontSize: 12,
                        color: MUTED,
                      }}
                    >
                      {chip}
                    </span>
                  );
                })}
              </div>
            ) : null}

            {showMatchCount && hasProfiles && matchCount !== null && matchCount > 0 ? (
              <div style={{ margin: "0 0 14px" }}>
                <p className="bm-sans" style={{ margin: 0, fontSize: 13, color: MUTED }}>
                  {browseMatchCountCopy(matchCount)}
                </p>
                <Link
                  href={MEETUP_PATH}
                  className="bm-sans bm-focus"
                  style={{ display: "inline-block", marginTop: 4, fontSize: 13, color: VIOLET, fontWeight: 500, textDecoration: "none" }}
                >
                  {BROWSE_SEE_MEETUP}
                </Link>
              </div>
            ) : null}

            {!searching && !hasProfiles ? (
              <>
                <EmptyState
                  eyebrow="BROWSE"
                  title={emptyKind === "inventory" ? BROWSE_EMPTY_INVENTORY_TITLE : BROWSE_EMPTY_RESULTS_TITLE}
                  body={emptyKind === "inventory" ? BROWSE_EMPTY_INVENTORY_BODY : BROWSE_EMPTY_RESULTS_BODY}
                />
                {emptyKind !== "inventory" ? (
                  <p style={{ margin: "12px 0 0", textAlign: "center" }}>
                    <Link
                      href={MEETUP_PATH}
                      className="bm-sans bm-focus"
                      style={{ fontSize: 13, color: VIOLET, fontWeight: 500, textDecoration: "none" }}
                    >
                      {BROWSE_SEE_MEETUP}
                    </Link>
                  </p>
                ) : null}
              </>
            ) : hasProfiles ? (
              <>
              <PinnedRow profiles={pinned} />
              <BrowseCarousel
                profiles={pond}
                saved={saved}
                signedIn={signedIn}
                onInterested={markInterested}
                onPass={function (profile) {
                  passProfile(profile.id);
                }}
                onSave={toggleSave}
                onBlocked={function (profile) {
                  const blockedId = profile.id;
                  passProfile(blockedId);
                  setLiked(function (prev) {
                    return prev.filter(function (x) { return x.id !== blockedId; });
                  });
                  setSaved(function (prev) {
                    return prev.filter(function (x) { return x.id !== blockedId; });
                  });
                }}
              />
              </>
            ) : null}
          </>
        )}

        {/* ---------------- MATCHES ---------------- */}
        {tab === "matches" && (
          <div>
            {speedPartner ? (
              <SpeedMatch
                partner={speedPartner}
                signedIn={signedIn}
                onClose={function () { setSpeedPartner(null); }}
              />
            ) : matches.length === 0 ? (
              <EmptyState
                eyebrow="MATCHES"
                title={MATCHES_EMPTY_TITLE}
                body={MATCHES_EMPTY_BODY}
                action={
                  <EmptyStateAction
                    onClick={function () {
                      setTab("browse");
                    }}
                  >
                    {MATCHES_EMPTY_ACTION}
                  </EmptyStateAction>
                }
              />
            ) : (
              <div>
                <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 14px" }}>
                  {MATCHES_LIST_LABEL}
                </p>
                <div style={{ display: "grid", gap: 14 }}>
                  {matches.map(function (p) {
                    return (
                      <MatchCard
                        key={p.id}
                        profile={p}
                        signedIn={signedIn}
                        onSpeedMatch={function () { setSpeedPartner(p); }}
                        onMessage={function () {
                          setTab("chat");
                          if (!signedIn || !entitlement.canMessage) {
                            setBillingNote(signedIn ? "" : BILLING_COPY.signIn);
                          }
                        }}
                        onBlocked={function () {
                          const blockedId = p.id;
                          setLiked(function (prev) {
                            return prev.filter(function (x) { return x.id !== blockedId; });
                          });
                          setSpeedPartner(function (current) {
                            return current && current.id === blockedId ? null : current;
                          });
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- CHAT ---------------- */}
        {tab === "chat" && (
          <div style={{ background: CREAM, border: "1px solid " + LINE, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "12px 17px", borderBottom: "1px solid " + LINE, background: WASH }}>
              <p className="bm-sans" style={{ margin: 0, fontSize: 12.5, color: MUTED, lineHeight: 1.45 }}>
                {INBOX_PREVIEW_NOTE}{" "}
                <Link href={INBOX_PATH} className="bm-focus" style={{ color: VIOLET }}>
                  {INBOX_PREVIEW_OPEN}
                </Link>
              </p>
            </div>
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

            <div style={{ padding: "0 15px" }}>
              {!entitlement.canMessage ? (
                <MessagePaywall
                  entitlement={entitlement}
                  busy={billingBusy}
                  note={billingNote}
                  signedIn={signedIn}
                  onSubscribe={beginCheckout}
                  onManage={beginPortal}
                  onSignIn={goLoginForChat}
                />
              ) : (
                <div
                  className="bm-card"
                  style={{
                    background: WASH,
                    border: "1px solid " + LINE,
                    borderRadius: 14,
                    padding: "14px 16px",
                    margin: "0 0 14px",
                  }}
                >
                  <p className="bm-sans" style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.45 }}>
                    {BILLING_COPY.active}
                  </p>
                  <button
                    type="button"
                    onClick={beginPortal}
                    disabled={billingBusy}
                    className="bm-sans bm-ghost bm-focus"
                    style={{
                      marginTop: 10,
                      background: "transparent",
                      color: VIOLET,
                      border: "1px solid " + LINE,
                      borderRadius: 999,
                      padding: "8px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: billingBusy ? "default" : "pointer",
                    }}
                  >
                    {BILLING_COPY.manage}
                  </button>
                  {billingNote ? (
                    <p className="bm-sans" style={{ margin: "10px 0 0", fontSize: 13, color: MUTED }}>
                      {billingNote}
                    </p>
                  ) : null}
                </div>
              )}
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
                onClick={trySendChat}
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
      {tab === "browse" || tab === "matches" ? (
        <MeetupRail>
          <MeetupCard compact />
        </MeetupRail>
      ) : null}
      <SiteFooter extraBottom={56} />
    </div>
  );
}
