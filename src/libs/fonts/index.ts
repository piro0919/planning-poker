import localFont from "next/font/local";

// Google からビルド時に取りに行くと、その経路が詰まっただけでビルドが落ちる。
// ラテンの部分だけをリポジトリに置いて、自前で配る。

export const courgette = localFont({
  display: "swap",
  src: "./courgette-latin.woff2",
  weight: "400",
});

export const mPlusRounded1c = localFont({
  display: "swap",
  src: "./m-plus-rounded-1c-latin.woff2",
  weight: "400",
});
