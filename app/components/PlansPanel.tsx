"use client";

import Link from "next/link";
import { useState } from "react";
import { PIN_CHECKOUT_PATH } from "../../lib/browse-pin";
import { loginHref } from "../../lib/next-path";
import {
  GET_PRIORITY,
  PLANS_PRIORITY_BODY,
  PLANS_PRIORITY_HEADLINE,
  PLANS_PRIORITY_KICKER,
  PLANS_PRIORITY_NOTE,
  PLANS_SUBSCRIBE_BODY,
  PLANS_SUBSCRIBE_CTA,
  PLANS_SUBSCRIBE_HEADLINE,
  PLANS_SUBSCRIBE_KICKER,
  PLANS_VERIFY_BODY,
  PLANS_VERIFY_CTA,
  PLANS_VERIFY_HEADLINE,
  PLANS_VERIFY_HREF,
  PLANS_VERIFY_KICKER,
} from "../../lib/plans";
import { BILLING_COPY } from "../../lib/billing";
import { startCheckout } from "../../lib/client-billing";
import { supabase } from "../../lib/supabase";
import { CREAM, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";

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
    <div data-plans-stack="true">
      <section
        className="bm-card"
        data-plan-card="bandham-ai"
        style={{
          background: CREAM,
          border: "1px solid " + LINE,
          borderRadius: 14,
          padding: "22px 18px 20px",
          marginBottom: 16,
        }}
      >
        <p className="bm-sans" style={{ margin: "0 0 8px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
          {PLANS_SUBSCRIBE_KICKER}
        </p>
        <h3 className="bm-serif bm-plan-headline" style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 400, color: VIOLET_DEEP }}>
          {PLANS_SUBSCRIBE_HEADLINE}
        </h3>
        <p className="bm-sans" style={{ margin: "0 0 16px", fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
          {PLANS_SUBSCRIBE_BODY}
        </p>
        <button
          type="button"
          onClick={beginSubscribe}
          disabled={busy}
          className="bm-sans bm-talk bm-focus"
          style={{
            display: "inline-block",
            background: VIOLET,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 999,
            padding: "11px 18px",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: busy ? "default" : "pointer",
          }}
        >
          {PLANS_SUBSCRIBE_CTA}
        </button>
      </section>

      <section
        className="bm-card"
        data-plan-card="priority"
        style={{
          background: WASH,
          border: "1px solid " + LINE,
          borderRadius: 14,
          padding: "18px 16px",
          marginBottom: 16,
        }}
      >
        <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
          {PLANS_PRIORITY_KICKER}
        </p>
        <p className="bm-sans" style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600, color: VIOLET }}>
          {PLANS_PRIORITY_HEADLINE}
        </p>
        <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
          {PLANS_PRIORITY_BODY}
        </p>
        <button
          type="button"
          data-plans-priority-cta="true"
          onClick={beginPriority}
          disabled={busy}
          className="bm-sans bm-ghost bm-focus"
          style={{
            display: "inline-block",
            background: "transparent",
            color: VIOLET,
            border: "1px solid " + LINE,
            borderRadius: 999,
            padding: "10px 16px",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: busy ? "default" : "pointer",
          }}
        >
          {GET_PRIORITY}
        </button>
      </section>

      <section
        className="bm-card"
        data-plan-card="verifyai"
        style={{
          background: CREAM,
          border: "1px solid " + LINE,
          borderLeft: "3px solid " + VIOLET,
          borderRadius: 14,
          padding: "16px 16px 18px",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "6px 12px", margin: "0 0 6px" }}>
          <p className="bm-sans" style={{ margin: 0, fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
            {PLANS_VERIFY_KICKER}
          </p>
          <p className="bm-sans" style={{ margin: 0, fontSize: 14, fontWeight: 600, color: VIOLET_DEEP }}>
            {PLANS_VERIFY_HEADLINE}
          </p>
        </div>
        <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
          {PLANS_VERIFY_BODY}
        </p>
        <Link
          href={PLANS_VERIFY_HREF}
          className="bm-sans bm-ghost bm-focus"
          style={{
            display: "inline-block",
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
          {PLANS_VERIFY_CTA}
        </Link>
      </section>

      {note ? (
        <p className="bm-sans" style={{ margin: "8px 0 0", fontSize: 13, color: MUTED }}>
          {note}
        </p>
      ) : null}
    </div>
  );
}
