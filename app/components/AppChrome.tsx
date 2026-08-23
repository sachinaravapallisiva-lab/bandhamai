import Link from "next/link";
import type { ReactNode } from "react";
import { BM_CSS, CREAM, INK, LINE, MUTED, VIOLET, WASH } from "../../lib/theme";
import BrandWordmark from "./BrandWordmark";
import SiteFooter from "./SiteFooter";

export default function AppChrome({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: WASH, color: INK }}>
      <style>{BM_CSS}</style>
      <header style={{ background: CREAM, borderBottom: "1px solid " + LINE }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 20px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 0 }}>
                <BrandWordmark href="/" size={22} />
              </h1>
              <p className="bm-sans" style={{ margin: "8px 0 0", fontSize: 12, color: MUTED, letterSpacing: ".01em" }}>
                Find your vibe match?
              </p>
            </div>
            {right}
          </div>
        </div>
      </header>
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 28px" }}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export function ChromeLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="bm-sans bm-ghost bm-focus"
      style={{
        display: "inline-block",
        background: "transparent",
        color: VIOLET,
        border: "1px solid " + LINE,
        borderRadius: 999,
        padding: "8px 14px",
        fontSize: 13,
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}
