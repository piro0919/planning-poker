import { expect, test } from "@playwright/test";
// 「投票中」「公開中」の表示はスマホの幅では隠れる。状態は「締め切る」の有無と、場の札の数字で見る。
import { createRoom, joinRoom, pickCard } from "./room";

test("全員が出し終わると、その場で公開される", async ({ browser, page }) => {
  const url = await createRoom(page, "Alice");
  const bob = await joinRoom(browser, url, "Bob");

  await expect(page.getByText("Bobさん", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "開始する" }).click();
  await expect(page.getByRole("button", { name: "締め切る" })).toBeVisible();
  await pickCard(page, "5");
  await pickCard(bob, "3");

  await expect(
    page.getByRole("listitem").filter({ hasText: "あなた" })
  ).toContainText("5");
  await expect(
    page.getByRole("listitem").filter({ hasText: "Bobさん" })
  ).toContainText("3");
});

test("まだ出していない人が抜けると、残りの票で公開される", async ({
  browser,
  page,
}) => {
  const url = await createRoom(page, "Alice");
  const bob = await joinRoom(browser, url, "Bob");
  const carol = await joinRoom(browser, url, "Carol");

  await expect(page.getByText("Carolさん", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "開始する" }).click();
  await expect(page.getByRole("button", { name: "締め切る" })).toBeVisible();
  await pickCard(page, "5");
  await pickCard(bob, "3");

  await expect(page.getByRole("button", { name: "締め切る" })).toBeVisible();

  await carol.getByRole("button", { name: "退出する" }).click();

  await expect(
    page.getByRole("listitem").filter({ hasText: "あなた" })
  ).toContainText("5");
  await expect(page.getByText("Carolさん", { exact: true })).toHaveCount(0);
});

test("自分が先頭で、残りは新しく入った順に並ぶ", async ({ browser, page }) => {
  const url = await createRoom(page, "Alice");

  await joinRoom(browser, url, "Bob");
  await joinRoom(browser, url, "Carol");

  await expect(page.getByText("Carolさん", { exact: true })).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveText([
    /あなた/,
    /Carolさん/,
    /Bobさん/,
  ]);
});

test("札はキーボードで選べ、選んでも画面がずれない", async ({
  browser,
  page,
}) => {
  const url = await createRoom(page, "Alice");

  await joinRoom(browser, url, "Bob");
  await page.getByRole("button", { name: "開始する" }).click();
  await expect(page.getByRole("button", { name: "締め切る" })).toBeVisible();

  const card = page.getByRole("button", { exact: true, name: "8" });

  await card.focus();
  await page.keyboard.press("Enter");

  await expect(card).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => document.scrollingElement?.scrollTop)).toBe(
    0
  );
});

test("繋ぎ直しても、開始の知らせを出し直さない", async ({ browser, page }) => {
  const url = await createRoom(page, "Alice");
  const bob = await joinRoom(browser, url, "Bob");

  await page.getByRole("button", { name: "開始する" }).click();
  await expect(page.getByRole("button", { name: "締め切る" })).toBeVisible();
  await expect(bob.getByText("開始しました")).toBeVisible();

  await bob.reload();

  // 繋がった知らせと同じ時に出るはずなので、それを待ってから確かめる。
  await expect(bob.getByText("接続が戻りました")).toBeVisible();
  await expect(bob.getByText("開始しました")).toHaveCount(0);
});
