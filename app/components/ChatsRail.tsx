"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchInboxThreads } from "../../lib/client-inbox";
import {
  CHATS_BROWSE,
  CHATS_EMPTY_BODY,
  CHATS_EMPTY_TITLE,
  CHATS_OPEN_INBOX,
  CHATS_RAIL_LIMIT,
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

  const rows = (threads || []).slice(0, CHATS_RAIL_LIMIT);

  return (
    <section
      className="bm-card"
      data-chats-rail="true"
      aria-label={CHATS_TITLE}
      style={{
        background: CREAM,
        border: "1px solid " + LINE,
        borderRadius: 14,
        padding: "16px 14px 14px",
        marginBottom: 18,
      }}
    >
      <h2
        className="bm-serif"
        style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 400, color: VIOLET_DEEP }}
      >
        {CHATS_TITLE}
      </h2>

      {signedIn === null || (signedIn && threads == null) ? (
        <p className="bm-sans" style={{ margin: 0, fontSize: 13, color: MUTED }}>
          One moment...
        </p>
      ) : !signedIn ? (
        <div>
          <p className="bm-sans" style={{ margin: "0 0 10px", fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
            {CHATS_SIGN_IN}
          </p>
          <p className="bm-sans" style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
            <Link href={loginHref("/")} className="bm-focus" style={{ color: VIOLET }}>
              Sign in
            </Link>
            {", "}
            <Link href={INBOX_PATH} className="bm-focus" style={{ color: VIOLET }}>
              {CHATS_OPEN_INBOX}
            </Link>
            {" or "}
            <Link href="/" className="bm-focus" style={{ color: VIOLET }}>
              {CHATS_BROWSE}
            </Link>
            {"."}
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div>
          <p className="bm-serif" style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 400, color: INK }}>
            {note ? "" : CHATS_EMPTY_TITLE}
          </p>
          <p className="bm-sans" style={{ margin: "0 0 10px", fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
            {note || CHATS_EMPTY_BODY}
          </p>
          <p className="bm-sans" style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
            <Link href={INBOX_PATH} className="bm-focus" style={{ color: VIOLET }}>
              {CHATS_OPEN_INBOX}
            </Link>
            {" or "}
            <Link href="/" className="bm-focus" style={{ color: VIOLET }}>
              {CHATS_BROWSE}
            </Link>
            {"."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 2 }}>
          {rows.map(function (thread) {
            const initial = sidebarAvatarInitial(thread.name);
            return (
              <Link
                key={thread.userId}
                href={inboxChatHref(thread.userId)}
                data-chats-row="true"
                className="bm-focus"
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 6px",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span
                  aria-hidden="true"
                  className="bm-sans"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    border: "1px solid " + LINE,
                    background: WASH,
                    color: VIOLET,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {initial}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span
                    className="bm-serif"
                    style={{
                      display: "block",
                      fontSize: 15,
                      fontWeight: 400,
                      color: INK,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {thread.name}
                  </span>
                  <span
                    className="bm-sans"
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: MUTED,
                      lineHeight: 1.35,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {thread.lastBody}
                  </span>
                </span>
                <span
                  className="bm-sans"
                  style={{ fontSize: 11, color: MUTED, flexShrink: 0, alignSelf: "flex-start", paddingTop: 2 }}
                >
                  {inboxTimeLabel(thread.lastAt)}
                </span>
              </Link>
            );
          })}
          {note ? (
            <p className="bm-sans" style={{ margin: "8px 0 0", fontSize: 12, color: MUTED }}>
              {note}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
