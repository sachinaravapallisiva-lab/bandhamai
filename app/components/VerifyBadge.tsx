import { GOLD } from "../../lib/theme";

/** Quiet VerifyAI hook. Hidden unless `verified` is true. Gold shield only. */
export default function VerifyBadge({ verified }: { verified?: boolean }) {
  if (!verified) return null;
  return (
    <span
      title="VerifyAI"
      aria-label="VerifyAI"
      style={{
        display: "inline-flex",
        width: 18,
        height: 18,
        flexShrink: 0,
        verticalAlign: "middle",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M10 1.6 16.4 4.2v5.1c0 4.1-2.8 7.6-6.4 8.7-3.6-1.1-6.4-4.6-6.4-8.7V4.2L10 1.6Z"
          fill={GOLD}
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
    </span>
  );
}
