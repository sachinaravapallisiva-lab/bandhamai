"use client";

import { useEffect, useId, useRef, useState } from "react";
import { VERIFYAI_COPY } from "../../lib/verifyai";
import { CREAM, LINE, VIOLET, VIOLET_DEEP } from "../../lib/theme";

/** Quiet VerifyAI hook. Hidden unless `verified` is true. Violet shield + Verified. */
export default function VerifyBadge({ verified }: { verified?: boolean }) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);

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
          margin: 0,
          padding: 0,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: VIOLET_DEEP,
          verticalAlign: "middle",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M10 1.6 16.4 4.2v5.1c0 4.1-2.8 7.6-6.4 8.7-3.6-1.1-6.4-4.6-6.4-8.7V4.2L10 1.6Z"
            fill={VIOLET}
          />
          <path
            d="M6.7 10.1 9 12.4l4.4-4.6"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            fontSize: 11,
            letterSpacing: ".02em",
            fontWeight: 600,
            color: VIOLET_DEEP,
          }}
        >
          {VERIFYAI_COPY.badgeLabel}
        </span>
      </button>
      {open ? (
        <span
          id={tipId}
          role="tooltip"
          className="bm-sans"
          style={{
            position: "absolute",
            left: 0,
            top: "calc(100% + 6px)",
            zIndex: 4,
            whiteSpace: "nowrap",
            padding: "6px 10px",
            borderRadius: 10,
            border: "1px solid " + LINE,
            background: CREAM,
            color: VIOLET_DEEP,
            fontSize: 12,
            fontWeight: 500,
            boxShadow: "0 8px 20px rgba(45,27,54,.10)",
          }}
        >
          {phrase}
        </span>
      ) : null}
    </span>
  );
}
