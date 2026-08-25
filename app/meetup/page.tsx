"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AccountDrawer, { AccountMenuControl } from "../components/AccountDrawer";
import MeetupGroupChat from "../components/MeetupGroupChat";
import MatchCard from "../components/MatchCard";
import SpeedMatch from "../components/SpeedMatch";
import SiteFooter from "../components/SiteFooter";
import EmptyState from "../components/EmptyState";
import { supabase } from "../../lib/supabase";
import { authJsonHeaders } from "../../lib/client-auth";
import { confirmEventTicket, startEventTicketCheckout } from "../../lib/client-billing";
import { loginHref } from "../../lib/next-path";
import {
  MEETUP_API_PATH,
  MEETUP_COPY,
  MEETUP_PATH,
  MEETUP_SHORTLIST_PATH,
  chatHrefForUser,
  fallbackMeetup,
  isMeetupPartnerId,
  meetupSpeedPartner,
  type MeetupMember,
  type MeetupRecord,
} from "../../lib/meetup";
import { readLocalRound } from "../../lib/speed-match";
import { BM_CSS, CREAM, INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";
import type { BrowseProfile } from "../../lib/profile-search";

type Phase = "landing" | "speed" | "shortlist";

export default function MeetupPage() {
  const router = useRouter();
  const [meetup, setMeetup] = useState<MeetupRecord>(fallbackMeetup());
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [rsvped, setRsvped] = useState(false);
  const [ticketPaid, setTicketPaid] = useState(false);
  const [ticketConfigured, setTicketConfigured] = useState<boolean | null>(null);
  const [tableReady, setTableReady] = useState<boolean | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>("landing");
  const [members, setMembers] = useState<MeetupMember[]>([]);
  const [speedPartner, setSpeedPartner] = useState<BrowseProfile | null>(null);

  function applyMeetupPayload(data: {
    meetup?: MeetupRecord;
    rsvped?: boolean;
    ticketPaid?: boolean;
    ticketConfigured?: boolean;
    tableReady?: boolean;
    error?: string;
  }) {
    if (data.meetup) setMeetup(data.meetup);
    setRsvped(!!data.rsvped);
    setTicketPaid(!!data.ticketPaid);
    if (typeof data.ticketConfigured === "boolean") setTicketConfigured(data.ticketConfigured);
    if (typeof data.tableReady === "boolean") setTableReady(data.tableReady);
    if (data.error && !data.meetup) setNote(data.error);
  }

  function loadMeetup() {
    authJsonHeaders().then(function (headers) {
      return fetch(MEETUP_API_PATH, headers ? { headers } : undefined);
    })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, data };
        });
      })
      .then(function (result) {
        applyMeetupPayload(result.data);
        if (result.data.rsvped && readLocalRound() && isMeetupPartnerId(readLocalRound()?.partner_profile_id)) {
          setPhase("shortlist");
          loadShortlist();
        }
      })
      .catch(function () {
        setNote("Could not load this month's meetup.");
      });
  }

  function loadShortlist() {
    authJsonHeaders().then(function (headers) {
      if (!headers) return;
      fetch(MEETUP_SHORTLIST_PATH, { headers })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok, data };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            setMembers([]);
            return;
          }
          setMembers(Array.isArray(result.data.members) ? result.data.members : []);
        })
        .catch(function () {
          setMembers([]);
        });
    });
  }

  useEffect(function () {
    supabase.auth.getSession().then(function (result) {
      const session = result.data.session;
      setSignedIn(!!session);
      setUserId(session?.user.id || "");
      loadMeetup();
    });
  }, []);

  useEffect(function () {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ticket = params.get("ticket") || "";
    const sessionId = params.get("session_id") || "";
    if (ticket === "cancel") {
      setNote(MEETUP_COPY.ticketCancel);
      return;
    }
    if (ticket === "paid" && sessionId) {
      confirmEventTicket(sessionId).then(function (result) {
        if (result.ok) {
          setTicketPaid(true);
          setRsvped(result.rsvped);
          setNote(MEETUP_COPY.ticketPaidNote);
          loadMeetup();
          return;
        }
        setNote(result.error || MEETUP_COPY.ticketRequired);
      });
    }
  }, []);

  function goLogin() {
    router.push(loginHref(MEETUP_PATH));
  }

  function beginTicket() {
    if (!signedIn) {
      goLogin();
      return;
    }
    setBusy(true);
    setNote("");
    startEventTicketCheckout().then(function (result) {
      setBusy(false);
      if (result.alreadyPaid) {
        setTicketPaid(true);
        setRsvped(true);
        setNote(MEETUP_COPY.ticketPaidNote);
        loadMeetup();
        return;
      }
      if (result.url) {
        window.location.assign(result.url);
        return;
      }
      setNote(result.error || MEETUP_COPY.ticketNotConfigured);
    });
  }

  const partner = speedPartner || meetupSpeedPartner(meetup.id);

  return (
    <div className="bm-shell" style={{ minHeight: "100vh", background: CREAM, color: INK, display: "flex" }}>
      <style>{BM_CSS}</style>
      <AccountDrawer />
      <div className="bm-dash">
      <header style={{ background: CREAM, borderBottom: "1px solid " + LINE }}>
        <div className="bm-dash-inner" style={{ padding: "20px 20px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <AccountMenuControl />
                  <Link href="/" className="bm-serif bm-focus" style={{ textDecoration: "none", color: INK }}>
                    <h1 className="bm-home-wordmark" style={{ margin: 0, fontSize: 27, fontWeight: 400, letterSpacing: "-.01em" }}>
                      Bandham AI
                    </h1>
                  </Link>
                </div>
                <p className="bm-sans" style={{ margin: "3px 0 0", fontSize: 12, color: MUTED }}>
                  Find your vibe match?
                </p>
            </div>
            <Link
              href="/"
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
              Back to browse
            </Link>
          </div>
        </div>
      </header>

      <main
        className="bm-dash-inner meetup-grid"
        style={{
          padding: "24px 20px 28px",
          display: "grid",
          gap: 18,
          gridTemplateColumns: "minmax(0, 1fr)",
        }}
      >
        <style>{`@media (min-width: 880px){ .meetup-grid{ grid-template-columns: minmax(0,1fr) 320px !important; align-items: start; } }`}</style>

        <div>
          <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
            {MEETUP_COPY.kicker}
          </p>
          <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 30, fontWeight: 400, color: VIOLET_DEEP }}>
            {meetup.month_label || MEETUP_COPY.monthTitle}
          </h2>
          <p className="bm-sans" style={{ margin: "0 0 10px", fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
            {meetup.summary || MEETUP_COPY.pageBody}
          </p>
          <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 13.5, color: INK, lineHeight: 1.5 }}>
            {meetup.timezone_note || MEETUP_COPY.timeNote}
          </p>
          <p className="bm-sans" style={{ margin: "0 0 16px", fontSize: 13.5, color: MUTED }}>
            {MEETUP_COPY.formatNote}
          </p>

          <section
            className="bm-card"
            style={{
              background: CREAM,
              border: "1px solid " + LINE,
              borderRadius: 14,
              padding: "16px",
              marginBottom: 18,
            }}
          >
            <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
              EVENT TICKET
            </p>
            <h3 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 400 }}>
              {MEETUP_COPY.ticketHeadline}
            </h3>
            <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
              {MEETUP_COPY.ticketBody}
            </p>
            {rsvped || ticketPaid ? (
              <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: VIOLET, fontWeight: 600 }}>
                {MEETUP_COPY.rsvped}
              </p>
            ) : (
              <button
                type="button"
                onClick={beginTicket}
                disabled={busy || (signedIn && ticketConfigured === false && tableReady === true)}
                className="bm-sans bm-talk bm-focus"
                style={{
                  background: VIOLET,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 999,
                  padding: "12px 18px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: busy ? "default" : "pointer",
                }}
              >
                {busy ? MEETUP_COPY.ticketBusy : signedIn ? MEETUP_COPY.ticketCta : "Sign in to get a ticket"}
              </button>
            )}
            {ticketConfigured === false && signedIn ? (
              <p className="bm-sans" style={{ margin: "12px 0 0", fontSize: 13, color: MUTED, lineHeight: 1.45 }}>
                {MEETUP_COPY.ticketNotConfigured}
              </p>
            ) : null}
            {tableReady === false ? (
              <p className="bm-sans" style={{ margin: "12px 0 0", fontSize: 13, color: MUTED, lineHeight: 1.45 }}>
                {MEETUP_COPY.tableMissing}
              </p>
            ) : null}
            {note ? (
              <p className="bm-sans" style={{ margin: "12px 0 0", fontSize: 13, color: MUTED, lineHeight: 1.45 }}>
                {note}
              </p>
            ) : null}
          </section>

          {rsvped && phase === "landing" ? (
            <section
              className="bm-card"
              style={{
                background: "#FFFFFF",
                border: "1px solid " + LINE,
                borderRadius: 14,
                padding: "16px",
                marginBottom: 18,
              }}
            >
              <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
                {MEETUP_COPY.speedKicker}
              </p>
              <h3 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 400 }}>
                {MEETUP_COPY.speedTitle}
              </h3>
              <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
                {MEETUP_COPY.speedBody}
              </p>
              <button
                type="button"
                onClick={function () {
                  setSpeedPartner(null);
                  setPhase("speed");
                }}
                className="bm-sans bm-talk bm-focus"
                style={{
                  background: VIOLET,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 999,
                  padding: "12px 18px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {MEETUP_COPY.speedBegin}
              </button>
            </section>
          ) : null}

          {rsvped && phase === "speed" ? (
            <SpeedMatch
              partner={partner}
              signedIn={signedIn}
              hidePresence={!speedPartner}
              introTitle={speedPartner ? undefined : MEETUP_COPY.speedTitle}
              introBody={speedPartner ? undefined : MEETUP_COPY.speedBody}
              beginLabel={MEETUP_COPY.speedBegin}
              closeLabel={MEETUP_COPY.speedClose}
              doneCloseLabel={speedPartner ? MEETUP_COPY.speedClose : MEETUP_COPY.speedDone}
              onFinished={function () {
                if (!speedPartner) {
                  loadShortlist();
                }
              }}
              onClose={function () {
                if (!speedPartner) {
                  setPhase("shortlist");
                  loadShortlist();
                } else {
                  setSpeedPartner(null);
                  setPhase("shortlist");
                }
              }}
            />
          ) : null}

          {rsvped && phase === "shortlist" ? (
            <div>
              <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
                {MEETUP_COPY.shortlistKicker}
              </p>
              <h3 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 400 }}>
                {MEETUP_COPY.shortlistTitle}
              </h3>
              <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
                {MEETUP_COPY.shortlistBody}
              </p>
              {members.length === 0 ? (
                <EmptyState
                  eyebrow={MEETUP_COPY.shortlistKicker}
                  title={MEETUP_COPY.shortlistEmptyTitle}
                  body={MEETUP_COPY.shortlistEmptyBody}
                />
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {members.map(function (member) {
                    const profile = member.profile;
                    if (profile) {
                      return (
                        <MatchCard
                          key={member.userId}
                          profile={profile}
                          signedIn={signedIn}
                          onSpeedMatch={function () {
                            setSpeedPartner(profile);
                            setPhase("speed");
                          }}
                          onMessage={function () {
                            router.push(chatHrefForUser(member.userId));
                          }}
                          onBlocked={function () {
                            setMembers(function (prev) {
                              return prev.filter(function (row) {
                                return row.userId !== member.userId;
                              });
                            });
                          }}
                        />
                      );
                    }
                    return (
                      <article
                        key={member.userId}
                        className="bm-card"
                        style={{
                          background: CREAM,
                          border: "1px solid " + LINE,
                          borderRadius: 14,
                          padding: "16px",
                        }}
                      >
                        <h4 className="bm-serif" style={{ margin: "0 0 10px", fontSize: 22, color: VIOLET_DEEP }}>
                          {member.displayName}
                        </h4>
                        <button
                          type="button"
                          onClick={function () {
                            router.push(chatHrefForUser(member.userId));
                          }}
                          className="bm-sans bm-ghost bm-focus"
                          style={{
                            background: CREAM,
                            color: VIOLET,
                            border: "1px solid " + LINE,
                            borderRadius: 999,
                            padding: "10px 14px",
                            fontSize: 13.5,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {MEETUP_COPY.openOneToOne}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <MeetupGroupChat signedIn={signedIn} rsvped={rsvped} tableReady={tableReady === true} userId={userId} />
      </main>
      <SiteFooter />
      </div>
    </div>
  );
}
