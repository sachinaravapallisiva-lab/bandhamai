"use client";

import {
  BROWSE_ASK_EYEBROW,
  BROWSE_ASK_HINT,
  BROWSE_ASK_TITLE,
  browseAskProgress,
  choicesForBrowseAsk,
  isBrowseAskSkip,
  type BrowseAskQuestion,
} from "../../lib/browse-ask";
import { PROFILE_ACTION_MIN } from "../../lib/profile-card";
import { CREAM, INK, LINE, MUTED, WASH } from "../../lib/theme";

export default function BrowseAsk({
  question,
  index,
  total,
  onChoose,
}: {
  question: BrowseAskQuestion;
  index: number;
  total: number;
  onChoose: (choiceId: string) => void;
}) {
  return (
    <section
      className="bm-card"
      style={{
        background: CREAM,
        border: "1px solid " + LINE,
        borderRadius: 14,
        padding: "20px 18px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
        <p className="bm-sans" style={{ margin: 0, fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
          {BROWSE_ASK_EYEBROW}
        </p>
        <p className="bm-sans" style={{ margin: 0, fontSize: 12, color: MUTED }}>
          {browseAskProgress(index, total)}
        </p>
      </div>
      <h2 className="bm-serif" style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 400, lineHeight: 1.3 }}>
        {BROWSE_ASK_TITLE}
      </h2>
      <p className="bm-sans" style={{ margin: "0 0 16px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
        {BROWSE_ASK_HINT}
      </p>
      <p className="bm-serif" aria-live="polite" style={{ margin: "0 0 14px", fontSize: 20, fontWeight: 400, lineHeight: 1.35, color: INK }}>
        {question.prompt}
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {choicesForBrowseAsk(question).map(function (choice) {
          const quiet = isBrowseAskSkip(choice.id);
          return (
            <button
              key={choice.id}
              type="button"
              onClick={function () {
                onChoose(choice.id);
              }}
              className="bm-sans bm-ghost bm-focus"
              style={{
                display: "inline-flex",
                alignItems: "center",
                textAlign: "left",
                minHeight: PROFILE_ACTION_MIN,
                background: quiet ? CREAM : WASH,
                color: quiet ? MUTED : INK,
                border: "1px solid " + LINE,
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
