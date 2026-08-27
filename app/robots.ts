import type { MetadataRoute } from "next";
import { SITE } from "@/lib/data";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Next's static export writes an index.txt (the raw RSC flight
        // payload) beside every index.html. They are machine artefacts that
        // duplicate the page text, so they must never be crawled as content.
        disallow: "/*index.txt$",
      },
      // AI search crawlers: explicitly welcomed so the guides stay citable in
      // ChatGPT Search, Perplexity and Claude. See /llms.txt for the site map.
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "Claude-User",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
        ],
        allow: "/",
      },
    ],
    sitemap: `${SITE.domain}/sitemap.xml`,
  };
}
