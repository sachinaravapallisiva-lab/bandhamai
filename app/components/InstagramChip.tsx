import { displayInstagramHandle, instagramProfileUrl } from "../../lib/instagram";
import { CREAM, LINE, VIOLET } from "../../lib/theme";

/** Small Instagram link. Hidden when there is no handle. */
export default function InstagramChip({ handle }: { handle?: string | null }) {
  const cleaned = typeof handle === "string" ? handle.replace(/^@+/, "").trim() : "";
  if (!cleaned) return null;

  return (
    <a
      href={instagramProfileUrl(cleaned)}
      target="_blank"
      rel="noopener noreferrer"
      className="bm-sans bm-focus"
      aria-label={"Open Instagram profile " + displayInstagramHandle(cleaned)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        marginTop: 8,
        padding: "4px 10px",
        border: "1px solid " + LINE,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: VIOLET,
        textDecoration: "none",
        background: CREAM,
      }}
    >
      Instagram {displayInstagramHandle(cleaned)}
    </a>
  );
}
