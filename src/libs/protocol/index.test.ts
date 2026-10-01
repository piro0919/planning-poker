import { describe, expect, it } from "vitest";
import {
  DECK,
  NAME_MAX_LENGTH,
  normalizeName,
  parseClientMessage,
  parseServerMessage,
} from ".";

function raw(value: unknown): string {
  return JSON.stringify(value);
}

describe("parseClientMessage", () => {
  it("reads every well-formed message", () => {
    expect(parseClientMessage(raw({ name: "Ann", type: "join" }))).toEqual({
      name: "Ann",
      type: "join",
    });
    expect(parseClientMessage(raw({ type: "vote", value: "13" }))).toEqual({
      type: "vote",
      value: "13",
    });
    expect(parseClientMessage(raw({ type: "start" }))).toEqual({
      type: "start",
    });
    expect(parseClientMessage(raw({ token: "t", type: "resume" }))).toEqual({
      token: "t",
      type: "resume",
    });
  });

  it("accepts every card in the deck", () => {
    for (const value of DECK) {
      expect(parseClientMessage(raw({ value, type: "vote" }))).toEqual({
        value,
        type: "vote",
      });
    }
  });

  it("rejects a vote that is not in the deck", () => {
    expect(
      parseClientMessage(raw({ type: "vote", value: "7" }))
    ).toBeUndefined();
    expect(
      parseClientMessage(raw({ type: "vote", value: "" }))
    ).toBeUndefined();
    expect(
      parseClientMessage(raw({ type: "vote", value: 13 }))
    ).toBeUndefined();
  });

  it("rejects broken JSON, unknown types and wrong field types", () => {
    expect(parseClientMessage("{")).toBeUndefined();
    expect(parseClientMessage("null")).toBeUndefined();
    expect(parseClientMessage("[]")).toBeUndefined();
    expect(parseClientMessage(raw({ type: "kick" }))).toBeUndefined();
    expect(parseClientMessage(raw({ name: 1, type: "join" }))).toBeUndefined();
    expect(parseClientMessage(raw({ type: "handOver" }))).toBeUndefined();
    expect(
      parseClientMessage(
        JSON.stringify({ token: "x".repeat(65), type: "resume" })
      )
    ).toBeUndefined();
  });

  it("drops unknown fields", () => {
    expect(parseClientMessage(raw({ admin: true, type: "leave" }))).toEqual({
      type: "leave",
    });
  });
});

describe("normalizeName", () => {
  it("trims the name", () => {
    expect(normalizeName("  Ann  ")).toEqual({ name: "Ann" });
  });

  it("rejects an empty name", () => {
    expect(normalizeName("   ")).toEqual({ code: "nameEmpty" });
  });

  it("counts code points, not UTF-16 units", () => {
    expect(normalizeName("😀".repeat(NAME_MAX_LENGTH))).toEqual({
      name: "😀".repeat(NAME_MAX_LENGTH),
    });
    expect(normalizeName("a".repeat(NAME_MAX_LENGTH + 1))).toEqual({
      code: "nameTooLong",
    });
  });
});

describe("parseServerMessage", () => {
  it("reads an error with a known code", () => {
    expect(
      parseServerMessage(raw({ code: "adminOnly", type: "error" }))
    ).toEqual({
      code: "adminOnly",
      type: "error",
    });
  });

  it("treats an error from an older worker as unknown", () => {
    expect(parseServerMessage(raw({ message: "x", type: "error" }))).toEqual({
      code: "unknown",
      type: "error",
    });
  });

  it("reads a state message", () => {
    const room = {
      adminId: "a",
      status: "start",
      users: [
        { createdDate: "d", hasVoted: true, id: "a", name: "A", value: "" },
      ],
    };

    expect(parseServerMessage(JSON.stringify({ room, type: "state" }))).toEqual(
      { room, type: "state" }
    );
  });

  it("rejects malformed messages", () => {
    expect(parseServerMessage("not json")).toBeUndefined();
    expect(
      parseServerMessage(raw({ room: { status: "x" }, type: "state" }))
    ).toBeUndefined();
    expect(
      parseServerMessage(raw({ token: 1, type: "joined" }))
    ).toBeUndefined();
  });
});
