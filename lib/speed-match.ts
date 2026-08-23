/** Locked Tier 2 Speed Match: 10 questions, 15 seconds each. */

export const SPEED_MATCH_QUESTION_COUNT = 10;
export const SPEED_MATCH_SECONDS = 15;
export const SPEED_MATCH_TABLE = "speed_match_rounds";
export const SPEED_MATCH_SQL_FILE = "supabase/speed_match.sql";
export const SPEED_MATCH_STORAGE_KEY = "bandham.speedMatch.last";

export type SpeedMatchChoice = {
  id: string;
  label: string;
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
 * Indian / desi matrimony dealbreakers and hard filters.
 * Short choices so 15 seconds is realistic. Not Western dating prompts.
 */
export const SPEED_MATCH_QUESTIONS: SpeedMatchQuestion[] = [
  {
    id: "diet",
    prompt: "What food do you want at home after marriage?",
    choices: [
      { id: "vegetarian", label: "Vegetarian household" },
      { id: "eggetarian", label: "Eggetarian is fine" },
      { id: "nonveg", label: "Non-veg is fine" },
      { id: "decide", label: "We'll decide meals together" },
    ],
  },
  {
    id: "location",
    prompt: "After marriage, where do you want to live?",
    choices: [
      { id: "india", label: "India" },
      { id: "abroad", label: "United States / abroad" },
      { id: "either", label: "Either, depending on family and work" },
      { id: "undecided", label: "Still deciding" },
    ],
  },
  {
    id: "family_living",
    prompt: "How do you want to live with family after marriage?",
    choices: [
      { id: "joint", label: "Joint family with parents" },
      { id: "nearby", label: "Nuclear home, parents nearby" },
      { id: "nuclear", label: "Nuclear, and distance is fine" },
      { id: "open", label: "Open — depends on the situation" },
    ],
  },
  {
    id: "parents",
    prompt: "How should parents be involved in this process?",
    choices: [
      { id: "from_start", label: "Involved from the start" },
      { id: "after_talk", label: "We talk first, then involve parents" },
      { id: "inform", label: "We decide; parents are informed" },
      { id: "talking", label: "Still talking this through" },
    ],
  },
  {
    id: "community",
    prompt: "Does the same community or family background matter to you?",
    choices: [
      { id: "same", label: "Prefer the same community" },
      { id: "values", label: "Open if values line up" },
      { id: "none", label: "Not a filter for me" },
      { id: "family", label: "Still deciding with family" },
    ],
  },
  {
    id: "dowry",
    prompt: "What is your stance on dowry?",
    choices: [
      { id: "refuse", label: "I will not ask for or accept it" },
      { id: "walk_away", label: "Dealbreaker if either family brings it up" },
      { id: "both_clear", label: "Both families must agree there is none" },
    ],
  },
  {
    id: "faith",
    prompt: "How do you want faith practiced at home?",
    choices: [
      { id: "regular", label: "Regular temple, church, or mosque" },
      { id: "festivals", label: "Festivals and family rituals" },
      { id: "private", label: "Private / personal" },
      { id: "not_central", label: "Faith is not central for me" },
    ],
  },
  {
    id: "timeline",
    prompt: "What is your timeline to marry?",
    choices: [
      { id: "year", label: "Within a year" },
      { id: "two_years", label: "In one to two years" },
      { id: "families", label: "When both families are ready" },
      { id: "none", label: "No fixed timeline yet" },
    ],
  },
  {
    id: "children",
    prompt: "How do you feel about children?",
    choices: [
      { id: "want", label: "I want children" },
      { id: "dont", label: "I do not want children" },
      { id: "open", label: "Open, depending on my partner" },
      { id: "undecided", label: "Still deciding" },
    ],
  },
  {
    id: "work",
    prompt: "After marriage, should a spouse keep working?",
    choices: [
      { id: "working", label: "Yes — I want a working partner" },
      { id: "either", label: "Support either path" },
      { id: "home", label: "Prefer one person focuses on home" },
      { id: "later", label: "We'll decide together later" },
    ],
  },
];

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
    return !!row.choice_id;
  }).length;
}

export function choiceLabel(questionId: string, choiceId: string | null) {
  if (!choiceId) return "Skipped";
  const question = SPEED_MATCH_QUESTIONS.find(function (q) {
    return q.id === questionId;
  });
  const choice = question?.choices.find(function (c) {
    return c.id === choiceId;
  });
  return choice?.label || "Skipped";
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

    const choiceId = row.choice_id;
    if (choiceId !== null && typeof choiceId !== "string") return null;
    if (choiceId && !expected.choices.some(function (c) { return c.id === choiceId; })) {
      return null;
    }

    out.push({
      question_id: expected.id,
      choice_id: choiceId,
      timed_out: row.timed_out === true,
      skipped: row.skipped === true || choiceId === null,
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
