"use client";
import { useLocale, useTranslations } from "next-intl";
import styles from "./style.module.scss";
import { usePathname, useRouter } from "@/i18n/navigation";

export default function LocaleSwitch(): JSX.Element {
  const locale = useLocale();
  // 読み上げ文字は切り替えた先の言葉で書く。今の言語のファイルに、
  // 切り替え先の言葉で入れてある。
  const t = useTranslations("Ui");
  const pathname = usePathname();
  const router = useRouter();
  const next = locale === "en" ? "ja" : "en";

  return (
    <button
      aria-label={t("switchLocale")}
      className={styles.button}
      onClick={(): void => {
        router.replace(pathname, { locale: next });
      }}
      type="button"
    >
      {next.toUpperCase()}
    </button>
  );
}
