import {
  SPEED_MATCH_QUESTION_COUNT,
  SPEED_MATCH_QUESTIONS,
  SPEED_MATCH_SECONDS,
  choiceLabel,
  countAnswered,
  emptyAnswers,
  parseRoundAnswers,
  progressLabel,
  questionAt,
  withAnswer,
} from "../lib/speed-match.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

assert(SPEED_MATCH_QUESTION_COUNT === 10, "locked to 10 questions");
assert(SPEED_MATCH_SECONDS === 15, "locked to 15 seconds");
assert(SPEED_MATCH_QUESTIONS.length === 10, "bank must be exactly 10");

const ids = new Set();
const banned = /\b(flirt|party|hookup|hook-up|crush|drinks tonight|vibe check|swipe|hot take|never have i|love language|attachment style)\b/i;

SPEED_MATCH_QUESTIONS.forEach(function (q, i) {
  assert(q.id && !ids.has(q.id), "question ids must be unique: " + q.id);
  ids.add(q.id);
  assert(q.prompt && q.prompt.length > 8, "prompt missing at " + q.id);
  assert(!banned.test(q.prompt), "flirty/party prompt at " + q.id);
  assert(q.choices.length >= 2 && q.choices.length <= 4, "2–4 choices at " + q.id);
  const choiceIds = new Set();
  q.choices.forEach(function (c) {
    assert(c.id && !choiceIds.has(c.id), "choice ids must be unique on " + q.id);
    choiceIds.add(c.id);
    assert(c.label && c.label.length > 1, "choice label missing on " + q.id);
    assert(!banned.test(c.label), "flirty choice on " + q.id);
  });
  assert(progressLabel(i) === i + 1 + "/10", "progress " + progressLabel(i));
  assert(questionAt(i)?.id === q.id, "questionAt mismatch at " + i);
});

assert(questionAt(10) === null, "no 11th question");

const dealbreakers = ["diet", "location", "family_living", "parents", "community", "dowry", "faith", "timeline", "children", "work"];
assert(
  dealbreakers.every(function (id) { return ids.has(id); }),
  "missing a matrimony dealbreaker id"
);

const answers = emptyAnswers();
assert(answers.length === 10, "emptyAnswers is 10 slots");
assert(countAnswered(answers) === 0, "empty round has no answers");

const first = withAnswer(answers, 0, {
  question_id: "diet",
  choice_id: "vegetarian",
  timed_out: false,
  skipped: false,
});
assert(countAnswered(first) === 1, "one recorded choice");
assert(choiceLabel("diet", "vegetarian") === "Vegetarian only", "choice label lookup");
assert(choiceLabel("diet", null) === "Skipped", "skip label");

const parsed = parseRoundAnswers(first);
assert(parsed && parsed[0].choice_id === "vegetarian", "parse keeps a valid round");
assert(parseRoundAnswers(first.slice(0, 3)) === null, "short payload rejected");
assert(parseRoundAnswers([{ question_id: "nope" }]) === null, "wrong ids rejected");

const badChoice = first.map(function (row, i) {
  return i === 0 ? { ...row, choice_id: "not-a-choice" } : row;
});
assert(parseRoundAnswers(badChoice) === null, "unknown choice rejected");

assert(!("match_percent" in first[0]), "do not invent a score on answers");

SPEED_MATCH_QUESTIONS.forEach(function (q) {
  assert(!/\bhow do you feel\b/i.test(q.prompt), "keep prompts as hard filters: " + q.id);
});

console.log("speed match bank ok", {
  count: SPEED_MATCH_QUESTIONS.length,
  seconds: SPEED_MATCH_SECONDS,
  ids: SPEED_MATCH_QUESTIONS.map(function (q) { return q.id; }),
});
