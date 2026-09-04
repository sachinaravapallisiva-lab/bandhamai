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
  NRI_DIASPORA_KICKER,
  NRI_DIASPORA_PATH,
  NRI_DIASPORA_TITLE,
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
      <p className="bm-sans" style={{ margin: "0 0 22px", fontSize: 12.5, color: MUTED }}>
        {NRI_DIASPORA_DATE_LABEL}
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
          <p style={{ margin: "0 0 14px" }}>
            If you grew up between cultures, or you live outside India now, classic matrimony sites can feel built for
            someone else. Time zones, relocation, family expectations, and whether someone is serious all hit harder when
            home is Houston, London, Sydney, Dublin, or Berlin.
          </p>
          <p style={{ margin: "0 0 22px" }}>
            Bandham AI is Indian matrimony for NRI and diaspora. Tagline: Find your vibe match? Not a dating app. Built
            for people who want a real match, not endless swipes.
          </p>

          <h2 className="bm-serif" style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 400, color: INK }}>
            What NRI and diaspora searchers actually need
          </h2>
          <ol style={{ margin: "0 0 22px", paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>
              Profiles that travel: partner open to your city, or clear about moving.
            </li>
            <li style={{ marginBottom: 8 }}>
              Intent that is marriage minded: matrimony framing, not casual dating chrome.
            </li>
            <li style={{ marginBottom: 8 }}>Browse without paying first: see if the pool fits before messaging.</li>
            <li style={{ marginBottom: 8 }}>Trust signals: optional verification when you are ready to meet.</li>
            <li style={{ marginBottom: 8 }}>A calm place to talk: messaging when you choose, not noise.</li>
          </ol>

          <h2 className="bm-serif" style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 400, color: INK }}>
            Why Bandham AI fits that search
          </h2>
          <p style={{ margin: "0 0 10px" }}>
            Browse and search stay free. Create a profile, search, and try Speed Match without a paywall. Messaging is
            $9.99 a month when you are ready to talk.
          </p>
          <p style={{ margin: "0 0 10px" }}>Built for diaspora markets: US, Australia, UK, Europe, and Ireland.</p>
          <p style={{ margin: "0 0 10px" }}>
            VerifyAI when trust matters: separate $4.99 one time check that the person is who they say they are.
          </p>
          <p style={{ margin: "0 0 10px" }}>{BLOG_ASSISTANT_COPY}</p>
          <p style={{ margin: "0 0 22px" }}>
            Speed Match for a quick read: tap answers, short timer, skip any question.
          </p>

          <h2 className="bm-serif" style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 400, color: INK }}>
            How to get started
          </h2>
          <ol style={{ margin: "0 0 16px", paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>Create your profile so the right people can find you.</li>
            <li style={{ marginBottom: 8 }}>
              Browse and search for your vibe match. Use Speed Match when you want a fast filter.
            </li>
            <li style={{ marginBottom: 8 }}>
              Subscribe when you want messaging. Add VerifyAI when you want an identity check.
            </li>
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
