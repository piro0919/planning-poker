/**
 * クライアントと Worker の間で交わすメッセージの定義。
 * Next.js 側と Worker 側の両方から読むため、実行時の依存を持たせない。
 * 形の確かめもここに置き、両側が同じ規則で読み書きする。
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

/** 場に出せる札。この中にない値は Worker が受け取らない。 */
export const DECK = [
  "0",
  "1/2",
  "1",
  "2",
  "3",
  "5",
  "8",
  "13",
  "20",
  "40",
  "100",
  "∞",
  "?",
] as const;

export type CardValue = (typeof DECK)[number];

/** 名前の長さの上限。コードポイントで数える。 */
export const NAME_MAX_LENGTH = 32;

/** 受け取る ID や合言葉の長さの上限。UUID が収まれば足りる。 */
const ID_MAX_LENGTH = 64;
/** 名前として届く文字列の上限。これを超えるものは読む前に捨てる。 */
const RAW_NAME_MAX_LENGTH = 1024;

export type ClientMessage =
  | { type: "handOver"; userId: string }
  | { name: string; type: "join" }
  | { type: "leave" }
  | { token: string; type: "resume" }
  | { type: "reveal" }
  | { type: "start" }
  | { type: "vote"; value: CardValue };

/** 画面の言葉はクライアントが持つ。Worker は理由の種類だけを返す。 */
export const ERROR_CODES = [
  "adminOnly",
  "alreadyJoined",
  "invalidMessage",
  "nameEmpty",
  "nameTooLong",
  "notJoined",
  "notStarted",
  "unknown",
  "userGone",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export type ServerMessage =
  | { code: ErrorCode; type: "error" }
  | { room: PublicRoom; type: "state" }
  | { token: string; type: "joined"; userId: string }
  | { type: "notFound" }
  | { type: "resumeFailed" };

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= ID_MAX_LENGTH
  );
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * 札として出せる値かどうか。
 *
 * @param {unknown} value 調べる値。
 * @return {boolean} 札にある値なら true。
 */
export function isCardValue(value: unknown): value is CardValue {
  return (DECK as readonly unknown[]).includes(value);
}

/**
 * 名前を整えて長さを確かめる。
 *
 * @param {string} name 入力された名前。
 * @return {object} 整えた名前か、受け取れない理由。
 */
export function normalizeName(
  name: string
): { code: "nameEmpty" | "nameTooLong" } | { name: string } {
  const trimmed = name.trim();

  if (!trimmed) {
    return { code: "nameEmpty" };
  }

  if (Array.from(trimmed).length > NAME_MAX_LENGTH) {
    return { code: "nameTooLong" };
  }

  return { name: trimmed };
}

/**
 * クライアントから届いた文字列を読む。形が合わなければ undefined を返す。
 * 札は DECK にあるものだけを通す。名前の長さは理由を返せるよう join の処理で確かめる。
 *
 * @param {string} raw 届いた文字列。
 * @return {ClientMessage | undefined} 読めたメッセージ。
 */
export function parseClientMessage(raw: string): ClientMessage | undefined {
  const data = parseJson(raw);

  if (!isRecord(data)) {
    return undefined;
  }

  const { name, token, type, userId, value } = data;

  switch (type) {
    case "handOver":
      return isId(userId) ? { type, userId } : undefined;
    case "join":
      return typeof name === "string" && name.length <= RAW_NAME_MAX_LENGTH
        ? { name, type }
        : undefined;
    case "leave":
      return { type };
    case "resume":
      return isId(token) ? { token, type } : undefined;
    case "reveal":
      return { type };
    case "start":
      return { type };
    case "vote":
      return isCardValue(value) ? { type, value } : undefined;
    default:
      return undefined;
  }
}

function isPublicUser(value: unknown): value is PublicUser {
  return (
    isRecord(value) &&
    typeof value.createdDate === "string" &&
    typeof value.hasVoted === "boolean" &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.value === "string"
  );
}

function isPublicRoom(value: unknown): value is PublicRoom {
  return (
    isRecord(value) &&
    typeof value.adminId === "string" &&
    (value.status === "reserve" ||
      value.status === "start" ||
      value.status === "wait") &&
    Array.isArray(value.users) &&
    value.users.every(isPublicUser)
  );
}

function isErrorCode(value: unknown): value is ErrorCode {
  return (ERROR_CODES as readonly unknown[]).includes(value);
}

/**
 * Worker から届いた文字列を読む。形が合わなければ undefined を返す。
 *
 * @param {string} raw 届いた文字列。
 * @return {ServerMessage | undefined} 読めたメッセージ。
 */
export function parseServerMessage(raw: string): ServerMessage | undefined {
  const data = parseJson(raw);

  if (!isRecord(data)) {
    return undefined;
  }

  const { code, room, token, type, userId } = data;

  switch (type) {
    case "error":
      // 知らない理由は「不明」として出す。古い Worker は code を持たない。
      return { type, code: isErrorCode(code) ? code : "unknown" };
    case "joined":
      return typeof token === "string" && typeof userId === "string"
        ? { token, type, userId }
        : undefined;
    case "notFound":
      return { type };
    case "resumeFailed":
      return { type };
    case "state":
      return isPublicRoom(room) ? { room, type } : undefined;
    default:
      return undefined;
  }
}

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
