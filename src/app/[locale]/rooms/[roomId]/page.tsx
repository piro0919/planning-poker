import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import RoomPage from "@/components/RoomPage";
import { toLocale } from "@/i18n/routing";
import getMetadata from "@/libs/getMetadata";

export type PageProps = {
  params: Promise<{ locale: string; roomId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;

  // 部屋は短命で、中身も当事者だけのもの。検索には載せない。
  return getMetadata({ index: false, locale: toLocale(locale) });
}

export default async function Page({
  params,
}: PageProps): Promise<React.JSX.Element> {
  const { locale, roomId } = await params;

  setRequestLocale(locale);

  return <RoomPage roomId={roomId} />;
}
