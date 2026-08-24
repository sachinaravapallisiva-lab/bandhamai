"use client";

import {
  BROWSE_ASK_HINT,
  BROWSE_ASK_LABEL,
  browseAskChoices,
  browseAskProgress,
  isBrowseAskNoAnswer,
  type BrowseAskQuestion,
} from "../../lib/browse-ask";
import { PROFILE_ACTION_MIN } from "../../lib/profile-card";
import { CREAM, INK, LINE, MUTED, VIOLET, WASH } from "../../lib/theme";

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
        padding: "16px 16px 14px",
        marginBottom: 18,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
        <p className="bm-sans" style={{ margin: 0, fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
          {BROWSE_ASK_LABEL}
        </p>
        <p className="bm-sans" style={{ margin: 0, fontSize: 12, color: MUTED }}>
          {browseAskProgress(index, total)}
        </p>
      </div>
      <p className="bm-sans" style={{ margin: "0 0 10px", fontSize: 12, color: MUTED, lineHeight: 1.45 }}>
        {BROWSE_ASK_HINT}
      </p>
      <h2 className="bm-serif" style={{ margin: "0 0 14px", fontSize: 22, fontWeight: 400, lineHeight: 1.3, color: INK }}>
        {question.prompt}
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {browseAskChoices(question).map(function (choice) {
          const quiet = isBrowseAskNoAnswer(choice.id);
          return (
            <button
              key={choice.id}
              type="button"
              onClick={function () { onChoose(choice.id); }}
              className="bm-sans bm-ghost bm-focus"
              style={{
                minHeight: PROFILE_ACTION_MIN,
                background: quiet ? "#FFFFFF" : WASH,
                color: quiet ? MUTED : INK,
                border: "1px solid " + LINE,
                borderRadius: 999,
                padding: "10px 14px",
                fontSize: 13.5,
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
