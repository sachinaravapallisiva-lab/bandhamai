"use client";

import { useState } from "react";
import {
  BIODATA_DOWNLOAD_LABEL,
  BIODATA_FAILED_ERROR,
  BIODATA_NO_PROFILE_ERROR,
  BIODATA_PREPARING_LABEL,
  BIODATA_SHARE_TITLE,
  BIODATA_SIGNED_IN_ERROR,
} from "../../lib/biodata";
import { biodataDownloadPath } from "../../lib/biodata-share";
import { authFormHeaders } from "../../lib/client-auth";
import { LINE, MUTED, VIOLET, VIOLET_DEEP } from "../../lib/theme";

function filenameFromDisposition(header: string | null) {
  if (!header) return "";
  const match = /filename="([^"]+)"/.exec(header);
  return match && match[1] ? match[1] : "";
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 1000);
}

export default function DownloadBiodata({
  hasProfile = true,
  variant = "ghost",
  profileId,
  compact = false,
}: {
  hasProfile?: boolean;
  variant?: "ghost" | "solid";
  profileId?: string;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  function download() {
    if (!hasProfile) {
      setNote(BIODATA_NO_PROFILE_ERROR);
      return;
    }
    setBusy(true);
    setNote("");
    authFormHeaders()
      .then(function (headers) {
        if (!headers) {
          setBusy(false);
          setNote(BIODATA_SIGNED_IN_ERROR);
          return null;
        }
        return fetch(biodataDownloadPath(profileId), { headers });
      })
      .then(function (res) {
        if (!res) return;
        const filename = filenameFromDisposition(res.headers.get("content-disposition")) || "bandham-biodata-member.pdf";
        if (!res.ok) {
          return res.json().then(function (data: { error?: string }) {
            setBusy(false);
            setNote(data.error || BIODATA_FAILED_ERROR);
          }).catch(function () {
            setBusy(false);
            setNote(BIODATA_FAILED_ERROR);
          });
        }
        return res.blob().then(function (blob) {
          const file = new File([blob], filename, { type: "application/pdf" });
          const nav = navigator as Navigator & {
            canShare?: (data: ShareData) => boolean;
          };
          if (typeof navigator.share === "function" && nav.canShare && nav.canShare({ files: [file] })) {
            return navigator.share({ files: [file], title: BIODATA_SHARE_TITLE }).then(
              function () {
                setBusy(false);
              },
              function (err: unknown) {
                const aborted = err instanceof Error && err.name === "AbortError";
                if (!aborted) saveBlob(blob, filename);
                setBusy(false);
              }
            );
          }
          saveBlob(blob, filename);
          setBusy(false);
        });
      })
      .catch(function () {
        setBusy(false);
        setNote(BIODATA_FAILED_ERROR);
      });
  }

  const solid = variant === "solid";
  const pad = compact ? "8px 12px" : solid ? "12px 22px" : "10px 16px";
  const size = compact ? 12.5 : solid ? 14.5 : 13.5;

  return (
    <div>
      <button
        type="button"
        disabled={busy || !hasProfile}
        onClick={download}
        className={solid ? "bm-sans bm-talk bm-focus" : "bm-sans bm-ghost bm-focus"}
        aria-label={BIODATA_DOWNLOAD_LABEL}
        style={{
          background: solid ? (busy ? VIOLET_DEEP : VIOLET) : "transparent",
          color: solid ? "#FFFFFF" : VIOLET,
          border: solid ? "none" : "1px solid " + LINE,
          borderRadius: 999,
          padding: pad,
          fontSize: size,
          fontWeight: 600,
          cursor: busy || !hasProfile ? "default" : "pointer",
          opacity: busy || !hasProfile ? 0.7 : 1,
        }}
      >
        {busy ? BIODATA_PREPARING_LABEL : BIODATA_DOWNLOAD_LABEL}
      </button>
      {note ? (
        <p className="bm-sans" style={{ margin: "10px 0 0", fontSize: 13, color: MUTED, lineHeight: 1.45 }}>
          {note}
        </p>
      ) : null}
    </div>
  );
}
