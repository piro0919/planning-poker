import { DurableObject } from "cloudflare:workers";
import type {
  ClientMessage,
  PublicRoom,
  PublicUser,
  RoomStatus,
  ServerMessage,
} from "../../src/libs/protocol";

// Env と Room は互いを参照する。型のうえだけの循環なので実害はない。
/* eslint-disable no-use-before-define */
export type Env = {
  ALLOWED_ORIGINS: string;
  /** 猶予の既定を上書きする。試験のためだけに使う。 */
  GRACE_MS?: string;
  ROOM: DurableObjectNamespace<Room>;
};
/* eslint-enable no-use-before-define */

type StoredUser = {
  createdDate: string;
  /** 切れた時刻。猶予のあいだは席を残しておく。 */
  disconnectedAt?: number;
  id: string;
  name: string;
  /** 同じ人として戻ってくるための合言葉。本人以外には配らない。 */
  token: string;
  value: string;
};

type StoredRoom = {
  adminId: string;
  createdDate: string;
  expiresAt: number;
  status: RoomStatus;
  users: StoredUser[];
};

type Attachment = {
  userId: string;
};

/** 部屋を最後に触ってから、この時間で消える。 */
const ROOM_TTL_MS = 2 * 24 * 60 * 60 * 1000;
/** 回線が切れてから、席を空けるまでの猶予。 */
const DEFAULT_GRACE_MS = 60 * 1000;
const ROOM_KEY = "room";

export class Room extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected websocket", { status: 426 });
    }

    const shouldCreate =
      new URL(request.url).searchParams.get("create") === "1";
    const room = await this.load();

    if (!room && !shouldCreate) {
      return this.acceptAndClose({ type: "notFound" });
    }

    if (!room) {
      await this.persist(
        this.touch({
          adminId: "",
          createdDate: new Date().toISOString(),
          expiresAt: 0,
          status: "reserve",
          users: [],
        })
      );
    }

    const { 0: client, 1: server } = new WebSocketPair();

    this.ctx.acceptWebSocket(server);

    // 入室前でも場は見える。名前を出すまでは観戦者と同じ扱いになる。
    this.send(server, { room: await this.publicRoom(""), type: "state" });

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(
    ws: WebSocket,
    message: ArrayBuffer | string
  ): Promise<void> {
    if (typeof message !== "string") {
      return;
    }

    let parsed: ClientMessage;

    try {
      parsed = JSON.parse(message) as ClientMessage;
    } catch {
      this.send(ws, { message: "不正なメッセージです", type: "error" });

      return;
    }

    const room = await this.load();

    if (!room) {
      this.send(ws, { type: "notFound" });

      return;
    }

    switch (parsed.type) {
      case "handOver":
        await this.handOver(ws, room, parsed.userId);

        break;
      case "join":
        await this.join(ws, room, parsed.name);

        break;
      case "leave":
        await this.leave(ws, room);

        break;
      case "resume":
        await this.resume(ws, room, parsed.token);

        break;
      case "reveal":
        await this.setStatus(ws, room, "wait");

        break;
      case "start":
        await this.setStatus(ws, room, "start");

        break;
      case "vote":
        await this.vote(ws, room, parsed.value);

        break;
      default:
        this.send(ws, { message: "不明なメッセージです", type: "error" });
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    await this.markDisconnected(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.markDisconnected(ws);
  }

  async alarm(): Promise<void> {
    const room = await this.load();

    if (!room) {
      return;
    }

    const now = Date.now();

    if (room.expiresAt <= now) {
      for (const ws of this.ctx.getWebSockets()) {
        ws.close(1001, "room expired");
      }

      await this.ctx.storage.deleteAll();

      return;
    }

    // 猶予を過ぎて戻ってこなかった人の席を空ける。部屋の寿命は延ばさない。
    const users = room.users.filter(
      (user) => !user.disconnectedAt || user.disconnectedAt + this.graceMs > now
    );

    if (users.length === room.users.length) {
      await this.persist(room);

      return;
    }

    await this.persist({
      ...room,
      users,
      adminId: users.some((user) => user.id === room.adminId)
        ? room.adminId
        : users[0]?.id ?? "",
    });

    await this.broadcast();
  }

  private get graceMs(): number {
    return Number(this.env.GRACE_MS) || DEFAULT_GRACE_MS;
  }

  private async join(
    ws: WebSocket,
    room: StoredRoom,
    name: string
  ): Promise<void> {
    const trimmed = name.trim();

    if (!trimmed) {
      this.send(ws, { message: "お名前が空です", type: "error" });

      return;
    }

    if (this.userIdOf(ws)) {
      this.send(ws, { message: "すでに入室しています", type: "error" });

      return;
    }

    const user: StoredUser = {
      createdDate: new Date().toISOString(),
      id: crypto.randomUUID(),
      name: trimmed,
      token: crypto.randomUUID(),
      value: "",
    };

    ws.serializeAttachment({ userId: user.id } satisfies Attachment);

    // 最初に入った人が管理者になる。部屋を作った本人がそのまま管理者になる。
    await this.persist(
      this.touch({
        ...room,
        adminId: room.adminId || user.id,
        users: [...room.users, user],
      })
    );

    this.send(ws, { token: user.token, type: "joined", userId: user.id });

    await this.broadcast();
  }

  private async resume(
    ws: WebSocket,
    room: StoredRoom,
    token: string
  ): Promise<void> {
    const user = room.users.find((candidate) => candidate.token === token);

    if (!user) {
      this.send(ws, { type: "resumeFailed" });

      return;
    }

    ws.serializeAttachment({ userId: user.id } satisfies Attachment);

    await this.persist(
      this.touch({
        ...room,
        users: room.users.map((candidate) =>
          candidate.id === user.id
            ? { ...candidate, disconnectedAt: undefined }
            : candidate
        ),
      })
    );

    this.send(ws, { token: user.token, type: "joined", userId: user.id });

    await this.broadcast();
  }

  private async vote(
    ws: WebSocket,
    room: StoredRoom,
    value: string
  ): Promise<void> {
    const userId = this.userIdOf(ws);

    if (!userId) {
      this.send(ws, { message: "入室していません", type: "error" });

      return;
    }

    if (room.status !== "start") {
      this.send(ws, { message: "まだ開始していません", type: "error" });

      return;
    }

    const users = room.users.map((user) =>
      user.id === userId ? { ...user, value } : user
    );
    // 全員が出し終わったら、その場で公開する。誰かが押す必要はない。
    const status: RoomStatus = users.every((user) => user.value)
      ? "wait"
      : "start";

    await this.persist(this.touch({ ...room, status, users }));

    await this.broadcast();
  }

  private async setStatus(
    ws: WebSocket,
    room: StoredRoom,
    status: RoomStatus
  ): Promise<void> {
    if (!this.assertAdmin(ws, room)) {
      return;
    }

    await this.persist(
      this.touch({
        ...room,
        status,
        // 開始のたびに前回の票を捨てる。
        users:
          status === "start"
            ? room.users.map((user) => ({ ...user, value: "" }))
            : room.users,
      })
    );

    await this.broadcast();
  }

  private async handOver(
    ws: WebSocket,
    room: StoredRoom,
    userId: string
  ): Promise<void> {
    if (!this.assertAdmin(ws, room)) {
      return;
    }

    if (!room.users.some((user) => user.id === userId)) {
      this.send(ws, { message: "その人はもういません", type: "error" });

      return;
    }

    await this.persist(this.touch({ ...room, adminId: userId }));

    await this.broadcast();
  }

  // 退出ボタン。猶予を待たずに席を空ける。
  private async leave(ws: WebSocket, room: StoredRoom): Promise<void> {
    const userId = this.userIdOf(ws);

    if (!userId) {
      return;
    }

    ws.serializeAttachment(null);

    const users = room.users.filter((user) => user.id !== userId);

    await this.persist(
      this.touch({
        ...room,
        users,
        // 管理者が抜けたら、いちばん古くからいる人に引き継ぐ。
        adminId: room.adminId === userId ? users[0]?.id ?? "" : room.adminId,
      })
    );

    await this.broadcast();
  }

  // 回線が切れただけ。席は猶予のあいだ残す。
  private async markDisconnected(ws: WebSocket): Promise<void> {
    const userId = this.userIdOf(ws);
    const room = await this.load();

    if (!userId || !room) {
      return;
    }

    await this.persist({
      ...room,
      users: room.users.map((user) =>
        user.id === userId ? { ...user, disconnectedAt: Date.now() } : user
      ),
    });
  }

  private assertAdmin(ws: WebSocket, room: StoredRoom): boolean {
    if (this.userIdOf(ws) === room.adminId) {
      return true;
    }

    this.send(ws, { message: "管理者だけができます", type: "error" });

    return false;
  }

  private userIdOf(ws: WebSocket): string {
    const attachment = ws.deserializeAttachment() as Attachment | null;

    return attachment?.userId ?? "";
  }

  private async load(): Promise<StoredRoom | undefined> {
    return await this.ctx.storage.get<StoredRoom>(ROOM_KEY);
  }

  // 誰かが触ったしるし。放置された部屋だけが消える。
  private touch(room: StoredRoom): StoredRoom {
    return { ...room, expiresAt: Date.now() + ROOM_TTL_MS };
  }

  private async persist(room: StoredRoom): Promise<void> {
    await this.ctx.storage.put(ROOM_KEY, room);

    // 部屋の寿命と、切れた人の猶予。近いほうでアラームを張り直す。
    const deadlines = [
      room.expiresAt,
      ...room.users
        .filter((user) => user.disconnectedAt)
        .map((user) => (user.disconnectedAt ?? 0) + this.graceMs),
    ];

    await this.ctx.storage.setAlarm(Math.min(...deadlines));
  }

  // 公開前は、自分以外の value を伏せて hasVoted だけを見せる。
  private async publicRoom(viewerId: string): Promise<PublicRoom> {
    const room = await this.load();

    if (!room) {
      return { adminId: "", status: "reserve", users: [] };
    }

    const users = room.users.map<PublicUser>((user) => {
      const hidden = room.status === "start" && user.id !== viewerId;

      return {
        createdDate: user.createdDate,
        hasVoted: !!user.value,
        id: user.id,
        name: user.name,
        value: hidden ? "" : user.value,
      };
    });

    return { users, adminId: room.adminId, status: room.status };
  }

  private async broadcast(): Promise<void> {
    for (const ws of this.ctx.getWebSockets()) {
      this.send(ws, {
        room: await this.publicRoom(this.userIdOf(ws)),
        type: "state",
      });
    }
  }

  private send(ws: WebSocket, message: ServerMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch {
      // 閉じかけの接続に送っただけ。切断側の処理に任せる。
    }
  }

  private acceptAndClose(message: ServerMessage): Response {
    const { 0: client, 1: server } = new WebSocketPair();

    server.accept();
    server.send(JSON.stringify(message));
    server.close(1000, "room not found");

    return new Response(null, { status: 101, webSocket: client });
  }
}

const ROOM_PATH = /^\/rooms\/([^/]+)\/ws$/;
const REGEXP_CHARS = /[.+?^${}()|[\]\\]/g;

// ALLOWED_ORIGINS の各項目は * を含められる。Vercel の Preview は
// デプロイごとに URL が変わるため、そこだけを * で受ける。
function matchesOrigin(origin: string, pattern: string): boolean {
  if (!pattern.includes("*")) {
    return pattern === origin;
  }

  const source = pattern
    .split("*")
    .map((part) => part.replace(REGEXP_CHARS, "\\$&"))
    .join("[^/]*");

  return new RegExp(`^${source}$`).test(origin);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const allowed = env.ALLOWED_ORIGINS.split(",").map((value) => value.trim());

    if (origin && !allowed.some((pattern) => matchesOrigin(origin, pattern))) {
      return new Response("forbidden origin", { status: 403 });
    }

    const matched = ROOM_PATH.exec(new URL(request.url).pathname);

    if (!matched) {
      return new Response("not found", { status: 404 });
    }

    const roomId = decodeURIComponent(matched[1]);
    const id = env.ROOM.idFromName(roomId);

    return await env.ROOM.get(id).fetch(request);
  },
} satisfies ExportedHandler<Env>;
