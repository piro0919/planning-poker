/**
 * クライアントと Worker の間で交わすメッセージの定義。
 * Next.js 側と Worker 側の両方から読むため、実行時の依存を持たせない。
 */

export type RoomStatus = "reserve" | "start" | "wait";

/** 場に配られる参加者。公開前は自分以外の value が空になり、hasVoted だけが立つ。 */
export type PublicUser = {
  createdDate: string;
  hasVoted: boolean;
  id: string;
  name: string;
  value: string;
};

export type PublicRoom = {
  adminId: string;
  status: RoomStatus;
  users: PublicUser[];
};

export type ClientMessage =
  | { type: "handOver"; userId: string }
  | { name: string; type: "join" }
  | { type: "leave" }
  | { token: string; type: "resume" }
  | { type: "reveal" }
  | { type: "start" }
  | { type: "vote"; value: string };

export type ServerMessage =
  | { message: string; type: "error" }
  | { room: PublicRoom; type: "state" }
  | { token: string; type: "joined"; userId: string }
  | { type: "notFound" }
  | { type: "resumeFailed" };

/**
 * 部屋の WebSocket に繋ぐ URL を組み立てる。
 * create を付けた接続だけが部屋を作れる。
 *
 * @param {string} origin Worker の起点。
 * @param {string} roomId 部屋の ID。
 * @param {boolean} create 部屋がなければ作るかどうか。
 * @return {string} 接続先の URL。
 */
export function roomSocketUrl(
  origin: string,
  roomId: string,
  create = false
): string {
  const url = new URL(`/rooms/${encodeURIComponent(roomId)}/ws`, origin);

  url.protocol = url.protocol === "http:" ? "ws:" : "wss:";

  if (create) {
    url.searchParams.set("create", "1");
  }

  return url.toString();
}
