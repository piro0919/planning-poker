import type { MetadataRoute } from "next";

const SITE_URL = "https://planning-poker.kkweb.io";

// 部屋は都度作られて短命なので載せない。
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      changeFrequency: "monthly",
      lastModified: new Date(),
      priority: 1,
      url: SITE_URL,
    },
  ];
}
