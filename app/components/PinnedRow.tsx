"use client";

import Link from "next/link";
import type { BrowseProfile } from "../../lib/profile-search";
import {
  BROWSE_PIN_CARD_WIDTH,
  BROWSE_PIN_PHOTO_HEIGHT,
  BROWSE_PINNED_LABEL,
  BROWSE_PRIORITY_MARK,
} from "../../lib/browse-pin";
import { GET_PRIORITY, PLANS_PATH } from "../../lib/plans";
import { PROFILE_CARD_RADIUS, PROFILE_PHOTO_FALLBACK } from "../../lib/profile-card";
import { CREAM, LINE, MUTED, VIOLET, VIOLET_DEEP } from "../../lib/theme";
import PresenceMark from "./PresenceMark";

export default function PinnedRow({ profiles }: { profiles: BrowseProfile[] }) {
  if (!profiles.length) return null;

  return (
    <section
      data-browse-pinned-row="true"
      aria-label={BROWSE_PINNED_LABEL}
      style={{ margin: "0 0 18px" }}
    >
      <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 8px" }}>
        {BROWSE_PINNED_LABEL}
      </p>
      <Link
        href={PLANS_PATH}
        data-pin-cta="true"
        className="bm-sans bm-ghost bm-focus"
        style={{
          display: "inline-block",
          margin: "0 0 12px",
          background: "transparent",
          color: VIOLET,
          border: "1px solid " + LINE,
          borderRadius: 999,
          padding: "8px 14px",
          fontSize: 13,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        {GET_PRIORITY}
      </Link>
      <div
        className="bm-pin-line"
        data-browse-pinned-line="true"
        style={{
          display: "flex",
          flexWrap: "nowrap",
          alignItems: "stretch",
          gap: 10,
          overflowX: "auto",
          overflowY: "visible",
          minHeight: BROWSE_PIN_PHOTO_HEIGHT + 92,
          paddingBottom: 8,
        }}
      >
        {profiles.map(function (profile) {
          const city = profile.city.trim();
          const photoUrl = profile.photoUrl.trim();
          return (
            <article
              key={profile.id}
              className="bm-card bm-pin-card"
              data-priority-mark="true"
              style={{
                flex: "0 0 " + BROWSE_PIN_CARD_WIDTH + "px",
                width: BROWSE_PIN_CARD_WIDTH,
                maxWidth: BROWSE_PIN_CARD_WIDTH,
                background: CREAM,
                border: "1px solid " + LINE,
                borderRadius: PROFILE_CARD_RADIUS,
                overflow: "visible",
              }}
            >
              <div
                className="bm-pin-photo"
                data-pin-photo-well="true"
                style={{
                  height: BROWSE_PIN_PHOTO_HEIGHT,
                  minHeight: BROWSE_PIN_PHOTO_HEIGHT,
                  background: PROFILE_PHOTO_FALLBACK,
                  display: "grid",
                  placeItems: "center",
                  borderBottom: "1px solid " + LINE,
                  overflow: "hidden",
                  borderTopLeftRadius: PROFILE_CARD_RADIUS,
                  borderTopRightRadius: PROFILE_CARD_RADIUS,
                }}
              >
                {photoUrl ? (
                  // Preview-only in-repo portrait. next/image remote config is unused here.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt={profile.name ? profile.name + " profile photo" : "Profile photo"}
                    data-pin-photo="true"
                    style={{
                      width: "100%",
                      height: BROWSE_PIN_PHOTO_HEIGHT,
                      objectFit: "contain",
                      objectPosition: "center",
                      display: "block",
                      background: PROFILE_PHOTO_FALLBACK,
                    }}
                  />
                ) : null}
              </div>
              <div style={{ padding: "8px 10px 12px", overflow: "visible" }}>
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
                    data-pin-city="true"
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
