import {
  PRESENCE_OFFLINE_COLOR,
  PRESENCE_ONLINE_COLOR,
  PRESENCE_ONLINE_TEXT,
} from "../../lib/presence";
import { MUTED } from "../../lib/theme";
import { ProfilePhoto } from "./ProfilePhoto";

/** Small green circular mark + Online, or muted Offline. */
export default function PresenceMark({
  online,
  compact = false,
}: {
  online?: boolean;
  compact?: boolean;
}) {
  const on = !!online;
  return (
    <span
      className="bm-sans"
      title={on ? "Online" : "Offline"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        verticalAlign: "middle",
        marginLeft: compact ? 0 : 8,
        position: "relative",
        top: compact ? 0 : -1,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: on ? 9 : 8,
          height: on ? 9 : 8,
          borderRadius: 999,
          background: on ? PRESENCE_ONLINE_COLOR : PRESENCE_OFFLINE_COLOR,
          boxShadow: on ? "0 0 0 2px rgba(22,163,74,.18)" : "none",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: compact ? 11 : 11.5,
          letterSpacing: ".02em",
          color: on ? PRESENCE_ONLINE_TEXT : MUTED,
          fontWeight: on ? 600 : 500,
        }}
      >
        {on ? "Online" : "Offline"}
      </span>
    </span>
  );
}

export function PresencePhoto({
  src,
  alt,
  size,
  online,
}: {
  src?: string;
  alt: string;
  size: number;
  online?: boolean;
}) {
  const on = !!online;
  return (
    <span style={{ position: "relative", display: "inline-block", flexShrink: 0 }}>
      {src ? (
        <ProfilePhoto src={src} alt={alt} size={size} />
      ) : (
        <span
          aria-hidden="true"
          style={{
            width: size,
            height: size,
            borderRadius: 14,
            background: "#F3F0FD",
            display: "block",
          }}
        />
      )}
      {on ? (
        <span
          aria-hidden="true"
          title="Online"
          style={{
            position: "absolute",
            right: -2,
            bottom: -2,
            width: 14,
            height: 14,
            borderRadius: 999,
            background: PRESENCE_ONLINE_COLOR,
            border: "2px solid #FFFFFF",
            boxSizing: "border-box",
          }}
        />
      ) : null}
    </span>
  );
}
