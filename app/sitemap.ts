import type { MetadataRoute } from "next";
import { BLOG_PATH, BLOG_POSTS, NRI_DIASPORA_DATE_MODIFIED, siteUrl } from "../lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl("/"),
      lastModified: NRI_DIASPORA_DATE_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: siteUrl(BLOG_PATH),
      lastModified: NRI_DIASPORA_DATE_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...BLOG_POSTS.map(function (post) {
      return {
        url: siteUrl(post.path),
        lastModified: post.dateModified,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      };
    }),
  ];
}
