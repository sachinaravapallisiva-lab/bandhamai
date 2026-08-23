import type { Metadata } from "next";
import Link from "next/link";
import {
  PREFERENCES_BODY,
  PREFERENCES_KICKER,
  PREFERENCES_MATCHES_LABEL,
  PREFERENCES_TITLE,
} from "../../lib/account-menu";
import { LINE, MUTED, VIOLET } from "../../lib/theme";
import AppChrome, { ChromeLink } from "../components/AppChrome";

export const metadata: Metadata = {
  title: PREFERENCES_TITLE,
  description: "Dealbreakers and match preferences for Bandham AI.",
};

export default function PreferencesPage() {
  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 10px" }}>
        {PREFERENCES_KICKER}
      </p>
      <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 400 }}>
        {PREFERENCES_TITLE}
      </h2>
      <p className="bm-sans" style={{ margin: "0 0 22px", fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
        {PREFERENCES_BODY}
      </p>
      <section
        className="bm-card"
        style={{
          background: "#FFFFFF",
          border: "1px solid " + LINE,
          borderRadius: 14,
          padding: "22px 18px",
        }}
      >
        <p className="bm-sans" style={{ margin: "0 0 16px", fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
          Speed Match is ten matrimony dealbreaker questions on Matches. It is not the home screen.
        </p>
        <Link
          href="/matches"
          className="bm-sans bm-ghost bm-focus"
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 44,
            background: "transparent",
            color: VIOLET,
            border: "1px solid " + LINE,
            borderRadius: 999,
            padding: "10px 16px",
            fontSize: 13.5,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {PREFERENCES_MATCHES_LABEL}
        </Link>
      </section>
    </AppChrome>
  );
}
