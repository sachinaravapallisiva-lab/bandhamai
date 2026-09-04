import type { MetadataRoute } from "next";
import { BLOG_PATH, siteUrl } from "../lib/blog";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", BLOG_PATH, BLOG_PATH + "/"],
    },
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl("/").replace(/^https?:\/\//, ""),
  };
}
