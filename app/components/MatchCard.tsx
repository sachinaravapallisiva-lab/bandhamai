"use client";

import { canShowOtherBiodataDownload } from "../../lib/biodata-share";
import type { BrowseProfile } from "../../lib/profile-search";
import { browseFactChips, browseMetaLine, browseVisaLabel } from "../../lib/profile-search";
import {
  PROFILE_ACTION_MIN,
  PROFILE_BODY_PAD,
  PROFILE_CARD_RADIUS,
  PROFILE_PHOTO_BG,
  PROFILE_PHOTO_HEIGHT,
} from "../../lib/profile-card";
import { PRESENCE_ONLINE_COLOR } from "../../lib/presence";
import { CREAM, INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";
import DownloadBiodata from "./DownloadBiodata";
import InstagramShareControls from "./InstagramShareControls";
import PresenceMark from "./PresenceMark";
import ProfileFactChips from "./ProfileFactChips";
import { ProfilePhotoSoon } from "./ProfilePhoto";
import SafetyActions from "./SafetyActions";
import SeenChip from "./SeenChip";
import VerifyBadge from "./VerifyBadge";

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="7.2" stroke="#FFFFFF" strokeWidth="1.7" />
      <path d="M12 8.6v3.6l2.4 1.5" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5.4 6.4h13.2c.7 0 1.2.5 1.2 1.2v8.2c0 .7-.5 1.2-1.2 1.2H9.2L5 19.8V7.6c0-.7.5-1.2 1.2-1.2Z"
        stroke={VIOLET}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const actionBase = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  flex: 1,
  minHeight: PROFILE_ACTION_MIN,
  minWidth: PROFILE_ACTION_MIN,
  borderRadius: 999,
  padding: "10px 14px",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer" as const,
};

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
  const prompt = profile.note.trim();

  return (
    <article
      className="bm-card"
      style={{
        background: CREAM,
        border: "1px solid " + LINE,
        overflow: "hidden",
        borderRadius: PROFILE_CARD_RADIUS,
      }}
    >
      <div style={{ position: "relative" }}>
        {profile.photoUrl ? (
          // Processed by our API (WebP). next/image remote config is not wired for Storage yet.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photoUrl}
            alt={profile.name ? profile.name + " profile photo" : "Profile photo"}
            style={{
              width: "100%",
              height: PROFILE_PHOTO_HEIGHT,
              objectFit: "cover",
              display: "block",
              background: PROFILE_PHOTO_BG,
            }}
          />
        ) : (
          <ProfilePhotoSoon name={profile.name} />
        )}
        {profile.online ? (
          <span
            aria-hidden="true"
            title="Online"
            style={{
              position: "absolute",
              right: 14,
              bottom: 14,
              width: 16,
              height: 16,
              borderRadius: 999,
              background: PRESENCE_ONLINE_COLOR,
              border: "2px solid " + CREAM,
              boxSizing: "border-box",
            }}
          />
        ) : null}
      </div>

      <div style={{ padding: PROFILE_BODY_PAD }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h2
            className="bm-serif"
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 400,
              color: VIOLET_DEEP,
              letterSpacing: "-.015em",
            }}
          >
            {profile.name || "Profile"}
          </h2>
          <VerifyBadge verified={profile.verified} />
          <SeenChip seen={profile.seen} />
          <PresenceMark online={profile.online} compact />
        </div>
        {meta ? (
          <p className="bm-sans" style={{ margin: "6px 0 0", fontSize: 13.5, color: MUTED, letterSpacing: ".01em" }}>
            {meta}
          </p>
        ) : (
          <p className="bm-sans" style={{ margin: "6px 0 0", fontSize: 13.5, color: MUTED, letterSpacing: ".01em" }}>
            Interested from Browse
          </p>
        )}

        {canShowOtherBiodataDownload({ signedIn, biodataShare: profile.biodataShare }) ? (
          <div style={{ marginTop: 12 }}>
            <DownloadBiodata profileId={profile.id} compact />
          </div>
        ) : null}

        <InstagramShareControls
          profileId={profile.id}
          signedIn={signedIn}
          initialHandle={profile.instagram}
        />

        <ProfileFactChips chips={chips} visa={browseVisaLabel(profile)} />

        {prompt ? (
          <div
            style={{
              marginTop: 14,
              padding: "12px 14px",
              background: WASH,
              border: "1px solid " + LINE,
              borderRadius: 14,
            }}
          >
            <p className="bm-sans" style={{ margin: 0, fontSize: 12, color: MUTED, fontWeight: 500, letterSpacing: ".02em" }}>
              {profile.promptLabel}
            </p>
            <p
              className="bm-serif"
              style={{
                margin: "6px 0 0",
                fontSize: 17,
                lineHeight: 1.45,
                color: INK,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {prompt}
            </p>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onSpeedMatch}
            className="bm-sans bm-talk bm-focus"
            style={{
              ...actionBase,
              background: VIOLET,
              color: "#FFFFFF",
              border: "none",
            }}
          >
            <ClockIcon />
            Start Speed Match
          </button>
          <button
            type="button"
            onClick={onMessage}
            className="bm-sans bm-ghost bm-focus"
            style={{
              ...actionBase,
              background: CREAM,
              color: VIOLET,
              border: "1px solid " + LINE,
            }}
          >
            <MessageIcon />
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
