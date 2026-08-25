import { readFileSync } from "node:fs";
import { ACCOUNT_MENU_ITEMS } from "../lib/account-menu.ts";
import {
  FOOTER_LINKS,
  SUPPORT_CALL_BODY,
  SUPPORT_CALL_HEADLINE,
  SUPPORT_CALL_LABEL,
  SUPPORT_CALL_PATH,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
} from "../lib/site.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

assert(SUPPORT_PHONE_DISPLAY === "+1 803 265 5233", "display number lock");
assert(SUPPORT_PHONE_TEL === "tel:+18032655233", "tel link lock");
assert(!/-/.test(SUPPORT_PHONE_DISPLAY), "displayed number has no hyphens");
assert(SUPPORT_CALL_HEADLINE === "Call us", "headline lock");
assert(SUPPORT_CALL_LABEL === "Call us", "label lock");
assert(SUPPORT_CALL_PATH === "/contact#call", "hash path lock");
assert(SUPPORT_CALL_BODY.includes("Bandham Support"), "names Bandham Support");
assert(SUPPORT_CALL_BODY.includes("accounts"), "accounts");
assert(SUPPORT_CALL_BODY.includes("billing"), "billing");
assert(SUPPORT_CALL_BODY.includes("tickets"), "tickets");
assert(SUPPORT_CALL_BODY.toLowerCase().includes("not the love guru"), "not the love guru");
assert(SUPPORT_CALL_BODY.toLowerCase().includes("not an emergency"), "not emergency");
assert(!/24\s*\/\s*7|24-7|twenty.four/i.test(SUPPORT_CALL_BODY), "no 24/7 claim");
assert(!/[—–]/.test(SUPPORT_CALL_BODY), "call copy avoids em dashes");
assert(!/-/.test(SUPPORT_CALL_BODY), "call copy avoids hyphens");
assert(!/wait time|minutes or less|second (phone|number|line)/i.test(SUPPORT_CALL_BODY), "no invented wait or second line");

const footerLabels = FOOTER_LINKS.map(function (item) {
  return item.label;
});
assert(footerLabels.includes("Contact"), "footer keeps Contact");
assert(!footerLabels.includes("Call us"), "do not clutter the footer legal row");

const callItem = ACCOUNT_MENU_ITEMS.find(function (item) {
  return item.id === "call" || item.label === "Call us";
});
assert(!!callItem, "account menu has Call us");
assert(callItem.label === SUPPORT_CALL_LABEL, "drawer Call us label lock");
assert(callItem.href === SUPPORT_CALL_PATH, "drawer Call us goes to contact hash");

const help = ACCOUNT_MENU_ITEMS.find(function (item) {
  return item.id === "help";
});
assert(help && help.href === "/contact", "help still goes to contact");

const contact = read("app/contact/page.tsx");
assert(contact.includes('id="call"'), "call anchor");
assert(contact.includes("SUPPORT_CALL_HEADLINE"), "contact uses shared headline");
assert(contact.includes("SUPPORT_CALL_BODY"), "contact uses shared body");
assert(contact.includes("SUPPORT_PHONE_DISPLAY"), "contact uses shared display number");
assert(contact.includes("SUPPORT_PHONE_TEL"), "contact uses shared tel link");
assert(contact.includes("ContactForm"), "contact form stays");
assert(!/24\s*\/\s*7/.test(contact), "contact page no 24/7");
assert(!/position:\s*["']?fixed/.test(contact), "not a floating dialer");
assert(contact.includes("CREAM") || contact.includes("#FDF8F1"), "call block sits on cream");
assert(contact.includes("VIOLET") || contact.includes("#6D28D9"), "number stays violet");

const drawer = read("app/components/AccountDrawer.tsx");
assert(drawer.includes('name === "call"') || drawer.includes("iconForItem"), "drawer can icon Call us");
assert(drawer.includes("ACCOUNT_MENU_ITEMS"), "drawer still reads the shared menu");

const login = read("app/login/page.tsx");
assert(!login.includes("803 265 5233"), "login does not need the number");
assert(!login.includes("tel:+18032655233"), "login has no tel link");

const terms = read("app/terms/page.tsx");
const safety = read("app/safety/page.tsx");
assert(!terms.includes("803 265 5233"), "terms does not list the number");
assert(!safety.includes("803 265 5233"), "safety does not list the number");

const site = read("lib/site.ts");
assert((site.match(/\+1 803 265 5233/g) || []).length === 1, "one live display number");
assert((site.match(/tel:\+18032655233/g) || []).length === 1, "one live tel link");
assert(!/\+1 803 265 5234|\+1803-265-5233/.test(site), "no invented or hyphenated second number");

const readme = read("README.md");
assert(readme.includes("+1 803 265 5233"), "README names the public number");
assert(readme.includes("tel:+18032655233"), "README names the tel link");
assert(readme.includes("/contact"), "README points to Contact");

console.log("contact call us ok", {
  display: SUPPORT_PHONE_DISPLAY,
  tel: SUPPORT_PHONE_TEL,
  path: SUPPORT_CALL_PATH,
});
