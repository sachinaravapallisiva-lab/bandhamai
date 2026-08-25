"use client";

import { useEffect, useState } from "react";
import { authJsonHeaders } from "../../lib/client-auth";
import { PROFILE_PHOTO_BG, profileInitials } from "../../lib/profile-card";
import {
  PROFILE_VIEWS_PATH,
  WHO_VIEWED_YOU_BODY,
  WHO_VIEWED_YOU_EMPTY,
  WHO_VIEWED_YOU_KICKER,
  WHO_VIEWED_YOU_SECTION_ID,
  WHO_VIEWED_YOU_SIGN_IN,
  WHO_VIEWED_YOU_TITLE,
  viewedAtLabel,
  type ProfileViewer,
} from "../../lib/profile-views";
import { CREAM, INK, LINE, MUTED, VIOLET } from "../../lib/theme";

export default function WhoViewedYou({
  signedIn,
  compact = false,
}: {
  signedIn: boolean;
  compact?: boolean;
}) {
  const [viewers, setViewers] = useState<ProfileViewer[] | null>(null);
  const [note, setNote] = useState("");

  useEffect(
    function () {
      if (!signedIn) {
        setViewers([]);
        setNote("");
        return;
      }

      authJsonHeaders()
        .then(function (headers) {
          if (!headers) {
            setViewers([]);
            return null;
          }
          return fetch(PROFILE_VIEWS_PATH, { headers });
        })
        .then(function (res) {
          if (!res) return;
          return res.json().then(function (data) {
            return { ok: res.ok, data };
          });
        })
        .then(function (result) {
          if (!result) return;
          if (!result.ok) {
            setViewers([]);
            setNote("");
            return;
          }
          const rows = Array.isArray(result.data.viewers) ? result.data.viewers : [];
          setViewers(
            rows.map(function (row: Partial<ProfileViewer>) {
              return {
                profileId: typeof row.profileId === "string" ? row.profileId : "",
                name: typeof row.name === "string" ? row.name : "",
                city: typeof row.city === "string" ? row.city : "",
                photoUrl: typeof row.photoUrl === "string" ? row.photoUrl : "",
                viewedAt: typeof row.viewedAt === "string" ? row.viewedAt : "",
              };
            })
          );
          setNote("");
        })
        .catch(function () {
          setViewers([]);
          setNote("");
        });
    },
    [signedIn]
  );

  return (
    <section
      id={WHO_VIEWED_YOU_SECTION_ID}
      className="bm-card"
      style={{
        background: CREAM,
        border: "1px solid " + LINE,
        borderRadius: compact ? 14 : 16,
        padding: compact ? "16px 16px" : "22px 18px",
        marginBottom: 16,
      }}
    >
      <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 9.5, letterSpacing: ".14em", color: MUTED }}>
        {WHO_VIEWED_YOU_KICKER}
      </p>
      <h3 className="bm-serif" style={{ margin: "0 0 8px", fontSize: compact ? 20 : 22, fontWeight: 400, color: INK }}>
        {WHO_VIEWED_YOU_TITLE}
      </h3>
      <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
        {WHO_VIEWED_YOU_BODY}
      </p>

      {!signedIn ? (
        <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: MUTED }}>
          {WHO_VIEWED_YOU_SIGN_IN}
        </p>
      ) : viewers == null ? (
        <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: MUTED }}>
          One moment
        </p>
      ) : viewers.length === 0 ? (
        <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: MUTED }}>
          {note || WHO_VIEWED_YOU_EMPTY}
        </p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {viewers.map(function (row) {
            const name = row.name || "Member";
            const when = viewedAtLabel(row.viewedAt);
            return (
              <div
                key={row.profileId + row.viewedAt}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid " + LINE,
                  background: "#FFFFFF",
                }}
              >
                {row.photoUrl ? (
                  // Processed by our API (WebP). next/image remote config is not wired for Storage yet.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.photoUrl}
                    alt=""
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      objectFit: "cover",
                      background: PROFILE_PHOTO_BG,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="bm-sans"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 999,
                      background: PROFILE_PHOTO_BG,
                      color: VIOLET,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {profileInitials(name)}
                  </span>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p className="bm-serif" style={{ margin: 0, fontSize: 17, color: INK }}>
                    {name}
                  </p>
                  <p className="bm-sans" style={{ margin: "2px 0 0", fontSize: 12.5, color: MUTED }}>
                    {[row.city, when].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
