"use client";

import Link from "next/link";
import { MEETUP_COPY, MEETUP_PATH, type MeetupRecord } from "../../lib/meetup";
import { CREAM, LINE, MUTED, VIOLET, VIOLET_DEEP } from "../../lib/theme";

export default function MeetupCard({
  meetup,
  compact,
}: {
  meetup?: MeetupRecord | null;
  compact?: boolean;
}) {
  const title = (meetup && meetup.month_label) || MEETUP_COPY.monthTitle;

  return (
    <section
      className="bm-card"
      style={{
        background: CREAM,
        border: "1px solid " + LINE,
        borderRadius: 14,
        padding: compact ? "16px 16px 14px" : "18px 16px",
        marginBottom: 18,
      }}
    >
      <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
        {MEETUP_COPY.kicker}
      </p>
      <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: compact ? 22 : 24, fontWeight: 400, color: VIOLET_DEEP }}>
        {title}
      </h2>
      <p className="bm-sans" style={{ margin: "0 0 14px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
        {MEETUP_COPY.cardBody}
      </p>
      <Link
        href={MEETUP_PATH}
        className="bm-sans bm-talk bm-focus"
        style={{
          display: "inline-block",
          background: VIOLET,
          color: "#FFFFFF",
          borderRadius: 999,
          padding: "11px 18px",
          fontSize: 13.5,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        {MEETUP_COPY.openMeetup}
      </Link>
    </section>
  );
}
