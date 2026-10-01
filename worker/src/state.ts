/**
 * 部屋の状態の移り変わり。Durable Object にも WebSocket にも触らない。
 * 試験から直接呼べるよう、ここには純粋な関数だけを置く。
 */
import type { RoomStatus } from "../../src/libs/protocol";

export type StoredUser = {
  createdDate: string;
  /** 切れた時刻。猶予のあいだは席を残しておく。 */
  disconnectedAt?: number;
  id: string;
  name: string;
  /** 同じ人として戻ってくるための合言葉。本人以外には配らない。 */
  token: string;
  value: string;
};

export type StoredRoom = {
  adminId: string;
  createdDate: string;
  expiresAt: number;
  status: RoomStatus;
  users: StoredUser[];
};

/**
 * 一本の接続が切れたときの状態。
 * 同じ人の接続がほかに生きていれば、切れたことにはしない。
 * 古いタブの close が resume のあとに届いたり、同じ合言葉で二つのタブを
 * 開いていたりしても、繋がっている人の席が猶予切れで消えないようにする。
 *
 * @param {StoredRoom} room いまの部屋。
 * @param {string} userId 切れた接続の持ち主。
 * @param {string[]} liveUserIds 切れた接続を除く、生きている接続の持ち主。
 * @param {number} now いまの時刻。
 * @return {StoredRoom} 次の部屋。
 */
export function disconnect(
  room: StoredRoom,
  userId: string,
  liveUserIds: readonly string[],
  now: number
): StoredRoom {
  if (liveUserIds.includes(userId)) {
    return reconnect(room, userId);
  }

  return {
    ...room,
    users: room.users.map((user) =>
      user.id === userId && user.disconnectedAt === undefined
        ? { ...user, disconnectedAt: now }
        : user
    ),
  };
}

/**
 * 同じ人が戻ってきたときの状態。切れた印を消す。
 *
 * @param {StoredRoom} room いまの部屋。
 * @param {string} userId 戻ってきた人。
 * @return {StoredRoom} 次の部屋。
 */
export function reconnect(room: StoredRoom, userId: string): StoredRoom {
  return {
    ...room,
    users: room.users.map((user) =>
      user.id === userId ? withoutDisconnectedAt(user) : user
    ),
  };
}

function withoutDisconnectedAt(user: StoredUser): StoredUser {
  if (user.disconnectedAt === undefined) {
    return user;
  }

  const { disconnectedAt: _, ...rest } = user;

  return rest;
}

/**
 * 猶予を過ぎて戻ってこなかった人の席を空ける。
 * 生きている接続を持つ人は、印が残っていても消さない。
 *
 * @param {StoredRoom} room いまの部屋。
 * @param {string[]} liveUserIds 生きている接続の持ち主。
 * @param {number} now いまの時刻。
 * @param {number} graceMs 猶予。
 * @return {StoredRoom} 次の部屋。
 */
export function sweep(
  room: StoredRoom,
  liveUserIds: readonly string[],
  now: number,
  graceMs: number
): StoredRoom {
  const users = room.users
    .filter(
      (user) =>
        liveUserIds.includes(user.id) ||
        user.disconnectedAt === undefined ||
        user.disconnectedAt + graceMs > now
    )
    .map((user) =>
      liveUserIds.includes(user.id) ? withoutDisconnectedAt(user) : user
    );

  return {
    ...room,
    users,
    // 管理者が消えたら、いちばん古くからいる人に引き継ぐ。
    adminId: users.some((user) => user.id === room.adminId)
      ? room.adminId
      : users[0]?.id ?? "",
  };
}
