import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import HomePage from "@/components/HomePage";
import { toLocale } from "@/i18n/routing";
import getMetadata from "@/libs/getMetadata";

export type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;

  return getMetadata({ locale: toLocale(locale), type: "website" });
}

export default async function Page({
  params,
}: PageProps): Promise<React.JSX.Element> {
  const { locale } = await params;

  setRequestLocale(locale);

  return <HomePage />;
}
