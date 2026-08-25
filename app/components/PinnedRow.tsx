"use client";

import type { BrowseProfile } from "../../lib/profile-search";
import { browseFactChips, browseMetaLine } from "../../lib/profile-search";
import { BROWSE_PINNED_LABEL, BROWSE_PRIORITY_MARK } from "../../lib/browse-pin";
import { PROFILE_CARD_RADIUS, PROFILE_PHOTO_FALLBACK, PROFILE_PHOTO_SOON } from "../../lib/profile-card";
import { CREAM, INK, LINE, MUTED, VIOLET, VIOLET_DEEP } from "../../lib/theme";
import PresenceMark from "./PresenceMark";
import ProfileFactChips from "./ProfileFactChips";

export default function PinnedRow({ profiles }: { profiles: BrowseProfile[] }) {
  if (!profiles.length) return null;

  return (
    <section
      data-browse-pinned-row="true"
      aria-label={BROWSE_PINNED_LABEL}
      style={{ margin: "0 0 18px" }}
    >
      <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 12px" }}>
        {BROWSE_PINNED_LABEL}
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {profiles.map(function (profile) {
          const meta = browseMetaLine(profile);
          const chips = browseFactChips(profile);
          const about = profile.note.trim();
          return (
            <article
              key={profile.id}
              className="bm-card"
              data-priority-mark="true"
              style={{
                flex: "0 0 240px",
                maxWidth: 240,
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
                  height: 96,
                  background: PROFILE_PHOTO_FALLBACK,
                  display: "grid",
                  placeItems: "center",
                  borderBottom: "1px solid " + LINE,
                }}
              >
                <span className="bm-sans" style={{ fontSize: 12, color: MUTED }}>
                  {PROFILE_PHOTO_SOON}
                </span>
              </div>
              <div style={{ padding: "12px 14px 14px" }}>
                <p
                  className="bm-sans"
                  style={{
                    margin: "0 0 8px",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: ".04em",
                    color: VIOLET,
                  }}
                >
                  {BROWSE_PRIORITY_MARK}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <h3 className="bm-serif" style={{ margin: 0, fontSize: 20, fontWeight: 400, color: VIOLET_DEEP }}>
                    {profile.name || "Profile"}
                  </h3>
                  <PresenceMark online={profile.online} compact />
                </div>
                {meta ? (
                  <p className="bm-sans" style={{ margin: "6px 0 0", fontSize: 13, color: MUTED }}>
                    {meta}
                  </p>
                ) : null}
                <ProfileFactChips chips={chips} visa="" />
                {about ? (
                  <p className="bm-serif" style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.45, color: INK }}>
                    {about}
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
