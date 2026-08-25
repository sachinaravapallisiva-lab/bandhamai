import Link from "next/link";
import type { ReactNode } from "react";
import { BM_CSS, CREAM, INK, LINE, MUTED, VIOLET } from "../../lib/theme";
import AccountDrawer from "./AccountDrawer";
import SiteFooter from "./SiteFooter";

export default function AppChrome({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK }}>
      <style>{BM_CSS}</style>
      <header style={{ background: CREAM, borderBottom: "1px solid " + LINE }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 20px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
              <AccountDrawer />
              <div>
                <Link href="/" className="bm-serif bm-focus" style={{ textDecoration: "none", color: INK }}>
                  <h1 style={{ margin: 0, fontSize: 27, fontWeight: 400, letterSpacing: "-.01em" }}>
                    Bandham AI
                  </h1>
                </Link>
                <p className="bm-sans" style={{ margin: "3px 0 0", fontSize: 12, color: MUTED, letterSpacing: ".01em" }}>
                  Find your vibe match?
                </p>
              </div>
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
