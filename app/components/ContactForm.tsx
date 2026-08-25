"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authJsonHeaders } from "../../lib/client-auth";
import { loginHref } from "../../lib/next-path";
import {
  CONTACT_GUEST_HINT,
  CONTACT_OPEN_TICKET,
  CONTACT_SIGN_IN,
  CONTACT_SIGNED_HINT,
  CONTACT_TICKET_EMAILED,
  CONTACT_TICKET_FAILED,
  CONTACT_TICKET_NEED_DETAIL,
  CONTACT_TICKET_SAVED,
  SUPPORT_CALL_LABEL,
  SUPPORT_PHONE_TEL,
} from "../../lib/site";
import { supabase } from "../../lib/supabase";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_TICKETS_PATH,
  normalizeTicketDraft,
  type SupportCategory,
} from "../../lib/support";
import { INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";

function publicTicketError(raw: unknown) {
  if (typeof raw !== "string") return CONTACT_TICKET_FAILED;
  const trimmed = raw.trim();
  if (!trimmed || /supabase|sql editor|RESEND|service key|table_missing/i.test(trimmed)) {
    return CONTACT_TICKET_FAILED;
  }
  return trimmed;
}

export default function ContactForm() {
  const [signedIn, setSignedIn] = useState(false);
  const [category, setCategory] = useState<SupportCategory>("account");
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(function () {
    supabase.auth.getSession().then(function (result) {
      setSignedIn(!!result.data.session);
    });
    const { data } = supabase.auth.onAuthStateChange(function (_event, session) {
      setSignedIn(!!session);
    });
    return function () {
      data.subscription.unsubscribe();
    };
  }, []);

  function openTicket() {
    const draft = normalizeTicketDraft({
      category: category,
      subject: subject,
      body: note,
    });
    if (!draft) {
      setStatus(CONTACT_TICKET_NEED_DETAIL);
      return;
    }
    setBusy(true);
    setStatus("");
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) {
          setSignedIn(false);
          setStatus(CONTACT_GUEST_HINT);
          return null;
        }
        return fetch(SUPPORT_TICKETS_PATH, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(draft),
        }).then(function (r) {
          return r.json().then(function (data: { message?: unknown; error?: unknown; email_sent?: unknown }) {
            return { ok: r.ok, data: data };
          });
        });
      })
      .then(function (result) {
        setBusy(false);
        if (!result) return;
        if (result.ok) {
          setSubject("");
          setNote("");
          if (result.data.email_sent === true) {
            setStatus(CONTACT_TICKET_EMAILED);
            return;
          }
          setStatus(
            typeof result.data.message === "string" && result.data.message.trim()
              ? result.data.message
              : CONTACT_TICKET_SAVED
          );
          return;
        }
        setStatus(publicTicketError(result.data && result.data.error));
      })
      .catch(function () {
        setBusy(false);
        setStatus(CONTACT_TICKET_FAILED);
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
    <form
      onSubmit={function (e) {
        e.preventDefault();
        if (signedIn) openTicket();
      }}
      className="bm-card"
      style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "22px 18px" }}
    >
      <p
        className="bm-sans"
        style={{
          margin: "0 0 16px",
          padding: "10px 12px",
          background: WASH,
          border: "1px dashed " + LINE,
          borderRadius: 10,
          fontSize: 13,
          color: VIOLET_DEEP,
          lineHeight: 1.5,
        }}
      >
        {signedIn ? CONTACT_SIGNED_HINT : CONTACT_GUEST_HINT}
      </p>

      {signedIn ? (
        <>
          <label className="bm-sans" style={{ display: "block", fontSize: 9.5, letterSpacing: ".14em", color: MUTED, marginBottom: 6 }}>
            CATEGORY
          </label>
          <select
            value={category}
            onChange={function (e) {
              setCategory(e.target.value as SupportCategory);
            }}
            className="bm-sans bm-input bm-focus"
            style={fieldStyle}
          >
            {SUPPORT_CATEGORIES.map(function (item) {
              return (
                <option key={item} value={item}>
                  {item}
                </option>
              );
            })}
          </select>

          <label className="bm-sans" style={{ display: "block", fontSize: 9.5, letterSpacing: ".14em", color: MUTED, marginBottom: 6 }}>
            SUBJECT
          </label>
          <input
            value={subject}
            onChange={function (e) {
              setSubject(e.target.value);
            }}
            className="bm-sans bm-input bm-focus"
            style={fieldStyle}
            placeholder="Short summary"
          />

          <label className="bm-sans" style={{ display: "block", fontSize: 9.5, letterSpacing: ".14em", color: MUTED, marginBottom: 6 }}>
            NOTE
          </label>
          <textarea
            value={note}
            onChange={function (e) {
              setNote(e.target.value);
            }}
            rows={5}
            className="bm-sans bm-input bm-focus"
            style={{ ...fieldStyle, minHeight: 120, resize: "vertical", marginBottom: 18 }}
            placeholder="Account help the in app Block, Report, or Account delete tools cannot do"
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
            {CONTACT_OPEN_TICKET}
          </button>
        </>
      ) : (
        <>
          <label className="bm-sans" style={{ display: "block", fontSize: 9.5, letterSpacing: ".14em", color: MUTED, marginBottom: 6 }}>
            NOTE
          </label>
          <textarea
            value={note}
            onChange={function (e) {
              setNote(e.target.value);
            }}
            rows={4}
            className="bm-sans bm-input bm-focus"
            style={{ ...fieldStyle, minHeight: 100, resize: "vertical", marginBottom: 18 }}
            placeholder="Jot what you want to ask, then call us or sign in"
          />

          <div style={{ display: "flex", gap: 9 }}>
            <a
              href={SUPPORT_PHONE_TEL}
              className="bm-sans bm-talk bm-focus"
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: VIOLET,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 999,
                padding: "13px",
                fontSize: 14.5,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {SUPPORT_CALL_LABEL}
            </a>
            <Link
              href={loginHref("/contact")}
              className="bm-sans bm-ghost bm-focus"
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                color: VIOLET,
                border: "1px solid " + LINE,
                borderRadius: 999,
                padding: "13px",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {CONTACT_SIGN_IN}
            </Link>
          </div>
        </>
      )}

      {status ? (
        <p className="bm-sans" style={{ margin: "14px 0 0", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
          {status}
        </p>
      ) : null}
    </form>
  );
}
