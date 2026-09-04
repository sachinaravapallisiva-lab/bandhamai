import type { Metadata } from "next";
import Link from "next/link";
import {
  BLOG_ASSISTANT_COPY,
  BLOG_PATH,
  BLOG_SUPPORT_PHONE,
  BLOG_SUPPORT_TEL,
  NRI_DIASPORA_DATE_LABEL,
  NRI_DIASPORA_DESCRIPTION,
  NRI_DIASPORA_FAQS,
  NRI_DIASPORA_FIT,
  NRI_DIASPORA_FIT_HEADING,
  NRI_DIASPORA_KICKER,
  NRI_DIASPORA_NEED_HEADING,
  NRI_DIASPORA_NEEDS,
  NRI_DIASPORA_OPENING,
  NRI_DIASPORA_PATH,
  NRI_DIASPORA_START_HEADING,
  NRI_DIASPORA_STEPS,
  NRI_DIASPORA_TITLE,
  NRI_DIASPORA_UPDATED_LABEL,
  NRI_DIASPORA_VALUES,
  NRI_DIASPORA_VALUES_HEADING,
  blogArticleJsonLd,
  blogFaqJsonLd,
  jsonLdScript,
  siteUrl,
} from "../../../lib/blog";
import { INK, LINE, MUTED, VIOLET } from "../../../lib/theme";
import AppChrome, { ChromeLink } from "../../components/AppChrome";

export const metadata: Metadata = {
  title: NRI_DIASPORA_TITLE,
  description: NRI_DIASPORA_DESCRIPTION,
  alternates: {
    canonical: siteUrl(NRI_DIASPORA_PATH),
  },
  openGraph: {
    title: NRI_DIASPORA_TITLE,
    description: NRI_DIASPORA_DESCRIPTION,
    url: siteUrl(NRI_DIASPORA_PATH),
    type: "article",
    siteName: "Bandham AI",
  },
  robots: {
    index: true,
    follow: true,
  },
};

function ArticleCta({
  href,
  children,
  primary,
}: {
  href: string;
  children: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={primary ? "bm-sans bm-talk bm-focus" : "bm-sans bm-ghost bm-focus"}
      style={{
        display: "inline-block",
        background: primary ? VIOLET : "transparent",
        color: primary ? "#FFFFFF" : VIOLET,
        border: primary ? "1px solid " + VIOLET : "1px solid " + LINE,
        borderRadius: 999,
        padding: "10px 16px",
        fontSize: 13,
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

export default function NriDiasporaArticlePage() {
  return (
    <AppChrome right={<ChromeLink href={BLOG_PATH}>Back to blog</ChromeLink>}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(blogArticleJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(blogFaqJsonLd()) }} />

      <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 10px" }}>
        {NRI_DIASPORA_KICKER}
      </p>
      <p className="bm-sans" style={{ margin: "0 0 6px", fontSize: 12.5, color: MUTED }}>
        {NRI_DIASPORA_DATE_LABEL}
      </p>
      <p className="bm-sans" style={{ margin: "0 0 22px", fontSize: 12.5, color: MUTED }}>
        {NRI_DIASPORA_UPDATED_LABEL}
      </p>

      <article
        className="bm-card"
        style={{
          background: "#FFFFFF",
          border: "1px solid " + LINE,
          borderRadius: 14,
          padding: "22px 18px",
        }}
      >
        <h1 className="bm-serif" style={{ margin: "0 0 14px", fontSize: 28, fontWeight: 400, color: INK, lineHeight: 1.25 }}>
          {NRI_DIASPORA_TITLE}
        </h1>
        <div className="bm-sans" style={{ fontSize: 14, lineHeight: 1.6, color: INK }}>
          {NRI_DIASPORA_OPENING.map(function (para, index) {
            return (
              <p key={para} style={{ margin: index === NRI_DIASPORA_OPENING.length - 1 ? "0 0 22px" : "0 0 14px" }}>
                {para}
              </p>
            );
          })}

          <h2 className="bm-serif" style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 400, color: INK }}>
            {NRI_DIASPORA_VALUES_HEADING}
          </h2>
          {NRI_DIASPORA_VALUES.map(function (para, index) {
            return (
              <p key={para} style={{ margin: index === NRI_DIASPORA_VALUES.length - 1 ? "0 0 22px" : "0 0 10px" }}>
                {para}
              </p>
            );
          })}

          <h2 className="bm-serif" style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 400, color: INK }}>
            {NRI_DIASPORA_NEED_HEADING}
          </h2>
          <ol style={{ margin: "0 0 22px", paddingLeft: 20 }}>
            {NRI_DIASPORA_NEEDS.map(function (item) {
              return (
                <li key={item} style={{ marginBottom: 8 }}>
                  {item}
                </li>
              );
            })}
          </ol>

          <h2 className="bm-serif" style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 400, color: INK }}>
            {NRI_DIASPORA_FIT_HEADING}
          </h2>
          {NRI_DIASPORA_FIT.map(function (para) {
            return (
              <p key={para} style={{ margin: "0 0 10px" }}>
                {para}
              </p>
            );
          })}
          <p style={{ margin: "0 0 22px" }}>{BLOG_ASSISTANT_COPY}</p>

          <h2 className="bm-serif" style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 400, color: INK }}>
            {NRI_DIASPORA_START_HEADING}
          </h2>
          <ol style={{ margin: "0 0 16px", paddingLeft: 20 }}>
            {NRI_DIASPORA_STEPS.map(function (item) {
              return (
                <li key={item} style={{ marginBottom: 8 }}>
                  {item}
                </li>
              );
            })}
          </ol>
          <p
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              margin: "0 0 12px",
            }}
          >
            <ArticleCta href="/signup" primary>
              Create a profile
            </ArticleCta>
            <ArticleCta href="/">Browse</ArticleCta>
            <ArticleCta href="/plans">Plans</ArticleCta>
          </p>
          <p style={{ margin: "0 0 22px", fontSize: 14, color: MUTED }}>
            Support:{" "}
            <a href={BLOG_SUPPORT_TEL} className="bm-focus" style={{ color: VIOLET, fontWeight: 600, textDecoration: "none" }}>
              {BLOG_SUPPORT_PHONE}
            </a>
          </p>

          <h2 className="bm-serif" style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 400, color: INK }}>
            FAQ
          </h2>
          {NRI_DIASPORA_FAQS.map(function (item) {
            return (
              <section key={item.question} style={{ marginBottom: 16 }}>
                <h3 className="bm-serif" style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 400, color: INK }}>
                  {item.question}
                </h3>
                <p style={{ margin: 0 }}>{item.answer}</p>
              </section>
            );
          })}
        </div>
      </article>
    </AppChrome>
  );
}
