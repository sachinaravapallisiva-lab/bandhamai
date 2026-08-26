import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
} from "../lib/site.ts";
import {
  SUPPORT_HANDOFF_E164_ENV,
  SUPPORT_HANDOFF_E164_OPERATOR_DEFAULT,
  SUPPORT_PUBLIC_CALLER_ID_E164,
  SUBSCRIBE_OUTBOUND_BLOCK_E164,
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
    if (/\.(tsx|ts|jsx|js|md|mjs)$/.test(name)) out.push(full);
  }
  return out;
}

const PRIVATE_PHONE = /470\s*962\s*0438|14709620438|\+1[\s-]*470|640\s*837\s*9459|16408379459|\+1[\s-]*640/;
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

assert(SUPPORT_HANDOFF_E164_ENV === "BANDHAM_SUPPORT_HANDOFF_E164", "handoff env name");
assert(SUPPORT_PUBLIC_CALLER_ID_E164 === "+18032655233", "caller id stays 803");
assert(SUPPORT_HANDOFF_E164_OPERATOR_DEFAULT === "+14709620438", "operator default dest");
assert(SUBSCRIBE_OUTBOUND_BLOCK_E164 === "+16408379459", "subscribe outbound block");
assert(SUPPORT_PHONE_DISPLAY === "+1 803 265 5233", "Contact still publishes 803");
assert(SUPPORT_PHONE_TEL === "tel:+18032655233", "Contact tel stays 803");
assert(isSupportPublicNumber("+1 803 265 5233"), "803 matches public Support");
assert(isSubscribeOutboundNumber("+1 640 837 9459"), "640 is the blocked outbound");
assert(inboundAllowsSupportHandoff(""), "unknown inbound may handoff");
assert(inboundAllowsSupportHandoff("+18032655233"), "803 inbound may handoff");
assert(!inboundAllowsSupportHandoff("+16408379459"), "640 inbound must not handoff");
assert(!inboundAllowsSupportHandoff("+15551234567"), "other inbound must not handoff");

const prevHandoff = process.env.BANDHAM_SUPPORT_HANDOFF_E164;
delete process.env.BANDHAM_SUPPORT_HANDOFF_E164;
assert(supportHandoffE164() === SUPPORT_HANDOFF_E164_OPERATOR_DEFAULT, "empty env uses operator default");
process.env.BANDHAM_SUPPORT_HANDOFF_E164 = "+1 (470) 962-0438";
assert(supportHandoffE164() === "+14709620438", "env dest normalizes");
process.env.BANDHAM_SUPPORT_HANDOFF_E164 = "+16408379459";
assert(supportHandoffE164() === "", "640 cannot be the dest");
process.env.BANDHAM_SUPPORT_HANDOFF_E164 = "+18032655233";
assert(supportHandoffE164() === "", "803 cannot transfer to itself");
if (prevHandoff === undefined) delete process.env.BANDHAM_SUPPORT_HANDOFF_E164;
else process.env.BANDHAM_SUPPORT_HANDOFF_E164 = prevHandoff;

const dest = supportHandoffDestination();
assert(!!dest, "destination builds");
assert(dest.callerId === "+18032655233", "Vapi callerId stays 803");
assert(dest.number === supportHandoffE164(), "destination is server dest");
assert(dest.number !== dest.callerId, "dest is not the public Support number");
assert(dest.transferPlan.mode === "warm-transfer-experimental", "warm transfer");
assert(dest.transferPlan.fallbackPlan.endCallEnabled === false, "no-answer stays on Support");
assert(dest.transferPlan.fallbackPlan.message === VOICE_SPOKEN_HANDOFF_UNAVAILABLE, "fallback spoken lock");
assert(!PRIVATE_PHONE.test(dest.message), "caller message has no private number");
assert(!PRIVATE_PHONE.test(dest.transferPlan.message), "operator whisper has no private number");

const ok = supportHandoffPayload({ inboundNumber: "+18032655233", toolCallId: "call-1" });
assert(ok.transferred === true, "803 can transfer");
assert(ok.caller_id === "+18032655233", "payload caller id is 803");
assert(ok.message === VOICE_SPOKEN_HANDOFF, "spoken connect line");
assert(ok.results[0].result === VOICE_SPOKEN_HANDOFF, "Vapi tool result is spoken only");
assert(!PRIVATE_PHONE.test(JSON.stringify(ok.results)), "tool result omits dest");
assert(!PRIVATE_PHONE.test(ok.message), "connect line omits dest");

const blocked = supportHandoffPayload({ inboundNumber: "+16408379459" });
assert(blocked.transferred === false && blocked.stay_on_support === true, "640 stays on Support");
assert(!blocked.destination, "640 response has no dest");

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
assert(!PRIVATE_PHONE.test(spoken), "spoken copy has no 470 or 640");
assert(!/Aravapalli|Sachin/i.test(spoken), "spoken copy has no full name dump");
assert(VOICE_SPOKEN_HANDOFF_WHO === "You will get Sai.", "Sai only when asked who");
assert(VOICE_SPOKEN_PRICES.includes("9.99 a month"), "subscription spoken price");
assert(VOICE_SPOKEN_PRICES.includes("4.99 one time"), "VerifyAI spoken price");
assert(VOICE_SPOKEN_PRICES.toLowerCase().includes("feature demo"), "meetup demo lock");

const prompt = read(VOICE_SUPPORT_PROMPT_FILE);
assert(prompt.includes("transfer_to_human"), "prompt names handoff tool");
assert(prompt.toLowerCase().includes("warm transfer"), "prompt describes warm transfer");
assert(prompt.toLowerCase().includes("stay on"), "prompt stays on Support if no answer");
assert(!PRIVATE_PHONE.test(prompt), "spoken prompt text has no 470 or 640");
assert(!prompt.includes(SUPPORT_HANDOFF_E164_OPERATOR_DEFAULT), "dest not in spoken prompt file");
assert(!prompt.includes(SUBSCRIBE_OUTBOUND_BLOCK_E164), "640 e164 not in prompt");
assert(!prompt.includes("285886ff"), "prompt does not touch subscribe assistant id");
const sayBlocks = prompt.split("Say this:").slice(1).join("\n");
assert(!/-/.test(sayBlocks.replace(/example\.com/g, "examplecom")), "spoken examples avoid hyphens");
assert(!PRIVATE_PHONE.test(sayBlocks), "spoken examples have no private numbers");
assert(sayBlocks.includes(VOICE_SPOKEN_HANDOFF), "prompt has connect line");
assert(sayBlocks.includes(VOICE_SPOKEN_HANDOFF_WHO), "prompt has who line");

USER_FACING.forEach(function (path) {
  const text = read(path);
  assert(!PRIVATE_PHONE.test(text), "user-facing copy has no 470 or 640: " + path);
  assert(!text.includes(SUPPORT_HANDOFF_E164_OPERATOR_DEFAULT), "dest not published: " + path);
});

const contact = read("app/contact/page.tsx");
assert(contact.includes("SUPPORT_PHONE_DISPLAY"), "Contact still uses shared 803 display");
assert(contact.includes("SUPPORT_PHONE_TEL"), "Contact still uses shared 803 tel");
assert(!/tel:\+1470|tel:\+1640/.test(contact), "Contact has no private tel");

const site = read("lib/site.ts");
assert((site.match(/\+1 803 265 5233/g) || []).length === 1, "site publishes 803 only once");
assert(!PRIVATE_PHONE.test(site), "site copy has no 470 or 640");

const plans = read("lib/plans.ts") + read("app/plans/page.tsx");
assert(!PRIVATE_PHONE.test(plans), "Plans has no 470 or 640");

const footer = read("app/components/SiteFooter.tsx");
assert(!PRIVATE_PHONE.test(footer), "footer has no 470 or 640");
assert(!/803|470|640/.test(footer), "footer still has no phone numbers");

SUBSCRIBE_CALLER_FILES.forEach(function (path) {
  const abs = new URL("../" + path, import.meta.url);
  if (!existsSync(abs)) return;
  const text = read(path);
  assert(!text.includes("BANDHAM_SUPPORT_HANDOFF_E164"), "subscribe caller file untouched by handoff env: " + path);
  assert(!text.includes("transfer_to_human"), "subscribe caller file untouched by Support transfer: " + path);
  assert(!text.includes("warm-transfer-experimental"), "subscribe caller file untouched by Support transfer plan: " + path);
});

const root = new URL("..", import.meta.url);
const scanned = walkFiles(new URL("../app", import.meta.url).pathname, []);
scanned.forEach(function (full) {
  const rel = relative(root.pathname, full);
  const text = readFileSync(full, "utf8");
  assert(!PRIVATE_PHONE.test(text), "app file has no private phone: " + rel);
  assert(!text.includes("285886ff"), "do not touch subscribe assistant 285886ff: " + rel);
});

const route = read("app/api/voice/support/route.ts");
assert(route.includes("supportHandoffPayload"), "route returns handoff payload");
assert(route.includes("flattenVoiceSupportBody"), "route accepts Vapi envelopes");
assert(!route.includes("285886ff"), "route does not name subscribe assistant");
assert(!/from ["'].*twilio/.test(route), "no second telephony stack");

const env = read(".env.example");
assert(env.includes("BANDHAM_SUPPORT_HANDOFF_E164="), "env stubs handoff");
assert(!/BANDHAM_SUPPORT_HANDOFF_E164=\S+/.test(env), "assignment line stays empty");
assert(env.includes("+14709620438"), "operator default lives in a comment");
assert(env.includes("+18032655233"), "comment locks caller id");
assert(!env.includes("NEXT_PUBLIC_BANDHAM_SUPPORT_HANDOFF"), "handoff is not public");

const readme = read("README.md");
assert(readme.includes("BANDHAM_SUPPORT_HANDOFF_E164"), "README names handoff env");
assert(readme.includes("+18032655233"), "README locks caller id");
assert(/do\s+\**not\**\s+patch the live vapi/i.test(readme), "README waits for Sai yes");

const pkg = read("package.json");
assert(pkg.includes("check:support-handoff"), "npm script exists");

console.log("support handoff ok", {
  callerId: SUPPORT_PUBLIC_CALLER_ID_E164,
  destEnv: SUPPORT_HANDOFF_E164_ENV,
  tool: "transfer_to_human",
});
