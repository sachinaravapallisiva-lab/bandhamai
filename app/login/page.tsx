"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { safeNextPath } from "../../lib/client-auth";
import { INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";
import AppChrome, { ChromeLink } from "../components/AppChrome";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(function () {
    supabase.auth.getSession().then(function (result) {
      if (result.data.session) {
        window.location.replace(safeNextPath(new URLSearchParams(window.location.search).get("next")));
      }
    });
  }, []);

  function goNext() {
    window.location.assign(safeNextPath(new URLSearchParams(window.location.search).get("next")));
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
    });
  }

  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 10px" }}>
        ACCOUNT
      </p>
      <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 400 }}>
        Sign in
      </h2>
      <p className="bm-sans" style={{ margin: "0 0 22px", fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
        Use the same email and password to create a profile.
      </p>

      <form
        onSubmit={function (e) {
          e.preventDefault();
          handleSignIn();
        }}
        className="bm-card"
        style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "22px 18px" }}
      >
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
          style={{
            width: "100%",
            padding: "13px 15px",
            border: "1px solid " + LINE,
            borderRadius: 10,
            fontSize: 14.5,
            color: INK,
            background: WASH,
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 14,
          }}
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
          style={{
            width: "100%",
            padding: "13px 15px",
            border: "1px solid " + LINE,
            borderRadius: 10,
            fontSize: 14.5,
            color: INK,
            background: WASH,
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 18,
          }}
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

        {status ? (
          <p className="bm-sans" style={{ margin: "14px 0 0", fontSize: 13.5, color: status.toLowerCase().includes("error") || status.includes("Invalid") ? VIOLET_DEEP : MUTED }}>
            {status}
          </p>
        ) : null}
      </form>
    </AppChrome>
  );
}
