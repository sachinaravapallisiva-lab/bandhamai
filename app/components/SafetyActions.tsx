"use client";

import { useState } from "react";
import Link from "next/link";
import { authJsonHeaders } from "../../lib/client-auth";
import { loginHref } from "../../lib/next-path";
import { REPORT_COPY, REPORT_REASONS, reportNeedsDetails, type ReportSurface } from "../../lib/safety";
import { CREAM, INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";

export default function SafetyActions({
  profileId,
  userId,
  name,
  surface,
  signedIn,
  nextPath,
  onBlocked,
}: {
  profileId?: string;
  userId?: string;
  name?: string;
  surface: ReportSurface;
  signedIn: boolean;
  nextPath: string;
  onBlocked?: () => void;
}) {
  const [open, setOpen] = useState<"none" | "block" | "report">("none");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [blocked, setBlocked] = useState(false);

  const who = name ? name : "this person";

  function fail(message: string) {
    setBusy(false);
    setNote(message);
  }

  function call(path: string, method: string, body: Record<string, unknown>) {
    setBusy(true);
    setNote("");
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) {
          fail("Sign in to continue.");
          return null;
        }
        return fetch(path, {
          method: method,
          headers: headers,
          body: JSON.stringify(body),
        });
      })
      .then(function (res) {
        if (!res) return;
        return res.json().then(function (data) {
          return { ok: res.ok, status: res.status, data };
        });
      })
      .then(function (result) {
        if (!result) return;
        setBusy(false);
        if (!result.ok) {
          setNote(result.data.error || "That did not save.");
          return;
        }
        if (path === "/api/blocks") {
          setBlocked(true);
          setOpen("none");
          setNote("Blocked. They will not show on your Browse shortlist or Inbox, and you will not see each other's messages.");
          if (onBlocked) onBlocked();
          return;
        }
        setReason("");
        setDetails("");
        setOpen("none");
        setNote(result.data.message || REPORT_COPY.saved);
      })
      .catch(function () {
        fail("Could not reach the server. Try again.");
      });
  }

  if (!profileId && !userId) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={busy || blocked}
          onClick={function () {
            setOpen(open === "block" ? "none" : "block");
            setNote("");
          }}
          className="bm-sans bm-ghost bm-focus"
          style={{
            background: CREAM,
            border: "1px solid " + LINE,
            borderRadius: 999,
            padding: "8px 14px",
            color: blocked ? MUTED : VIOLET,
            fontSize: 13,
            fontWeight: 600,
            cursor: busy || blocked ? "default" : "pointer",
          }}
        >
          {blocked ? "Blocked" : "Block"}
        </button>
        <button
          type="button"
          disabled={busy}
          aria-expanded={open === "report"}
          onClick={function () {
            if (open === "report") {
              setOpen("none");
            } else {
              setOpen("report");
              setReason("");
              setDetails("");
            }
            setNote("");
          }}
          className="bm-sans bm-ghost bm-focus"
          style={{
            background: CREAM,
            border: "1px solid " + LINE,
            borderRadius: 999,
            padding: "8px 14px",
            color: VIOLET,
            fontSize: 13,
            fontWeight: 600,
            cursor: busy ? "default" : "pointer",
          }}
        >
          {REPORT_COPY.action}
        </button>
      </div>

      {open === "block" ? (
        <div
          style={{
            marginTop: 10,
            padding: "12px 13px",
            background: WASH,
            border: "1px solid " + LINE,
            borderRadius: 10,
          }}
        >
          <p className="bm-sans" style={{ margin: "0 0 10px", fontSize: 13, color: INK, lineHeight: 1.45 }}>
            Block {who}? They will be hidden on your Browse shortlist, Matches, and Inbox. Neither of you should be able to message the other.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              disabled={busy}
              onClick={function () {
                call("/api/blocks", "POST", { profile_id: profileId || null, user_id: userId || null });
              }}
              className="bm-sans bm-talk bm-focus"
              style={{
                background: VIOLET,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: busy ? "default" : "pointer",
              }}
            >
              {busy ? "Saving…" : "Block"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={function () {
                setOpen("none");
              }}
              className="bm-sans bm-ghost bm-focus"
              style={{
                background: "transparent",
                color: VIOLET,
                border: "1px solid " + LINE,
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {open === "report" ? (
        <div
          style={{
            marginTop: 10,
            padding: "12px 13px",
            background: WASH,
            border: "1px solid " + LINE,
            borderRadius: 10,
          }}
        >
          <p className="bm-sans" style={{ margin: "0 0 10px", fontSize: 13, color: INK, lineHeight: 1.45 }}>
            {REPORT_COPY.action} {who}. {REPORT_COPY.intro}
          </p>
          <p className="bm-sans" style={{ display: "block", fontSize: 9.5, letterSpacing: ".14em", color: MUTED, margin: "0 0 8px" }}>
            {REPORT_COPY.reasonKicker}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {REPORT_REASONS.map(function (row) {
              const selected = reason === row.id;
              return (
                <button
                  key={row.id}
                  type="button"
                  aria-pressed={selected}
                  disabled={busy}
                  onClick={function () {
                    setReason(row.id);
                    if (!reportNeedsDetails(row.id)) setDetails("");
                  }}
                  className="bm-sans bm-focus"
                  style={{
                    background: selected ? VIOLET : CREAM,
                    color: selected ? "#FFFFFF" : VIOLET_DEEP,
                    border: "1px solid " + (selected ? VIOLET : LINE),
                    borderRadius: 999,
                    padding: "8px 12px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: busy ? "default" : "pointer",
                    textAlign: "left",
                  }}
                >
                  {row.label}
                </button>
              );
            })}
          </div>
          {reportNeedsDetails(reason) ? (
            <div>
              <label className="bm-sans" style={{ display: "block", fontSize: 9.5, letterSpacing: ".14em", color: MUTED, marginBottom: 6 }}>
                {REPORT_COPY.detailsKicker}
              </label>
              <textarea
                value={details}
                onChange={function (e) {
                  setDetails(e.target.value);
                }}
                rows={3}
                placeholder={REPORT_COPY.detailsPlaceholder}
                className="bm-sans bm-input bm-focus"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid " + LINE,
                  borderRadius: 10,
                  fontSize: 13.5,
                  color: INK,
                  background: "#FFFFFF",
                  boxSizing: "border-box",
                  resize: "vertical",
                  marginBottom: 10,
                }}
              />
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              disabled={busy || !reason}
              onClick={function () {
                if (!reason) {
                  setNote(REPORT_COPY.pickReason);
                  return;
                }
                call("/api/reports", "POST", {
                  profile_id: profileId || null,
                  user_id: userId || null,
                  reason,
                  details: reportNeedsDetails(reason) ? details : "",
                  surface,
                });
              }}
              className="bm-sans bm-talk bm-focus"
              style={{
                background: VIOLET,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: busy || !reason ? "default" : "pointer",
              }}
            >
              {busy ? "Saving…" : REPORT_COPY.submit}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={function () {
                setOpen("none");
                setReason("");
                setDetails("");
              }}
              className="bm-sans bm-ghost bm-focus"
              style={{
                background: "transparent",
                color: VIOLET,
                border: "1px solid " + LINE,
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {REPORT_COPY.cancel}
            </button>
          </div>
        </div>
      ) : null}

      {note ? (
        <p
          className="bm-sans"
          style={{
            margin: "8px 0 0",
            fontSize: 12.5,
            color: note.toLowerCase().includes("danger") || note.toLowerCase().includes("blocked") || note.toLowerCase().includes("saved")
              ? MUTED
              : VIOLET_DEEP,
            lineHeight: 1.45,
          }}
        >
          {note}
        </p>
      ) : null}

      {!signedIn ? (
        <p className="bm-sans" style={{ margin: "8px 0 0", fontSize: 12.5, color: MUTED, lineHeight: 1.45 }}>
          <Link href={loginHref(nextPath)} className="bm-focus" style={{ color: VIOLET }}>
            Sign in
          </Link>
          {" to finish a block or report."}
        </p>
      ) : null}
    </div>
  );
}
