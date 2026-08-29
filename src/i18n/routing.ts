import { defineRouting } from "next-intl/routing";

// 既定は英語。日本語だけ /ja が付く。
export const routing = defineRouting({
  defaultLocale: "en",
  localePrefix: "as-needed",
  locales: ["en", "ja"],
});

/** 扱う言語。locales を直に書き写さず、ここから引く。 */
export type Locale = (typeof routing.locales)[number];

// 動的区画から来た文字列を言語として読む。
// レイアウトが hasLocale で弾いているので、実際にここまで来るのは正しい値だけ。
// それでも as で押し通さないのは、区画の名前を変えたときに黙って壊れないため。
export function toLocale(value: string): Locale {
  return routing.locales.includes(value as Locale)
    ? (value as Locale)
    : routing.defaultLocale;
}
