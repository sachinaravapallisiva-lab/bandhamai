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
import { CREAM, INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";
import { PRESENCE_ONLINE_COLOR } from "../../lib/presence";
import DownloadBiodata from "./DownloadBiodata";
import InstagramShareControls from "./InstagramShareControls";
import PresenceMark from "./PresenceMark";
import ProfileFactChips from "./ProfileFactChips";
import { ProfilePhotoSoon } from "./ProfilePhoto";
import RecordProfileView from "./RecordProfileView";
import SafetyActions from "./SafetyActions";
import SeenChip from "./SeenChip";
import VerifyBadge from "./VerifyBadge";

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 19.4s-6.4-3.9-8.3-7.4C2 9.2 3.2 6.4 6.1 5.7c1.8-.4 3.4.3 4.3 1.7.9-1.4 2.5-2.1 4.3-1.7 2.9.7 4.1 3.5 2.4 6.3-1.9 3.5-8.3 7.4-8.3 7.4Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7l10 10M17 7 7 17" stroke={VIOLET_DEEP} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 5.4h10c.6 0 1 .4 1 1V19l-6-3.2L7 19V6.4c0-.6.4-1 1-1Z"
        stroke={VIOLET_DEEP}
        strokeWidth="1.7"
        strokeLinejoin="round"
        fill={filled ? VIOLET_DEEP : "none"}
      />
    </svg>
  );
}

const actionBase = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  minHeight: PROFILE_ACTION_MIN,
  minWidth: PROFILE_ACTION_MIN,
  borderRadius: 999,
  padding: "10px 14px",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer" as const,
};

export default function DiscoverCard({
  profile,
  saved,
  signedIn,
  nextPath = "/",
  onInterested,
  onPass,
  onSave,
  onBlocked,
  onViewed,
}: {
  profile: BrowseProfile;
  saved: boolean;
  signedIn: boolean;
  nextPath?: string;
  onInterested: () => void;
  onPass: () => void;
  onSave: () => void;
  onBlocked: () => void;
  onViewed?: (profileId: string) => void;
}) {
  const chips = browseFactChips(profile);
  const meta = browseMetaLine(profile);
  const prompt = profile.note.trim();

  return (
    <article
      className="bm-card"
      style={{
        background: CREAM,
        border: "1px solid " + LINE,
        borderRadius: PROFILE_CARD_RADIUS,
        overflow: "hidden",
      }}
    >
      <RecordProfileView profileId={profile.id} signedIn={signedIn} onRecorded={onViewed} />
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
          <h2 className="bm-serif" style={{ margin: 0, fontSize: 26, fontWeight: 400, color: VIOLET_DEEP, letterSpacing: "-.015em" }}>
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
        ) : null}

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
            <p className="bm-serif" style={{ margin: "6px 0 0", fontSize: 17, lineHeight: 1.45, color: INK }}>
              {prompt}
            </p>
          </div>
        ) : (
          <div style={{ height: 8 }} />
        )}

        <div style={{ display: "flex", alignItems: "stretch", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onInterested}
            className="bm-sans bm-talk bm-focus"
            style={{
              ...actionBase,
              flex: "1 1 132px",
              background: VIOLET,
              color: "#FFFFFF",
              border: "none",
            }}
          >
            <HeartIcon />
            Interested
          </button>

          <button
            type="button"
            onClick={onPass}
            className="bm-sans bm-ghost bm-focus"
            style={{
              ...actionBase,
              flex: "1 1 88px",
              background: CREAM,
              color: VIOLET_DEEP,
              border: "1px solid " + LINE,
            }}
          >
            <CloseIcon />
            Pass
          </button>

          <button
            type="button"
            onClick={onSave}
            aria-pressed={saved}
            className="bm-sans bm-ghost bm-focus"
            style={{
              ...actionBase,
              flex: "1 1 88px",
              background: CREAM,
              color: VIOLET_DEEP,
              border: "1px solid " + LINE,
            }}
          >
            <BookmarkIcon filled={saved} />
            {saved ? "Saved" : "Save"}
          </button>
        </div>

        <SafetyActions
          profileId={profile.id}
          name={profile.name}
          surface="profile"
          signedIn={signedIn}
          nextPath={nextPath}
          onBlocked={onBlocked}
        />
      </div>
    </article>
  );
}
