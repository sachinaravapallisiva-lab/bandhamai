import { readFileSync } from "node:fs";
import {
  BLOG_ASSISTANT_COPY,
  BLOG_INDEX_DESCRIPTION,
  BLOG_INDEX_LEDE,
  BLOG_INDEX_TITLE,
  BLOG_PATH,
  BLOG_POSTS,
  BLOG_SUPPORT_PHONE,
  NRI_DIASPORA_DATE_MODIFIED,
  NRI_DIASPORA_DATE_PUBLISHED,
  NRI_DIASPORA_DESCRIPTION,
  NRI_DIASPORA_FAQS,
  NRI_DIASPORA_FIT,
  NRI_DIASPORA_NEEDS,
  NRI_DIASPORA_OPENING,
  NRI_DIASPORA_PATH,
  NRI_DIASPORA_SLUG,
  NRI_DIASPORA_TITLE,
  NRI_DIASPORA_UPDATED_LABEL,
  NRI_DIASPORA_VALUES,
  blogArticleJsonLd,
  blogFaqJsonLd,
  jsonLdScript,
  siteUrl,
} from "../lib/blog.ts";
import { FOOTER_LINKS, SITE_ORIGIN, SUPPORT_PHONE_DISPLAY } from "../lib/site.ts";

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function read(path) {
  return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

const article = read("app/blog/indian-matrimony-for-nri-diaspora/page.tsx");
const index = read("app/blog/page.tsx");
const sitemap = read("app/sitemap.ts");
const robots = read("app/robots.ts");
const layout = read("app/layout.tsx");
const blogLib = read("lib/blog.ts");
const site = read("lib/site.ts");

assert(SITE_ORIGIN === "https://bandhamai.vercel.app", "production host lock");
assert(layout.includes("metadataBase"), "root layout sets metadataBase");
assert(layout.includes("SITE_ORIGIN"), "metadataBase uses shared origin");

assert(NRI_DIASPORA_SLUG === "indian-matrimony-for-nri-diaspora", "slug lock");
assert(NRI_DIASPORA_PATH === "/blog/indian-matrimony-for-nri-diaspora", "article path lock");
assert(
  NRI_DIASPORA_TITLE ===
    "Indian Matrimony for NRI and Diaspora: How to Find a Serious Match Abroad",
  "title lock",
);
assert(
  NRI_DIASPORA_DESCRIPTION.includes("NRI and diaspora life in the US, UK, Australia, Europe, and Ireland"),
  "description names markets",
);
assert(NRI_DIASPORA_DESCRIPTION.includes("find your vibe match"), "description keeps tagline");
assert(NRI_DIASPORA_DESCRIPTION.includes("Bandham AI"), "description names Bandham AI");
assert(NRI_DIASPORA_DATE_PUBLISHED === "2026-09-04", "publish date lock");
assert(NRI_DIASPORA_DATE_MODIFIED === "2026-09-04", "lastmod date lock");
assert(NRI_DIASPORA_UPDATED_LABEL.includes("4 September 2026"), "updated label");
assert(NRI_DIASPORA_DESCRIPTION.includes("desi with values"), "description names tone");

assert(BLOG_PATH === "/blog", "blog index path");
assert(BLOG_INDEX_TITLE === "Blog", "index title");
assert(BLOG_INDEX_LEDE.includes("Not a dating app"), "index says not a dating app");
assert(BLOG_INDEX_DESCRIPTION.includes("Find your vibe match?"), "index description keeps tagline");
assert(BLOG_POSTS.length === 1, "one live post");
assert(BLOG_POSTS[0].path === NRI_DIASPORA_PATH, "index lists the NRI article");

assert(article.includes("<article"), "semantic article");
assert(article.includes("<h1"), "article has h1");
assert(article.includes("<h2"), "article has h2");
assert(article.includes("application/ld+json"), "JSON-LD scripts");
assert(article.includes("blogArticleJsonLd"), "Article JSON-LD");
assert(article.includes("blogFaqJsonLd"), "FAQ JSON-LD");
assert(article.includes('href="/signup"'), "signup CTA");
assert(article.includes('href="/"'), "browse CTA");
assert(article.includes('href="/plans"'), "plans CTA");
assert(article.includes("BLOG_SUPPORT_PHONE") || article.includes(SUPPORT_PHONE_DISPLAY), "support number on article");
assert(article.includes("CREAM") || article.includes("bm-card") || article.includes("#FFFFFF"), "cream card look");
assert(article.includes("VIOLET") || article.includes("#6D28D9"), "violet CTAs");
assert(article.includes("canonical") || article.includes("alternates"), "canonical metadata");
assert(article.includes("openGraph"), "openGraph metadata");

assert(index.includes("BLOG_POSTS"), "index lists posts");
assert(index.includes(NRI_DIASPORA_PATH) || index.includes("post.path"), "index links the article");

assert(sitemap.includes("siteUrl") || sitemap.includes("SITE_ORIGIN") || sitemap.includes(SITE_ORIGIN), "sitemap uses production host");
assert(sitemap.includes("BLOG_POSTS") || sitemap.includes(NRI_DIASPORA_PATH), "sitemap includes the article");
assert(sitemap.includes('siteUrl("/")') || sitemap.includes(SITE_ORIGIN), "sitemap includes home");

assert(robots.includes("BLOG_PATH") || robots.includes("/blog"), "robots allows /blog");
assert(robots.includes("sitemap.xml"), "robots points at sitemap");
assert(!/disallow:\s*["']\/blog/i.test(robots), "robots must not disallow /blog");

assert(FOOTER_LINKS.some(function (item) {
  return item.href === BLOG_PATH && item.label === "Blog";
}), "footer links to Blog");

assert(BLOG_SUPPORT_PHONE === "+1 803 265 5233", "support number lock");
assert(siteUrl(NRI_DIASPORA_PATH) === SITE_ORIGIN + NRI_DIASPORA_PATH, "canonical URL");

const articleLd = blogArticleJsonLd();
assert(articleLd["@type"] === "BlogPosting", "BlogPosting type");
assert(articleLd.headline === NRI_DIASPORA_TITLE, "JSON-LD headline");
assert(articleLd.url === SITE_ORIGIN + NRI_DIASPORA_PATH, "JSON-LD url");
assert(articleLd.author.name === "Bandham AI", "JSON-LD author");
assert(articleLd.dateModified === NRI_DIASPORA_DATE_MODIFIED, "JSON-LD dateModified");
assert(articleLd.datePublished === NRI_DIASPORA_DATE_PUBLISHED, "JSON-LD datePublished");
assert(sitemap.includes("NRI_DIASPORA_DATE_MODIFIED") || sitemap.includes("dateModified"), "sitemap lastmod uses modified date");

const faqLd = blogFaqJsonLd();
assert(faqLd["@type"] === "FAQPage", "FAQPage type");
assert(faqLd.mainEntity.length === 4, "four FAQ items");
assert(NRI_DIASPORA_FAQS[0].answer.includes("Not a dating app") || NRI_DIASPORA_FAQS[0].answer.includes("Indian matrimony"), "FAQ not a dating app");
assert(NRI_DIASPORA_FAQS[1].answer.includes("$9.99"), "FAQ messaging price");
assert(NRI_DIASPORA_FAQS[1].answer.toLowerCase().includes("free"), "FAQ free browse");
assert(NRI_DIASPORA_FAQS[2].answer.includes("US") && NRI_DIASPORA_FAQS[2].answer.includes("Ireland"), "FAQ markets");
assert(NRI_DIASPORA_FAQS[3].answer.includes("$4.99"), "FAQ VerifyAI price");
assert(NRI_DIASPORA_FAQS[3].answer.includes("one time"), "FAQ VerifyAI one time");

const bodyCopy = [
  ...NRI_DIASPORA_OPENING,
  ...NRI_DIASPORA_VALUES,
  ...NRI_DIASPORA_NEEDS,
  ...NRI_DIASPORA_FIT,
].join("\n");

assert(NRI_DIASPORA_OPENING.length >= 3, "opening is a real lede");
assert(/two cultures/i.test(NRI_DIASPORA_OPENING.join(" ")), "opens with two cultures");
assert(/serious about marriage/i.test(NRI_DIASPORA_OPENING.join(" ")), "opens with serious intent");
assert(/chemistry/i.test(NRI_DIASPORA_OPENING.join(" ")), "opens with chemistry");
assert(/desi with values/i.test(NRI_DIASPORA_VALUES.join(" ")), "explains desi with values");
assert(/respect/i.test(NRI_DIASPORA_VALUES.join(" ")), "values includes respect");
assert(/intent/i.test(NRI_DIASPORA_VALUES.join(" ")), "values includes intent");
assert(/VerifyAI/.test(NRI_DIASPORA_VALUES.join(" ")), "values includes optional VerifyAI");
assert(/\$9\.99/.test(NRI_DIASPORA_VALUES.join(" ")), "values includes messaging when ready");
assert(bodyCopy.length > 2200, "article body is longer and richer");
assert(article.includes("NRI_DIASPORA_OPENING"), "article renders shared opening");
assert(article.includes("NRI_DIASPORA_VALUES"), "article renders shared values copy");
assert(article.includes("NRI_DIASPORA_UPDATED_LABEL"), "article shows updated date");

const userFacing = [
  NRI_DIASPORA_TITLE,
  NRI_DIASPORA_DESCRIPTION,
  BLOG_INDEX_DESCRIPTION,
  BLOG_INDEX_LEDE,
  bodyCopy,
  ...NRI_DIASPORA_FAQS.map(function (item) {
    return item.question + " " + item.answer;
  }),
  blogLib,
  article,
  index,
].join("\n");

assert(/Bandham AI/.test(userFacing), "names Bandham AI");
assert(!/Bandhamai|bandhamAI|\bBandhan\b/.test(userFacing.replace(/bandhamai\.vercel\.app/g, "")), "product name is two words");
assert(/Find your vibe match\?/.test(userFacing), "tagline with question mark");
assert(!/Find your vibe match(?!\?)/.test(userFacing), "locked tagline never drops the question mark");
assert(
  NRI_DIASPORA_VALUES.some(function (para) {
    return para.includes("Find your vibe match?");
  }),
  "values body keeps Sai tagline lock",
);
assert(/not a dating app/i.test(userFacing), "not a dating app");
assert(/US/.test(userFacing) && /Australia/.test(userFacing) && /UK/.test(userFacing) && /Europe/.test(userFacing) && /Ireland/.test(userFacing), "markets");
assert(/\$9\.99/.test(userFacing), "messaging price");
assert(/\$4\.99/.test(userFacing), "VerifyAI price");
assert(BLOG_ASSISTANT_COPY.includes("does not write sendable messages"), "assistant does not ghostwrite");
assert(BLOG_ASSISTANT_COPY.includes("does not search profiles"), "assistant does not search");
assert(article.includes("BLOG_ASSISTANT_COPY"), "article uses shared assistant copy");
assert(!/talk to (her |his |their )?parents|talking to parents/i.test(userFacing), "no parent talk pitch");
assert(!/#1|number one|best matrimony|millions of/i.test(userFacing), "no fake rank or scale");
assert(!/[—–]/.test(NRI_DIASPORA_DESCRIPTION), "description avoids dashes");
assert(!/[—–]/.test(NRI_DIASPORA_FAQS.map(function (item) { return item.answer; }).join("")), "FAQ answers avoid dashes");
assert(!/[—–]/.test(bodyCopy), "body avoids dashes");
assert(!/one-time/.test(userFacing), "VerifyAI copy says one time");

const ld = jsonLdScript(articleLd);
assert(ld.includes("BlogPosting"), "serialized BlogPosting");
assert(!ld.includes("<"), "JSON-LD escaped");

console.log("blog seo ok", {
  path: NRI_DIASPORA_PATH,
  origin: SITE_ORIGIN,
  faqs: NRI_DIASPORA_FAQS.length,
});
