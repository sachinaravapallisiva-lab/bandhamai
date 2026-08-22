"use client";

import { useEffect, useRef, useState } from "react";
import { authFormHeaders } from "../../lib/client-auth";
import { PHOTO_ACCEPT, type ProfilePhotoUrls } from "../../lib/profile-photos";
import { INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";
import { PhotoCardPreview, ProfilePhoto } from "./ProfilePhoto";

export default function PhotoUpload({
  value,
  onChange,
  name,
  city,
  profession,
  disabled,
  onBusyChange,
}: {
  value: ProfilePhotoUrls;
  onChange: (next: ProfilePhotoUrls) => void;
  name?: string;
  city?: string;
  profession?: string;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enhance, setEnhance] = useState(true);
  const [localPreview, setLocalPreview] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    function () {
      return function () {
        if (localPreview) URL.revokeObjectURL(localPreview);
      };
    },
    [localPreview]
  );

  function pickFile() {
    if (disabled || busy) return;
    inputRef.current?.click();
  }

  function uploadFile(file: File) {
    if (localPreview) URL.revokeObjectURL(localPreview);
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setError("");
    setBusy(true);
    if (onBusyChange) onBusyChange(true);
    setProgress(8);

    authFormHeaders()
      .then(function (headers) {
        if (!headers) {
          setBusy(false);
          if (onBusyChange) onBusyChange(false);
          setProgress(0);
          setError("Sign in to upload a photo.");
          return;
        }

        const form = new FormData();
        form.append("file", file);
        form.append("enhance", enhance ? "1" : "0");

        return new Promise<void>(function (resolve) {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/photos");
          xhr.setRequestHeader("Authorization", headers.Authorization);
          xhr.upload.onprogress = function (event) {
            if (!event.lengthComputable) return;
            setProgress(Math.max(8, Math.round((event.loaded / event.total) * 80)));
          };
          xhr.onload = function () {
            let data: { error?: string; photo_url?: string; photo_blurred_url?: string } = {};
            try {
              data = JSON.parse(xhr.responseText || "{}");
            } catch {
              data = {};
            }
            if (xhr.status >= 200 && xhr.status < 300 && data.photo_url) {
              onChange({
                photo_url: data.photo_url,
                photo_blurred_url: data.photo_blurred_url || "",
              });
              setProgress(100);
              setBusy(false);
              if (onBusyChange) onBusyChange(false);
              setError("");
              resolve();
              return;
            }
            setBusy(false);
            if (onBusyChange) onBusyChange(false);
            setProgress(0);
            setError(data.error || "Could not upload that photo.");
            resolve();
          };
          xhr.onerror = function () {
            setBusy(false);
            if (onBusyChange) onBusyChange(false);
            setProgress(0);
            setError("Network trouble. Try again?");
            resolve();
          };
          xhr.send(form);
        });
      })
      .catch(function () {
        setBusy(false);
        if (onBusyChange) onBusyChange(false);
        setProgress(0);
        setError("Network trouble. Try again?");
      });
  }

  const shown = value.photo_url || localPreview;

  return (
    <div>
      <label className="bm-sans" style={{ display: "block", fontSize: 9.5, letterSpacing: ".14em", color: MUTED, marginBottom: 6 }}>
        PHOTO
      </label>
      <p className="bm-sans" style={{ margin: "0 0 12px", fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
        Optional. AI enhance is a clarity / resolution pass only — it upscales and sharpens. It does not apply makeup or rewrite a face.
      </p>

      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={pickFile}
          disabled={disabled || busy}
          className="bm-focus"
          aria-label={shown ? "Replace profile photo" : "Choose profile photo"}
          style={{
            width: 120,
            height: 120,
            padding: 0,
            border: "1px dashed " + LINE,
            borderRadius: 14,
            background: WASH,
            cursor: disabled || busy ? "default" : "pointer",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {shown ? (
            <ProfilePhoto src={shown} alt="Selected profile photo" size={120} />
          ) : (
            <span className="bm-sans" style={{ color: MUTED, fontSize: 12.5 }}>
              Choose photo
            </span>
          )}
        </button>

        <div style={{ flex: 1, minWidth: 180 }}>
          <label className="bm-sans" style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13.5, color: INK, marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={enhance}
              disabled={disabled || busy}
              onChange={function (e) {
                setEnhance(e.target.checked);
              }}
              style={{ marginTop: 3, accentColor: VIOLET }}
            />
            <span>
              AI enhance — clarity / resolution only
              <span style={{ display: "block", color: MUTED, fontSize: 12, marginTop: 3 }}>
                Lanczos upscale to 1600px, mild sharpen, WebP. No beauty filters.
              </span>
            </span>
          </label>

          <button
            type="button"
            onClick={pickFile}
            disabled={disabled || busy}
            className="bm-sans bm-ghost bm-focus"
            style={{
              background: "transparent",
              color: VIOLET,
              border: "1px solid " + LINE,
              borderRadius: 999,
              padding: "10px 16px",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: disabled || busy ? "default" : "pointer",
              opacity: disabled || busy ? 0.7 : 1,
            }}
          >
            {busy ? "Uploading…" : value.photo_url ? "Replace photo" : "Upload photo"}
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_ACCEPT}
        hidden
        onChange={function (e) {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) uploadFile(file);
        }}
      />

      <div style={{ minHeight: 8, marginTop: 14 }}>
        {busy ? (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            style={{ height: 6, borderRadius: 999, background: LINE, overflow: "hidden" }}
          >
            <div style={{ width: progress + "%", height: "100%", background: VIOLET, transition: "width .16s ease" }} />
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="bm-sans" style={{ margin: "10px 0 0", fontSize: 13.5, color: VIOLET_DEEP }}>
          {error}
        </p>
      ) : busy ? (
        <p className="bm-sans" style={{ margin: "10px 0 0", fontSize: 12.5, color: MUTED }}>
          Uploading and running the clarity / resolution pass…
        </p>
      ) : value.photo_url ? (
        <p className="bm-sans" style={{ margin: "10px 0 0", fontSize: 12.5, color: MUTED }}>
          Saved. A blurred copy is stored for later blur-until-matched.
        </p>
      ) : null}

      {shown ? (
        <div style={{ marginTop: 16 }}>
          <PhotoCardPreview
            photoUrl={value.photo_url || localPreview}
            name={name || ""}
            city={city || ""}
            profession={profession || ""}
          />
        </div>
      ) : null}
    </div>
  );
}
