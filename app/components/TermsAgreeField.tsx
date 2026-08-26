"use client";

import Link from "next/link";
import { TERMS_PATH } from "../../lib/terms-agree";
import { INK, VIOLET } from "../../lib/theme";

export default function TermsAgreeField({
  id,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className="bm-sans"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        fontSize: 13.5,
        color: INK,
        lineHeight: 1.45,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <input
        id={id}
        name="agreeTerms"
        type="checkbox"
        required
        checked={checked}
        disabled={disabled}
        onChange={function (e) {
          onChange(e.target.checked);
        }}
        className="bm-focus"
        style={{ marginTop: 3, width: 16, height: 16, accentColor: VIOLET }}
      />
      <span>
        I agree to the{" "}
        <Link href={TERMS_PATH} className="bm-focus" style={{ color: VIOLET }}>
          Terms
        </Link>
        .
      </span>
    </label>
  );
}
