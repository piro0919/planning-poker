/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

// next-pwa のころと同じく、ビルドの成果物を先に取っておき、ほかは既定の方針で持つ。
// 部屋の中身は WebSocket で届くので、ここでは扱わない。
const serwist = new Serwist({
  clientsClaim: true,
  navigationPreload: true,
  precacheEntries: self.__SW_MANIFEST,
  runtimeCaching: defaultCache,
  skipWaiting: true,
});

serwist.addEventListeners();
