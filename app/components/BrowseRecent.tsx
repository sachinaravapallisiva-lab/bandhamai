"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  BROWSE_PROMPTS_HINT,
  BROWSE_PROMPTS_LABEL,
  BROWSE_PROMPTS_MENU,
  BROWSE_PROMPTS_NEW,
  BROWSE_PROMPTS_RERUN,
  BROWSE_PROMPTS_VIEW,
  browsePromptWhen,
  type BrowsePromptItem,
} from "../../lib/browse-prompts";
import { PROFILE_ACTION_MIN } from "../../lib/profile-card";
import { CREAM, INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";

function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="6" r="1.6" fill={VIOLET_DEEP} />
      <circle cx="12" cy="12" r="1.6" fill={VIOLET_DEEP} />
      <circle cx="12" cy="18" r="1.6" fill={VIOLET_DEEP} />
    </svg>
  );
}

export default function BrowseRecent({
  items,
  onView,
  onRerun,
  onNewSearch,
}: {
  items: BrowsePromptItem[];
  onView: (item: BrowsePromptItem) => void;
  onRerun: (item: BrowsePromptItem) => void;
  onNewSearch: () => void;
}) {
  const baseId = useId();
  const rootRef = useRef<HTMLElement | null>(null);
  const [openId, setOpenId] = useState("");

  useEffect(function () {
    if (!openId) return;

    function onDoc(event: MouseEvent) {
      const root = rootRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) {
        setOpenId("");
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenId("");
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return function () {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [openId]);

  if (!items.length) return null;

  return (
    <section ref={rootRef} style={{ marginBottom: 18 }}>
      <p className="bm-sans" style={{ margin: "0 0 4px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
        {BROWSE_PROMPTS_LABEL}
      </p>
      <p className="bm-sans" style={{ margin: "0 0 12px", fontSize: 12, color: MUTED, lineHeight: 1.45 }}>
        {BROWSE_PROMPTS_HINT}
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map(function (item) {
          const menuId = baseId + "-" + item.id;
          const open = openId === item.id;
          return (
            <article
              key={item.id}
              className="bm-card"
              style={{
                position: "relative",
                background: CREAM,
                border: "1px solid " + LINE,
                borderRadius: 14,
                padding: "14px 16px 12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <p
                  className="bm-serif"
                  style={{
                    margin: 0,
                    flex: 1,
                    minWidth: 0,
                    fontSize: 18,
                    fontWeight: 400,
                    color: INK,
                    lineHeight: 1.35,
                  }}
                >
                  {item.prompt}
                </p>
                <button
                  type="button"
                  aria-label={BROWSE_PROMPTS_MENU}
                  aria-haspopup="menu"
                  aria-expanded={open}
                  aria-controls={menuId}
                  onClick={function () {
                    setOpenId(open ? "" : item.id);
                  }}
                  className="bm-sans bm-ghost bm-focus"
                  style={{
                    flexShrink: 0,
                    width: PROFILE_ACTION_MIN,
                    minHeight: PROFILE_ACTION_MIN,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: WASH,
                    color: VIOLET_DEEP,
                    border: "1px solid " + LINE,
                    borderRadius: 999,
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <DotsIcon />
                </button>
              </div>

              <button
                type="button"
                onClick={function () { onView(item); }}
                className="bm-sans bm-focus"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: PROFILE_ACTION_MIN,
                  marginTop: 2,
                  padding: 0,
                  background: "none",
                  border: "none",
                  color: VIOLET,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {BROWSE_PROMPTS_VIEW}
              </button>

              <p className="bm-sans" style={{ margin: 0, fontSize: 12, color: MUTED }}>
                {browsePromptWhen(item.createdAt)}
              </p>

              {open ? (
                <div
                  id={menuId}
                  role="menu"
                  style={{
                    position: "absolute",
                    top: 52,
                    right: 12,
                    zIndex: 4,
                    minWidth: 168,
                    background: CREAM,
                    border: "1px solid " + LINE,
                    borderRadius: 12,
                    padding: 6,
                    boxShadow: "0 10px 28px rgba(45,27,54,.08)",
                  }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={function () {
                      setOpenId("");
                      onNewSearch();
                    }}
                    className="bm-sans bm-ghost bm-focus"
                    style={{
                      display: "block",
                      width: "100%",
                      minHeight: PROFILE_ACTION_MIN,
                      textAlign: "left",
                      background: "transparent",
                      color: INK,
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontSize: 13.5,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {BROWSE_PROMPTS_NEW}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={function () {
                      setOpenId("");
                      onRerun(item);
                    }}
                    className="bm-sans bm-ghost bm-focus"
                    style={{
                      display: "block",
                      width: "100%",
                      minHeight: PROFILE_ACTION_MIN,
                      textAlign: "left",
                      background: "transparent",
                      color: INK,
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontSize: 13.5,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {BROWSE_PROMPTS_RERUN}
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
