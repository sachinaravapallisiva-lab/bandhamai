import type { Metadata } from "next";
import Link from "next/link";
import {
  BLOG_INDEX_DESCRIPTION,
  BLOG_INDEX_KICKER,
  BLOG_INDEX_LEDE,
  BLOG_INDEX_TITLE,
  BLOG_PATH,
  BLOG_POSTS,
  siteUrl,
} from "../../lib/blog";
import { INK, LINE, MUTED, VIOLET } from "../../lib/theme";
import AppChrome, { ChromeLink } from "../components/AppChrome";

export const metadata: Metadata = {
  title: BLOG_INDEX_TITLE,
  description: BLOG_INDEX_DESCRIPTION,
  alternates: {
    canonical: siteUrl(BLOG_PATH),
  },
  openGraph: {
    title: BLOG_INDEX_TITLE,
    description: BLOG_INDEX_DESCRIPTION,
    url: siteUrl(BLOG_PATH),
    type: "website",
    siteName: "Bandham AI",
  },
};

export default function BlogIndexPage() {
  return (
    <AppChrome right={<ChromeLink href="/">Back to browse</ChromeLink>}>
      <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 10px" }}>
        {BLOG_INDEX_KICKER}
      </p>
      <h2 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 400 }}>
        {BLOG_INDEX_TITLE}
      </h2>
      <p className="bm-sans" style={{ margin: "0 0 22px", fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
        {BLOG_INDEX_LEDE}
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {BLOG_POSTS.map(function (post) {
          return (
            <li key={post.slug}>
              <Link
                href={post.path}
                className="bm-card bm-focus"
                style={{
                  display: "block",
                  background: "#FFFFFF",
                  border: "1px solid " + LINE,
                  borderRadius: 14,
                  padding: "22px 18px",
                  textDecoration: "none",
                  color: INK,
                }}
              >
                <p className="bm-sans" style={{ fontSize: 11, letterSpacing: ".16em", color: MUTED, margin: "0 0 10px" }}>
                  {post.kicker}
                </p>
                <h3 className="bm-serif" style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 400, color: VIOLET }}>
                  {post.title}
                </h3>
                <p className="bm-sans" style={{ margin: "0 0 10px", fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
                  {post.description}
                </p>
                <p className="bm-sans" style={{ margin: 0, fontSize: 12.5, color: MUTED }}>
                  {post.dateLabel}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </AppChrome>
  );
}
