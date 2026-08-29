import { type AbstractIntlMessages, hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import en from "../../messages/en.json";
import ja from "../../messages/ja.json";
import { routing } from "./routing";

// 動的な import にすると、本番のビルドで中身が空になる。数が少ないので直に読む。
const messagesByLocale: Record<string, AbstractIntlMessages> = { en, ja };

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: messagesByLocale[locale],
  };
});
