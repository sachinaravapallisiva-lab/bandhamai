"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchInboxThreads } from "../../lib/client-inbox";
import {
  CHATS_BROWSE,
  CHATS_EMPTY_TITLE,
  CHATS_OPEN_INBOX,
  CHATS_RAIL_MAX_HEIGHT,
  CHATS_SIGN_IN,
  CHATS_TITLE,
  INBOX_PATH,
  inboxChatHref,
  inboxTimeLabel,
  type InboxThread,
} from "../../lib/inbox";
import { loginHref } from "../../lib/next-path";
import { sidebarAvatarInitial } from "../../lib/sidebar-avatar";
import { CREAM, INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";

export default function ChatsRail() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [threads, setThreads] = useState<InboxThread[] | null>(null);
  const [note, setNote] = useState("");

  useEffect(function () {
    fetchInboxThreads({ conversations: true }).then(function (result) {
      const inSession = result.code !== "signed_out";
      setSignedIn(inSession);
      setThreads(result.threads);
      setNote(inSession ? result.error : "");
    });
  }, []);

  const rows = threads || [];

  return (
    <section
      className="bm-card"
      data-chats-rail="true"
      aria-label={CHATS_TITLE}
      style={{
        background: CREAM,
        border: "1px solid " + LINE,
        borderRadius: 14,
        padding: "12px 10px 8px",
        marginBottom: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 8,
          padding: "0 4px 8px",
        }}
      >
        <h2
          className="bm-serif"
          style={{ margin: 0, fontSize: 16, fontWeight: 400, color: VIOLET_DEEP }}
        >
          {CHATS_TITLE}
        </h2>
        <Link
          href={INBOX_PATH}
          className="bm-sans bm-focus"
          style={{ fontSize: 12, fontWeight: 600, color: VIOLET, textDecoration: "none", flexShrink: 0 }}
        >
          {CHATS_OPEN_INBOX}
        </Link>
      </div>

      {signedIn === null || (signedIn && threads == null) ? (
        <p className="bm-sans" style={{ margin: "4px 4px 8px", fontSize: 12.5, color: MUTED }}>
          One moment...
        </p>
      ) : !signedIn ? (
        <p className="bm-sans" style={{ margin: "2px 4px 8px", fontSize: 12.5, color: MUTED, lineHeight: 1.45 }}>
          <Link href={loginHref("/")} className="bm-focus" style={{ color: VIOLET }}>
            Sign in
          </Link>
          {CHATS_SIGN_IN.slice(7)}
        </p>
      ) : rows.length === 0 ? (
        <p className="bm-sans" style={{ margin: "2px 4px 8px", fontSize: 12.5, color: MUTED, lineHeight: 1.45 }}>
          {note || CHATS_EMPTY_TITLE}{" "}
          <Link href="/" className="bm-focus" style={{ color: VIOLET }}>
            {CHATS_BROWSE}
          </Link>
          {"."}
        </p>
      ) : (
        <div
          data-chats-list="true"
          style={{
            maxHeight: CHATS_RAIL_MAX_HEIGHT,
            overflowY: "auto",
            margin: "0 -4px",
          }}
        >
          {rows.map(function (thread) {
            const initial = sidebarAvatarInitial(thread.name);
            return (
              <Link
                key={thread.userId}
                href={inboxChatHref(thread.userId)}
                data-chats-row="true"
                className="bm-menu bm-focus"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "8px 8px",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span
                  aria-hidden="true"
                  className="bm-sans"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    border: "1px solid " + LINE,
                    background: WASH,
                    color: VIOLET,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {initial}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span
                      className="bm-sans"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: INK,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        minWidth: 0,
                      }}
                    >
                      {thread.name}
                    </span>
                    <span className="bm-sans" style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>
                      {inboxTimeLabel(thread.lastAt)}
                    </span>
                  </span>
                  <span
                    className="bm-sans"
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: MUTED,
                      lineHeight: 1.3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {thread.lastBody}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
