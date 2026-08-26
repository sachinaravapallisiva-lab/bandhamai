"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { VERIFYAI_COPY } from "../../lib/verifyai";
import { CREAM, GOLD, VIOLET, VIOLET_DEEP } from "../../lib/theme";

/** Quiet VerifyAI mark. Hidden unless `verified` is true. Violet shield, gold rim, white check, Verified. */
export default function VerifyBadge({ verified }: { verified?: boolean }) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<"right" | "left">("right");
  const tipId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return function () {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setPlace("right");
      return;
    }
    const node = tipRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (rect.right > window.innerWidth - 12) setPlace("left");
  }, [open]);

  if (!verified) return null;

  const phrase = VERIFYAI_COPY.badgePhrase;

  return (
    <span
      ref={rootRef}
      style={{
        position: "relative",
        display: "inline-flex",
        flexShrink: 0,
        verticalAlign: "middle",
      }}
    >
      <button
        type="button"
        className="bm-sans bm-focus"
        title={phrase}
        aria-label={phrase}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onClick={function (event) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(function (current) {
            return !current;
          });
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          margin: "-14.5px -6px",
          padding: "14.5px 6px",
          boxSizing: "content-box",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: VIOLET_DEEP,
          verticalAlign: "middle",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 20 20" overflow="visible" aria-hidden="true">
          <path
            d="M10 1.6 16.4 4.2v5.1c0 4.1-2.8 7.6-6.4 8.7-3.6-1.1-6.4-4.6-6.4-8.7V4.2L10 1.6Z"
            fill={VIOLET}
            stroke={GOLD}
            strokeWidth="1.45"
            strokeLinejoin="round"
            style={{ paintOrder: "stroke fill" }}
          />
          <path
            d="M6.85 10.1 8.95 12.2 13.25 7.5"
            fill="none"
            stroke="white"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            fontSize: 11,
            letterSpacing: ".01em",
            fontWeight: 600,
            lineHeight: 1,
            color: VIOLET_DEEP,
          }}
        >
          {VERIFYAI_COPY.badgeLabel}
        </span>
      </button>
      {open ? (
        <span
          ref={tipRef}
          id={tipId}
          role="tooltip"
          className="bm-sans"
          style={{
            position: "absolute",
            top: "50%",
            left: place === "right" ? "calc(100% + 8px)" : "auto",
            right: place === "left" ? "calc(100% + 8px)" : "auto",
            transform: "translateY(-50%)",
            zIndex: 8,
            boxSizing: "border-box",
            maxWidth: 208,
            whiteSpace: "normal",
            margin: 0,
            padding: "8px 10px",
            border: "1px solid " + GOLD,
            borderRadius: 8,
            background: CREAM,
            boxShadow: "0 6px 16px rgba(30, 27, 54, .08)",
            color: VIOLET_DEEP,
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.35,
          }}
        >
          {phrase}
        </span>
      ) : null}
    </span>
  );
}
