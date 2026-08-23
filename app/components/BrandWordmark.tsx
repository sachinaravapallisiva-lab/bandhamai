import Link from "next/link";
import { VIOLET } from "../../lib/theme";

function KnotMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.2c2.2 1.9 3.6 4.2 3.6 6.6 0 3.6-2.2 6.3-3.6 7.7-1.4-1.4-3.6-4.1-3.6-7.7 0-2.4 1.4-4.7 3.6-6.6Z"
        fill="none"
        stroke={VIOLET}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M7.2 9.6c1.8-1.5 4.1-2.2 6.6-1.4 2.2.7 3.7 2.4 4.2 4.4"
        fill="none"
        stroke={VIOLET}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M16.8 14.4c-1.8 1.5-4.1 2.2-6.6 1.4-2.2-.7-3.7-2.4-4.2-4.4"
        fill="none"
        stroke={VIOLET}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BrandWordmark({
  size = 22,
  href,
}: {
  size?: number;
  href?: string;
}) {
  const mark = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        color: VIOLET,
      }}
    >
      <KnotMark size={size} />
      <span
        className="bm-serif"
        style={{
          fontSize: size,
          fontWeight: 500,
          letterSpacing: "0.06em",
          lineHeight: 1,
        }}
      >
        BANDHAM AI
      </span>
    </span>
  );

  if (!href) return mark;
  return (
    <Link href={href} className="bm-focus" style={{ textDecoration: "none", color: VIOLET }}>
      {mark}
    </Link>
  );
}
