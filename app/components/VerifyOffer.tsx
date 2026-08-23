"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authJsonHeaders } from "../../lib/client-auth";
import { loginHref } from "../../lib/next-path";
import { VERIFYAI_COPY, VERIFYAI_PRICE_LABEL } from "../../lib/verifyai";
import { INK, LINE, MUTED, VIOLET } from "../../lib/theme";

type State = {
  paid: boolean;
  verified: boolean;
  status: string | null;
  checkoutConfigured: boolean;
  startConfigured: boolean;
  start_url?: string | null;
  message?: string;
  error?: string;
};

export default function VerifyOffer({
  signedIn,
  nextPath,
}: {
  signedIn: boolean;
  nextPath: string;
}) {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  function load() {
    authJsonHeaders().then(function (headers) {
      if (!headers) return;
      fetch("/api/verifyai/me", { headers })
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          setState({
            paid: !!data.paid,
            verified: !!data.verified,
            status: data.status || null,
            checkoutConfigured: data.checkoutConfigured !== false,
            startConfigured: !!data.startConfigured,
          });
        })
        .catch(function () {
          setNote("Could not load verification status.");
        });
    });
  }

  useEffect(function () {
    if (!signedIn) return;
    load();

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id") || "";
    if (params.get("verify") === "paid" && sessionId.startsWith("cs_")) {
      queueMicrotask(function () {
        setBusy(true);
      });
      authJsonHeaders().then(function (headers) {
        if (!headers) {
          setBusy(false);
          return;
        }
        return fetch("/api/verifyai/confirm", {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ session_id: sessionId }),
        }).then(function (r) {
          return r.json().then(function (data) {
            setState({
              paid: !!data.paid,
              verified: !!data.verified,
              status: data.status || "pending",
              checkoutConfigured: true,
              startConfigured: !!data.start_configured,
              start_url: data.start_url || null,
            });
            setNote(data.message || data.error || VERIFYAI_COPY.paid);
            if (data.start_url && !data.verified) {
              window.location.assign(data.start_url);
              return;
            }
            setBusy(false);
          });
        });
      }).catch(function () {
        setBusy(false);
        setNote("Payment may have succeeded. Refresh this page.");
      });
    }
    if (params.get("verify") === "done" || params.get("verify") === "cancel") {
      const canceled = params.get("verify") === "cancel";
      queueMicrotask(function () {
        setNote(
          canceled
            ? "Checkout canceled. Your profile is not verified."
            : "If VerifyAI finished, the badge appears after that success is recorded. Paying is not enough."
        );
      });
    }
  }, [signedIn]);

  function pay() {
    setBusy(true);
    setNote("");
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) {
          setBusy(false);
          setNote("Sign in to pay $4.99.");
          return null;
        }
        return fetch("/api/verifyai/checkout", { method: "POST", headers: headers });
      })
      .then(function (res) {
        if (!res) return;
        return res.json().then(function (data) {
          if (data.url) {
            window.location.assign(data.url);
            return;
          }
          setBusy(false);
          setNote(data.error || VERIFYAI_COPY.notConfigured);
        });
      })
      .catch(function () {
        setBusy(false);
        setNote("Could not start Stripe Checkout.");
      });
  }

  function startFlow() {
    setBusy(true);
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) return null;
        return fetch("/api/verifyai/start", { headers: headers });
      })
      .then(function (res) {
        if (!res) {
          setBusy(false);
          return;
        }
        return res.json().then(function (data) {
          setBusy(false);
          if (data.url) {
            window.location.assign(data.url);
            return;
          }
          setNote(data.error || VERIFYAI_COPY.startMissing);
        });
      })
      .catch(function () {
        setBusy(false);
        setNote(VERIFYAI_COPY.startMissing);
      });
  }

  if (!signedIn) {
    return (
      <section id="verify" className="bm-card" style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "22px 18px", marginBottom: 16 }}>
        <h3 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 400 }}>
          VerifyAI
        </h3>
        <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
          {VERIFYAI_COPY.body}
        </p>
        <Link href={loginHref(nextPath)} className="bm-sans bm-focus" style={{ color: VIOLET, fontWeight: 600 }}>
          Sign in to get verified
        </Link>
      </section>
    );
  }

  const verified = !!(state && state.verified);
  const paid = !!(state && state.paid);

  return (
    <section id="verify" className="bm-card" style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "22px 18px", marginBottom: 16 }}>
      <h3 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 400 }}>
        VerifyAI
      </h3>
      <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
        {VERIFYAI_COPY.body}
      </p>
      {verified ? (
        <p className="bm-sans" style={{ margin: 0, fontSize: 14, color: INK }}>
          This profile is verified. The quiet badge is on.
        </p>
      ) : paid ? (
        <button
          type="button"
          disabled={busy}
          onClick={startFlow}
          className="bm-sans bm-talk bm-focus"
          style={{
            background: VIOLET,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 999,
            padding: "11px 16px",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: busy ? "default" : "pointer",
          }}
        >
          {busy ? "One moment…" : "Continue to VerifyAI"}
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={pay}
          className="bm-sans bm-talk bm-focus"
          style={{
            background: VIOLET,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 999,
            padding: "11px 16px",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: busy ? "default" : "pointer",
          }}
        >
          {busy ? "One moment…" : "Get verified · " + VERIFYAI_PRICE_LABEL}
        </button>
      )}
      {note ? (
        <p className="bm-sans" style={{ margin: "12px 0 0", fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
          {note}
        </p>
      ) : null}
      {state && !state.checkoutConfigured && !verified ? (
        <p className="bm-sans" style={{ margin: "12px 0 0", fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
          {VERIFYAI_COPY.notConfigured}
        </p>
      ) : null}
    </section>
  );
}
