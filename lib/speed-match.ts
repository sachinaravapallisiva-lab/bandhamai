/** Locked Tier 2 Speed Match: 10 questions, 15 seconds each. */

import { speedMatchDealbreakerQuestions } from "./dealbreakers";

export const SPEED_MATCH_QUESTION_COUNT = 10;
export const SPEED_MATCH_SECONDS = 15;
export const SPEED_MATCH_TABLE = "speed_match_rounds";
export const SPEED_MATCH_SQL_FILE = "supabase/speed_match.sql";
export const SPEED_MATCH_STORAGE_KEY = "bandham.speedMatch.last";

export type SpeedMatchChoice = {
  id: string;
  label: string;
};

/** Canonical tap choice for skip / timer / prefer-not. No free-text answers. */
export const SPEED_MATCH_NO_ANSWER_ID = "dont_answer";
export const SPEED_MATCH_NO_ANSWER_ALIAS = "prefer_not";
export const SPEED_MATCH_NO_ANSWER_LABEL = "Don't want to answer";
export const SPEED_MATCH_NO_ANSWER_CHOICE: SpeedMatchChoice = {
  id: SPEED_MATCH_NO_ANSWER_ID,
  label: SPEED_MATCH_NO_ANSWER_LABEL,
};

export type SpeedMatchQuestion = {
  id: string;
  prompt: string;
  choices: SpeedMatchChoice[];
};

export type SpeedMatchStoredAnswer = {
  question_id: string;
  choice_id: string | null;
  timed_out: boolean;
  skipped: boolean;
};

export type SpeedMatchLocalRound = {
  partner_profile_id: string;
  partner_name: string;
  answers: SpeedMatchStoredAnswer[];
  completed_at: string;
};

/**
 * Indian household dealbreakers for talking. Not Browse search filters.
 * Diet is not a main question. Location, visa, religion, caste, and mother
 * tongue stay in the search box. Not Western dating, not flirty, not party games.
 */
export const SPEED_MATCH_QUESTIONS: SpeedMatchQuestion[] = speedMatchDealbreakerQuestions().map(
  function (question) {
    return {
      id: question.id,
      prompt: question.prompt,
      choices: question.choices.map(function (choice) {
        return { id: choice.id, label: choice.label };
      }),
    };
  }
);

export function isNoAnswerChoiceId(choiceId: string | null | undefined) {
  return (
    !choiceId ||
    choiceId === SPEED_MATCH_NO_ANSWER_ID ||
    choiceId === SPEED_MATCH_NO_ANSWER_ALIAS
  );
}

export function choicesForQuestion(question: SpeedMatchQuestion) {
  if (question.choices.some(function (c) { return c.id === SPEED_MATCH_NO_ANSWER_ID; })) {
    return question.choices;
  }
  return question.choices.concat(SPEED_MATCH_NO_ANSWER_CHOICE);
}

export function isValidChoiceId(question: SpeedMatchQuestion, choiceId: string) {
  if (isNoAnswerChoiceId(choiceId)) return true;
  return question.choices.some(function (c) { return c.id === choiceId; });
}

export function noAnswerPayload(questionId: string, timedOut: boolean): SpeedMatchStoredAnswer {
  return {
    question_id: questionId,
    choice_id: SPEED_MATCH_NO_ANSWER_ID,
    timed_out: timedOut,
    skipped: true,
  };
}

export function progressLabel(index: number) {
  return index + 1 + "/" + SPEED_MATCH_QUESTION_COUNT;
}

export function questionAt(index: number) {
  return SPEED_MATCH_QUESTIONS[index] || null;
}

export function emptyAnswers(): SpeedMatchStoredAnswer[] {
  return SPEED_MATCH_QUESTIONS.map(function (q) {
    return {
      question_id: q.id,
      choice_id: null,
      timed_out: false,
      skipped: false,
    };
  });
}

export function withAnswer(
  answers: SpeedMatchStoredAnswer[],
  index: number,
  patch: SpeedMatchStoredAnswer
) {
  return answers.map(function (row, i) {
    return i === index ? patch : row;
  });
}

export function countAnswered(answers: SpeedMatchStoredAnswer[]) {
  return answers.filter(function (row) {
    return !!row.choice_id && !isNoAnswerChoiceId(row.choice_id);
  }).length;
}

export function choiceLabel(questionId: string, choiceId: string | null) {
  if (isNoAnswerChoiceId(choiceId)) return SPEED_MATCH_NO_ANSWER_LABEL;
  const question = SPEED_MATCH_QUESTIONS.find(function (q) {
    return q.id === questionId;
  });
  const choice = question?.choices.find(function (c) {
    return c.id === choiceId;
  });
  return choice?.label || SPEED_MATCH_NO_ANSWER_LABEL;
}

export function parseRoundAnswers(raw: unknown): SpeedMatchStoredAnswer[] | null {
  if (!Array.isArray(raw) || raw.length !== SPEED_MATCH_QUESTION_COUNT) return null;

  const out: SpeedMatchStoredAnswer[] = [];
  for (let i = 0; i < SPEED_MATCH_QUESTION_COUNT; i++) {
    const item = raw[i];
    const expected = SPEED_MATCH_QUESTIONS[i];
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    if (row.question_id !== expected.id) return null;

    const rawChoice = row.choice_id;
    if (rawChoice !== null && typeof rawChoice !== "string") return null;

    let choiceId: string | null;
    if (rawChoice === null || isNoAnswerChoiceId(rawChoice)) {
      choiceId = SPEED_MATCH_NO_ANSWER_ID;
    } else if (isValidChoiceId(expected, rawChoice)) {
      choiceId = rawChoice;
    } else {
      return null;
    }

    out.push({
      question_id: expected.id,
      choice_id: choiceId,
      timed_out: row.timed_out === true,
      skipped: row.skipped === true || isNoAnswerChoiceId(choiceId),
    });
  }
  return out;
}

export function writeLocalRound(round: SpeedMatchLocalRound) {
  try {
    sessionStorage.setItem(SPEED_MATCH_STORAGE_KEY, JSON.stringify(round));
  } catch {
    /* private mode / quota — session state still holds the round */
  }
}

export function readLocalRound(): SpeedMatchLocalRound | null {
  try {
    const raw = sessionStorage.getItem(SPEED_MATCH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SpeedMatchLocalRound>;
    const answers = parseRoundAnswers(parsed.answers);
    if (!answers || typeof parsed.partner_profile_id !== "string") return null;
    return {
      partner_profile_id: parsed.partner_profile_id,
      partner_name: typeof parsed.partner_name === "string" ? parsed.partner_name : "",
      answers,
      completed_at: typeof parsed.completed_at === "string" ? parsed.completed_at : "",
    };
  } catch {
    return null;
  }
}
