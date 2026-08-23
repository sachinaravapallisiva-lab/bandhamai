"use client";

import { useEffect, useRef, useState } from "react";
import { authJsonHeaders } from "../../lib/client-auth";
import type { BrowseProfile } from "../../lib/profile-search";
import {
  SPEED_MATCH_QUESTION_COUNT,
  SPEED_MATCH_SECONDS,
  SPEED_MATCH_QUESTIONS,
  SPEED_MATCH_SQL_FILE,
  choiceLabel,
  countAnswered,
  emptyAnswers,
  progressLabel,
  questionAt,
  withAnswer,
  writeLocalRound,
  type SpeedMatchStoredAnswer,
} from "../../lib/speed-match";
import { INK, LINE, MUTED, VIOLET, VIOLET_DEEP, WASH } from "../../lib/theme";

type Phase = "intro" | "play" | "done";
type PersistKind = "local" | "saved" | "table_missing" | "error";

export default function SpeedMatch({
  partner,
  signedIn,
  onClose,
}: {
  partner: BrowseProfile;
  signedIn: boolean;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(SPEED_MATCH_SECONDS);
  const [answers, setAnswers] = useState<SpeedMatchStoredAnswer[]>(emptyAnswers);
  const [persistKind, setPersistKind] = useState<PersistKind>("local");
  const [persistNote, setPersistNote] = useState("");

  const answersRef = useRef(answers);
  const lockedRef = useRef(false);
  const chooseRef = useRef<(choiceId: string | null, timedOut: boolean, skipped: boolean) => void>(
    function () {}
  );

  answersRef.current = answers;

  function persistRound(next: SpeedMatchStoredAnswer[]) {
    writeLocalRound({
      partner_profile_id: partner.id,
      partner_name: partner.name,
      answers: next,
      completed_at: new Date().toISOString(),
    });

    if (!signedIn) {
      setPersistKind("local");
      setPersistNote("Saved on this device for this visit. Sign in next time if you want it on your account.");
      return;
    }

    authJsonHeaders()
      .then(function (headers) {
        if (!headers) {
          setPersistKind("local");
          setPersistNote("Saved on this device for this visit.");
          return null;
        }
        return fetch("/api/speed-match", {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            partner_profile_id: partner.id,
            answers: next,
          }),
        });
      })
      .then(function (res) {
        if (!res) return;
        return res.json().then(function (data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .then(function (result) {
        if (!result) return;
        if (result.ok && result.data && result.data.persisted) {
          setPersistKind("saved");
          setPersistNote("Saved to your account. This is a record of what you said, not a score.");
          return;
        }
        if (result.data && result.data.code === "table_missing") {
          setPersistKind("table_missing");
          setPersistNote(
            "Saved on this device for this visit. Account storage needs " + SPEED_MATCH_SQL_FILE + "."
          );
          return;
        }
        setPersistKind("error");
        setPersistNote("Could not save to the account. The answers are still on this device.");
      })
      .catch(function () {
        setPersistKind("error");
        setPersistNote("Could not save to the account. The answers are still on this device.");
      });
  }

  function choose(choiceId: string | null, timedOut: boolean, skipped: boolean) {
    if (phase !== "play" || lockedRef.current) return;
    lockedRef.current = true;
    const question = questionAt(index);
    if (!question) return;

    const next = withAnswer(answersRef.current, index, {
      question_id: question.id,
      choice_id: choiceId,
      timed_out: timedOut,
      skipped: skipped || choiceId === null,
    });
    answersRef.current = next;
    setAnswers(next);

    if (index + 1 >= SPEED_MATCH_QUESTION_COUNT) {
      setPhase("done");
      persistRound(next);
      return;
    }
    setIndex(index + 1);
  }

  chooseRef.current = choose;

  useEffect(function () {
    if (phase !== "play") return;
    lockedRef.current = false;
    setLeft(SPEED_MATCH_SECONDS);
    const started = Date.now();
    const id = setInterval(function () {
      const remaining = Math.max(0, SPEED_MATCH_SECONDS - (Date.now() - started) / 1000);
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        chooseRef.current(null, true, true);
      }
    }, 100);
    return function () {
      clearInterval(id);
    };
  }, [phase, index]);

  const question = questionAt(index);
  const secondsLeft = Math.ceil(left);
  const answered = countAnswered(answers);
  const barPct = Math.max(0, Math.min(100, (left / SPEED_MATCH_SECONDS) * 100));

  return (
    <div
      className="bm-card"
      style={{ background: "#FFFFFF", border: "1px solid " + LINE, borderRadius: 14, padding: "20px 18px" }}
    >
      {phase === "intro" ? (
        <>
          <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
            SPEED MATCH
          </p>
          <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 23, fontWeight: 400 }}>
            Ten questions with {partner.name || "this profile"}
          </h2>
          <p className="bm-sans" style={{ margin: "0 0 16px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
            Fifteen seconds each. Matrimony filters families actually gate on — not a score, and not a promise that you will match. Skip if you need to.
          </p>
          <div style={{ display: "flex", gap: 9 }}>
            <button
              type="button"
              onClick={onClose}
              className="bm-sans bm-ghost bm-focus"
              style={{
                flex: 1,
                background: "transparent",
                color: MUTED,
                border: "1px solid " + LINE,
                borderRadius: 999,
                padding: "11px",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Back to Matches
            </button>
            <button
              type="button"
              onClick={function () {
                setAnswers(emptyAnswers());
                answersRef.current = emptyAnswers();
                setIndex(0);
                setPhase("play");
              }}
              className="bm-sans bm-talk bm-focus"
              style={{
                flex: 1,
                background: VIOLET,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 999,
                padding: "11px",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Begin
            </button>
          </div>
        </>
      ) : null}

      {phase === "play" && question ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
            <p className="bm-sans" style={{ margin: 0, fontSize: 12, letterSpacing: ".12em", color: MUTED }}>
              {progressLabel(index)}
            </p>
            <p className="bm-sans" aria-live="polite" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: secondsLeft <= 5 ? VIOLET_DEEP : VIOLET }}>
              {secondsLeft}s
            </p>
          </div>
          <div
            aria-hidden="true"
            style={{ height: 4, background: WASH, border: "1px solid " + LINE, borderRadius: 999, overflow: "hidden", marginBottom: 16 }}
          >
            <div
              style={{
                width: barPct + "%",
                height: "100%",
                background: VIOLET,
                transition: "width .1s linear",
              }}
            />
          </div>
          <h2 className="bm-serif" style={{ margin: "0 0 16px", fontSize: 22, fontWeight: 400, lineHeight: 1.3 }}>
            {question.prompt}
          </h2>
          <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            {question.choices.map(function (choice) {
              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={function () { choose(choice.id, false, false); }}
                  className="bm-sans bm-ghost bm-focus"
                  style={{
                    textAlign: "left",
                    background: WASH,
                    color: INK,
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
          <button
            type="button"
            onClick={function () { choose(null, false, true); }}
            className="bm-sans bm-focus"
            style={{
              background: "none",
              border: "none",
              color: MUTED,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            Skip
          </button>
        </>
      ) : null}

      {phase === "done" ? (
        <>
          <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 11, letterSpacing: ".16em", color: MUTED }}>
            ROUND FINISHED
          </p>
          <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 23, fontWeight: 400 }}>
            You answered {answered} of {SPEED_MATCH_QUESTION_COUNT}
          </h2>
          <p className="bm-sans" style={{ margin: "0 0 16px", fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
            This is a record of what you said with {partner.name || "this profile"}. It is not a compatibility score, and it does not guarantee a match.
          </p>
          <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            {SPEED_MATCH_QUESTIONS.map(function (q, i) {
              const row = answers[i];
              return (
                <div key={q.id} style={{ borderTop: "1px solid " + LINE, paddingTop: 10 }}>
                  <p className="bm-sans" style={{ margin: "0 0 3px", fontSize: 11, letterSpacing: ".12em", color: MUTED }}>
                    {progressLabel(i)}
                  </p>
                  <p className="bm-serif" style={{ margin: "0 0 4px", fontSize: 16 }}>
                    {q.prompt}
                  </p>
                  <p className="bm-sans" style={{ margin: 0, fontSize: 13.5, color: row?.choice_id ? INK : MUTED }}>
                    {choiceLabel(q.id, row?.choice_id || null)}
                    {row?.timed_out ? " · time ran out" : ""}
                  </p>
                </div>
              );
            })}
          </div>
          {persistNote ? (
            <p className="bm-sans" style={{ margin: "0 0 16px", fontSize: 12.5, color: persistKind === "saved" ? VIOLET : MUTED, lineHeight: 1.45 }}>
              {persistNote}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="bm-sans bm-talk bm-focus"
            style={{
              width: "100%",
              background: VIOLET,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 999,
              padding: "12px",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Back to Matches
          </button>
        </>
      ) : null}
    </div>
  );
}
