"use client";

import { useState } from "react";
import type { BrowseProfile } from "../../lib/profile-search";
import {
  BROWSE_PIN_CAP_NOTE,
  BROWSE_PIN_NOT_CONFIGURED,
  BROWSE_PIN_RENEW_NOTE,
  BROWSE_PIN_SEPARATE_NOTE,
  BROWSE_PIN_VOICE,
  BROWSE_PINNED_LABEL,
  BROWSE_PRIORITY_MARK,
  PIN_CHECKOUT_PATH,
} from "../../lib/browse-pin";
import { PROFILE_CARD_RADIUS, PROFILE_PHOTO_FALLBACK, PROFILE_PHOTO_SOON } from "../../lib/profile-card";
import { CREAM, LINE, MUTED, VIOLET, VIOLET_DEEP } from "../../lib/theme";
import PresenceMark from "./PresenceMark";

export default function PinnedRow({ profiles }: { profiles: BrowseProfile[] }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  if (!profiles.length) return null;

  async function startPinCheckout() {
    setBusy(true);
    setNote("");
    try {
      const res = await fetch(PIN_CHECKOUT_PATH, { method: "POST" });
      const data = (await res.json().catch(function () {
        return {};
      })) as { error?: string };
      setNote(data.error || BROWSE_PIN_NOT_CONFIGURED);
    } catch {
      setNote(BROWSE_PIN_NOT_CONFIGURED);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      data-browse-pinned-row="true"
      aria-label={BROWSE_PINNED_LABEL}
      style={{ margin: "0 0 18px" }}
    >
      <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 8px" }}>
        {BROWSE_PINNED_LABEL}
      </p>
      <p
        className="bm-sans"
        data-pin-voice="true"
        style={{ margin: "0 0 6px", fontSize: 13.5, fontWeight: 600, color: VIOLET_DEEP }}
      >
        {BROWSE_PIN_VOICE}
      </p>
      <p className="bm-sans" style={{ margin: "0 0 4px", fontSize: 12, color: MUTED }}>
        {BROWSE_PIN_CAP_NOTE} {BROWSE_PIN_RENEW_NOTE}
      </p>
      <p className="bm-sans" style={{ margin: "0 0 10px", fontSize: 12, color: MUTED }}>
        {BROWSE_PIN_SEPARATE_NOTE}
      </p>
      <button
        type="button"
        data-pin-cta="true"
        onClick={startPinCheckout}
        disabled={busy}
        className="bm-sans bm-ghost bm-focus"
        style={{
          margin: "0 0 12px",
          background: "transparent",
          color: VIOLET,
          border: "1px solid " + LINE,
          borderRadius: 999,
          padding: "8px 14px",
          fontSize: 13,
          fontWeight: 600,
          cursor: busy ? "default" : "pointer",
        }}
      >
        {BROWSE_PIN_VOICE}
      </button>
      {note ? (
        <p className="bm-sans" data-pin-fail-closed="true" style={{ margin: "0 0 12px", fontSize: 12, color: MUTED }}>
          {note}
        </p>
      ) : null}
      <div
        data-browse-pinned-line="true"
        style={{
          display: "flex",
          flexWrap: "nowrap",
          gap: 10,
          overflowX: "auto",
          overflowY: "hidden",
          paddingBottom: 4,
        }}
      >
        {profiles.map(function (profile) {
          const city = profile.city.trim();
          return (
            <article
              key={profile.id}
              className="bm-card"
              data-priority-mark="true"
              style={{
                flex: "0 0 148px",
                width: 148,
                maxWidth: 148,
                background: CREAM,
                border: "1px solid " + LINE,
                borderRadius: PROFILE_CARD_RADIUS,
                overflow: "hidden",
              }}
            >
              <div
                role="img"
                aria-label={profile.name ? profile.name + " " + PROFILE_PHOTO_SOON.toLowerCase() : PROFILE_PHOTO_SOON}
                style={{
                  height: 56,
                  background: PROFILE_PHOTO_FALLBACK,
                  display: "grid",
                  placeItems: "center",
                  borderBottom: "1px solid " + LINE,
                }}
              >
                <span className="bm-sans" style={{ fontSize: 10, color: MUTED }}>
                  {PROFILE_PHOTO_SOON}
                </span>
              </div>
              <div style={{ padding: "8px 10px 10px" }}>
                <p
                  className="bm-sans"
                  style={{
                    margin: "0 0 4px",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: ".04em",
                    color: VIOLET,
                  }}
                >
                  {BROWSE_PRIORITY_MARK}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <h3
                    className="bm-serif"
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 400,
                      color: VIOLET_DEEP,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {profile.name || "Profile"}
                  </h3>
                  <PresenceMark online={profile.online} compact />
                </div>
                {city ? (
                  <p
                    className="bm-sans"
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: MUTED,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {city}
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
