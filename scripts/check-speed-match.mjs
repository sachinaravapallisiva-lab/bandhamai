import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  SPEED_MATCH_NO_ANSWER_ALIAS,
  SPEED_MATCH_NO_ANSWER_CHOICE,
  SPEED_MATCH_NO_ANSWER_ID,
  SPEED_MATCH_NO_ANSWER_LABEL,
  SPEED_MATCH_QUESTION_COUNT,
  SPEED_MATCH_QUESTIONS,
  SPEED_MATCH_SECONDS,
  choiceLabel,
  choicesForQuestion,
  countAnswered,
  emptyAnswers,
  isNoAnswerChoiceId,
  noAnswerPayload,
  parseRoundAnswers,
  progressLabel,
  questionAt,
  withAnswer,
} from "../lib/speed-match.ts";
import { DEALBREAKER_FIELD_ORDER, DEALBREAKER_SPEED_VISA_CHOICES } from "../lib/dealbreakers.ts";
import { BROWSE_ASK_FIELD_ORDER } from "../lib/browse-ask.ts";
import { VISA_STATUS_OPTIONS } from "../lib/visa-status.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function assertEq(got, expected, label) {
  if (got !== expected) {
    throw new Error(label + ": expected " + JSON.stringify(expected) + ", got " + JSON.stringify(got));
  }
}

assert(SPEED_MATCH_QUESTION_COUNT === 10, "locked to 10 questions");
assert(SPEED_MATCH_SECONDS === 15, "locked to 15 seconds");
assert(SPEED_MATCH_QUESTIONS.length === 10, "bank must be exactly 10");
assert(SPEED_MATCH_NO_ANSWER_ID === "dont_answer", "canonical no-answer id");
assert(SPEED_MATCH_NO_ANSWER_ALIAS === "prefer_not", "prefer-not alias");
assert(SPEED_MATCH_NO_ANSWER_LABEL === "Don't want to answer", "explicit no-answer label");
assert(SPEED_MATCH_NO_ANSWER_CHOICE.id === SPEED_MATCH_NO_ANSWER_ID, "shared choice id");

const ids = new Set();
const banned = /\b(flirt|party|hookup|hook-up|crush|drinks tonight|vibe check|swipe|hot take|never have i|love language|attachment style)\b/i;

SPEED_MATCH_QUESTIONS.forEach(function (q, i) {
  assert(q.id && !ids.has(q.id), "question ids must be unique: " + q.id);
  ids.add(q.id);
  assert(q.prompt && q.prompt.length > 8, "prompt missing at " + q.id);
  assert(!banned.test(q.prompt), "flirty/party prompt at " + q.id);
  assert(q.choices.length >= 2, "at least two dealbreaker choices at " + q.id);
  assert(!/[—–]/.test(q.prompt), "no em dash in prompt: " + q.prompt);
  assert(
    !q.choices.some(function (c) { return isNoAnswerChoiceId(c.id); }),
    "dont_answer stays off the dealbreaker bank at " + q.id
  );
  const tapChoices = choicesForQuestion(q);
  assert(tapChoices.length === q.choices.length + 1, "every question adds one no-answer tap at " + q.id);
  assert(tapChoices[tapChoices.length - 1].id === SPEED_MATCH_NO_ANSWER_ID, "no-answer is last tap at " + q.id);
  assert(tapChoices[tapChoices.length - 1].label === SPEED_MATCH_NO_ANSWER_LABEL, "no-answer label at " + q.id);
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

const dealbreakers = [
  "location",
  "visa",
  "religion",
  "caste",
  "family_living",
  "parents",
  "work",
  "timeline",
  "children",
  "mother_tongue",
];
assertEq(
  SPEED_MATCH_QUESTIONS.map(function (q) { return q.id; }).join(" "),
  dealbreakers.join(" "),
  "Speed Match order matches Sai's household 10"
);
assert(!ids.has("diet"), "diet is not a main Speed Match question");
assert(!ids.has("dowry"), "dowry is not in this 10");
assert(!ids.has("faith"), "faith practice is replaced by religion");
assert(!ids.has("community"), "community preference is caste / community chips");

const answers = emptyAnswers();
assert(answers.length === 10, "emptyAnswers is 10 slots");
assert(countAnswered(answers) === 0, "empty round has no answers");

const first = withAnswer(answers, 0, {
  question_id: "location",
  choice_id: "us",
  timed_out: false,
  skipped: false,
});
assert(countAnswered(first) === 1, "one recorded choice");
assert(choiceLabel("location", "us") === "United States", "choice label lookup");
assert(choiceLabel("location", null) === SPEED_MATCH_NO_ANSWER_LABEL, "null maps to don't-want label");
assert(choiceLabel("location", SPEED_MATCH_NO_ANSWER_ID) === SPEED_MATCH_NO_ANSWER_LABEL, "dont_answer label");
assert(choiceLabel("location", SPEED_MATCH_NO_ANSWER_ALIAS) === SPEED_MATCH_NO_ANSWER_LABEL, "prefer_not label");

const skipped = withAnswer(first, 1, noAnswerPayload("visa", false));
assert(skipped[1].choice_id === SPEED_MATCH_NO_ANSWER_ID, "tap skip persists dont_answer");
assert(skipped[1].skipped === true, "tap skip is skipped");
assert(skipped[1].timed_out === false, "tap skip is not a timeout");
assert(countAnswered(skipped) === 1, "dont_answer does not count as answered");

const timedOut = withAnswer(first, 1, noAnswerPayload("visa", true));
assert(timedOut[1].choice_id === SPEED_MATCH_NO_ANSWER_ID, "timer skip persists dont_answer");
assert(timedOut[1].timed_out === true, "timer skip sets timed_out");
assert(timedOut[1].skipped === true, "timer skip is skipped");

const parsed = parseRoundAnswers(first);
assert(parsed && parsed[0].choice_id === "us", "parse keeps a valid round");
assert(parseRoundAnswers(first.slice(0, 3)) === null, "short payload rejected");
assert(parseRoundAnswers([{ question_id: "nope" }]) === null, "wrong ids rejected");

const parsedSkip = parseRoundAnswers(skipped);
assert(parsedSkip && parsedSkip[1].choice_id === SPEED_MATCH_NO_ANSWER_ID, "parse keeps dont_answer");
assert(parsedSkip[1].skipped === true, "parse marks dont_answer skipped");

const aliasRound = skipped.map(function (row, i) {
  return i === 1 ? { ...row, choice_id: SPEED_MATCH_NO_ANSWER_ALIAS } : row;
});
const parsedAlias = parseRoundAnswers(aliasRound);
assert(parsedAlias && parsedAlias[1].choice_id === SPEED_MATCH_NO_ANSWER_ID, "prefer_not normalizes to dont_answer");

const legacyNull = first.map(function (row, i) {
  return i === 1
    ? { question_id: "visa", choice_id: null, timed_out: true, skipped: true }
    : row;
});
const parsedNull = parseRoundAnswers(legacyNull);
assert(parsedNull && parsedNull[1].choice_id === SPEED_MATCH_NO_ANSWER_ID, "legacy null skip becomes dont_answer");
assert(parsedNull[1].timed_out === true, "legacy timer flag kept");

const badChoice = first.map(function (row, i) {
  return i === 0 ? { ...row, choice_id: "not-a-choice" } : row;
});
assert(parseRoundAnswers(badChoice) === null, "unknown choice rejected");

assert(!("match_percent" in first[0]), "do not invent a score on answers");
assert(!("match_percent" in skipped[1]), "no score on no-answer payload");

SPEED_MATCH_QUESTIONS.forEach(function (q) {
  assert(!/\bhow do you feel\b/i.test(q.prompt), "keep prompts as hard filters: " + q.id);
});

const uiPath = fileURLToPath(new URL("../app/components/SpeedMatch.tsx", import.meta.url));
const ui = readFileSync(uiPath, "utf8");
assert(!/<textarea\b/.test(ui) && !/<input\b/.test(ui), "tap choices only — no free-text answers");
assert(ui.includes("choicesForQuestion"), "UI renders the shared tap list including dont_answer");
assert(ui.includes("SPEED_MATCH_NO_ANSWER_ID"), "timer skip uses shared dont_answer id");
assert(!/\bSkip\b/.test(ui), "underline Skip is replaced by Don't want to answer");
assert(!/[—]/.test(ui), "Speed Match UI has no em dash");

assertEq(
  BROWSE_ASK_FIELD_ORDER.join(" "),
  DEALBREAKER_FIELD_ORDER.join(" "),
  "Browse ask and Speed Match share the same 10"
);
DEALBREAKER_SPEED_VISA_CHOICES.forEach(function (choice) {
  assert(VISA_STATUS_OPTIONS.includes(choice.label), "Speed Match visa reuses a stored label: " + choice.label);
});
const visaQ = SPEED_MATCH_QUESTIONS.find(function (q) { return q.id === "visa"; });
assert(visaQ, "visa is in the Speed Match bank");
visaQ.choices.forEach(function (choice) {
  assert(VISA_STATUS_OPTIONS.includes(choice.label), "Speed Match visa chip is a known label: " + choice.label);
});
assert(SPEED_MATCH_QUESTIONS[0].id === "location", "Speed Match starts at location");
assert(SPEED_MATCH_QUESTIONS[6].id === "work", "work after marriage stays in the 10");
assert(SPEED_MATCH_QUESTIONS[9].id === "mother_tongue", "mother tongue is last");

console.log("speed match bank ok", {
  count: SPEED_MATCH_QUESTIONS.length,
  seconds: SPEED_MATCH_SECONDS,
  no_answer: SPEED_MATCH_NO_ANSWER_ID,
  ids: SPEED_MATCH_QUESTIONS.map(function (q) { return q.id; }),
});
