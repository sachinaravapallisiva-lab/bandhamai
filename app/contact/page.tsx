import type { Metadata } from "next";
import Link from "next/link";
import AppChrome, { ChromeLink } from "../components/AppChrome";
import ContactForm from "../components/ContactForm";
import { LEGAL_UPDATED, SUPPORT_INBOX_TODO } from "../../lib/site";
import { MUTED, VIOLET } from "../../lib/theme";

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
        Use this page for account help, a safety report, or a request to remove a profile. For legal pages, see{" "}
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
      <ContactForm />
      <p className="bm-sans" style={{ margin: "18px 0 0", fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
        If someone is in danger, contact local authorities. This form is a stub until a public inbox is published.
      </p>
    </AppChrome>
  );
}
