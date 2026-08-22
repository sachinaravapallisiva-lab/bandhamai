import type { ReactNode } from "react";
import { LEGAL_UPDATED } from "../../lib/site";
import { INK, LINE, MUTED } from "../../lib/theme";

export default function LegalArticle({
  kicker,
  title,
  lede,
  children,
}: {
  kicker: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <>
      <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 10px" }}>
        {kicker}
      </p>
      <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 400 }}>
        {title}
      </h2>
      <p className="bm-sans" style={{ margin: "0 0 8px", fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
        {lede}
      </p>
      <p className="bm-sans" style={{ margin: "0 0 22px", fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>
        Last updated {LEGAL_UPDATED}. This is not legal advice. It is subject to change and should be reviewed by a lawyer before you rely on it.
      </p>
      <article
        className="bm-card"
        style={{
          background: "#FFFFFF",
          border: "1px solid " + LINE,
          borderRadius: 14,
          padding: "22px 18px",
        }}
      >
        {children}
      </article>
    </>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={{ marginBottom: 22 }}>
      <h3 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 400, color: INK }}>
        {title}
      </h3>
      <div className="bm-sans" style={{ fontSize: 14, lineHeight: 1.55, color: INK }}>
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
      {items.map(function (item) {
        return (
          <li key={item} style={{ marginBottom: 6 }}>
            {item}
          </li>
        );
      })}
    </ul>
  );
}
