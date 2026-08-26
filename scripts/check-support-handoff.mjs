import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
} from "../lib/site.ts";
import {
  SUPPORT_HANDOFF_E164_ENV,
  SUPPORT_PUBLIC_CALLER_ID_E164,
  SUBSCRIBE_OUTBOUND_E164_ENV,
  VOICE_SPOKEN_HANDOFF,
  VOICE_SPOKEN_HANDOFF_UNAVAILABLE,
  VOICE_SPOKEN_HANDOFF_WHO,
  VOICE_SPOKEN_INCLUDED_WHEN_ASKED,
  VOICE_SPOKEN_INTRO,
  VOICE_SPOKEN_NOT_FOUND,
  VOICE_SPOKEN_PRICES,
  VOICE_SPOKEN_REFUND,
  VOICE_SPOKEN_SAFETY,
  VOICE_SUPPORT_PROMPT_FILE,
  flattenVoiceSupportBody,
  inboundAllowsSupportHandoff,
  isIgnorableVoiceEvent,
  isSubscribeOutboundNumber,
  isSupportPublicNumber,
  readVoiceTool,
  subscribeOutboundE164,
  supportHandoffDestination,
  supportHandoffE164,
  supportHandoffPayload,
} from "../lib/voice-support.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

function walkFiles(dir, out) {
  const entries = readdirSync(dir);
  for (const name of entries) {
    if (name === "node_modules" || name === ".git" || name === ".next") continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkFiles(full, out);
      continue;
    }
    if (stat.isFile()) out.push(full);
  }
  return out;
}

/** Built in pieces so this file never contains the leaked personal dest as one string. */
function personalDestNeedles() {
  const digits = ["4", "7", "0", "9", "6", "2", "0", "4", "3", "8"].join("");
  return [
    digits,
    "1" + digits,
    "+1" + digits,
    "+1 " + ["470", "962", "0438"].join(" "),
    ["470", "962", "0438"].join("-"),
    ["470", "962", "0438"].join(" "),
  ];
}

function subscribeOutNeedles() {
  const digits = ["6", "4", "0", "8", "3", "7", "9", "4", "5", "9"].join("");
  return [
    digits,
    "1" + digits,
    "+1" + digits,
    "+1 " + ["640", "837", "9459"].join(" "),
    ["640", "837", "9459"].join("-"),
    ["640", "837", "9459"].join(" "),
  ];
}

function textHasNeedle(text, needles) {
  return needles.some(function (needle) {
    return text.includes(needle);
  });
}

const FAKE_DEST = "+15551234567";
const FAKE_SUBSCRIBE_OUT = "+15559876543";
const SUBSCRIBE_CALLER_FILES = [
  "docs/subscribe-call-prompt.md",
  "lib/subscribe-call.ts",
  "lib/subscribe-call-server.ts",
  "app/api/voice/subscribe-reminders/route.ts",
  "app/components/SubscribeCallField.tsx",
  "scripts/check-subscribe-call.mjs",
  "supabase/subscribe_call_opt_in.sql",
];
const USER_FACING = [
  "app/contact/page.tsx",
  "app/components/ContactForm.tsx",
  "app/components/AccountDrawer.tsx",
  "app/components/SiteFooter.tsx",
  "app/page.tsx",
  "app/plans/page.tsx",
  "lib/site.ts",
  "lib/plans.ts",
];
const PUBLIC_640_PATHS = [
  "README.md",
  ".env.example",
  "docs/voice-support-prompt.md",
  "app/contact/page.tsx",
  "app/components/ContactForm.tsx",
  "app/components/SiteFooter.tsx",
  "app/plans/page.tsx",
  "lib/site.ts",
  "lib/plans.ts",
];

assert(SUPPORT_HANDOFF_E164_ENV === "BANDHAM_SUPPORT_HANDOFF_E164", "handoff env name");
assert(SUBSCRIBE_OUTBOUND_E164_ENV === "BANDHAM_SUBSCRIBE_OUTBOUND_E164", "subscribe outbound env name");
assert(SUPPORT_PUBLIC_CALLER_ID_E164 === "+18032655233", "caller id stays 803");
assert(SUPPORT_PHONE_DISPLAY === "+1 803 265 5233", "Contact still publishes 803");
assert(SUPPORT_PHONE_TEL === "tel:+18032655233", "Contact tel stays 803");
assert(isSupportPublicNumber("+1 803 265 5233"), "803 matches public Support");
assert(inboundAllowsSupportHandoff(""), "unknown inbound may handoff");
assert(inboundAllowsSupportHandoff("+18032655233"), "803 inbound may handoff");
assert(!inboundAllowsSupportHandoff(FAKE_DEST), "other inbound must not handoff");

const prevHandoff = process.env.BANDHAM_SUPPORT_HANDOFF_E164;
const prevSubscribe = process.env.BANDHAM_SUBSCRIBE_OUTBOUND_E164;
delete process.env.BANDHAM_SUPPORT_HANDOFF_E164;
delete process.env.BANDHAM_SUBSCRIBE_OUTBOUND_E164;
assert(supportHandoffE164() === "", "empty handoff env fails closed");
assert(supportHandoffDestination() === null, "no dest without env");
assert(subscribeOutboundE164() === "", "empty subscribe outbound env is no extra block");
assert(isSubscribeOutboundNumber(FAKE_SUBSCRIBE_OUT) === false, "no extra block when env empty");
assert(
  supportHandoffPayload({ inboundNumber: "+18032655233" }).stay_on_support === true,
  "empty dest stays on Support"
);

process.env.BANDHAM_SUPPORT_HANDOFF_E164 = "+1 (555) 123-4567";
assert(supportHandoffE164() === FAKE_DEST, "env dest normalizes");
process.env.BANDHAM_SUPPORT_HANDOFF_E164 = "+18032655233";
assert(supportHandoffE164() === "", "803 cannot transfer to itself");

process.env.BANDHAM_SUBSCRIBE_OUTBOUND_E164 = FAKE_SUBSCRIBE_OUT;
process.env.BANDHAM_SUPPORT_HANDOFF_E164 = FAKE_SUBSCRIBE_OUT;
assert(supportHandoffE164() === "", "subscribe outbound cannot be the dest");
assert(isSubscribeOutboundNumber(FAKE_SUBSCRIBE_OUT) === true, "env subscribe outbound is blocked");
assert(!inboundAllowsSupportHandoff(FAKE_SUBSCRIBE_OUT), "subscribe outbound inbound must not handoff");

process.env.BANDHAM_SUPPORT_HANDOFF_E164 = FAKE_DEST;
const dest = supportHandoffDestination();
assert(!!dest, "destination builds from env");
assert(dest.callerId === "+18032655233", "Vapi callerId stays 803");
assert(dest.number === FAKE_DEST, "destination is the env dest");
assert(dest.number !== dest.callerId, "dest is not the public Support number");
assert(dest.transferPlan.mode === "warm-transfer-experimental", "warm transfer");
assert(dest.transferPlan.fallbackPlan.endCallEnabled === false, "no-answer stays on Support");
assert(dest.transferPlan.fallbackPlan.message === VOICE_SPOKEN_HANDOFF_UNAVAILABLE, "fallback spoken lock");

const ok = supportHandoffPayload({ inboundNumber: "+18032655233", toolCallId: "call-1" });
assert(ok.transferred === true, "803 can transfer when dest env is set");
assert(ok.caller_id === "+18032655233", "payload caller id is 803");
assert(ok.message === VOICE_SPOKEN_HANDOFF, "spoken connect line");
assert(ok.results[0].result === VOICE_SPOKEN_HANDOFF, "Vapi tool result is spoken only");
assert(!String(ok.results[0].result).includes(FAKE_DEST), "tool result omits dest");
assert(!ok.message.includes(FAKE_DEST), "connect line omits dest");

const blocked = supportHandoffPayload({ inboundNumber: FAKE_SUBSCRIBE_OUT });
assert(blocked.transferred === false && blocked.stay_on_support === true, "blocked inbound stays on Support");
assert(!blocked.destination, "blocked inbound has no dest");

if (prevHandoff === undefined) delete process.env.BANDHAM_SUPPORT_HANDOFF_E164;
else process.env.BANDHAM_SUPPORT_HANDOFF_E164 = prevHandoff;
if (prevSubscribe === undefined) delete process.env.BANDHAM_SUBSCRIBE_OUTBOUND_E164;
else process.env.BANDHAM_SUBSCRIBE_OUTBOUND_E164 = prevSubscribe;

const vapiDest = flattenVoiceSupportBody({
  message: {
    type: "transfer-destination-request",
    call: { phoneNumber: { number: "+18032655233" } },
  },
});
assert(readVoiceTool(vapiDest) === "transfer_to_human", "Vapi dest request is handoff");
assert(vapiDest.inbound_number === "+18032655233", "reads inbound 803");

const vapiTool = flattenVoiceSupportBody({
  message: {
    type: "tool-calls",
    toolCallList: [{ id: "tc1", function: { name: "transferCall", arguments: { reason: "asked for Sai" } } }],
    call: { phoneNumber: { number: "+18032655233" } },
  },
});
assert(readVoiceTool(vapiTool) === "transfer_to_human", "Vapi tool-calls alias");
assert(vapiTool.reason === "asked for Sai", "nested args flatten");
assert(isIgnorableVoiceEvent({ message: { type: "status-update" } }) === true, "status events ignored");
assert(isIgnorableVoiceEvent({ message: { type: "transfer-destination-request" } }) === false, "dest request not ignored");
assert(isIgnorableVoiceEvent({ tool: "identify_member" }) === false, "xAI body not ignored");

const spoken = [
  VOICE_SPOKEN_INTRO,
  VOICE_SPOKEN_PRICES,
  VOICE_SPOKEN_INCLUDED_WHEN_ASKED,
  VOICE_SPOKEN_SAFETY,
  VOICE_SPOKEN_REFUND,
  VOICE_SPOKEN_NOT_FOUND,
  VOICE_SPOKEN_HANDOFF,
  VOICE_SPOKEN_HANDOFF_UNAVAILABLE,
  VOICE_SPOKEN_HANDOFF_WHO,
].join("\n");
assert(!/[—–]/.test(spoken), "spoken copy avoids em dashes");
assert(!/-/.test(spoken), "spoken copy avoids hyphens");
assert(!/\$/.test(spoken), "spoken copy avoids dollar signs");
assert(!textHasNeedle(spoken, personalDestNeedles()), "spoken copy has no personal dest");
assert(!textHasNeedle(spoken, subscribeOutNeedles()), "spoken copy has no subscribe outbound");
assert(!/Aravapalli|Sachin/i.test(spoken), "spoken copy has no full name dump");
assert(VOICE_SPOKEN_HANDOFF_WHO === "You will get Sai.", "Sai only when asked who");
assert(VOICE_SPOKEN_PRICES.includes("9.99 a month"), "subscription spoken price");
assert(VOICE_SPOKEN_PRICES.includes("4.99 one time"), "VerifyAI spoken price");
assert(VOICE_SPOKEN_PRICES.toLowerCase().includes("feature demo"), "meetup demo lock");

const prompt = read(VOICE_SUPPORT_PROMPT_FILE);
assert(prompt.includes("transfer_to_human"), "prompt names handoff tool");
assert(prompt.toLowerCase().includes("warm transfer"), "prompt describes warm transfer");
assert(prompt.toLowerCase().includes("stay on"), "prompt stays on Support if no answer");
assert(!textHasNeedle(prompt, personalDestNeedles()), "prompt has no personal dest");
assert(!textHasNeedle(prompt, subscribeOutNeedles()), "prompt has no subscribe outbound");
assert(!prompt.includes("285886ff"), "prompt does not touch subscribe assistant id");
const sayBlocks = prompt.split("Say this:").slice(1).join("\n");
assert(!/-/.test(sayBlocks.replace(/example\.com/g, "examplecom")), "spoken examples avoid hyphens");
assert(sayBlocks.includes(VOICE_SPOKEN_HANDOFF), "prompt has connect line");
assert(sayBlocks.includes(VOICE_SPOKEN_HANDOFF_WHO), "prompt has who line");

USER_FACING.forEach(function (path) {
  const text = read(path);
  assert(!textHasNeedle(text, personalDestNeedles()), "user-facing copy has no personal dest: " + path);
  assert(!textHasNeedle(text, subscribeOutNeedles()), "user-facing copy has no subscribe outbound: " + path);
});

const contact = read("app/contact/page.tsx");
assert(contact.includes("SUPPORT_PHONE_DISPLAY"), "Contact still uses shared 803 display");
assert(contact.includes("SUPPORT_PHONE_TEL"), "Contact still uses shared 803 tel");
assert(!/tel:\+1555|tel:\+1470|tel:\+1640/.test(contact), "Contact has no extra tel");

const site = read("lib/site.ts");
assert((site.match(/\+1 803 265 5233/g) || []).length === 1, "site publishes 803 only once");

const footer = read("app/components/SiteFooter.tsx");
assert(!/803|470|640/.test(footer), "footer still has no phone numbers");

SUBSCRIBE_CALLER_FILES.forEach(function (path) {
  const abs = new URL("../" + path, import.meta.url);
  if (!existsSync(abs)) return;
  const text = read(path);
  assert(!text.includes("BANDHAM_SUPPORT_HANDOFF_E164"), "subscribe caller file untouched by handoff env: " + path);
  assert(!text.includes("transfer_to_human"), "subscribe caller file untouched by Support transfer: " + path);
  assert(!text.includes("warm-transfer-experimental"), "subscribe caller file untouched by Support transfer plan: " + path);
});

const rootUrl = new URL("..", import.meta.url);
const root = rootUrl.pathname;
const destNeedles = personalDestNeedles();
const outNeedles = subscribeOutNeedles();
walkFiles(root, []).forEach(function (full) {
  const rel = relative(root, full);
  if (!rel || rel.startsWith("..")) return;
  const text = readFileSync(full, "utf8");
  assert(!textHasNeedle(text, destNeedles), "personal dest leaked in " + rel);
  if (rel.startsWith("app/") || rel.startsWith("docs/") || PUBLIC_640_PATHS.includes(rel)) {
    assert(!textHasNeedle(text, outNeedles), "subscribe outbound leaked in " + rel);
  }
  if (rel.startsWith("app/")) {
    assert(!text.includes("285886ff"), "do not touch subscribe assistant 285886ff: " + rel);
  }
});

const route = read("app/api/voice/support/route.ts");
assert(route.includes("supportHandoffPayload"), "route returns handoff payload");
assert(route.includes("flattenVoiceSupportBody"), "route accepts Vapi envelopes");
assert(!route.includes("285886ff"), "route does not name subscribe assistant");
assert(!/from ["'].*twilio/.test(route), "no second telephony stack");
assert(!route.includes("OPERATOR_DEFAULT"), "route has no hardcoded dest default");

const lib = read("lib/voice-support.ts");
assert(!lib.includes("OPERATOR_DEFAULT"), "lib has no operator dest default");
assert(lib.includes("SUPPORT_HANDOFF_E164_ENV"), "lib names handoff env");
assert(lib.includes("SUBSCRIBE_OUTBOUND_E164_ENV"), "lib names subscribe outbound env");

const env = read(".env.example");
assert(env.includes("BANDHAM_SUPPORT_HANDOFF_E164="), "env stubs handoff");
assert(!/BANDHAM_SUPPORT_HANDOFF_E164=\S+/.test(env), "handoff assignment line stays empty");
assert(env.includes("BANDHAM_SUBSCRIBE_OUTBOUND_E164="), "env stubs subscribe outbound");
assert(!/BANDHAM_SUBSCRIBE_OUTBOUND_E164=\S+/.test(env), "subscribe outbound assignment line stays empty");
assert(env.includes("+18032655233"), "comment locks caller id");
assert(!env.includes("NEXT_PUBLIC_BANDHAM_SUPPORT_HANDOFF"), "handoff is not public");
assert(!env.includes("NEXT_PUBLIC_BANDHAM_SUBSCRIBE_OUTBOUND"), "subscribe outbound is not public");

const readme = read("README.md");
assert(readme.includes("BANDHAM_SUPPORT_HANDOFF_E164"), "README names handoff env");
assert(readme.includes("BANDHAM_SUBSCRIBE_OUTBOUND_E164"), "README names subscribe outbound env");
assert(readme.includes("+18032655233"), "README locks caller id");
assert(/do\s+\**not\**\s+patch the live vapi/i.test(readme), "README waits for Sai yes");
assert(readme.toLowerCase().includes("empty means stay on support"), "README fail closed");

const pkg = read("package.json");
assert(pkg.includes("check:support-handoff"), "npm script exists");

console.log("support handoff ok", {
  callerId: SUPPORT_PUBLIC_CALLER_ID_E164,
  destEnv: SUPPORT_HANDOFF_E164_ENV,
  subscribeEnv: SUBSCRIBE_OUTBOUND_E164_ENV,
  tool: "transfer_to_human",
});
