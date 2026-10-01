import { describe, expect, it } from "vitest";
import { type StoredRoom, disconnect, reconnect, sweep } from "./state";

const GRACE_MS = 60_000;

function roomWith(
  users: Array<{ disconnectedAt?: number; id: string }>
): StoredRoom {
  return {
    adminId: users[0]?.id ?? "",
    createdDate: "2026-01-01T00:00:00.000Z",
    expiresAt: Number.MAX_SAFE_INTEGER,
    status: "reserve",
    users: users.map((user) => ({
      createdDate: "2026-01-01T00:00:00.000Z",
      name: user.id,
      token: `${user.id}-token`,
      value: "",
      ...user,
    })),
  };
}

describe("disconnect", () => {
  it("marks the user when no other socket of theirs is open", () => {
    const next = disconnect(roomWith([{ id: "a" }]), "a", [], 1000);

    expect(next.users[0].disconnectedAt).toBe(1000);
  });

  it("leaves the user connected when another socket of theirs is open", () => {
    // 古いタブの close が、新しいタブの resume のあとに届いた。
    const next = disconnect(roomWith([{ id: "a" }]), "a", ["a"], 1000);

    expect(next.users[0].disconnectedAt).toBeUndefined();
  });

  it("clears a stale mark when another socket of theirs is open", () => {
    const room = roomWith([{ disconnectedAt: 500, id: "a" }]);
    const next = disconnect(room, "a", ["b", "a"], 1000);

    expect(next.users[0].disconnectedAt).toBeUndefined();
  });

  it("keeps the first disconnect time when a second socket closes", () => {
    const room = roomWith([{ disconnectedAt: 500, id: "a" }]);
    const next = disconnect(room, "a", [], 1000);

    expect(next.users[0].disconnectedAt).toBe(500);
  });

  it("does not touch other users", () => {
    const next = disconnect(roomWith([{ id: "a" }, { id: "b" }]), "a", [], 1);

    expect(next.users[1].disconnectedAt).toBeUndefined();
  });
});

describe("reconnect", () => {
  it("clears the disconnect mark", () => {
    const next = reconnect(roomWith([{ disconnectedAt: 1, id: "a" }]), "a");

    expect(next.users[0]).not.toHaveProperty("disconnectedAt");
  });
});

describe("sweep", () => {
  it("removes users whose grace period has passed", () => {
    const room = roomWith([{ id: "a" }, { disconnectedAt: 0, id: "b" }]);
    const next = sweep(room, ["a"], GRACE_MS, GRACE_MS);

    expect(next.users.map((user) => user.id)).toEqual(["a"]);
  });

  it("keeps users still inside the grace period", () => {
    const room = roomWith([{ disconnectedAt: 0, id: "a" }]);
    const next = sweep(room, [], GRACE_MS - 1, GRACE_MS);

    expect(next.users).toHaveLength(1);
  });

  it("keeps a marked user who still has an open socket", () => {
    const room = roomWith([{ disconnectedAt: 0, id: "a" }]);
    const next = sweep(room, ["a"], GRACE_MS * 2, GRACE_MS);

    expect(next.users).toHaveLength(1);
    expect(next.users[0].disconnectedAt).toBeUndefined();
  });

  it("hands the admin role to the oldest remaining user", () => {
    const room = roomWith([
      { disconnectedAt: 0, id: "a" },
      { id: "b" },
      { id: "c" },
    ]);
    const next = sweep(room, ["b", "c"], GRACE_MS, GRACE_MS);

    expect(next.adminId).toBe("b");
  });

  it("empties the admin when nobody is left", () => {
    const room = roomWith([{ disconnectedAt: 0, id: "a" }]);

    expect(sweep(room, [], GRACE_MS, GRACE_MS).adminId).toBe("");
  });
});
