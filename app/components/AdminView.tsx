"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ADMIN_KICKER,
  ADMIN_LEAD,
  ADMIN_METRICS_CARD_ACTION,
  ADMIN_METRICS_CARD_BODY,
  ADMIN_METRICS_CARD_TITLE,
  ADMIN_METRICS_PATH,
  ADMIN_PATH,
  ADMIN_TITLE,
  ADMIN_UNAVAILABLE_BODY,
  ADMIN_UNAVAILABLE_TITLE,
} from "../../lib/admin";
import { fetchAdminAccess } from "../../lib/client-admin";
import { loginHref } from "../../lib/next-path";
import { supabase } from "../../lib/supabase";
import { METRICS_TITLE } from "../../lib/metrics";
import { CREAM, GOLD, INK, LINE, MUTED, VIOLET, VIOLET_DEEP } from "../../lib/theme";
import AppChrome, { ChromeLink } from "./AppChrome";
import BandhamMark from "./BandhamMark";

type ViewState = "boot" | "closed" | "ready";

function GoldRule() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "18px 0 0",
      }}
    >
      <span style={{ width: 28, height: 1, background: GOLD, opacity: 0.7 }} />
      <svg width="12" height="12" viewBox="0 0 14 14">
        <path d="M7 1.2 8.4 5.6 12.8 7 8.4 8.4 7 12.8 5.6 8.4 1.2 7 5.6 5.6 7 1.2Z" fill={GOLD} />
      </svg>
      <span style={{ flex: 1, height: 1, background: GOLD, opacity: 0.35 }} />
    </span>
  );
}

export default function AdminView() {
  const router = useRouter();
  const [view, setView] = useState<ViewState>("boot");

  useEffect(function () {
    let cancelled = false;
    supabase.auth.getSession().then(function (result) {
      if (cancelled) return;
      if (!result.data.session) {
        router.replace(loginHref(ADMIN_PATH));
        return;
      }
      fetchAdminAccess().then(function (access) {
        if (cancelled) return;
        setView(access.admin ? "ready" : "closed");
      });
    });
    return function () {
      cancelled = true;
    };
  }, [router]);

  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      {view === "boot" ? null : view === "closed" ? (
        <section
          className="bm-card"
          style={{
            background: CREAM,
            border: "1px solid " + LINE,
            borderRadius: 22,
            padding: "42px 28px 36px",
          }}
        >
          <h2 className="bm-serif" style={{ margin: "0 0 10px", fontSize: 32, fontWeight: 400 }}>
            {ADMIN_UNAVAILABLE_TITLE}
          </h2>
          <p className="bm-sans" style={{ margin: 0, fontSize: 16, color: MUTED, lineHeight: 1.55 }}>
            {ADMIN_UNAVAILABLE_BODY}
          </p>
        </section>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <section
            className="bm-card"
            style={{
              position: "relative",
              overflow: "hidden",
              background: CREAM,
              border: "1px solid " + LINE,
              borderRadius: 22,
              padding: "36px 28px 32px",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse at 12% 0%, rgba(109,40,217,.08), transparent 42%), radial-gradient(ellipse at 80% 0%, rgba(196,163,106,.16), transparent 48%)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <BandhamMark />
                <p className="bm-sans" style={{ margin: 0, fontSize: 12, letterSpacing: ".16em", color: VIOLET, fontWeight: 600 }}>
                  {ADMIN_KICKER}
                </p>
              </div>
              <h2 className="bm-serif" style={{ margin: "18px 0 0", fontSize: 40, fontWeight: 400, color: INK }}>
                {ADMIN_TITLE}
              </h2>
              <p className="bm-sans" style={{ margin: "10px 0 0", fontSize: 16, lineHeight: 1.55, color: MUTED, maxWidth: 520 }}>
                {ADMIN_LEAD}
              </p>
              <GoldRule />
            </div>
          </section>

          <Link
            href={ADMIN_METRICS_PATH}
            className="bm-card bm-focus"
            style={{
              display: "block",
              background: "#FFFFFF",
              border: "1px solid " + LINE,
              borderRadius: 22,
              padding: "28px 24px",
              textDecoration: "none",
              minHeight: 44,
            }}
          >
            <p className="bm-sans" style={{ margin: 0, fontSize: 12, letterSpacing: ".16em", color: MUTED, fontWeight: 600 }}>
              {ADMIN_METRICS_CARD_TITLE}
            </p>
            <h3 className="bm-serif" style={{ margin: "10px 0 0", fontSize: 28, fontWeight: 400, color: INK }}>
              {METRICS_TITLE}
            </h3>
            <p className="bm-sans" style={{ margin: "10px 0 0", fontSize: 16, lineHeight: 1.55, color: MUTED }}>
              {ADMIN_METRICS_CARD_BODY}
            </p>
            <span
              className="bm-sans"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 44,
                marginTop: 18,
                color: VIOLET_DEEP,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {ADMIN_METRICS_CARD_ACTION}
            </span>
          </Link>
        </div>
      )}
    </AppChrome>
  );
}
