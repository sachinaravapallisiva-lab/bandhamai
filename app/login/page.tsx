"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { safeNextPath } from "../../lib/next-path";
import {
  LOGIN_AGE_NOTE,
  LOGIN_CREATED_CONFIRM,
  LOGIN_CREATED_SESSION,
  LOGIN_CREATING,
  LOGIN_EMPTY_FIELDS,
  LOGIN_FORGOT_LABEL,
  LOGIN_FORGOT_SENT,
  LOGIN_RESEND_LABEL,
  LOGIN_RESEND_SENT,
  LOGIN_SIGN_IN_LABEL,
  LOGIN_SIGN_UP_API,
  LOGIN_SIGN_UP_LABEL,
  LOGIN_SIGN_UP_PROMPT,
  LOGIN_SIGN_UP_UNREACHABLE,
  LOGIN_TERMS_NEED,
  LOGIN_TERMS_PATH,
  canCreateSignUpAccount,
  decideSignInIntent,
  decideSignUpIntent,
  loginAuthMode,
  loginHeading,
  loginHelp,
  loginPageModeFromSearch,
  type LoginPageMode,
} from "../../lib/login-auth";
import { identifySignedInUser } from "../../lib/posthog-browser";
import { INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";
import AppChrome, { ChromeLink } from "../components/AppChrome";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [mode, setMode] = useState<LoginPageMode>(function () {
    if (typeof window === "undefined") return "signin";
    return loginPageModeFromSearch(new URLSearchParams(window.location.search).get("mode"));
  });
  const emailRef = useRef<HTMLInputElement>(null);

  function nextTarget() {
    return safeNextPath(new URLSearchParams(window.location.search).get("next"));
  }

  useEffect(function () {
    const params = new URLSearchParams(window.location.search);
    const resetting = params.get("mode") === "reset";

    supabase.auth.getSession().then(function (result) {
      if (result.data.session && !resetting) {
        window.location.replace(safeNextPath(params.get("next")));
      }
    });

    const { data } = supabase.auth.onAuthStateChange(function (event) {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        setStatus("Choose a new password.");
      }
    });
    return function () {
      data.subscription.unsubscribe();
    };
  }, []);

  function goNext() {
    window.location.assign(nextTarget());
  }

  function handleSignUp() {
    const intent = decideSignUpIntent(loginAuthMode(mode), email, password);
    if (intent === "switch-to-signup") {
      setMode("signup");
      setStatus(LOGIN_SIGN_UP_PROMPT);
      window.requestAnimationFrame(function () {
        emailRef.current?.focus();
      });
      return;
    }
    if (intent === "need-fields") {
      setStatus(LOGIN_EMPTY_FIELDS);
      emailRef.current?.focus();
      return;
    }
    if (intent === "create-account") {
      if (!canCreateSignUpAccount(agreedTerms)) {
        if (mode !== "signup") setMode("signup");
        setStatus(LOGIN_TERMS_NEED);
        return;
      }
      setBusy(true);
      setStatus(LOGIN_CREATING);
      fetch(LOGIN_SIGN_UP_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          agreed: true,
        }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            setBusy(false);
            setStatus(result.data.error || LOGIN_SIGN_UP_UNREACHABLE);
            return;
          }
          const user = result.data.user;
          if (user && user.id) {
            identifySignedInUser(user.id, user.email || email.trim());
          }
          const session = result.data.session;
          if (session && session.access_token && session.refresh_token) {
            return supabase.auth.setSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }).then(function () {
              setBusy(false);
              setStatus(LOGIN_CREATED_SESSION);
              goNext();
            });
          }
          setBusy(false);
          setStatus(LOGIN_CREATED_CONFIRM);
        })
        .catch(function () {
          setBusy(false);
          setStatus(LOGIN_SIGN_UP_UNREACHABLE);
        });
    }
  }

  function handleSignIn() {
    if (mode === "signup") setMode("signin");
    const intent = decideSignInIntent(email, password);
    if (intent === "need-fields") {
      setStatus(LOGIN_EMPTY_FIELDS);
      return;
    }
    setBusy(true);
    setStatus("Signing in...");
    supabase.auth.signInWithPassword({ email: email.trim(), password: password }).then(function (result) {
      setBusy(false);
      if (result.error) {
        setStatus(result.error.message);
        return;
      }
      const user = result.data.user;
      if (user && user.id) {
        identifySignedInUser(user.id, user.email);
      }
      setStatus("Signed in as " + (user?.email || email));
      goNext();
    }).catch(function () {
      setBusy(false);
      setStatus("Could not reach sign-in. Try again.");
    });
  }

  function handleForgot() {
    if (!email.trim()) {
      setStatus("Enter your email first, then tap Forgot password.");
      return;
    }
    setBusy(true);
    setStatus("Sending a reset link...");
    const redirectTo = window.location.origin + "/login?mode=reset&next=" + encodeURIComponent(nextTarget());
    supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectTo }).then(function (result) {
      setBusy(false);
      if (result.error) {
        setStatus(result.error.message);
        return;
      }
      setStatus(LOGIN_FORGOT_SENT);
    }).catch(function () {
      setBusy(false);
      setStatus("Could not start a password reset. Try again.");
    });
  }

  function handleResendConfirm() {
    if (!email.trim()) {
      setStatus("Enter your email first, then tap Resend confirmation.");
      return;
    }
    setBusy(true);
    setStatus("Sending confirmation...");
    supabase.auth.resend({ type: "signup", email: email.trim() }).then(function (result) {
      setBusy(false);
      if (result.error) {
        setStatus(result.error.message);
        return;
      }
      setStatus(LOGIN_RESEND_SENT);
    }).catch(function () {
      setBusy(false);
      setStatus("Could not resend confirmation. Try again.");
    });
  }

  function handleUpdatePassword() {
    if (!nextPassword || nextPassword.length < 6) {
      setStatus("Choose a new password of at least 6 characters.");
      return;
    }
    setBusy(true);
    setStatus("Saving new password...");
    supabase.auth.updateUser({ password: nextPassword }).then(function (result) {
      setBusy(false);
      if (result.error) {
        setStatus(result.error.message);
        return;
      }
      setStatus("Password updated. You are signed in.");
      goNext();
    }).catch(function () {
      setBusy(false);
      setStatus("Could not update the password. Open the reset link from your email again.");
    });
  }

  const fieldStyle = {
    width: "100%",
    padding: "13px 15px",
    border: "1px solid " + LINE,
    borderRadius: 10,
    fontSize: 14.5,
    color: INK,
    background: WASH,
    outline: "none" as const,
    boxSizing: "border-box" as const,
    marginBottom: 14,
  };

  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 10px" }}>
        ACCOUNT
      </p>
      <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 400 }}>
        {loginHeading(mode)}
      </h2>
      <p className="bm-sans" style={{ margin: "0 0 22px", fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
        {loginHelp(mode)}
      </p>

      <form
        onSubmit={function (e) {
          e.preventDefault();
          if (mode === "reset") handleUpdatePassword();
          else if (mode === "signup") handleSignUp();
          else handleSignIn();
        }}
        className="bm-card"
        style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "22px 18px" }}
      >
        {mode === "reset" ? (
          <>
            <label className="bm-sans" style={{ display: "block", fontSize: 9.5, letterSpacing: ".14em", color: MUTED, marginBottom: 6 }}>
              NEW PASSWORD
            </label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              value={nextPassword}
              onChange={function (e) {
                setNextPassword(e.target.value);
              }}
              className="bm-sans bm-input bm-focus"
              style={{ ...fieldStyle, marginBottom: 18 }}
            />
            <button
              type="submit"
              disabled={busy}
              className="bm-sans bm-talk bm-focus"
              style={{
                width: "100%",
                background: VIOLET,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 999,
                padding: "13px",
                fontSize: 14.5,
                fontWeight: 600,
                cursor: busy ? "default" : "pointer",
                opacity: busy ? 0.7 : 1,
              }}
            >
              Save password
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={function () {
                setMode("signin");
                setStatus("");
              }}
              className="bm-sans bm-focus"
              style={{
                marginTop: 12,
                background: "none",
                border: "none",
                color: VIOLET,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <button type="submit" hidden disabled={mode === "signup" && !agreedTerms}>
              {mode === "signup" ? LOGIN_SIGN_UP_LABEL : LOGIN_SIGN_IN_LABEL}
            </button>
            <label className="bm-sans" style={{ display: "block", fontSize: 9.5, letterSpacing: ".14em", color: MUTED, marginBottom: 6 }}>
              EMAIL
            </label>
            <input
              ref={emailRef}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={function (e) {
                setEmail(e.target.value);
              }}
              className="bm-sans bm-input bm-focus"
              style={fieldStyle}
            />

            <label className="bm-sans" style={{ display: "block", fontSize: 9.5, letterSpacing: ".14em", color: MUTED, marginBottom: 6 }}>
              PASSWORD
            </label>
            <input
              type="password"
              name="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="Password"
              value={password}
              onChange={function (e) {
                setPassword(e.target.value);
              }}
              className="bm-sans bm-input bm-focus"
              style={{ ...fieldStyle, marginBottom: mode === "signup" ? 14 : 18 }}
            />

            {mode === "signup" ? (
              <label
                htmlFor="agree-terms"
                className="bm-sans"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  marginBottom: 18,
                  fontSize: 13.5,
                  color: INK,
                  lineHeight: 1.45,
                  cursor: "pointer",
                }}
              >
                <input
                  id="agree-terms"
                  name="agreeTerms"
                  type="checkbox"
                  required
                  checked={agreedTerms}
                  onChange={function (e) {
                    setAgreedTerms(e.target.checked);
                  }}
                  className="bm-focus"
                  style={{ marginTop: 3, width: 16, height: 16, accentColor: VIOLET }}
                />
                <span>
                  I agree to the{" "}
                  <Link href={LOGIN_TERMS_PATH} className="bm-focus" style={{ color: VIOLET }}>
                    Terms
                  </Link>
                  .
                </span>
              </label>
            ) : null}

            <div style={{ display: "flex", gap: 9 }}>
              <button
                type="button"
                disabled={busy}
                onClick={handleSignIn}
                className="bm-sans bm-talk bm-focus"
                style={{
                  flex: 1,
                  background: VIOLET,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 999,
                  padding: "13px",
                  fontSize: 14.5,
                  fontWeight: 600,
                  cursor: busy ? "default" : "pointer",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {LOGIN_SIGN_IN_LABEL}
              </button>
              <button
                type="button"
                disabled={busy || (mode === "signup" && !agreedTerms)}
                onClick={handleSignUp}
                className="bm-sans bm-ghost bm-focus"
                style={{
                  flex: 1,
                  background: "transparent",
                  color: VIOLET,
                  border: "1px solid " + LINE,
                  borderRadius: 999,
                  padding: "13px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: busy || (mode === "signup" && !agreedTerms) ? "default" : "pointer",
                  opacity: mode === "signup" && !agreedTerms ? 0.55 : 1,
                }}
              >
                {LOGIN_SIGN_UP_LABEL}
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 14 }}>
              <button
                type="button"
                disabled={busy}
                onClick={handleForgot}
                className="bm-sans bm-focus"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: VIOLET,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: busy ? "default" : "pointer",
                  textDecoration: "underline",
                }}
              >
                {LOGIN_FORGOT_LABEL}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleResendConfirm}
                className="bm-sans bm-focus"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: MUTED,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: busy ? "default" : "pointer",
                  textDecoration: "underline",
                }}
              >
                {LOGIN_RESEND_LABEL}
              </button>
            </div>
          </>
        )}

        {status ? (
          <p className="bm-sans" style={{ margin: "14px 0 0", fontSize: 13.5, color: status.toLowerCase().includes("error") || status.includes("Invalid") ? VIOLET_DEEP : MUTED }}>
            {status}
          </p>
        ) : null}
      </form>

      <p className="bm-sans" style={{ margin: "16px 0 0", fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>
        {LOGIN_AGE_NOTE} See{" "}
        <Link href="/safety" className="bm-focus" style={{ color: VIOLET }}>
          Safety
        </Link>
        {" and "}
        <Link href="/terms" className="bm-focus" style={{ color: VIOLET }}>
          Terms
        </Link>
        .
      </p>
    </AppChrome>
  );
}
