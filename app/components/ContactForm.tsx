"use client";

import { useState } from "react";
import { SUPPORT_INBOX_TODO } from "../../lib/site";
import { INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  function submit() {
    const body = [
      "Bandham AI contact draft",
      name.trim() ? "Name: " + name.trim() : "Name: (not given)",
      email.trim() ? "Email: " + email.trim() : "Email: (not given)",
      "",
      note.trim() || "(empty note)",
    ].join("\n");
    setDraft(body);
    setCopied(false);
  }

  function copyDraft() {
    if (!draft || !navigator.clipboard) return;
    navigator.clipboard.writeText(draft).then(function () {
      setCopied(true);
    }).catch(function () {
      setCopied(false);
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
        submit();
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
        {SUPPORT_INBOX_TODO} This form does not send email.
      </p>

      <label className="bm-sans" style={{ display: "block", fontSize: 9.5, letterSpacing: ".14em", color: MUTED, marginBottom: 6 }}>
        YOUR NAME
      </label>
      <input
        value={name}
        onChange={function (e) {
          setName(e.target.value);
        }}
        className="bm-sans bm-input bm-focus"
        style={fieldStyle}
        placeholder="How we should address you"
      />

      <label className="bm-sans" style={{ display: "block", fontSize: 9.5, letterSpacing: ".14em", color: MUTED, marginBottom: 6 }}>
        YOUR EMAIL
      </label>
      <input
        type="email"
        value={email}
        onChange={function (e) {
          setEmail(e.target.value);
        }}
        className="bm-sans bm-input bm-focus"
        style={fieldStyle}
        placeholder="you@email.com"
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
        placeholder="Account help, a safety report, or a removal request"
      />

      <button
        type="submit"
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
          cursor: "pointer",
        }}
      >
        Draft note
      </button>

      {draft ? (
        <div style={{ marginTop: 16 }}>
          <p className="bm-sans" style={{ margin: "0 0 8px", fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
            Saved on this screen only. Copy it and keep it until a real inbox is listed.
          </p>
          <pre
            className="bm-sans"
            style={{
              margin: 0,
              padding: "12px 14px",
              background: WASH,
              border: "1px solid " + LINE,
              borderRadius: 10,
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              color: INK,
            }}
          >
            {draft}
          </pre>
          <button
            type="button"
            onClick={copyDraft}
            className="bm-sans bm-ghost bm-focus"
            style={{
              marginTop: 10,
              background: "transparent",
              color: VIOLET,
              border: "1px solid " + LINE,
              borderRadius: 999,
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {copied ? "Copied" : "Copy draft"}
          </button>
        </div>
      ) : null}
    </form>
  );
}
