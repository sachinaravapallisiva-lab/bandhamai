"use client";

import type { BrowseProfile } from "../../lib/profile-search";
import { browseFactChips, browseMetaLine } from "../../lib/profile-search";
import { CREAM, INK, LINE, MUTED, VIOLET, VIOLET_DEEP } from "../../lib/theme";
import { PRESENCE_ONLINE_COLOR } from "../../lib/presence";
import InstagramChip from "./InstagramChip";
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

function ChipIcon({ kind }: { kind: "lang" | "edu" | "home" }) {
  const common = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true as const };
  if (kind === "edu") {
    return (
      <svg {...common}>
        <path d="M3 10.5 12 6l9 4.5L12 15 3 10.5Z" stroke={MUTED} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M7 12.5v4.2c0 .4 2.2 1.8 5 1.8s5-1.4 5-1.8v-4.2" stroke={MUTED} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "home") {
    return (
      <svg {...common}>
        <path d="M4.5 11.2 12 5.5l7.5 5.7V20h-5.2v-5.1H9.7V20H4.5v-8.8Z" stroke={MUTED} strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M7 8.5c1.8-2.4 5.2-3 7.6-1.4 2.2 1.5 2.8 4.4 1.4 6.7" stroke={MUTED} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.2 16.8c.8.4 1.7.6 2.6.6 3 0 5.4-2.2 5.4-5" stroke={MUTED} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="9.2" cy="10.6" r="1" fill={MUTED} />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 19.4s-6.4-3.9-8.3-7.4C2 9.2 3.2 6.4 6.1 5.7c1.8-.4 3.4.3 4.3 1.7.9-1.4 2.5-2.1 4.3-1.7 2.9.7 4.1 3.5 2.4 6.3-1.9 3.5-8.3 7.4-8.3 7.4Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7l10 10M17 7 7 17" stroke={VIOLET_DEEP} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

export default function DiscoverCard({
  profile,
  saved,
  signedIn,
  nextPath = "/",
  onInterested,
  onPass,
  onSave,
  onBlocked,
}: {
  profile: BrowseProfile;
  saved: boolean;
  signedIn: boolean;
  nextPath?: string;
  onInterested: () => void;
  onPass: () => void;
  onSave: () => void;
  onBlocked: () => void;
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
        borderRadius: 22,
        overflow: "hidden",
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
              height: 300,
              objectFit: "cover",
              display: "block",
              background: "#EDE4D4",
            }}
          />
        ) : (
          <div
            aria-hidden={profile.name ? undefined : true}
            style={{
              height: 300,
              background: "linear-gradient(160deg, #EFE4D2 0%, #D9C8EC 58%, #5B21B6 130%)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <span className="bm-serif" style={{ fontSize: 52, color: CREAM, letterSpacing: "-.02em" }}>
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

      <div style={{ padding: "18px 18px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h2 className="bm-serif" style={{ margin: 0, fontSize: 26, fontWeight: 400, color: VIOLET_DEEP, letterSpacing: "-.015em" }}>
            {profile.name || "Profile"}
          </h2>
          <VerifyBadge verified={profile.verified} />
          <PresenceMark online={profile.online} compact />
        </div>

        {meta ? (
          <p className="bm-sans" style={{ margin: "6px 0 0", fontSize: 13.5, color: MUTED, letterSpacing: ".01em" }}>
            {meta}
          </p>
        ) : null}

        {profile.instagram ? (
          <div style={{ marginTop: 10 }}>
            <InstagramChip handle={profile.instagram} />
          </div>
        ) : null}

        {chips.length ? (
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              marginTop: 16,
              padding: "12px 0",
              borderTop: "1px solid " + LINE,
              borderBottom: "1px solid " + LINE,
            }}
          >
            {chips.map(function (chip, index) {
              return (
                <div
                  key={chip.key}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "0 8px",
                    borderLeft: index === 0 ? "none" : "1px solid " + LINE,
                    minWidth: 0,
                  }}
                >
                  <ChipIcon kind={chip.icon} />
                  <span
                    className="bm-sans"
                    style={{
                      fontSize: 12.5,
                      color: MUTED,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {chip.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}

        {prompt ? (
          <div style={{ position: "relative", padding: "16px 28px 4px 0", minHeight: 72 }}>
            <p className="bm-sans" style={{ margin: 0, fontSize: 12.5, color: VIOLET, fontWeight: 500 }}>
              {profile.promptLabel}
            </p>
            <p className="bm-serif" style={{ margin: "6px 0 0", fontSize: 18, lineHeight: 1.4, color: INK }}>
              {prompt}
            </p>
            <span
              aria-hidden="true"
              className="bm-serif"
              style={{
                position: "absolute",
                right: 0,
                top: 18,
                fontSize: 64,
                lineHeight: 1,
                color: "rgba(109,40,217,.12)",
              }}
            >
              ”
            </span>
          </div>
        ) : (
          <div style={{ height: 14 }} />
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 16 }}>
          <button
            type="button"
            onClick={onInterested}
            className="bm-sans bm-talk bm-focus"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: VIOLET_DEEP,
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                background: VIOLET,
                display: "grid",
                placeItems: "center",
                boxShadow: "0 8px 18px rgba(109,40,217,.28)",
              }}
            >
              <HeartIcon />
            </span>
            Interested
          </button>

          <button
            type="button"
            onClick={onPass}
            className="bm-sans bm-ghost bm-focus"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: VIOLET_DEEP,
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: CREAM,
                border: "1px solid " + LINE,
                display: "grid",
                placeItems: "center",
              }}
            >
              <CloseIcon />
            </span>
            Pass
          </button>

          <button
            type="button"
            onClick={onSave}
            aria-pressed={saved}
            className="bm-sans bm-ghost bm-focus"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: VIOLET_DEEP,
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: CREAM,
                border: "1px solid " + LINE,
                display: "grid",
                placeItems: "center",
              }}
            >
              <BookmarkIcon filled={saved} />
            </span>
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
