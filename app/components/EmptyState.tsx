import type { ReactNode } from "react";
import { CREAM, GOLD, LINE, MUTED, VIOLET, VIOLET_DEEP } from "../../lib/theme";

function GoldMark() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginBottom: 18,
      }}
    >
      <span style={{ width: 28, height: 1, background: GOLD, opacity: 0.7 }} />
      <svg width="14" height="14" viewBox="0 0 14 14">
        <path d="M7 1.2 8.4 5.6 12.8 7 8.4 8.4 7 12.8 5.6 8.4 1.2 7 5.6 5.6 7 1.2Z" fill={GOLD} />
      </svg>
      <span style={{ width: 28, height: 1, background: GOLD, opacity: 0.7 }} />
    </span>
  );
}

export default function EmptyState({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <section
      className="bm-card"
      style={{
        position: "relative",
        overflow: "hidden",
        background: CREAM,
        border: "1px solid " + LINE,
        borderRadius: 22,
        padding: "42px 28px 36px",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(196,163,106,.16), transparent 58%), linear-gradient(180deg, #FFFBF6 0%, " +
            CREAM +
            " 72%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative" }}>
        <p
          className="bm-sans"
          style={{
            margin: "0 0 14px",
            fontSize: 11,
            letterSpacing: ".16em",
            color: VIOLET,
            fontWeight: 600,
          }}
        >
          {eyebrow}
        </p>
        <GoldMark />
        <h2
          className="bm-serif"
          style={{
            margin: "0 0 10px",
            fontSize: 26,
            fontWeight: 400,
            color: VIOLET_DEEP,
            letterSpacing: "-.015em",
          }}
        >
          {title}
        </h2>
        <p
          className="bm-sans"
          style={{
            margin: "0 auto",
            maxWidth: 360,
            fontSize: 14,
            lineHeight: 1.55,
            color: MUTED,
          }}
        >
          {body}
        </p>
        {action ? <div style={{ marginTop: 22 }}>{action}</div> : null}
      </div>
    </section>
  );
}

export function EmptyStateAction({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bm-sans bm-talk bm-focus"
      style={{
        background: VIOLET,
        color: "#FFFFFF",
        border: "none",
        borderRadius: 999,
        padding: "11px 18px",
        fontSize: 13.5,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
