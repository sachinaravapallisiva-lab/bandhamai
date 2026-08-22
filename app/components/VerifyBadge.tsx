import { LINE, MUTED } from "../../lib/theme";

/** Quiet VerifyAI hook. Hidden unless `verified` is true. */
export default function VerifyBadge({ verified }: { verified?: boolean }) {
  if (!verified) return null;
  return (
    <span
      className="bm-sans"
      title="VerifyAI"
      style={{
        display: "inline-block",
        marginLeft: 8,
        padding: "2px 7px",
        border: "1px solid " + LINE,
        borderRadius: 999,
        fontSize: 9,
        letterSpacing: ".12em",
        color: MUTED,
        fontWeight: 600,
        verticalAlign: "middle",
        position: "relative",
        top: -1,
      }}
    >
      VERIFYAI
    </span>
  );
}
