// eslint-disable-next-line filenames/match-exported
"use client";
// eslint-disable-next-line camelcase
import { M_PLUS_Rounded_1c } from "@next/font/google";
import axios from "axios";
import { connectFirestoreEmulator } from "firebase/firestore";
import { ReactNode, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import "ress/dist/ress.min.css";
// eslint-disable-next-line postcss-modules/no-unused-class
import "./globals.scss";
import "libs/app";
import db from "libs/db";

if (process.env.NODE_ENV === "development") {
  connectFirestoreEmulator(db, "localhost", 8080);
}

const mPLUSRounded1C = M_PLUS_Rounded_1c({
  subsets: ["latin"],
  weight: "400",
});

export type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  useEffect(() => {
    const callback = async (): Promise<void> => {
      if (process.env.NODE_ENV !== "development") {
        return;
      }

      await axios.post("/api/emulator");
    };

    // eslint-disable-next-line no-void
    void callback();
  }, []);

  return (
    <html>
      <head />
      <body className={mPLUSRounded1C.className}>
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
      </body>
    </html>
  );
}
