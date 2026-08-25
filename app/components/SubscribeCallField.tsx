"use client";

import {
  SUBSCRIBE_CALL_HINT,
  SUBSCRIBE_CALL_LABEL,
  SUBSCRIBE_CALL_PHONE_HINT,
  SUBSCRIBE_CALL_PHONE_LABEL,
  displayPhoneWithSpaces,
} from "../../lib/subscribe-call";
import { INK, LINE, MUTED, WASH } from "../../lib/theme";

export default function SubscribeCallField({
  checked,
  phone,
  onChecked,
  onPhone,
  disabled,
  optInId = "account-subscribe-call",
  phoneId = "account-subscribe-phone",
}: {
  checked: boolean;
  phone: string;
  onChecked: (next: boolean) => void;
  onPhone: (next: string) => void;
  disabled?: boolean;
  optInId?: string;
  phoneId?: string;
}) {
  return (
    <div>
      <div
        style={{
          padding: "14px 15px",
          border: "1px solid " + LINE,
          borderRadius: 10,
          background: WASH,
        }}
      >
        <label
          htmlFor={optInId}
          className="bm-sans"
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            cursor: disabled ? "default" : "pointer",
          }}
        >
          <input
            id={optInId}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={function (e) {
              onChecked(e.target.checked);
            }}
            className="bm-focus"
            style={{ marginTop: 3, width: 16, height: 16, accentColor: INK }}
          />
          <span>
            <span style={{ display: "block", fontSize: 14.5, color: INK, lineHeight: 1.4 }}>
              {SUBSCRIBE_CALL_LABEL}
            </span>
            <span style={{ display: "block", marginTop: 4, fontSize: 12, color: MUTED, lineHeight: 1.45 }}>
              {SUBSCRIBE_CALL_HINT}
            </span>
          </span>
        </label>
      </div>

      <label
        htmlFor={phoneId}
        className="bm-sans"
        style={{ display: "block", fontSize: 9.5, letterSpacing: ".14em", color: MUTED, margin: "14px 0 6px" }}
      >
        {SUBSCRIBE_CALL_PHONE_LABEL}
      </label>
      <input
        id={phoneId}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        disabled={disabled}
        value={phone}
        placeholder="+1 512 555 0100"
        onChange={function (e) {
          onPhone(displayPhoneWithSpaces(e.target.value));
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
        {SUBSCRIBE_CALL_PHONE_HINT}
      </p>
    </div>
  );
}
