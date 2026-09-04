import { SITE_ORIGIN, SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from "./site";

export const BLOG_PATH = "/blog";
export const BLOG_INDEX_TITLE = "Blog";
export const BLOG_INDEX_KICKER = "BLOG";
export const BLOG_INDEX_DESCRIPTION =
  "Indian matrimony notes for NRI and diaspora life. Bandham AI: Find your vibe match?";
export const BLOG_INDEX_LEDE =
  "Short reads on Indian matrimony for people in the US, Australia, UK, Europe, and Ireland. Not a dating app.";

export const NRI_DIASPORA_SLUG = "indian-matrimony-for-nri-diaspora";
export const NRI_DIASPORA_PATH = BLOG_PATH + "/" + NRI_DIASPORA_SLUG;

export const NRI_DIASPORA_TITLE =
  "Indian Matrimony for NRI and Diaspora: How to Find a Serious Match Abroad";
export const NRI_DIASPORA_DESCRIPTION =
  "Looking for Indian matrimony built for NRI and diaspora life in the US, UK, Australia, Europe, and Ireland? Bandham AI is desi with values and chemistry. Here’s how to find your vibe match.";
export const NRI_DIASPORA_DATE_PUBLISHED = "2026-09-04";
export const NRI_DIASPORA_DATE_MODIFIED = "2026-09-04";
export const NRI_DIASPORA_DATE_LABEL = "4 September 2026";
export const NRI_DIASPORA_UPDATED_LABEL = "Updated 4 September 2026";
export const NRI_DIASPORA_KICKER = "NRI AND DIASPORA";

export type BlogFaq = {
  question: string;
  answer: string;
};

export const NRI_DIASPORA_FAQS: BlogFaq[] = [
  {
    question: "Is Bandham AI a dating app?",
    answer:
      "No. Indian matrimony for NRI and diaspora. Serious about marriage, with room for chemistry. Not a dating app.",
  },
  {
    question: "Is it free?",
    answer:
      "Browse, search, Speed Match, and creating a profile stay free. Messaging is $9.99 a month when you want to talk.",
  },
  {
    question: "Where is Bandham focused?",
    answer:
      "US, Australia, UK, Europe, and Ireland. The product is built for NRI and diaspora life in those places.",
  },
  {
    question: "What is VerifyAI?",
    answer:
      "Separate $4.99 one time verification that the person is who they say they are. Optional. Not part of the messaging month.",
  },
];

export const NRI_DIASPORA_OPENING = [
  "You already know the split. Diwali at your parents' place, then Monday at a job in Dallas, London, Sydney, Dublin, or Berlin. You are serious about marriage. You also want someone you actually like talking to after the introductions are done.",
  "That is the lived NRI and diaspora tension in one breath. Two cultures in one life. Family matters. Respect matters. So does chemistry. Classic matrimony can feel built for a hometown you no longer live in. Dating apps treat marriage like a maybe. You are looking for something in between: Indian matrimony that still feels like you.",
  "Bandham AI is that place. Indian matrimony for NRI and diaspora. Tagline: Find your vibe match? Not a dating app. Built for people who want a real match, not endless swipes.",
] as const;

export const NRI_DIASPORA_VALUES_HEADING = "What desi with values means here";

export const NRI_DIASPORA_VALUES = [
  "On Bandham AI, desi with values is not a lecture and not a purity test. It is how the product treats you. Warm, clear, and confident. Modern NRI and diaspora voice. Still matrimony.",
  "Respect first. Profiles and chat sit in a matrimony frame. The chrome stays calm: Soft Minimal cream and violet. You are not dropped into a swipe deck. You can look with dignity and be looked at the same way.",
  "Clarity of intent. People here are looking for marriage, not a maybe. You can say what you want without dressing it up as casual. Serious intent is the default. Chemistry is not a side note. Find your vibe match is the question, and it is a real one.",
  "Optional trust. VerifyAI is a separate $4.99 one time check that the person is who they say they are. You add it when that signal matters. It is not required to browse, search, or create a profile.",
  "Messaging when you are ready. Browse, search, Speed Match, and creating a profile stay free. Messaging is $9.99 a month when you want to talk. No rush to pay just to look.",
  "Family and cultural rootedness stay in the picture without a sermon. You can care about home, diet, language, and timeline and still want a vibe match. That mix is the point, not a contradiction.",
] as const;

export const NRI_DIASPORA_NEED_HEADING = "What NRI and diaspora searchers actually need";

export const NRI_DIASPORA_NEEDS = [
  "Profiles that travel. A partner who is open to your city, or clear about moving. Time zones and relocation are part of the story, not a footnote.",
  "Intent that is marriage minded. Matrimony framing, not casual dating chrome. You should not have to guess whether someone is serious.",
  "Browse without paying first. See if the pool fits before messaging. Looking should stay free.",
  "Trust signals you can choose. Optional verification when you are ready to meet, not a badge forced on every card.",
  "A calm place to talk. Messaging when you choose, not noise. Conversation after you have already seen enough to want one.",
] as const;

export const NRI_DIASPORA_FIT_HEADING = "Why Bandham AI fits that search";

export const NRI_DIASPORA_FIT = [
  "Browse and search stay free. Create a profile, search, and try Speed Match without a paywall. Messaging is $9.99 a month when you are ready to talk.",
  "Built for diaspora markets: US, Australia, UK, Europe, and Ireland. That is the map. The product is written for that life.",
  "VerifyAI when trust matters: separate $4.99 one time check that the person is who they say they are.",
  "Speed Match for a quick read: tap answers, short timer, skip any question. Ten matrimony dealbreakers, not a game.",
] as const;

export const NRI_DIASPORA_START_HEADING = "How to get started";

export const NRI_DIASPORA_STEPS = [
  "Create your profile so the right people can find you.",
  "Browse and search for your vibe match. Use Speed Match when you want a fast filter.",
  "Subscribe when you want messaging. Add VerifyAI when you want an identity check.",
] as const;

export const BLOG_POSTS = [
  {
    slug: NRI_DIASPORA_SLUG,
    path: NRI_DIASPORA_PATH,
    title: NRI_DIASPORA_TITLE,
    description: NRI_DIASPORA_DESCRIPTION,
    datePublished: NRI_DIASPORA_DATE_PUBLISHED,
    dateModified: NRI_DIASPORA_DATE_MODIFIED,
    dateLabel: NRI_DIASPORA_DATE_LABEL,
    kicker: NRI_DIASPORA_KICKER,
  },
] as const;

export function siteUrl(path: string) {
  if (!path || path === "/") return SITE_ORIGIN;
  return SITE_ORIGIN + (path.startsWith("/") ? path : "/" + path);
}

export function blogArticleJsonLd() {
  const url = siteUrl(NRI_DIASPORA_PATH);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: NRI_DIASPORA_TITLE,
    description: NRI_DIASPORA_DESCRIPTION,
    url,
    datePublished: NRI_DIASPORA_DATE_PUBLISHED,
    dateModified: NRI_DIASPORA_DATE_MODIFIED,
    author: {
      "@type": "Organization",
      name: "Bandham AI",
      url: SITE_ORIGIN,
    },
    publisher: {
      "@type": "Organization",
      name: "Bandham AI",
      url: SITE_ORIGIN,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

export function blogFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: NRI_DIASPORA_FAQS.map(function (item) {
      return {
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      };
    }),
  };
}

export function jsonLdScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export const BLOG_SUPPORT_PHONE = SUPPORT_PHONE_DISPLAY;
export const BLOG_SUPPORT_TEL = SUPPORT_PHONE_TEL;

export const BLOG_ASSISTANT_COPY =
  "Guidance without ghostwriting: Bandham assistant can coach and help with tickets. It does not write sendable messages. It does not search profiles (top search box only).";
