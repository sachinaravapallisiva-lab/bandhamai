"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchInboxThreads } from "../../lib/client-inbox";
import {
  INBOX_EMPTY_BODY,
  INBOX_EMPTY_TITLE,
  INBOX_OPEN_LABEL,
  INBOX_SIGN_IN,
  inboxChatHref,
  type InboxThread,
} from "../../lib/inbox";
import { loginHref } from "../../lib/next-path";
import { INK, LINE, MUTED, VIOLET, WASH } from "../../lib/theme";
import SafetyActions from "./SafetyActions";

export default function InboxList({
  signedIn,
  nextPath = "/inbox",
}: {
  signedIn: boolean;
  nextPath?: string;
}) {
  const [threads, setThreads] = useState<InboxThread[] | null>(null);
  const [note, setNote] = useState("");

  function load() {
    if (!signedIn) {
      setThreads([]);
      setNote(INBOX_SIGN_IN);
      return;
    }
    fetchInboxThreads().then(function (result) {
      setThreads(result.threads);
      setNote(result.error);
    });
  }

  useEffect(
    function () {
      load();
    },
    [signedIn]
  );

  if (!signedIn) {
    return (
      <section
        className="bm-card"
        style={{
          background: "#FFFFFF",
          border: "1px solid " + LINE,
          borderRadius: 14,
          padding: "22px 18px",
        }}
      >
        <p className="bm-sans" style={{ margin: 0, fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
          <Link href={loginHref(nextPath)} className="bm-focus" style={{ color: VIOLET }}>
            Sign in
          </Link>
          {" to open Inbox."}
        </p>
      </section>
    );
  }

  if (threads == null) {
    return (
      <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: MUTED }}>
        One moment...
      </p>
    );
  }

  if (threads.length === 0) {
    return (
      <section
        className="bm-card"
        style={{
          background: "#FFFFFF",
          border: "1px solid " + LINE,
          borderRadius: 14,
          padding: "22px 18px",
        }}
      >
        <p className="bm-serif" style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 400, color: INK }}>
          {INBOX_EMPTY_TITLE}
        </p>
        <p className="bm-sans" style={{ margin: 0, fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
          {note || INBOX_EMPTY_BODY}
        </p>
      </section>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {threads.map(function (thread) {
        return (
          <article
            key={thread.userId}
            className="bm-card"
            style={{
              background: "#FFFFFF",
              border: "1px solid " + LINE,
              borderRadius: 14,
              padding: "16px 16px 14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <p className="bm-serif" style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 400, color: INK }}>
                  {thread.name}
                </p>
                <p
                  className="bm-sans"
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: MUTED,
                    lineHeight: 1.45,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {thread.lastBody}
                </p>
              </div>
              <Link
                href={inboxChatHref(thread.userId)}
                className="bm-sans bm-ghost bm-focus"
                style={{
                  flexShrink: 0,
                  background: WASH,
                  color: VIOLET,
                  border: "1px solid " + LINE,
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {INBOX_OPEN_LABEL}
              </Link>
            </div>
            <SafetyActions
              profileId={thread.profileId || undefined}
              userId={thread.userId}
              name={thread.name}
              surface="chat"
              signedIn={signedIn}
              nextPath={nextPath}
              onBlocked={function () {
                setThreads(function (prev) {
                  if (!prev) return prev;
                  return prev.filter(function (row) {
                    return row.userId !== thread.userId;
                  });
                });
              }}
            />
          </article>
        );
      })}
      {note ? (
        <p className="bm-sans" style={{ margin: 0, fontSize: 13, color: MUTED }}>
          {note}
        </p>
      ) : null}
    </div>
  );
}
