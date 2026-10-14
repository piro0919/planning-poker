import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import ja from "../../messages/ja.json";
import { ERROR_CODES } from "../libs/protocol";

const LOCALES = [
  ["en", en],
  ["ja", ja],
] as const;

/**
 * 文言のファイルを、キーの道筋と値の組に平たくする。
 *
 * @param {unknown} value 平たくする値。
 * @param {string[]} path ここまでのキーの道筋。
 * @return {Array} キーの道筋と値の組。
 */
function flatten(value: unknown, path: string[] = []): [string, unknown][] {
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      flatten(child, [...path, key])
    );
  }

  return [[path.join("."), value]];
}

function keysOf(messages: unknown): string[] {
  return flatten(messages)
    .map(([key]) => key)
    .sort();
}

// {name} や {max} のような差し込み口の名前を集める。
function placeholdersOf(value: unknown): string[] {
  const names: string[] = String(value).match(/\{\w+/g) ?? [];

  return names.map((name) => name.slice(1)).sort();
}

describe("messages", () => {
  // 書きかけの空の文言が、画面にそのまま出ないようにする。
  it.each(LOCALES)("%s のすべての文言が空でない文字列である", (_, messages) => {
    const entries = flatten(messages);
    const blank = entries.filter(
      ([, value]) => typeof value !== "string" || !value.trim()
    );

    expect(entries.length).toBeGreaterThan(0);
    expect(blank.map(([key]) => key)).toEqual([]);
  });

  // 片方の言語にだけある文言を作らない。
  it("英語と日本語のキーがそろっている", () => {
    expect(keysOf(ja)).toEqual(keysOf(en));
  });

  // 片方の言語でだけ名前が出ない、といったずれを作らない。
  it("英語と日本語で差し込み口がそろっている", () => {
    const jaEntries = new Map(flatten(ja));
    const mismatched = flatten(en).filter(
      ([key, value]) =>
        placeholdersOf(value).join() !==
        placeholdersOf(jaEntries.get(key)).join()
    );

    expect(mismatched.map(([key]) => key)).toEqual([]);
  });

  // 英語の画面に和文の記号や文字が混ざらないようにする。
  // 言語の切り替えは、切り替えた先の言葉で書く。日本語に切り替えるなら日本語で出す。
  it("英語の文言に全角の文字が無い", () => {
    const wide = flatten(en).filter(
      ([key, value]) =>
        key !== "Ui.switchLocale" &&
        /[\u3000-\u30ff\u4e00-\u9fff\uff00-\uffef]/.test(String(value))
    );

    expect(wide.map(([key]) => key)).toEqual([]);
  });

  // Worker が返す理由ごとに、画面で出す言葉がある。
  it.each(LOCALES)("%s にすべてのエラーの文言がある", (_, messages) => {
    const errors: Record<string, unknown> = messages.Room.errors;

    expect(ERROR_CODES.filter((code) => !errors[code])).toEqual([]);
  });
});
