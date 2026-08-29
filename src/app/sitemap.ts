import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const SITE_URL = "https://planning-poker.kkweb.io";
const url = (locale: string): string =>
  `${SITE_URL}${locale === routing.defaultLocale ? "" : `/${locale}`}`;

// 部屋は都度作られて短命なので載せない。
export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.map((locale) => ({
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((available) => [available, url(available)])
      ),
    },
    changeFrequency: "monthly",
    lastModified: new Date(),
    priority: 1,
    url: url(locale),
  }));
}
