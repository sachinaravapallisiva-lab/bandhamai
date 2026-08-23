"use client";

import { BILLING_COPY, MESSAGING_PRICE_LABEL, type Entitlement } from "../../lib/billing";
import { INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";

export default function MessagePaywall({
  entitlement,
  busy,
  note,
  signedIn,
  onSubscribe,
  onManage,
  onSignIn,
}: {
  entitlement: Entitlement;
  busy: boolean;
  note: string;
  signedIn: boolean;
  onSubscribe: () => void;
  onManage: () => void;
  onSignIn: () => void;
}) {
  const configured = entitlement.configured;
  const tableMissing = entitlement.code === "table_missing";

  return (
    <section
      className="bm-card"
      style={{
        background: WASH,
        border: "1px solid " + LINE,
        borderRadius: 14,
        padding: "18px 16px",
        margin: "0 0 14px",
      }}
    >
      <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 8px" }}>
        MESSAGING
      </p>
      <h3 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 400, color: INK }}>
        {configured ? BILLING_COPY.headline : "Billing is not configured"}
      </h3>
      <p className="bm-sans" style={{ margin: "0 0 10px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
        {configured ? BILLING_COPY.body : BILLING_COPY.notConfigured}
      </p>
      <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>
        {BILLING_COPY.lawyer}
      </p>

      {!signedIn ? (
        <button
          type="button"
          onClick={onSignIn}
          className="bm-sans bm-talk bm-focus"
          style={{
            width: "100%",
            background: VIOLET,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 999,
            padding: "12px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Sign in to continue
        </button>
      ) : !configured || tableMissing ? (
        <p className="bm-sans" style={{ margin: 0, fontSize: 13, color: VIOLET_DEEP, lineHeight: 1.45 }}>
          {tableMissing ? BILLING_COPY.tableMissing : BILLING_COPY.notConfigured}
        </p>
      ) : (
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onSubscribe}
            disabled={busy}
            className="bm-sans bm-talk bm-focus"
            style={{
              flex: 1,
              minWidth: 160,
              background: busy ? VIOLET_DEEP : VIOLET,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 999,
              padding: "12px",
              fontSize: 14,
              fontWeight: 600,
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Opening Stripe…" : BILLING_COPY.subscribe}
          </button>
          {entitlement.stripeCustomerId ? (
            <button
              type="button"
              onClick={onManage}
              disabled={busy}
              className="bm-sans bm-ghost bm-focus"
              style={{
                background: "transparent",
                color: VIOLET,
                border: "1px solid " + LINE,
                borderRadius: 999,
                padding: "12px 16px",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: busy ? "default" : "pointer",
              }}
            >
              {BILLING_COPY.manage}
            </button>
          ) : null}
        </div>
      )}

      {note ? (
        <p className="bm-sans" style={{ margin: "12px 0 0", fontSize: 13, color: MUTED, lineHeight: 1.45 }}>
          {note}
        </p>
      ) : null}

      <p className="bm-sans" style={{ margin: "12px 0 0", fontSize: 11, color: MUTED }}>
        {MESSAGING_PRICE_LABEL} · cancel anytime in the Stripe customer portal
      </p>
    </section>
  );
}
