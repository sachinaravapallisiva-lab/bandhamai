"use client";

import { canShowOtherBiodataDownload } from "../../lib/biodata-share";
import type { BrowseProfile } from "../../lib/profile-search";
import { browseFactChips, browseMetaLine } from "../../lib/profile-search";
import { PRESENCE_ONLINE_COLOR } from "../../lib/presence";
import { CREAM, GOLD, INK, LINE, MUTED, VIOLET, VIOLET_DEEP } from "../../lib/theme";
import DownloadBiodata from "./DownloadBiodata";
import InstagramShareControls from "./InstagramShareControls";
import PresenceMark from "./PresenceMark";
import SafetyActions from "./SafetyActions";
import VerifyBadge from "./VerifyBadge";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] || "" : "";
  return (first + last).toUpperCase();
}

export default function MatchCard({
  profile,
  signedIn,
  onSpeedMatch,
  onMessage,
  onBlocked,
}: {
  profile: BrowseProfile;
  signedIn: boolean;
  onSpeedMatch: () => void;
  onMessage: () => void;
  onBlocked: () => void;
}) {
  const meta = browseMetaLine(profile);
  const chips = browseFactChips(profile);

  return (
    <article
      className="bm-card"
      style={{
        background: CREAM,
        border: "1px solid " + LINE,
        borderRadius: 22,
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          height: 3,
          background: "linear-gradient(90deg, transparent, " + GOLD + ", transparent)",
          opacity: 0.55,
        }}
      />
      <div style={{ padding: "16px 16px 14px", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          {profile.photoUrl ? (
            // Processed by our API (WebP). next/image remote config is not wired for Storage yet.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photoUrl}
              alt={profile.name ? profile.name + " profile photo" : "Profile photo"}
              style={{
                width: 88,
                height: 88,
                objectFit: "cover",
                borderRadius: 16,
                display: "block",
                background: "#EDE4D4",
              }}
            />
          ) : (
            <div
              aria-hidden={profile.name ? undefined : true}
              style={{
                width: 88,
                height: 88,
                borderRadius: 16,
                background: "linear-gradient(160deg, #EFE4D2 0%, #D9C8EC 58%, #5B21B6 130%)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <span className="bm-serif" style={{ fontSize: 26, color: CREAM, letterSpacing: "-.02em" }}>
                {initials(profile.name)}
              </span>
            </div>
          )}
          {profile.online ? (
            <span
              aria-hidden="true"
              title="Online"
              style={{
                position: "absolute",
                right: 6,
                bottom: 6,
                width: 14,
                height: 14,
                borderRadius: 999,
                background: PRESENCE_ONLINE_COLOR,
                border: "2px solid " + CREAM,
                boxSizing: "border-box",
              }}
            />
          ) : null}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h2
              className="bm-serif"
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 400,
                color: VIOLET_DEEP,
                letterSpacing: "-.015em",
              }}
            >
              {profile.name || "Profile"}
            </h2>
            <VerifyBadge verified={profile.verified} />
            <PresenceMark online={profile.online} compact />
          </div>
          {meta ? (
            <p className="bm-sans" style={{ margin: "5px 0 0", fontSize: 13, color: MUTED }}>
              {meta}
            </p>
          ) : (
            <p className="bm-sans" style={{ margin: "5px 0 0", fontSize: 13, color: MUTED }}>
              Interested from Browse
            </p>
          )}
          {chips.length ? (
            <p
              className="bm-sans"
              style={{
                margin: "8px 0 0",
                fontSize: 12,
                color: MUTED,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {chips.map(function (chip) { return chip.label; }).join(" · ")}
            </p>
          ) : null}
          <InstagramShareControls
            profileId={profile.id}
            signedIn={signedIn}
            initialHandle={profile.instagram}
          />
          {canShowOtherBiodataDownload({ signedIn, biodataShare: profile.biodataShare }) ? (
            <div style={{ marginTop: 10 }}>
              <DownloadBiodata profileId={profile.id} compact />
            </div>
          ) : null}
        </div>
      </div>

      {profile.note.trim() ? (
        <div style={{ padding: "0 18px 4px" }}>
          <p className="bm-sans" style={{ margin: 0, fontSize: 12, color: VIOLET, fontWeight: 500 }}>
            {profile.promptLabel}
          </p>
          <p
            className="bm-serif"
            style={{
              margin: "4px 0 0",
              fontSize: 16,
              lineHeight: 1.4,
              color: INK,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {profile.note.trim()}
          </p>
        </div>
      ) : null}

      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", gap: 9 }}>
          <button
            type="button"
            onClick={onSpeedMatch}
            className="bm-sans bm-talk bm-focus"
            style={{
              flex: 1,
              background: VIOLET,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 999,
              padding: "11px",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Start Speed Match
          </button>
          <button
            type="button"
            onClick={onMessage}
            className="bm-sans bm-ghost bm-focus"
            style={{
              flex: 1,
              background: "transparent",
              color: VIOLET,
              border: "1px solid " + LINE,
              borderRadius: 999,
              padding: "11px",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Message
          </button>
        </div>
        <SafetyActions
          profileId={profile.id}
          name={profile.name}
          surface="profile"
          signedIn={signedIn}
          nextPath="/matches"
          onBlocked={onBlocked}
        />
      </div>
    </article>
  );
}
