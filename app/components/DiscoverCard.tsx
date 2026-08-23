import type { BrowseProfile } from "../../lib/profile-search";
import { CREAM, INK, LINE, MUTED, VIOLET, VIOLET_DEEP } from "../../lib/theme";
import SafetyActions from "./SafetyActions";
import VerifyBadge from "./VerifyBadge";

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 1.6c2.4 0 4.4 1.9 4.4 4.3 0 3.2-4.4 8.5-4.4 8.5S3.6 9.1 3.6 5.9C3.6 3.5 5.6 1.6 8 1.6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="8" cy="5.9" r="1.35" fill="currentColor" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2" y="5.2" width="12" height="8.2" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 5.2V3.8A1.2 1.2 0 0 1 7.2 2.6h1.6A1.2 1.2 0 0 1 10 3.8v1.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M8 13.4s-5.3-3.2-5.3-6.6A2.85 2.85 0 0 1 8 5.2a2.85 2.85 0 0 1 5.3 1.6C13.3 10.2 8 13.4 8 13.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4.1 2.4h7.8c.6 0 1.1.5 1.1 1.1v10.1L8 11.2 3 13.6V3.5c0-.6.5-1.1 1.1-1.1Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function heroTone(name: string) {
  const n = (name.trim().charCodeAt(0) || 66) % 16;
  return {
    from: `hsl(${268 + n}, 48%, 38%)`,
    mid: `hsl(${276 + n}, 44%, 24%)`,
    to: `hsl(${284 + n}, 38%, 14%)`,
  };
}

function HeroFallback({ name }: { name: string }) {
  const initial = (name.trim()[0] || "B").toUpperCase();
  const tone = heroTone(name);
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(165deg, ${tone.from} 0%, ${tone.mid} 52%, ${tone.to} 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 28% 18%, rgba(251,246,236,.2), transparent 42%), radial-gradient(circle at 82% 72%, rgba(109,40,217,.28), transparent 40%)",
        }}
      />
      <span
        className="bm-serif"
        style={{
          position: "absolute",
          left: 24,
          top: 28,
          fontSize: 92,
          lineHeight: 1,
          color: "rgba(251,246,236,.16)",
        }}
      >
        {initial}
      </span>
    </div>
  );
}

function actionBtn(kind: "primary" | "ghost" | "save") {
  if (kind === "primary") {
    return {
      background: VIOLET,
      color: "#FFFFFF",
      border: "none",
    };
  }
  if (kind === "save") {
    return {
      background: "transparent",
      color: INK,
      border: "1px solid " + LINE,
    };
  }
  return {
    background: CREAM,
    color: INK,
    border: "1px solid " + LINE,
  };
}

export default function DiscoverCard({
  profile,
  interested,
  saved,
  signedIn,
  onInterested,
  onPass,
  onSave,
  onBlocked,
}: {
  profile: BrowseProfile;
  interested: boolean;
  saved: boolean;
  signedIn: boolean;
  onInterested: () => void;
  onPass: () => void;
  onSave: () => void;
  onBlocked: () => void;
}) {
  const attrs = [
    profile.langs,
    profile.education,
    profile.diet,
  ].filter(Boolean);

  return (
    <article
      className="bm-card"
      style={{
        background: CREAM,
        border: "1px solid " + LINE,
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 12px 36px rgba(30,27,54,.08)",
      }}
    >
      <div
        style={{
          position: "relative",
          minHeight: 440,
          height: "min(62vh, 560px)",
          background: VIOLET_DEEP,
        }}
      >
        {profile.photoUrl ? (
          // Processed by our API (WebP). next/image remote config is not wired for Storage yet.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photoUrl}
            alt={profile.name ? profile.name + " profile photo" : "Profile photo"}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <HeroFallback name={profile.name} />
        )}
        <div
          style={{
            position: "absolute",
            inset: "auto 0 0",
            padding: "72px 22px 22px",
            background: "linear-gradient(180deg, rgba(30,27,54,0) 0%, rgba(30,27,54,.78) 72%, rgba(30,27,54,.9) 100%)",
            color: "#FFF8EE",
          }}
        >
          <h2
            className="bm-serif"
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: "-.02em",
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            {profile.name || "Member"}
            <VerifyBadge verified={profile.verified} />
          </h2>
          {profile.city ? (
            <p
              className="bm-sans"
              style={{
                margin: "8px 0 0",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: 0.94,
              }}
            >
              <PinIcon />
              <span>{profile.city}</span>
            </p>
          ) : null}
          {profile.work ? (
            <p
              className="bm-sans"
              style={{
                margin: "5px 0 0",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: 0.94,
              }}
            >
              <BriefcaseIcon />
              <span>{profile.work}</span>
            </p>
          ) : null}
        </div>
      </div>

      <div style={{ padding: "18px 20px 20px" }}>
        {attrs.length ? (
          <div
            className="bm-sans"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px 16px",
              marginBottom: profile.note ? 14 : 18,
              paddingBottom: 14,
              borderBottom: "1px solid " + LINE,
              color: MUTED,
              fontSize: 13,
            }}
          >
            {attrs.map(function (item) {
              return <span key={item}>{item}</span>;
            })}
          </div>
        ) : null}

        {profile.note ? (
          <p
            className="bm-serif"
            style={{
              margin: "0 0 18px",
              fontSize: 16,
              lineHeight: 1.45,
              fontStyle: "italic",
              color: INK,
            }}
          >
            {profile.note}
          </p>
        ) : null}

        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <button
            type="button"
            onClick={onInterested}
            className="bm-sans bm-talk bm-focus"
            style={{
              flex: 1,
              ...actionBtn("primary"),
              background: interested ? VIOLET_DEEP : VIOLET,
              borderRadius: 999,
              padding: "13px 12px",
              fontSize: 14.5,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
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
              flex: 1,
              ...actionBtn("ghost"),
              borderRadius: 999,
              padding: "13px 12px",
              fontSize: 14.5,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <CloseIcon />
            Pass
          </button>
        </div>
        <button
          type="button"
          onClick={onSave}
          className="bm-sans bm-ghost bm-focus"
          style={{
            width: "100%",
            ...actionBtn("save"),
            borderRadius: 999,
            padding: "12px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <BookmarkIcon filled={saved} />
          {saved ? "Saved" : "Save"}
        </button>
        <SafetyActions
          profileId={profile.id}
          name={profile.name}
          surface="profile"
          signedIn={signedIn}
          nextPath="/"
          onBlocked={onBlocked}
        />
      </div>
    </article>
  );
}
