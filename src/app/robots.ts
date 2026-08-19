import type { MetadataRoute } from "next";

const SITE_URL = "https://planning-poker.kkweb.io";

export default function robots(): MetadataRoute.Robots {
  return {
    host: SITE_URL,
    rules: { allow: "/", disallow: ["/api/", "/rooms/"], userAgent: "*" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
