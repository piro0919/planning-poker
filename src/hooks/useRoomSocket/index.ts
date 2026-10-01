"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ClientMessage,
  ErrorCode,
  PublicRoom,
  isCardValue,
  parseServerMessage,
  roomSocketUrl,
} from "@/libs/protocol";

export type UseRoomSocketParams = {
  create: boolean;
  /** Worker に断られたときに呼ばれる。 */
  onError?: (code: ErrorCode) => void;
  roomId: string;
};

export type RoomPhase = "connecting" | "joined" | "naming" | "notFound";

export type RoomSocketData = {
  connected: boolean;
  handOver: (userId: string) => void;
  join: (name: string) => void;
  leave: () => void;
  phase: RoomPhase;
  reveal: () => void;
  room: PublicRoom;
  start: () => void;
  userId: string;
  vote: (value: string) => void;
};

const EMPTY_ROOM: PublicRoom = {
  adminId: "",
  status: "reserve",
  users: [],
};
/** 同じ人として戻るための合言葉を、この鍵で持っておく。 */
const SESSION_PREFIX = "room-session:";
const MAX_RETRY_MS = 10000;

export default function useRoomSocket({
  create,
  onError,
  roomId,
}: UseRoomSocketParams): RoomSocketData {
  const socketRef = useRef<WebSocket | undefined>(undefined);
  // 呼び出し側が毎回新しい関数を渡しても、繋ぎ直さずに最新を呼ぶ。
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const [room, setRoom] = useState<PublicRoom>(EMPTY_ROOM);
  const [userId, setUserId] = useState("");
  const [phase, setPhase] = useState<RoomPhase>("connecting");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const origin = process.env.NEXT_PUBLIC_ROOM_ORIGIN;

    if (!origin || !roomId) {
      return;
    }

    const sessionKey = `${SESSION_PREFIX}${roomId}`;

    let closedByUs = false;
    let retryCount = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const connect = (first: boolean): void => {
      const socket = new WebSocket(
        roomSocketUrl(origin, roomId, first && create)
      );

      socketRef.current = socket;

      socket.addEventListener("open", () => {
        retryCount = 0;

        setConnected(true);

        const token = window.sessionStorage.getItem(sessionKey);

        if (token) {
          socket.send(JSON.stringify({ token, type: "resume" }));

          return;
        }

        setPhase("naming");
      });

      socket.addEventListener("message", ({ data }) => {
        const message = parseServerMessage(String(data));

        if (!message) {
          // 読めない電文は捨てる。次の state で場は揃う。
          return;
        }

        switch (message.type) {
          case "joined":
            window.sessionStorage.setItem(sessionKey, message.token);
            setUserId(message.userId);
            setPhase("joined");

            break;
          case "notFound":
            setPhase("notFound");

            break;
          case "resumeFailed":
            // 猶予を過ぎて席が消えていた。名前から入り直す。
            window.sessionStorage.removeItem(sessionKey);
            setUserId("");
            setPhase("naming");

            break;
          case "state":
            setRoom(message.room);

            break;
          case "error":
            onErrorRef.current?.(message.code);

            break;
        }
      });

      socket.addEventListener("close", () => {
        setConnected(false);

        if (closedByUs) {
          return;
        }

        // 落ちたら間を空けて繋ぎ直す。合言葉があれば同じ席に戻る。
        const delay = Math.min(1000 * 2 ** retryCount, MAX_RETRY_MS);

        retryCount += 1;
        timer = setTimeout(() => connect(false), delay);
      });
    };

    connect(true);

    return (): void => {
      closedByUs = true;

      clearTimeout(timer);

      socketRef.current?.close();
      socketRef.current = undefined;
    };
    // 部屋ごとに一度だけ繋ぐ。create は初回の接続でしか使わない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const send = useCallback((message: ClientMessage) => {
    const socket = socketRef.current;

    if (socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify(message));
  }, []);
  const join = useCallback(
    (name: string) => send({ name, type: "join" }),
    [send]
  );
  const vote = useCallback(
    (value: string) => {
      // 札にない値は Worker が断る。送る前に落としておく。
      if (!isCardValue(value)) {
        return;
      }

      send({ value, type: "vote" });
    },
    [send]
  );
  const start = useCallback(() => send({ type: "start" }), [send]);
  const reveal = useCallback(() => send({ type: "reveal" }), [send]);
  const handOver = useCallback(
    (targetId: string) => send({ type: "handOver", userId: targetId }),
    [send]
  );
  const leave = useCallback(() => {
    send({ type: "leave" });

    window.sessionStorage.removeItem(`${SESSION_PREFIX}${roomId}`);
  }, [roomId, send]);

  return {
    connected,
    handOver,
    join,
    leave,
    phase,
    reveal,
    room,
    start,
    userId,
    vote,
  };
}
