import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import HomePage from "@/components/HomePage";
import { toLocale } from "@/i18n/routing";
import getMetadata from "@/libs/getMetadata";

export type PageProps = {
  params: { locale: string };
};

export async function generateMetadata({
  params: { locale },
}: PageProps): Promise<Metadata> {
  return getMetadata({ locale: toLocale(locale), type: "website" });
}

export default function Page({ params: { locale } }: PageProps): JSX.Element {
  setRequestLocale(locale);

  return <HomePage />;
}
