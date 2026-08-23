import Link from "next/link";
import { FOOTER_LINKS } from "../../lib/site";
import { CREAM, LINE, MUTED } from "../../lib/theme";

export default function SiteFooter({
  extraBottom = 0,
}: {
  extraBottom?: number;
}) {
  return (
    <footer
      style={{
        background: CREAM,
        borderTop: "1px solid " + LINE,
        paddingBottom: extraBottom,
      }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "14px 20px 18px",
        }}
      >
        <nav
          aria-label="Legal and trust"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 16px",
            alignItems: "center",
          }}
        >
          {FOOTER_LINKS.map(function (item) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bm-sans bm-focus"
                style={{
                  color: MUTED,
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <p
          className="bm-sans"
          style={{ margin: "10px 0 0", fontSize: 12, color: MUTED, lineHeight: 1.45 }}
        >
          Bandham AI. Adults 18 and over. India and the US diaspora.
        </p>
      </div>
    </footer>
  );
}
