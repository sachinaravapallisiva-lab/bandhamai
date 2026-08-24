"use client";

import {
  BROWSE_ASK_HINT,
  BROWSE_ASK_KICKER,
  BROWSE_ASK_TAP_MIN,
  BROWSE_ASK_TITLE,
  choicesForBrowseAsk,
  progressLabel,
  type BrowseAskQuestion,
} from "../../lib/browse-ask";
import { CREAM, INK, LINE, MUTED, WASH } from "../../lib/theme";
import { isNoAnswerChoiceId } from "../../lib/speed-match";

export default function BrowseAsk({
  questions,
  index,
  onChoose,
}: {
  questions: BrowseAskQuestion[];
  index: number;
  onChoose: (choiceId: string) => void;
}) {
  const question = questions[index];
  if (!question) return null;

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
          {BROWSE_ASK_KICKER}
        </p>
        <p className="bm-sans" style={{ margin: 0, fontSize: 12, color: MUTED }}>
          {progressLabel(index, questions.length)}
        </p>
      </div>
      <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 400, lineHeight: 1.3 }}>
        {question.prompt}
      </h2>
      <p className="bm-sans" style={{ margin: "0 0 16px", fontSize: 13, color: MUTED, lineHeight: 1.45 }}>
        {BROWSE_ASK_TITLE} {BROWSE_ASK_HINT}
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {choicesForBrowseAsk(question).map(function (choice) {
          const quiet = isNoAnswerChoiceId(choice.id);
          return (
            <button
              key={choice.id}
              type="button"
              onClick={function () {
                onChoose(choice.id);
              }}
              className="bm-sans bm-ghost bm-focus"
              style={{
                minHeight: BROWSE_ASK_TAP_MIN,
                textAlign: "left",
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
