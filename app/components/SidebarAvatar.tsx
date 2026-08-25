"use client";

import { useEffect, useState } from "react";
import {
  SIDEBAR_AVATAR_ALT,
  SIDEBAR_AVATAR_MARK,
  SIDEBAR_AVATAR_SIZE,
  sidebarAvatarInitial,
} from "../../lib/sidebar-avatar";
import { CREAM, LINE, VIOLET, WASH } from "../../lib/theme";

export default function SidebarAvatar({
  photoUrl,
  name,
}: {
  photoUrl: string;
  name: string;
}) {
  const [broken, setBroken] = useState(false);
  const size = SIDEBAR_AVATAR_SIZE;
  const initial = sidebarAvatarInitial(name);
  const showPhoto = Boolean(photoUrl) && !broken;

  useEffect(
    function () {
      setBroken(false);
    },
    [photoUrl]
  );

  const mark = {
    width: size,
    height: size,
    borderRadius: 999,
    border: "1px solid " + LINE,
    flexShrink: 0,
    boxSizing: "border-box" as const,
  };

  if (showPhoto) {
    return (
      // Own Bandham profile photo. next/image remote hosts are not wired for Storage.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={SIDEBAR_AVATAR_ALT}
        width={size}
        height={size}
        data-sidebar-own-photo={SIDEBAR_AVATAR_MARK}
        onError={function () {
          setBroken(true);
        }}
        style={{
          ...mark,
          objectFit: "cover",
          display: "block",
          background: WASH,
        }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      data-sidebar-own-photo={SIDEBAR_AVATAR_MARK}
      className="bm-sans"
      style={{
        ...mark,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: CREAM,
        color: VIOLET,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {initial}
    </span>
  );
}
