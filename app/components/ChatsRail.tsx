"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchInboxThreads } from "../../lib/client-inbox";
import {
  CHATS_BROWSE,
  CHATS_EMPTY_TITLE,
  CHATS_OPEN_INBOX,
  CHATS_RAIL_MAX_HEIGHT,
  CHATS_SEARCH_LABEL,
  CHATS_SEARCH_PLACEHOLDER,
  CHATS_SIGN_IN,
  CHATS_TITLE,
  INBOX_PATH,
  chatRowMatches,
  inboxChatHref,
  inboxTimeLabel,
  type InboxThread,
} from "../../lib/inbox";
import { loginHref } from "../../lib/next-path";
import { sidebarAvatarInitial } from "../../lib/sidebar-avatar";
import { CREAM, INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";

const AVATAR_WASH = "rgba(109,40,217,.08)";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.25" stroke={VIOLET} strokeWidth="1.4" />
      <path d="M10.2 10.2 13.2 13.2" stroke={VIOLET} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ComposeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.4" y="2.4" width="11.2" height="11.2" rx="2.2" stroke={VIOLET} strokeWidth="1.4" />
      <path d="M8.8 4.6 11.4 7.2 7.1 11.5H4.5V8.9L8.8 4.6Z" stroke={VIOLET} strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

export default function ChatsRail() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [threads, setThreads] = useState<InboxThread[] | null>(null);
  const [note, setNote] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(function () {
    fetchInboxThreads({ conversations: true }).then(function (result) {
      const inSession = result.code !== "signed_out";
      setSignedIn(inSession);
      setThreads(result.threads);
      setNote(inSession ? result.error : "");
    });
  }, []);

  const rows = useMemo(
    function () {
      const all = threads || [];
      if (!query.trim()) return all;
      return all.filter(function (thread) {
        return chatRowMatches(thread, query);
      });
    },
    [threads, query]
  );

  return (
    <section
      className="bm-card"
      data-chats-rail="true"
      aria-label={CHATS_TITLE}
      style={{
        background: CREAM,
        border: "1px solid " + LINE,
        borderRadius: 14,
        padding: "12px 0 6px",
        marginBottom: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "0 12px 8px",
        }}
      >
        <h2
          className="bm-sans"
          style={{ margin: 0, fontSize: 17, fontWeight: 600, color: VIOLET_DEEP }}
        >
          {CHATS_TITLE}
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <button
            type="button"
            aria-label={CHATS_SEARCH_LABEL}
            aria-expanded={searchOpen}
            onClick={function () {
              setSearchOpen(function (open) {
                return !open;
              });
            }}
            className="bm-focus"
            style={{
              width: 28,
              height: 28,
              border: "none",
              background: "none",
              padding: 0,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            <SearchIcon />
          </button>
          <Link
            href={INBOX_PATH}
            aria-label={CHATS_OPEN_INBOX}
            className="bm-focus"
            style={{
              width: 28,
              height: 28,
              display: "grid",
              placeItems: "center",
            }}
          >
            <ComposeIcon />
          </Link>
        </div>
      </div>

      {searchOpen ? (
        <div style={{ padding: "0 12px 8px" }}>
          <input
            type="search"
            value={query}
            onChange={function (e) {
              setQuery(e.target.value);
            }}
            placeholder={CHATS_SEARCH_PLACEHOLDER}
            aria-label={CHATS_SEARCH_LABEL}
            className="bm-sans bm-input bm-focus"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "8px 12px",
              border: "1px solid " + LINE,
              borderRadius: 999,
              fontSize: 12.5,
              background: WASH,
              color: INK,
              outline: "none",
            }}
          />
        </div>
      ) : null}

      {signedIn === null || (signedIn && threads == null) ? (
        <p className="bm-sans" style={{ margin: "4px 12px 8px", fontSize: 12.5, color: MUTED }}>
          One moment...
        </p>
      ) : !signedIn ? (
        <p className="bm-sans" style={{ margin: "2px 12px 10px", fontSize: 12.5, color: MUTED, lineHeight: 1.45 }}>
          <Link href={loginHref("/")} className="bm-focus" style={{ color: VIOLET }}>
            Sign in
          </Link>
          {CHATS_SIGN_IN.slice(7)}
        </p>
      ) : rows.length === 0 ? (
        <p className="bm-sans" style={{ margin: "2px 12px 10px", fontSize: 12.5, color: MUTED, lineHeight: 1.45 }}>
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
          }}
        >
          {rows.map(function (thread, index) {
            const initial = sidebarAvatarInitial(thread.name);
            return (
              <Link
                key={thread.userId}
                href={inboxChatHref(thread.userId)}
                data-chats-row="true"
                className="bm-menu bm-focus"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  textDecoration: "none",
                  color: "inherit",
                  borderTop: index === 0 ? "none" : "1px solid " + LINE,
                }}
              >
                <span
                  aria-hidden="true"
                  className="bm-sans"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    background: AVATAR_WASH,
                    color: VIOLET,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
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
                        fontSize: 13.5,
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
