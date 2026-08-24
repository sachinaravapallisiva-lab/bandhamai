import type { BrowseFactChip } from "../../lib/profile-search";
import { CREAM, LINE, MUTED, WASH } from "../../lib/theme";

function ChipIcon({ kind }: { kind: "lang" | "edu" | "home" }) {
  const common = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true as const };
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

/** Quiet WASH pills — shared Soft Minimal meta for Browse + Matches cards. */
export default function ProfileFactChips({
  chips,
  visa = "",
}: {
  chips: BrowseFactChip[];
  visa?: string;
}) {
  const visaLabel = visa.trim();
  if (!chips.length && !visaLabel) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 14,
      }}
    >
      {visaLabel ? (
        <span
          className="bm-sans"
          style={{
            display: "inline-flex",
            alignItems: "center",
            maxWidth: "100%",
            padding: "5px 10px",
            borderRadius: 999,
            background: CREAM,
            border: "1px solid " + LINE,
            fontSize: 12,
            color: MUTED,
            minWidth: 0,
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {visaLabel}
          </span>
        </span>
      ) : null}
      {chips.map(function (chip) {
        return (
          <span
            key={chip.key}
            className="bm-sans"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              maxWidth: "100%",
              padding: "5px 10px",
              borderRadius: 999,
              background: WASH,
              border: "1px solid " + LINE,
              fontSize: 12,
              color: MUTED,
              minWidth: 0,
            }}
          >
            <ChipIcon kind={chip.icon} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {chip.label}
            </span>
          </span>
        );
      })}
    </div>
  );
}
