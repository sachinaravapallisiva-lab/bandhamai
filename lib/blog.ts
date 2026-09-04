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
  "Looking for Indian matrimony built for NRI and diaspora life in the US, UK, Australia, Europe, and Ireland? Here’s what matters, and how Bandham AI helps you find your vibe match.";
export const NRI_DIASPORA_DATE_PUBLISHED = "2026-09-04";
export const NRI_DIASPORA_DATE_LABEL = "4 September 2026";
export const NRI_DIASPORA_KICKER = "NRI AND DIASPORA";

export type BlogFaq = {
  question: string;
  answer: string;
};

export const NRI_DIASPORA_FAQS: BlogFaq[] = [
  {
    question: "Is Bandham AI a dating app?",
    answer: "No. Indian matrimony for NRI and diaspora.",
  },
  {
    question: "Is it free?",
    answer:
      "Browse, search, Speed Match, and creating a profile stay free. Messaging is $9.99 a month.",
  },
  {
    question: "Where is Bandham focused?",
    answer: "US, Australia, UK, Europe, and Ireland.",
  },
  {
    question: "What is VerifyAI?",
    answer: "Separate $4.99 one time verification that the person is who they say they are.",
  },
];

export const BLOG_POSTS = [
  {
    slug: NRI_DIASPORA_SLUG,
    path: NRI_DIASPORA_PATH,
    title: NRI_DIASPORA_TITLE,
    description: NRI_DIASPORA_DESCRIPTION,
    datePublished: NRI_DIASPORA_DATE_PUBLISHED,
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
    dateModified: NRI_DIASPORA_DATE_PUBLISHED,
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
