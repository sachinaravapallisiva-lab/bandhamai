import type { Metadata } from "next";
import Link from "next/link";
import AppChrome, { ChromeLink } from "../components/AppChrome";
import ContactForm from "../components/ContactForm";
import {
  LEGAL_UPDATED,
  SUPPORT_CALL_BODY,
  SUPPORT_CALL_HEADLINE,
  SUPPORT_INBOX_TODO,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
} from "../../lib/site";
import { CREAM, LINE, MUTED, VIOLET } from "../../lib/theme";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach Bandham AI about accounts, safety reports, or profile removal.",
};

export default function ContactPage() {
  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 10px" }}>
        CONTACT
      </p>
      <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 400 }}>
        Contact
      </h2>
      <p className="bm-sans" style={{ margin: "0 0 8px", fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
        Use this page for leftover account help that the in-app tools cannot do. To block or report someone, use Block and Report on their profile or in a live chat. To close an account, use{" "}
        <Link href="/account" style={{ color: VIOLET }}>
          Account
        </Link>
        . For legal pages, see{" "}
        <Link href="/terms" style={{ color: VIOLET }}>
          Terms
        </Link>
        {", "}
        <Link href="/privacy" style={{ color: VIOLET }}>
          Privacy
        </Link>
        {", and "}
        <Link href="/safety" style={{ color: VIOLET }}>
          Safety
        </Link>
        .
      </p>
      <p className="bm-sans" style={{ margin: "0 0 22px", fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>
        Last updated {LEGAL_UPDATED}. {SUPPORT_INBOX_TODO}
      </p>
      <section
        id="call"
        className="bm-card"
        style={{
          background: CREAM,
          border: "1px solid " + LINE,
          borderRadius: 14,
          padding: "22px 18px",
          marginBottom: 18,
          scrollMarginTop: 24,
        }}
      >
        <h3 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 400 }}>
          {SUPPORT_CALL_HEADLINE}
        </h3>
        <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
          {SUPPORT_CALL_BODY}
        </p>
        <a
          href={SUPPORT_PHONE_TEL}
          className="bm-sans bm-focus"
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 44,
            color: VIOLET,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: ".02em",
            textDecoration: "none",
          }}
        >
          {SUPPORT_PHONE_DISPLAY}
        </a>
      </section>
      <ContactForm />
      <p className="bm-sans" style={{ margin: "18px 0 0", fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
        If someone is in immediate danger, contact local authorities. This form still does not send email. It is not an emergency service.
      </p>
    </AppChrome>
  );
}
