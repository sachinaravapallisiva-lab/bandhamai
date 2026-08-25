"use client";

import type { ReactNode } from "react";
import { MEETUP_TEST_POSTS } from "../../lib/meetup-test-pond";
import { CREAM, LINE, MUTED, VIOLET_DEEP } from "../../lib/theme";

export default function MeetupRail({ children }: { children?: ReactNode }) {
  return (
    <aside
      data-meetup-rail="true"
      aria-label="Meetup this month"
      style={{
        flex: "1 1 220px",
        minWidth: 200,
        maxWidth: 340,
        alignSelf: "stretch",
        boxSizing: "border-box",
        padding: "20px 16px 28px",
        overflowY: "auto",
      }}
    >
      <div data-meetup-stack="true" style={{ display: "flex", flexDirection: "column" }}>
        {children}
        {MEETUP_TEST_POSTS.map(function (post) {
          return (
            <article
              key={post.id}
              className="bm-card"
              data-meetup-test-post="true"
              style={{
                background: CREAM,
                border: "1px solid " + LINE,
                borderRadius: 14,
                padding: "16px 16px 14px",
                marginBottom: 14,
              }}
            >
              <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
                {post.kicker}
              </p>
              <h2 className="bm-serif" style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 400, color: VIOLET_DEEP }}>
                {post.monthLabel}
              </h2>
              <p className="bm-serif" style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 400, color: VIOLET_DEEP }}>
                {post.title}
              </p>
              <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
                {post.body}
              </p>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
