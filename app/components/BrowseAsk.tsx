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

function Chip({
  choiceId,
  label,
  quiet,
  onChoose,
}: {
  choiceId: string;
  label: string;
  quiet: boolean;
  onChoose: (choiceId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={function () {
        onChoose(choiceId);
      }}
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
      {label}
    </button>
  );
}

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
  const skip = browseAskChoices(question).filter(function (choice) {
    return isBrowseAskNoAnswer(choice.id);
  })[0];

  return (
    <div
      data-browse-ask={question.id}
      style={{
        marginTop: 16,
        paddingTop: 16,
        borderTop: "1px solid " + LINE,
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
      {question.groups
        ? question.groups.map(function (group) {
            return (
              <div key={group.heading} style={{ marginBottom: 12 }}>
                <p className="bm-sans" style={{ margin: "0 0 8px", fontSize: 11, letterSpacing: ".14em", color: VIOLET }}>
                  {group.heading}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {group.choices.map(function (choice) {
                    return (
                      <Chip
                        key={choice.id}
                        choiceId={choice.id}
                        label={choice.label}
                        quiet={false}
                        onChoose={onChoose}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })
        : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, background: CREAM }}>
        {question.choices.map(function (choice) {
          return (
            <Chip
              key={choice.id}
              choiceId={choice.id}
              label={choice.label}
              quiet={isBrowseAskNoAnswer(choice.id)}
              onChoose={onChoose}
            />
          );
        })}
        {skip ? (
          <Chip
            choiceId={skip.id}
            label={skip.label}
            quiet={true}
            onChoose={onChoose}
          />
        ) : null}
      </div>
    </div>
  );
}
