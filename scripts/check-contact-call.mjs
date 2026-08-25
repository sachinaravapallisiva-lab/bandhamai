import { readFileSync } from "node:fs";
import { ACCOUNT_MENU_ITEMS } from "../lib/account-menu.ts";
import {
  CONTACT_DANGER,
  CONTACT_GUEST_HINT,
  CONTACT_OPEN_TICKET,
  CONTACT_SIGN_IN,
  CONTACT_SIGNED_HINT,
  CONTACT_TICKET_EMAILED,
  CONTACT_TICKET_FAILED,
  CONTACT_TICKET_NEED_DETAIL,
  CONTACT_TICKET_SAVED,
  FOOTER_LINKS,
  SUPPORT_CALL_BODY,
  SUPPORT_CALL_HEADLINE,
  SUPPORT_CALL_LABEL,
  SUPPORT_CALL_PATH,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  contactUserCopy,
} from "../lib/site.ts";
import { SUPPORT_TICKETS_PATH } from "../lib/support.ts";

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
assert(contact.includes("CONTACT_DANGER"), "contact uses shared danger copy");
assert(!/TODO/.test(contact), "contact page has no public TODO");
assert(!/This form (still )?does not send email/.test(contact), "contact page does not say the form is dead");
assert(!/640\s*837\s*9459/.test(contact), "contact page never publishes 640");
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
assert(!/TODO/.test(site), "site copy has no public TODO");
assert(!/640\s*837\s*9459/.test(site), "site copy never publishes 640");
assert(!/SUPPORT_INBOX_TODO/.test(site), "inbox TODO constant is gone");

contactUserCopy().forEach(function (text) {
  assert(!/[-–—]/.test(text), "contact copy has no hyphen or dash: " + text);
  assert(!/TODO|Supabase|support@/i.test(text), "contact copy stays member facing: " + text);
  assert(!/640\s*837\s*9459/.test(text), "contact copy never publishes 640");
});

assert(CONTACT_GUEST_HINT.toLowerCase().includes("call us"), "guest hint points to Call us");
assert(CONTACT_GUEST_HINT.toLowerCase().includes("sign in"), "guest hint points to Sign in");
assert(CONTACT_SIGNED_HINT.toLowerCase().includes("ticket"), "signed in hint is a ticket");
assert(CONTACT_TICKET_SAVED.toLowerCase().includes("ticket saved"), "saved copy does not claim email");
assert(!/email/i.test(CONTACT_TICKET_SAVED), "saved copy does not claim email");
assert(/email/i.test(CONTACT_TICKET_EMAILED), "emailed copy is only for email_sent");
assert(CONTACT_OPEN_TICKET === "Open ticket", "signed in CTA is Open ticket");
assert(CONTACT_SIGN_IN === "Sign in", "guest CTA is Sign in");
assert(CONTACT_TICKET_NEED_DETAIL.toLowerCase().includes("subject"), "validation names subject");
assert(CONTACT_TICKET_FAILED.toLowerCase().includes("call us"), "failure still points to Call us");
assert(CONTACT_DANGER.toLowerCase().includes("emergency"), "danger line stays");

const form = read("app/components/ContactForm.tsx");
assert(form.includes("SUPPORT_TICKETS_PATH") || form.includes(SUPPORT_TICKETS_PATH), "signed in submit hits tickets API");
assert(form.includes("normalizeTicketDraft"), "form uses the same draft fields as the API");
assert(form.includes("authJsonHeaders"), "tickets send the session bearer");
assert(form.includes("CONTACT_GUEST_HINT"), "guest banner is shared copy");
assert(form.includes("CONTACT_SIGNED_HINT"), "signed in banner is shared copy");
assert(form.includes("SUPPORT_PHONE_TEL"), "guest Call us uses the live tel");
assert(form.includes("loginHref") || form.includes("/login"), "guest Sign in goes to login");
assert(form.includes("email_sent"), "email claim waits for the API");
assert(!/TODO:|public TODO|support inbox/.test(form), "contact form has no public TODO");
assert(!/Draft note|Copy draft/.test(form), "no leftover draft only CTA");
assert(!/This form (still )?does not send email/.test(form), "form does not say it is dead");
assert(!/640\s*837\s*9459/.test(form), "form never publishes 640");
assert(!/support@/i.test(form), "form does not invent a support inbox");
assert(!/RESEND_API_KEY|resend\.com/.test(form), "form does not enable Resend");

const readme = read("README.md");
assert(readme.includes("+1 803 265 5233"), "README names the public number");
assert(readme.includes("tel:+18032655233"), "README names the tel link");
assert(readme.includes("/contact"), "README points to Contact");

console.log("contact call us ok", {
  display: SUPPORT_PHONE_DISPLAY,
  tel: SUPPORT_PHONE_TEL,
  path: SUPPORT_CALL_PATH,
});
