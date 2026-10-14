import { defineConfig, devices } from "@playwright/test";

/**
 * ブラウザを動かして、部屋を作ってから札を公開するまでの流れを確かめる。
 * 本番と同じ作りで見るため、画面はビルドしてから起動し、部屋は手元の Worker（wrangler dev）に置く。
 */
const PORT = 3310;
const WORKER_PORT = 8790;
const baseURL = `http://localhost:${PORT}`;
const workerURL = `http://localhost:${WORKER_PORT}`;

export default defineConfig({
  forbidOnly: !!process.env.CI,
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // 2 人目が入ると Board の札が「開始する」に重なっていた（2026-10-14）。
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  reporter: process.env.CI ? "github" : "list",
  retries: process.env.CI ? 1 : 0,
  testDir: "./e2e",
  use: { baseURL, locale: "ja-JP", trace: "retain-on-failure" },
  webServer: [
    {
      command: `npx wrangler dev --config worker/wrangler.jsonc --port ${WORKER_PORT} --var ALLOWED_ORIGINS:${baseURL}`,
      // Worker は WebSocket 以外に 426 を返すので、URL ではなく口が開いたかで待つ。
      port: WORKER_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `npm run build && npx next start -p ${PORT}`,
      env: { NEXT_DIST_DIR: ".next-e2e", NEXT_PUBLIC_ROOM_ORIGIN: workerURL },
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      url: `${baseURL}/ja`,
    },
  ],
  // 部屋を作る人と入る人を同時に動かすので、ひとつずつ回す。
  workers: 1,
});
