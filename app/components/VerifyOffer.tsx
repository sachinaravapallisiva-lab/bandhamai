"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { authJsonHeaders } from "../../lib/client-auth";
import { loginHref } from "../../lib/next-path";
import { canStartVerifyai, TERMS_NEED_VERIFYAI } from "../../lib/terms-agree";
import {
  isFirstPartyVerifyaiStartUrl,
  safeVerifyaiReturnPath,
  VERIFYAI_COPY,
  VERIFYAI_PRICE_LABEL,
} from "../../lib/verifyai";
import { runVerifyaiDeviceCheck, type VerifyaiDevicePublicKey } from "../../lib/verifyai-webauthn";
import { INK, LINE, MUTED, VIOLET, WASH } from "../../lib/theme";
import TermsAgreeField from "./TermsAgreeField";

type State = {
  paid: boolean;
  verified: boolean;
  status: string | null;
  hasPhoto: boolean;
  under18: boolean;
  checkoutConfigured: boolean;
  startConfigured: boolean;
  firstParty: boolean;
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
  const [needsAuth, setNeedsAuth] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const autoCheck = useRef(false);
  const checkStarted = useRef(false);

  function applyState(data: Record<string, unknown>, extras?: Partial<State>) {
    setState({
      paid: !!data.paid,
      verified: !!data.verified,
      status: typeof data.status === "string" ? data.status : extras?.status || null,
      hasPhoto: !!data.hasPhoto,
      under18: !!data.under18,
      checkoutConfigured: data.checkoutConfigured !== false,
      startConfigured: data.startConfigured !== false && data.start_configured !== false,
      firstParty: data.firstParty === true || data.first_party === true,
      start_url: typeof data.start_url === "string" ? data.start_url : extras?.start_url || null,
      ...extras,
    });
  }

  function load() {
    setNeedsAuth(false);
    setNote("");
    authJsonHeaders().then(function (headers) {
      if (!headers) {
        setNeedsAuth(true);
        return;
      }
      fetch("/api/verifyai/me", { headers })
        .then(function (r) {
          if (r.status === 401) {
            setNeedsAuth(true);
            return null;
          }
          return r.json();
        })
        .then(function (data) {
          if (!data) return;
          applyState(data);
        })
        .catch(function () {
          setNote("Could not load verification status.");
        });
    });
  }

  function reportDeviceResult(
    headers: HeadersInit,
    payload: Record<string, unknown>
  ) {
    return fetch("/api/verifyai/device", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    }).then(function (res) {
      return res.json().then(function (data) {
        applyState(data);
        setNote(data.message || data.error || "");
        setBusy(false);
        return data;
      });
    });
  }

  function runDeviceCheck() {
    if (!canStartVerifyai(agreedTerms)) {
      setNote(TERMS_NEED_VERIFYAI);
      setBusy(false);
      return;
    }
    setBusy(true);
    setNote("");
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) {
          setBusy(false);
          setNeedsAuth(true);
          return null;
        }
        return fetch("/api/verifyai/device?agreed=1", { headers: headers }).then(function (res) {
          if (res.status === 401) {
            setBusy(false);
            setNeedsAuth(true);
            return null;
          }
          return res.json().then(function (data) {
            if (!res.ok || !data.publicKey) {
              applyState(data);
              setNote(data.error || VERIFYAI_COPY.deviceFailed);
              setBusy(false);
              return null;
            }
            return runVerifyaiDeviceCheck(data.publicKey as VerifyaiDevicePublicKey).then(function (result) {
              if (result.error) {
                return reportDeviceResult(headers, {
                  agreed: true,
                  canceled: result.canceled,
                  failed: !result.canceled,
                  token: data.token,
                });
              }
              return reportDeviceResult(headers, {
                agreed: true,
                token: data.token,
                clientDataJSON: result.clientDataJSON,
                authenticatorData: result.authenticatorData,
              });
            });
          });
        });
      })
      .catch(function () {
        setBusy(false);
        setNote(VERIFYAI_COPY.deviceFailed);
      });
  }

  useEffect(function () {
    if (!signedIn) return;
    load();

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id") || "";
    if (params.get("verify") === "paid" && sessionId.startsWith("cs_")) {
      autoCheck.current = true;
      queueMicrotask(function () {
        setBusy(true);
      });
      authJsonHeaders().then(function (headers) {
        if (!headers) {
          setBusy(false);
          setNeedsAuth(true);
          return;
        }
        return fetch("/api/verifyai/confirm", {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ session_id: sessionId }),
        }).then(function (r) {
          if (r.status === 401) {
            setBusy(false);
            setNeedsAuth(true);
            return null;
          }
          return r.json().then(function (data) {
            applyState(data, {
              status: typeof data.status === "string" ? data.status : "pending",
              start_url: data.start_url || null,
            });
            setNote(data.message || data.error || VERIFYAI_COPY.paid);
            const startUrl = typeof data.start_url === "string" ? data.start_url : "";
            const firstParty = data.first_party === true || isFirstPartyVerifyaiStartUrl(startUrl, window.location.origin);
            if (data.verified) {
              setBusy(false);
              return;
            }
            if (!firstParty && startUrl && canStartVerifyai(agreedTerms)) {
              window.location.assign(startUrl);
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

  useEffect(function () {
    if (!autoCheck.current || checkStarted.current) return;
    if (!state || !state.paid || state.verified || !state.hasPhoto || state.under18) return;
    if (!canStartVerifyai(agreedTerms)) return;
    const startUrl = state.start_url || "";
    const firstParty = state.firstParty || isFirstPartyVerifyaiStartUrl(startUrl, window.location.origin);
    checkStarted.current = true;
    if (!firstParty && startUrl) {
      window.location.assign(startUrl);
      return;
    }
    runDeviceCheck();
  }, [agreedTerms, state]);

  function pay() {
    setBusy(true);
    setNote("");
    const returnPath = safeVerifyaiReturnPath(nextPath);
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) {
          setBusy(false);
          setNeedsAuth(true);
          setNote("Sign in to pay $4.99.");
          return null;
        }
        return fetch("/api/verifyai/checkout", {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ next: returnPath, return_path: returnPath }),
        });
      })
      .then(function (res) {
        if (!res) return;
        if (res.status === 401) {
          setBusy(false);
          setNeedsAuth(true);
          return;
        }
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
    if (!canStartVerifyai(agreedTerms)) {
      setNote(TERMS_NEED_VERIFYAI);
      return;
    }
    const startUrl = state && state.start_url ? state.start_url : "";
    const firstParty = !state || state.firstParty || isFirstPartyVerifyaiStartUrl(startUrl, window.location.origin);
    if (firstParty || !startUrl) {
      runDeviceCheck();
      return;
    }
    setBusy(true);
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) {
          setNeedsAuth(true);
          return null;
        }
        return fetch("/api/verifyai/start?agreed=1", { headers: headers });
      })
      .then(function (res) {
        if (!res) {
          setBusy(false);
          return;
        }
        if (res.status === 401) {
          setBusy(false);
          setNeedsAuth(true);
          return;
        }
        return res.json().then(function (data) {
          if (data.url && !isFirstPartyVerifyaiStartUrl(data.url, window.location.origin)) {
            window.location.assign(data.url);
            return;
          }
          setBusy(false);
          const missingStart = res.status === 503 || data.error === VERIFYAI_COPY.startMissing;
          if (missingStart) {
            setState(function (prev) {
              if (!prev) return prev;
              return { ...prev, startConfigured: false };
            });
            setNote(data.error || VERIFYAI_COPY.startMissing);
            return;
          }
          runDeviceCheck();
        });
      })
      .catch(function () {
        setBusy(false);
        setNote(VERIFYAI_COPY.startMissing);
      });
  }

  const signInRetry = (
    <div>
      <p className="bm-sans" style={{ margin: "0 0 12px", fontSize: 14, color: INK, lineHeight: 1.5 }}>
        Sign in again to load verification, or retry.
      </p>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <Link href={loginHref(nextPath)} className="bm-sans bm-focus" style={{ color: VIOLET, fontWeight: 600 }}>
          Sign in
        </Link>
        <button
          type="button"
          onClick={load}
          className="bm-sans bm-focus"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: VIOLET,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    </div>
  );

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
  const hasPhoto = !!(state && state.hasPhoto);
  const under18 = !!(state && state.under18);
  const firstParty = !!(
    state &&
    (state.firstParty || isFirstPartyVerifyaiStartUrl(state.start_url || "", typeof window !== "undefined" ? window.location.origin : undefined))
  );
  const startMissing = !!(
    paid &&
    !verified &&
    ((state && !state.startConfigured) || note === VERIFYAI_COPY.startMissing)
  );
  const showNote = note && note !== VERIFYAI_COPY.startMissing;

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
      ) : needsAuth ? (
        signInRetry
      ) : !state ? (
        note ? (
          <div>
            <p className="bm-sans" style={{ margin: "0 0 12px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
              {note}
            </p>
            <button
              type="button"
              onClick={load}
              className="bm-sans bm-focus"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: VIOLET,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: MUTED }}>
            One moment…
          </p>
        )
      ) : !hasPhoto ? (
        <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
          {VERIFYAI_COPY.photoRequired}{" "}
          <Link href="/profile/new" className="bm-sans bm-focus" style={{ color: VIOLET, fontWeight: 600 }}>
            Add a photo
          </Link>
        </p>
      ) : under18 ? (
        <p className="bm-sans" style={{ margin: 0, fontSize: 14, color: INK, lineHeight: 1.5 }}>
          {VERIFYAI_COPY.underage}
        </p>
      ) : startMissing ? (
        <p
          className="bm-sans"
          style={{
            margin: 0,
            fontSize: 14,
            color: INK,
            lineHeight: 1.5,
            background: WASH,
            border: "1px solid " + LINE,
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          {VERIFYAI_COPY.startMissing}
        </p>
      ) : paid ? (
        <div>
          <p className="bm-sans" style={{ margin: "0 0 12px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
            {VERIFYAI_COPY.deviceHint}
          </p>
          <div style={{ marginBottom: 14 }}>
            <TermsAgreeField
              id="verifyai-agree-terms"
              checked={agreedTerms}
              onChange={setAgreedTerms}
              disabled={busy}
            />
          </div>
          <button
            type="button"
            disabled={busy || !agreedTerms}
            onClick={startFlow}
            className="bm-sans bm-talk bm-focus"
            style={{
              background: agreedTerms ? VIOLET : WASH,
              color: agreedTerms ? "#FFFFFF" : MUTED,
              border: "none",
              borderRadius: 999,
              padding: "11px 16px",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: busy || !agreedTerms ? "default" : "pointer",
            }}
          >
            {busy ? "One moment…" : firstParty ? VERIFYAI_COPY.deviceStart : "Continue to VerifyAI"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy || (state != null && !hasPhoto)}
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
      {showNote ? (
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
