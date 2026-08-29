import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { type Locale, routing } from "@/i18n/routing";

const SITE_URL = "https://planning-poker.kkweb.io";

export type GetMetadataParams = {
  index?: boolean;
  locale: Locale;
  path?: string;
  type?: "article" | "website";
};

// 英語は接頭辞なしが正。canonical と og:url で同じ URL を出す。
function href(locale: Locale, pathname: string): string {
  return `${SITE_URL}${
    locale === routing.defaultLocale ? "" : `/${locale}`
  }${pathname}`;
}

export default async function getMetadata({
  index = true,
  locale,
  path = "/",
  type = "website",
}: GetMetadataParams): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Site" });
  // トップの path は "/" で来る。そのまま繋ぐと /ja/ になり、実体の /ja へ
  // 308 で飛ぶ URL を canonical と hreflang が指してしまう。空に均す。
  const pathname = path === "/" ? "" : path;
  const url = href(locale, pathname);
  const title = t("title");
  const description = t("description");
  const image = {
    alt: title,
    height: 630,
    type: "image/png",
    url: `${SITE_URL}/ogp-${locale}.png`,
    width: 1200,
  };

  return {
    description,
    title,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(
          routing.locales.map((available) => [
            available,
            href(available, pathname),
          ])
        ),
        // 言語を選べない利用者に見せるのは既定の英語。
        "x-default": href(routing.defaultLocale, pathname),
      },
    },
    applicationName: title,
    metadataBase: new URL(SITE_URL),
    openGraph: {
      description,
      title,
      type,
      url,
      alternateLocale: locale === "en" ? "ja_JP" : "en_US",
      images: [image],
      locale: locale === "en" ? "en_US" : "ja_JP",
      siteName: title,
    },
    robots: {
      index,
      follow: index,
    },
    twitter: {
      description,
      title,
      card: "summary_large_image",
      images: [image],
    },
  };
}
