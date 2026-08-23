"use client";

import { INK, LINE, MUTED, WASH } from "../../lib/theme";

export default function InstagramField({
  value,
  onChange,
  disabled,
  id = "pf-instagram",
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <div>
      <p
        className="bm-sans"
        style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 10px" }}
      >
        CONNECT SOCIALS
      </p>
      <label
        htmlFor={id}
        className="bm-sans"
        style={{ display: "block", fontSize: 9.5, letterSpacing: ".14em", color: MUTED, marginBottom: 6 }}
      >
        INSTAGRAM
      </label>
      <input
        id={id}
        type="text"
        inputMode="text"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={160}
        disabled={disabled}
        value={value}
        placeholder="@ananya or instagram.com/ananya"
        onChange={function (e) {
          onChange(e.target.value);
        }}
        className="bm-sans bm-input bm-focus"
        style={{
          width: "100%",
          padding: "13px 15px",
          border: "1px solid " + LINE,
          borderRadius: 10,
          fontSize: 14.5,
          color: INK,
          background: WASH,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      <p className="bm-sans" style={{ margin: "6px 0 0", fontSize: 12, color: MUTED, lineHeight: 1.45 }}>
        Optional. Paste a username or Instagram profile URL. Instagram only — not Facebook, LinkedIn, X, or TikTok.
      </p>
    </div>
  );
}
