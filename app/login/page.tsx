"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { safeNextPath } from "../../lib/next-path";
import { INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";
import AppChrome, { ChromeLink } from "../components/AppChrome";

type Mode = "signin" | "reset";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>(function () {
    if (typeof window === "undefined") return "signin";
    return new URLSearchParams(window.location.search).get("mode") === "reset" ? "reset" : "signin";
  });

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
    if (!email.trim() || !password) {
      setStatus("Enter an email and password.");
      return;
    }
    setBusy(true);
    setStatus("Creating account...");
    supabase.auth.signUp({ email: email.trim(), password: password }).then(function (result) {
      setBusy(false);
      if (result.error) {
        setStatus(result.error.message);
        return;
      }
      if (result.data.session) {
        setStatus("Account created and signed in.");
        goNext();
        return;
      }
      setStatus("Account created. Check your email if confirmation is required, then sign in.");
    }).catch(function () {
      setBusy(false);
      setStatus("Could not reach sign-up. Try again.");
    });
  }

  function handleSignIn() {
    if (!email.trim() || !password) {
      setStatus("Enter an email and password.");
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
      setStatus("Signed in as " + (result.data.user?.email || email));
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
      setStatus("If that email has an account, a reset link is on its way. Add this site’s login URL to Supabase redirect allow-list if the mail never arrives.");
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
      setStatus("If confirmation is turned on for this project, another email was sent. If signup already signed you in, you do not need this.");
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
        {mode === "reset" ? "New password" : "Sign in"}
      </h2>
      <p className="bm-sans" style={{ margin: "0 0 22px", fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
        {mode === "reset"
          ? "This form is for the reset link from your email."
          : "Use the same email and password to create a profile."}
      </p>

      <form
        onSubmit={function (e) {
          e.preventDefault();
          if (mode === "reset") handleUpdatePassword();
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
            <label className="bm-sans" style={{ display: "block", fontSize: 9.5, letterSpacing: ".14em", color: MUTED, marginBottom: 6 }}>
              EMAIL
            </label>
            <input
              type="email"
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
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={function (e) {
                setPassword(e.target.value);
              }}
              className="bm-sans bm-input bm-focus"
              style={{ ...fieldStyle, marginBottom: 18 }}
            />

            <div style={{ display: "flex", gap: 9 }}>
              <button
                type="submit"
                disabled={busy}
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
                Sign in
              </button>
              <button
                type="button"
                disabled={busy}
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
                  cursor: busy ? "default" : "pointer",
                }}
              >
                Sign up
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
                Forgot password
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
                Resend confirmation
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
        Bandham AI is for people 18 and over. By signing in or signing up, you confirm you meet that age. See{" "}
        <Link href="/safety" className="bm-focus" style={{ color: VIOLET }}>
          Safety
        </Link>
        {", "}
        <Link href="/terms" className="bm-focus" style={{ color: VIOLET }}>
          Terms
        </Link>
        {", and "}
        <Link href="/about" className="bm-focus" style={{ color: VIOLET }}>
          About
        </Link>
        . Email confirmation is whatever this Supabase project already uses — this page does not turn it on.
      </p>
    </AppChrome>
  );
}
