"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authJsonHeaders } from "../../lib/client-auth";
import {
  FEATURE_IDEA_API_PATH,
  FEATURE_IDEA_CONFIRM,
  FEATURE_IDEA_FIELD_LABEL,
  FEATURE_IDEA_PATH,
  FEATURE_IDEA_PLACEHOLDER,
  FEATURE_IDEA_SAFETY,
  FEATURE_IDEA_SIGN_IN,
  FEATURE_IDEA_SUBMIT,
  FEATURE_IDEA_TOO_SHORT,
} from "../../lib/feature-idea";
import { loginHref } from "../../lib/next-path";
import { supabase } from "../../lib/supabase";
import { INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";

export default function FeatureIdeaForm() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [idea, setIdea] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(function () {
    supabase.auth.getSession().then(function (result) {
      setSignedIn(!!result.data.session);
      setReady(true);
    }).catch(function () {
      setSignedIn(false);
      setReady(true);
    });
  }, []);

  function submit() {
    const body = idea.trim();
    if (body.length < 8) {
      setNote(FEATURE_IDEA_TOO_SHORT);
      return;
    }
    setBusy(true);
    setNote("");
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) {
          setBusy(false);
          setSignedIn(false);
          setNote(FEATURE_IDEA_SIGN_IN);
          return null;
        }
        return fetch(FEATURE_IDEA_API_PATH, {
          method: "POST",
          headers,
          body: JSON.stringify({ body }),
        });
      })
      .then(function (res) {
        if (!res) return;
        return res.json().then(function (data) {
          setBusy(false);
          if (!res.ok) {
            setNote(data.error || "Could not save your idea.");
            return;
          }
          setSent(true);
          setNote(typeof data.message === "string" ? data.message : FEATURE_IDEA_CONFIRM);
        });
      })
      .catch(function () {
        setBusy(false);
        setNote("Could not reach Bandham AI. Try again.");
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

  if (!ready) {
    return (
      <div
        className="bm-card"
        style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "22px 18px" }}
      >
        <p className="bm-sans" style={{ margin: 0, fontSize: 14, color: MUTED }}>
          One moment
        </p>
      </div>
    );
  }

  if (sent) {
    return (
      <div
        className="bm-card"
        style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "22px 18px" }}
      >
        <p className="bm-sans" style={{ margin: 0, fontSize: 16, color: INK, lineHeight: 1.5, fontWeight: 600 }}>
          {FEATURE_IDEA_CONFIRM}
        </p>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div
        className="bm-card"
        style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "22px 18px" }}
      >
        <p className="bm-sans" style={{ margin: "0 0 16px", fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
          {FEATURE_IDEA_SIGN_IN}
        </p>
        <Link
          href={loginHref(FEATURE_IDEA_PATH)}
          className="bm-sans bm-talk bm-focus"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 44,
            padding: "12px 18px",
            background: VIOLET,
            color: "#FFFFFF",
            borderRadius: 999,
            fontSize: 14.5,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={function (e) {
        e.preventDefault();
        if (!busy) submit();
      }}
      className="bm-card"
      style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "22px 18px" }}
    >
      <label className="bm-sans" style={{ display: "block", fontSize: 9.5, letterSpacing: ".14em", color: MUTED, marginBottom: 6 }}>
        {FEATURE_IDEA_FIELD_LABEL}
      </label>
      <textarea
        value={idea}
        onChange={function (e) {
          setIdea(e.target.value);
        }}
        rows={6}
        className="bm-sans bm-input bm-focus"
        style={{ ...fieldStyle, minHeight: 140, resize: "vertical", marginBottom: 18 }}
        placeholder={FEATURE_IDEA_PLACEHOLDER}
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
          cursor: busy ? "wait" : "pointer",
        }}
      >
        {busy ? "Sending" : FEATURE_IDEA_SUBMIT}
      </button>

      {note ? (
        <p className="bm-sans" style={{ margin: "14px 0 0", fontSize: 13.5, color: VIOLET_DEEP, lineHeight: 1.5 }}>
          {note}
        </p>
      ) : (
        <p className="bm-sans" style={{ margin: "14px 0 0", fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
          {FEATURE_IDEA_SAFETY}
        </p>
      )}
    </form>
  );
}
