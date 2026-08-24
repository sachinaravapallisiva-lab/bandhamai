"use client";

import { KUNDLI_SHARE_HINT, KUNDLI_SHARE_LABEL } from "../../lib/kundli-share";
import { INK, LINE, MUTED, WASH } from "../../lib/theme";

export default function KundliShareField({
  checked,
  onChange,
  disabled,
  id = "pf-kundli-share",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <div
      style={{
        padding: "14px 15px",
        border: "1px solid " + LINE,
        borderRadius: 10,
        background: WASH,
      }}
    >
      <label
        htmlFor={id}
        className="bm-sans"
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          cursor: disabled ? "default" : "pointer",
        }}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={function (e) {
            onChange(e.target.checked);
          }}
          className="bm-focus"
          style={{ marginTop: 3, width: 16, height: 16, accentColor: INK }}
        />
        <span>
          <span style={{ display: "block", fontSize: 14.5, color: INK, lineHeight: 1.4 }}>
            {KUNDLI_SHARE_LABEL}
          </span>
          <span style={{ display: "block", marginTop: 4, fontSize: 12, color: MUTED, lineHeight: 1.45 }}>
            {KUNDLI_SHARE_HINT}
          </span>
        </span>
      </label>
    </div>
  );
}
