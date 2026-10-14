import { type Browser, type Page, expect } from "@playwright/test";

/**
 * 名前を聞かれたら答えて入室する。
 *
 * @param {Page} page 部屋の画面。
 * @param {string} name 名乗る名前。
 */
export async function enterName(page: Page, name: string): Promise<void> {
  await page.getByRole("textbox").fill(name);
  await page.getByRole("button", { name: "OK" }).click();
  await expect(page.getByText("あなた")).toBeVisible();
}

/**
 * トップから部屋を作り、管理者として入室する。
 *
 * @param {Page} page トップの画面。
 * @param {string} name 名乗る名前。
 * @return {Promise<string>} 部屋の URL。
 */
export async function createRoom(page: Page, name: string): Promise<string> {
  await page.goto("/ja");
  await page.getByRole("button", { name: "新しい部屋を作成" }).click();
  await page.waitForURL(/\/rooms\//);
  await enterName(page, name);

  return page.url();
}

/**
 * 別のブラウザで同じ部屋に入る。席の合言葉は sessionStorage にあるので、文脈を分ければ別の人になる。
 *
 * @param {Browser} browser ブラウザ。
 * @param {string} url 部屋の URL。
 * @param {string} name 名乗る名前。
 * @return {Promise<Page>} 入室した画面。
 */
export async function joinRoom(
  browser: Browser,
  url: string,
  name: string
): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(url);
  await enterName(page, name);

  return page;
}

/**
 * 手札から札を出す。札は重ねて並べてあり、真ん中は隣の札に隠れるので、見えている左上を押す。
 *
 * @param {Page} page 部屋の画面。
 * @param {string} value 出す札。
 */
export async function pickCard(page: Page, value: string): Promise<void> {
  await page
    .getByRole("button", { exact: true, name: value })
    .click({ position: { x: 12, y: 24 } });
}
