// eslint-disable-next-line filenames/match-exported
import "@szhsin/react-menu/dist/index.css";
import "@szhsin/react-menu/dist/transitions/slide.css";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Toaster } from "react-hot-toast";
import "ress/dist/ress.min.css";
import "../globals.scss";
import "../mq-settings.scss";
import { routing, toLocale } from "@/i18n/routing";
import { mPlusRounded1c } from "@/libs/fonts";
import getMetadata from "@/libs/getMetadata";

export function generateStaticParams(): { locale: string }[] {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return getMetadata({ locale: toLocale(locale), type: "website" });
}

export default function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}): JSX.Element {
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <head>
        <meta
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
          name="viewport"
        />
        <link href="/manifest.json" rel="manifest" />
        <link href="/logo192.png" rel="apple-touch-icon" />
      </head>
      <body className={mPlusRounded1c.className}>
        <script />
        <NextIntlClientProvider>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: "#1a73e8",
                color: "#fff",
              },
            }}
          />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
