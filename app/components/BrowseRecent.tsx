"use client";

import {
  BROWSE_PROMPTS_HINT,
  BROWSE_PROMPTS_LABEL,
  BROWSE_PROMPTS_RERUN,
  BROWSE_PROMPTS_VIEW,
  browsePromptWhen,
  type BrowsePromptItem,
} from "../../lib/browse-prompts";
import { PROFILE_ACTION_MIN } from "../../lib/profile-card";
import { CREAM, INK, LINE, MUTED, VIOLET, WASH } from "../../lib/theme";

export default function BrowseRecent({
  items,
  onView,
  onRerun,
}: {
  items: BrowsePromptItem[];
  onView: (item: BrowsePromptItem) => void;
  onRerun: (item: BrowsePromptItem) => void;
}) {
  if (!items.length) return null;

  return (
    <section style={{ marginBottom: 18 }}>
      <p className="bm-sans" style={{ margin: "0 0 4px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
        {BROWSE_PROMPTS_LABEL}
      </p>
      <p className="bm-sans" style={{ margin: "0 0 12px", fontSize: 12, color: MUTED, lineHeight: 1.45 }}>
        {BROWSE_PROMPTS_HINT}
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map(function (item) {
          return (
            <article
              key={item.id}
              className="bm-card"
              style={{
                background: CREAM,
                border: "1px solid " + LINE,
                borderRadius: 14,
                padding: "14px 16px 12px",
              }}
            >
              <p className="bm-serif" style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 400, color: INK, lineHeight: 1.35 }}>
                {item.prompt}
              </p>
              <p className="bm-sans" style={{ margin: "0 0 12px", fontSize: 12, color: MUTED }}>
                {browsePromptWhen(item.createdAt)}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button
                  type="button"
                  onClick={function () { onView(item); }}
                  className="bm-sans bm-talk bm-focus"
                  style={{
                    minHeight: PROFILE_ACTION_MIN,
                    background: VIOLET,
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 999,
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {BROWSE_PROMPTS_VIEW}
                </button>
                <button
                  type="button"
                  onClick={function () { onRerun(item); }}
                  className="bm-sans bm-ghost bm-focus"
                  style={{
                    minHeight: PROFILE_ACTION_MIN,
                    background: WASH,
                    color: VIOLET,
                    border: "1px solid " + LINE,
                    borderRadius: 999,
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {BROWSE_PROMPTS_RERUN}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
