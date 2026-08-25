import { SEEN_CHIP_LABEL } from "../../lib/profile-views";
import { CREAM, LINE, MUTED } from "../../lib/theme";

/** Quiet cream chip. Not a swipe stamp and not a chat read receipt. */
export default function SeenChip({ seen, own }: { seen?: boolean; own?: boolean }) {
  if (!seen || own) return null;

  return (
    <span
      className="bm-sans"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 9px",
        borderRadius: 999,
        background: CREAM,
        border: "1px solid " + LINE,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: ".02em",
        color: MUTED,
      }}
    >
      {SEEN_CHIP_LABEL}
    </span>
  );
}
