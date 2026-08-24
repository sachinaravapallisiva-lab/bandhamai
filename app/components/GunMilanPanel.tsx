"use client";

import { useState } from "react";
import { authJsonHeaders } from "../../lib/client-auth";
import {
  GUN_MILAN_ACTION,
  GUN_MILAN_API_PATH,
  GUN_MILAN_CACHED_NOTE,
  GUN_MILAN_EMPTY_RUN,
  GUN_MILAN_FOCUS_HINT,
  GUN_MILAN_LOAD_ERROR,
  GUN_MILAN_KOOT_LABEL,
  GUN_MILAN_MANGLIK_LABEL,
  GUN_MILAN_NOT_CONFIGURED,
  GUN_MILAN_RUN,
  GUN_MILAN_RUNNING,
  GUN_MILAN_SCORE_LABEL,
  GUN_MILAN_TITLE,
  formatScoreLine,
  rememberGunMilanProfile,
  type GunMilanView,
} from "../../lib/gun-milan";
import { KUNDLI_SIGNED_IN_ERROR } from "../../lib/kundli-share";
import { CREAM, INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";

function asText(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function ManglikBlock({ title, flag }: { title: string; flag: GunMilanView["girl_mangal_dosha_details"] }) {
  if (!flag) return null;
  const lines = [
    flag.description != null ? asText(flag.description) : "",
    flag.has_dosha != null ? "has_dosha: " + asText(flag.has_dosha) : "",
    flag.has_exception != null ? "has_exception: " + asText(flag.has_exception) : "",
    flag.dosha_type != null && asText(flag.dosha_type) ? "dosha_type: " + asText(flag.dosha_type) : "",
  ].filter(Boolean);
  if (!lines.length) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <p className="bm-sans" style={{ margin: "0 0 4px", fontSize: 12, color: MUTED, fontWeight: 600 }}>
        {title}
      </p>
      {lines.map(function (line) {
        return (
          <p key={line} className="bm-sans" style={{ margin: "0 0 4px", fontSize: 13.5, color: INK, lineHeight: 1.45 }}>
            {line}
          </p>
        );
      })}
    </div>
  );
}

function ReportView({ report }: { report: GunMilanView }) {
  const score = formatScoreLine(report);
  return (
    <div>
      {score ? (
        <div style={{ marginBottom: 14 }}>
          <p className="bm-sans" style={{ margin: "0 0 4px", fontSize: 9.5, letterSpacing: ".14em", color: MUTED }}>
            {GUN_MILAN_SCORE_LABEL}
          </p>
          <p className="bm-serif" style={{ margin: 0, fontSize: 26, color: VIOLET_DEEP }}>
            {score}
          </p>
        </div>
      ) : null}

      {report.message && report.message.description != null ? (
        <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 13.5, color: INK, lineHeight: 1.5 }}>
          {asText(report.message.description)}
        </p>
      ) : null}

      {report.koots.length > 0 ? (
        <div style={{ marginBottom: 14 }}>
          <p className="bm-sans" style={{ margin: "0 0 8px", fontSize: 9.5, letterSpacing: ".14em", color: MUTED }}>
            {GUN_MILAN_KOOT_LABEL}
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            {report.koots.map(function (koot, index) {
              const key = asText(koot.id) || asText(koot.name) || String(index);
              const points =
                koot.obtained_points != null && koot.maximum_points != null
                  ? asText(koot.obtained_points) + " / " + asText(koot.maximum_points)
                  : "";
              return (
                <div
                  key={key}
                  style={{
                    padding: "10px 12px",
                    background: WASH,
                    border: "1px solid " + LINE,
                    borderRadius: 10,
                  }}
                >
                  <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: INK, fontWeight: 600 }}>
                    {asText(koot.name) || "Koot"}
                    {points ? " · " + points : ""}
                  </p>
                  {koot.girl_koot != null || koot.boy_koot != null ? (
                    <p className="bm-sans" style={{ margin: "4px 0 0", fontSize: 12.5, color: MUTED }}>
                      {asText(koot.girl_koot)}
                      {koot.girl_koot != null && koot.boy_koot != null ? " · " : ""}
                      {asText(koot.boy_koot)}
                    </p>
                  ) : null}
                  {koot.description != null ? (
                    <p className="bm-sans" style={{ margin: "6px 0 0", fontSize: 12.5, color: INK, lineHeight: 1.45 }}>
                      {asText(koot.description)}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {report.girl_mangal_dosha_details || report.boy_mangal_dosha_details ? (
        <div>
          <p className="bm-sans" style={{ margin: "0 0 8px", fontSize: 9.5, letterSpacing: ".14em", color: MUTED }}>
            {GUN_MILAN_MANGLIK_LABEL}
          </p>
          <ManglikBlock title="girl_mangal_dosha_details" flag={report.girl_mangal_dosha_details} />
          <ManglikBlock title="boy_mangal_dosha_details" flag={report.boy_mangal_dosha_details} />
        </div>
      ) : null}

      <p className="bm-sans" style={{ margin: "14px 0 0", fontSize: 12.5, color: MUTED, lineHeight: 1.45 }}>
        {GUN_MILAN_FOCUS_HINT}
      </p>
    </div>
  );
}

export default function GunMilanPanel({
  profileId,
  signedIn,
}: {
  profileId: string;
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [report, setReport] = useState<GunMilanView | null>(null);
  const [cached, setCached] = useState(false);
  const [canRun, setCanRun] = useState(false);

  function applyPayload(data: {
    report?: GunMilanView | null;
    configured?: boolean;
    cached?: boolean;
    error?: string;
  }) {
    if (typeof data.configured === "boolean") setConfigured(data.configured);
    if (data.report) {
      setReport(data.report);
      rememberGunMilanProfile(profileId);
    } else {
      setReport(null);
    }
    setCached(data.cached === true);
    if (data.error) setNote(data.error);
    setCanRun(!data.report && data.configured !== false && !data.error);
  }

  function load(run: boolean) {
    if (!signedIn) {
      setOpen(true);
      setNote(KUNDLI_SIGNED_IN_ERROR);
      return;
    }
    setOpen(true);
    setBusy(true);
    setNote("");
    rememberGunMilanProfile(profileId);
    authJsonHeaders()
      .then(function (headers) {
        if (!headers) {
          setBusy(false);
          setNote(KUNDLI_SIGNED_IN_ERROR);
          return null;
        }
        const path = run
          ? GUN_MILAN_API_PATH
          : GUN_MILAN_API_PATH + "?id=" + encodeURIComponent(profileId);
        return fetch(path, {
          method: run ? "POST" : "GET",
          headers,
          body: run ? JSON.stringify({ id: profileId }) : undefined,
        }).then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data };
          });
        });
      })
      .then(function (result) {
        if (!result) return;
        setBusy(false);
        applyPayload(result.data);
        if (!result.ok && !result.data.error) {
          setNote(GUN_MILAN_LOAD_ERROR);
        }
      })
      .catch(function () {
        setBusy(false);
        setNote(GUN_MILAN_LOAD_ERROR);
      });
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button
        type="button"
        onClick={function () {
          if (!open) load(false);
          else setOpen(false);
        }}
        className="bm-sans bm-ghost bm-focus"
        style={{
          background: CREAM,
          color: VIOLET_DEEP,
          border: "1px solid " + LINE,
          borderRadius: 999,
          padding: "10px 14px",
          fontSize: 13.5,
          fontWeight: 600,
          cursor: "pointer",
          minHeight: 44,
        }}
      >
        {GUN_MILAN_ACTION}
      </button>

      {open ? (
        <div
          style={{
            marginTop: 12,
            padding: "14px 14px 16px",
            background: CREAM,
            border: "1px solid " + LINE,
            borderRadius: 14,
          }}
        >
          <p className="bm-sans" style={{ margin: "0 0 8px", fontSize: 9.5, letterSpacing: ".14em", color: MUTED }}>
            {GUN_MILAN_TITLE}
          </p>

          {busy ? (
            <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: MUTED }}>
              {GUN_MILAN_RUNNING}
            </p>
          ) : null}

          {!busy && configured === false && !report ? (
            <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
              {GUN_MILAN_NOT_CONFIGURED}
            </p>
          ) : null}

          {!busy && note && !report ? (
            <p className="bm-sans" style={{ margin: configured === false ? "10px 0 0" : 0, fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
              {note}
            </p>
          ) : null}

          {!busy && report ? <ReportView report={report} /> : null}

          {!busy && !report && canRun ? (
            <p className="bm-sans" style={{ margin: "0 0 12px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
              {GUN_MILAN_EMPTY_RUN}
            </p>
          ) : null}

          {!busy && canRun ? (
            <button
              type="button"
              onClick={function () {
                load(true);
              }}
              className="bm-sans bm-talk bm-focus"
              style={{
                marginTop: 10,
                background: VIOLET,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 999,
                padding: "11px 16px",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {GUN_MILAN_RUN}
            </button>
          ) : null}

          {!busy && report && cached ? (
            <p className="bm-sans" style={{ margin: "10px 0 0", fontSize: 12, color: MUTED }}>
              {GUN_MILAN_CACHED_NOTE}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
