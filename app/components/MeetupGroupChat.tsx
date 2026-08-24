"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authJsonHeaders } from "../../lib/client-auth";
import { loginHref } from "../../lib/next-path";
import {
  MEETUP_COPY,
  MEETUP_MESSAGES_PATH,
  MEETUP_PATH,
  chatHrefForUser,
  type MeetupGroupMessage,
} from "../../lib/meetup";
import { CREAM, INK, LINE, MUTED, VIOLET, WASH } from "../../lib/theme";

export default function MeetupGroupChat({
  signedIn,
  rsvped,
  tableReady,
  userId,
}: {
  signedIn: boolean;
  rsvped: boolean;
  tableReady: boolean;
  userId: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<MeetupGroupMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const feedRef = useRef<HTMLDivElement | null>(null);

  function loadMessages() {
    if (!signedIn || !rsvped) return;
    authJsonHeaders().then(function (headers) {
      if (!headers) return;
      fetch(MEETUP_MESSAGES_PATH, { headers })
        .then(function (r) {
          return r.json().then(function (data) {
            return { ok: r.ok, data };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            setNote(result.data.error || MEETUP_COPY.chatNeedRsvp);
            setMessages([]);
            return;
          }
          setMessages(Array.isArray(result.data.messages) ? result.data.messages : []);
          setNote("");
        })
        .catch(function () {
          setNote("Could not load the group chat.");
        });
    });
  }

  useEffect(function () {
    loadMessages();
  }, [signedIn, rsvped]);

  useEffect(function () {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages]);

  function send() {
    const text = draft.trim();
    if (!text || busy) return;
    if (!signedIn) {
      router.push(loginHref(MEETUP_PATH));
      return;
    }
    if (!rsvped) {
      setNote(MEETUP_COPY.chatNeedRsvp);
      return;
    }
    setBusy(true);
    setNote("");
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) {
          setBusy(false);
          router.push(loginHref(MEETUP_PATH));
          return null;
        }
        return fetch(MEETUP_MESSAGES_PATH, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ body: text }),
        });
      })
      .then(function (res) {
        if (!res) return;
        return res.json().then(function (data) {
          setBusy(false);
          if (!res.ok) {
            setNote(data.error || "Could not send.");
            return;
          }
          setDraft("");
          if (data.message) {
            setMessages(function (prev) {
              return prev.concat(data.message);
            });
          } else {
            loadMessages();
          }
        });
      })
      .catch(function () {
        setBusy(false);
        setNote("Could not send.");
      });
  }

  const gated = !signedIn || !rsvped || !tableReady;

  return (
    <aside
      className="bm-card"
      style={{
        background: CREAM,
        border: "1px solid " + LINE,
        borderRadius: 14,
        padding: "16px 14px",
        display: "flex",
        flexDirection: "column",
        minHeight: 360,
      }}
    >
      <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
        {MEETUP_COPY.chatKicker}
      </p>
      <h3 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 400 }}>
        {MEETUP_COPY.chatTitle}
      </h3>
      <p className="bm-sans" style={{ margin: "0 0 8px", fontSize: 13, color: MUTED, lineHeight: 1.45 }}>
        {MEETUP_COPY.chatBody}
      </p>
      <p className="bm-sans" style={{ margin: "0 0 12px", fontSize: 12.5, color: MUTED, lineHeight: 1.45 }}>
        {MEETUP_COPY.guruNever}
      </p>

      <div
        ref={feedRef}
        style={{
          flex: 1,
          background: "#FFFFFF",
          border: "1px solid " + LINE,
          borderRadius: 12,
          padding: "12px",
          minHeight: 180,
          maxHeight: 320,
          overflowY: "auto",
          marginBottom: 12,
        }}
      >
        {gated ? (
          <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
            {!signedIn
              ? MEETUP_COPY.chatNeedSignIn
              : !tableReady
                ? MEETUP_COPY.chatNeedSql
                : MEETUP_COPY.chatNeedRsvp}
          </p>
        ) : messages.length === 0 ? (
          <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: MUTED }}>
            {MEETUP_COPY.chatEmpty}
          </p>
        ) : (
          messages.map(function (row) {
            const mine = row.sender_id === userId;
            return (
              <div key={row.id} style={{ marginBottom: 10, textAlign: mine ? "right" : "left" }}>
                <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", gap: 8, alignItems: "center" }}>
                  <span className="bm-sans" style={{ fontSize: 11, color: MUTED }}>
                    {mine ? "You" : row.sender_name}
                  </span>
                  {!mine && row.sender_id ? (
                    <button
                      type="button"
                      onClick={function () {
                        router.push(chatHrefForUser(row.sender_id));
                      }}
                      className="bm-sans bm-focus"
                      style={{
                        background: "none",
                        border: "none",
                        color: VIOLET,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      {MEETUP_COPY.openOneToOne}
                    </button>
                  ) : null}
                </div>
                <span
                  className="bm-sans"
                  style={{
                    display: "inline-block",
                    marginTop: 4,
                    background: mine ? VIOLET : WASH,
                    color: mine ? "#FFFFFF" : INK,
                    border: mine ? "none" : "1px solid " + LINE,
                    borderRadius: 13,
                    padding: "8px 12px",
                    fontSize: 14,
                    lineHeight: 1.45,
                  }}
                >
                  {row.body}
                </span>
              </div>
            );
          })
        )}
      </div>

      <p className="bm-sans" style={{ margin: "0 0 10px", fontSize: 12, color: MUTED, lineHeight: 1.45 }}>
        {MEETUP_COPY.oneToOneNote}
      </p>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={draft}
          onChange={function (e) {
            setDraft(e.target.value);
          }}
          onKeyDown={function (e) {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          placeholder={MEETUP_COPY.chatPlaceholder}
          disabled={gated}
          className="bm-sans bm-input bm-focus"
          style={{
            flex: 1,
            padding: "11px 14px",
            border: "1px solid " + LINE,
            borderRadius: 999,
            fontSize: 14,
            background: WASH,
            color: INK,
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={send}
          disabled={gated || busy}
          className="bm-sans bm-talk bm-focus"
          style={{
            background: VIOLET,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 999,
            padding: "11px 16px",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: gated || busy ? "default" : "pointer",
            opacity: gated || busy ? 0.6 : 1,
          }}
        >
          {MEETUP_COPY.chatSend}
        </button>
      </div>
      {note ? (
        <p className="bm-sans" style={{ margin: "10px 0 0", fontSize: 13, color: MUTED }}>
          {note}
        </p>
      ) : null}
    </aside>
  );
}
