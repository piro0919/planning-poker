// eslint-disable-next-line filenames/match-exported
"use client";
import "@szhsin/react-menu/dist/index.css";
import "@szhsin/react-menu/dist/transitions/slide.css";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "react-hot-toast";
import "ress/dist/ress.min.css";
import "./globals.scss";
import "./mq-settings.scss";
import { mPlusRounded1c } from "@/libs/fonts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="ja">
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
        <Analytics />
      </body>
    </html>
  );
}
