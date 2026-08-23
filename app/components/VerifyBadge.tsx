import { GOLD } from "../../lib/theme";

/** Quiet VerifyAI mark. Hidden unless `verified` is true. Gold only. */
export default function VerifyBadge({ verified }: { verified?: boolean }) {
  if (!verified) return null;
  return (
    <span
      className="bm-sans"
      title="VerifyAI"
      aria-label="VerifyAI verified"
      style={{
        display: "inline-flex",
        alignItems: "center",
        marginLeft: 8,
        verticalAlign: "middle",
        position: "relative",
        top: -1,
      }}
    >
      <svg width="15" height="17" viewBox="0 0 16 18" aria-hidden="true">
        <path
          d="M8 1.15 14.15 4v5.05c0 4.15-2.72 6.85-6.15 7.8C4.57 15.9 1.85 13.2 1.85 9.05V4L8 1.15Z"
          fill={GOLD}
        />
        <path
          d="M5.15 9.1 7.1 11.15 11.05 6.85"
          fill="none"
          stroke="#FFF8EE"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
