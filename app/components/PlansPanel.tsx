"use client";

import Link from "next/link";
import { useState } from "react";
import { PIN_CHECKOUT_PATH } from "../../lib/browse-pin";
import { loginHref } from "../../lib/next-path";
import {
  GET_PRIORITY,
  PLANS_PRIORITY_CAP,
  PLANS_PRIORITY_HEADLINE,
  PLANS_PRIORITY_NOTE,
  PLANS_PRIORITY_RENEW,
  PLANS_SUBSCRIBE_CTA,
  PLANS_SUBSCRIBE_HEADLINE,
  PLANS_VERIFY_CTA,
  PLANS_VERIFY_HEADLINE,
  PLANS_VERIFY_HREF,
} from "../../lib/plans";
import { BILLING_COPY } from "../../lib/billing";
import { startCheckout } from "../../lib/client-billing";
import { supabase } from "../../lib/supabase";
import { CREAM, LINE, MUTED, VIOLET, VIOLET_DEEP } from "../../lib/theme";

const cardStyle = {
  background: CREAM,
  border: "1px solid " + LINE,
  borderRadius: 14,
  padding: "20px 18px",
  marginBottom: 14,
};

const buttonStyle = {
  display: "inline-block",
  background: VIOLET,
  color: "#FFFFFF",
  border: "none",
  borderRadius: 999,
  padding: "11px 18px",
  fontSize: 13.5,
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
};

export default function PlansPanel() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function beginSubscribe() {
    setBusy(true);
    setNote("");
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      window.location.href = loginHref("/plans");
      return;
    }
    const result = await startCheckout();
    if (result.url) {
      window.location.href = result.url;
      return;
    }
    setNote(result.error || BILLING_COPY.notConfigured);
    setBusy(false);
  }

  async function beginPriority() {
    setBusy(true);
    setNote("");
    try {
      const res = await fetch(PIN_CHECKOUT_PATH, { method: "POST" });
      const data = (await res.json().catch(function () {
        return {};
      })) as { error?: string };
      setNote(data.error || PLANS_PRIORITY_NOTE);
    } catch {
      setNote(PLANS_PRIORITY_NOTE);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <section className="bm-card" style={cardStyle}>
        <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
          BANDHAM AI
        </p>
        <h3 className="bm-serif" style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 400, color: VIOLET_DEEP }}>
          {PLANS_SUBSCRIBE_HEADLINE}
        </h3>
        <button
          type="button"
          onClick={beginSubscribe}
          disabled={busy}
          className="bm-sans bm-talk bm-focus"
          style={buttonStyle}
        >
          {PLANS_SUBSCRIBE_CTA}
        </button>
      </section>

      <section className="bm-card" style={cardStyle}>
        <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
          PRIORITY
        </p>
        <h3 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 400, color: VIOLET_DEEP }}>
          {PLANS_PRIORITY_HEADLINE}
        </h3>
        <p className="bm-sans" style={{ margin: "0 0 4px", fontSize: 13.5, color: MUTED }}>
          {PLANS_PRIORITY_CAP}
        </p>
        <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 13.5, color: MUTED }}>
          {PLANS_PRIORITY_RENEW}
        </p>
        <button
          type="button"
          data-plans-priority-cta="true"
          onClick={beginPriority}
          disabled={busy}
          className="bm-sans bm-talk bm-focus"
          style={buttonStyle}
        >
          {GET_PRIORITY}
        </button>
      </section>

      <section className="bm-card" style={cardStyle}>
        <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
          VERIFYAI
        </p>
        <h3 className="bm-serif" style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 400, color: VIOLET_DEEP }}>
          {PLANS_VERIFY_HEADLINE}
        </h3>
        <Link href={PLANS_VERIFY_HREF} className="bm-sans bm-talk bm-focus" style={buttonStyle}>
          {PLANS_VERIFY_CTA}
        </Link>
      </section>

      {note ? (
        <p className="bm-sans" style={{ margin: "4px 0 0", fontSize: 13, color: MUTED }}>
          {note}
        </p>
      ) : null}
    </div>
  );
}
