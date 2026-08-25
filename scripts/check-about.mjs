import { readFileSync } from "node:fs";
import { FOOTER_LINKS } from "../lib/site.ts";
import { ALLOWED_NEXT_PATHS } from "../lib/next-path.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

const about = read("app/about/page.tsx");
const login = read("app/login/page.tsx");
const footer = read("app/components/SiteFooter.tsx");

const labels = FOOTER_LINKS.map(function (item) {
  return item.label;
});
const hrefs = FOOTER_LINKS.map(function (item) {
  return item.href;
});

assert(hrefs.includes("/about"), "footer has /about");
assert(labels.includes("About"), "footer label is About");
assert(!labels.includes("Goals"), "do not add a second Goals footer link");
assert(labels.filter(function (label) { return label === "About"; }).length === 1, "one About footer link");

const aboutIndex = hrefs.indexOf("/about");
const contactIndex = hrefs.indexOf("/contact");
assert(aboutIndex >= 0 && contactIndex >= 0 && aboutIndex < contactIndex, "About sits before Contact");

assert(footer.includes("FOOTER_LINKS"), "SiteFooter still maps FOOTER_LINKS");
assert(ALLOWED_NEXT_PATHS.includes("/about"), "login next allowlist includes /about");

assert(about.includes('title: "About"'), "about page title");
assert(about.includes("About our company"), "company section");
assert(about.includes("Goals"), "goals section");
assert(about.includes("AppChrome"), "about uses AppChrome");
assert(about.includes("Back to browse"), "about has Back to browse");
assert(about.includes("Bandham AI"), "product name is Bandham AI");
assert(about.includes("Find your vibe match?"), "tagline lock");
assert(about.includes("Indian matrimony for NRI and diaspora first"), "honest market lock");
assert(about.includes("US, Australia, UK, Europe, and Ireland"), "markets lock");
assert(about.includes("18 and over"), "adults lock");
assert(about.includes("talk to her parents"), "parents goal");
assert(about.includes("Guru"), "guru coaches");
assert(about.includes("never writes sendable dating text"), "guru never writes dating text");
assert(about.includes("Browse, search, Speed Match, and creating a profile stay free"), "free surfaces");
assert(about.includes("$9.99 a month"), "subscription price wording");
assert(about.includes("VerifyAI and meetup are separate"), "VerifyAI and meetup stay separate");

assert(!/Bandhamai|bandhamAI|Bandhan\b/.test(about), "never Bandhamai, bandhamAI, or Bandhan");
assert(!/LLC|headquarters|founding year|investor|members worldwide/i.test(about), "do not invent a company story");
assert(!/subscription is \$9\.99 .{0,40}messaging|\$9\.99 .{0,20}for messaging|messaging is \$9\.99/i.test(about), "do not say the subscription is $9.99 for messaging");
assert(!/\$9\.99\/mo|\$9\.99 per month|\$9\.99\/month/.test(about), "say $9.99 a month, not a slash price");

const aboutCopy = about
  .replace(/from ["'][^"']+["']/g, "")
  .replace(/href=["'][^"']+["']/g, "")
  .replace(/className=["'][^"']+["']/g, "");
assert(!/[-–—]/.test(aboutCopy), "about user facing copy has no hyphen or dash");

assert(login.includes('href="/about"'), "login links About");
assert(login.includes(">About<") || login.includes(">About</Link>"), "login labels the About link");
assert(login.includes('href="/safety"'), "login still links Safety");
assert(login.includes('href="/terms"'), "login still links Terms");

console.log("about page ok", {
  footer: labels.join(" / "),
  aboutBeforeContact: aboutIndex < contactIndex,
});
