"use client";

import type { ReactNode } from "react";
import { MEETUP_RAIL_DEMO_LABEL, meetupRailPosts } from "../../lib/meetup-test-pond";
import { CREAM, LINE, MUTED, VIOLET_DEEP } from "../../lib/theme";

export default function MeetupRail({ children }: { children?: ReactNode }) {
  const posts = meetupRailPosts([]);
  return (
    <aside
      data-meetup-rail="true"
      aria-label="Meetup this month"
      style={{
        alignSelf: "flex-start",
        position: "sticky",
        top: 0,
        height: "100vh",
        maxHeight: "100vh",
        boxSizing: "border-box",
        padding: "20px 12px 28px",
        overflowY: "auto",
        borderLeft: "1px solid " + LINE,
        background: CREAM,
      }}
    >
      <div data-meetup-stack="true" style={{ display: "flex", flexDirection: "column" }}>
        {posts.length > 0 ? (
          <p
            data-meetup-demo="true"
            className="bm-sans"
            style={{ margin: "0 0 12px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}
          >
            {MEETUP_RAIL_DEMO_LABEL}
          </p>
        ) : null}
        {children}
        {posts.map(function (post) {
          return (
            <article
              key={post.id}
              className="bm-card"
              data-meetup-test-post="true"
              style={{
                background: CREAM,
                border: "1px solid " + LINE,
                borderRadius: 14,
                padding: "14px 12px 12px",
                marginBottom: 12,
              }}
            >
              <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
                {post.kicker}
              </p>
              <h2 className="bm-serif" style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 400, color: VIOLET_DEEP }}>
                {post.monthLabel}
              </h2>
              <p className="bm-serif" style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 400, color: VIOLET_DEEP }}>
                {post.title}
              </p>
              <p className="bm-sans" style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.45 }}>
                {post.body}
              </p>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
