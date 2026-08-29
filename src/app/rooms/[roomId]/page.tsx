"use client";
import usePrevious from "@react-hook/previous";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Room, { RoomProps } from "@/components/Room";
import Seo from "@/components/Seo";
import useFibonacci from "@/hooks/useFibonacci";
import useRoomSocket from "@/hooks/useRoomSocket";

const MySwal = withReactContent(Swal);
/** 部屋を作った本人だけが、この印を持って最初の接続に来る。 */
const CREATE_KEY = "create-room";

export type PageProps = {
  params: { roomId: string };
};

export default function Page({ params: { roomId } }: PageProps): JSX.Element {
  const router = useRouter();
  const { fibonacci } = useFibonacci();
  const [create] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const created = window.sessionStorage.getItem(CREATE_KEY) === roomId;

    window.sessionStorage.removeItem(CREATE_KEY);

    return created;
  });
  const {
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
  } = useRoomSocket({ create, roomId });
  const users = useMemo<RoomProps["users"]>(
    () =>
      room.users.map(({ createdDate, hasVoted, id, name, value }) => ({
        createdDate,
        hasVoted,
        id,
        name,
        value,
        onClick: (): void => {
          handOver(id);
        },
      })),
    [handOver, room.users]
  );
  const prevUsers = usePrevious(users);
  const cards = useMemo<RoomProps["cards"]>(
    () =>
      fibonacci.map((value) => ({
        value,
        onSelect: (): void => {
          vote(value);
        },
      })),
    [fibonacci, vote]
  );
  const selectedValue = useMemo<RoomProps["selectedValue"]>(
    () => users.find(({ id }) => userId === id)?.value || "",
    [userId, users]
  );
  const handleStart = useCallback<RoomProps["onStart"]>(() => {
    start();
  }, [start]);
  const handleStop = useCallback<RoomProps["onStop"]>(() => {
    reveal();
  }, [reveal]);
  const handleLeave = useCallback<RoomProps["onLeave"]>(() => {
    leave();

    router.push("/");
  }, [leave, router]);
  const asked = useRef(false);
  const prevConnected = usePrevious(connected);

  useEffect(() => {
    if (phase !== "notFound") {
      return;
    }

    router.push("/404");
  }, [phase, router]);

  useEffect(() => {
    if (prevConnected === undefined || prevConnected === connected) {
      return;
    }

    if (connected) {
      toast.success("接続が戻りました");

      return;
    }

    toast.error("接続が切れました。繋ぎ直しています…");
  }, [connected, prevConnected]);

  useEffect(() => {
    if (phase !== "naming") {
      asked.current = false;

      return;
    }

    if (asked.current) {
      return;
    }

    asked.current = true;

    const callback = async (): Promise<void> => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { value } = await MySwal.fire({
        allowOutsideClick: false,
        icon: "question",
        input: "text",
        inputValidator: (value) =>
          value ? null : "お名前が入力されていません",
        titleText: "お名前を入力してください",
      });

      if (typeof value !== "string") {
        return;
      }

      join(value);
    };

    // eslint-disable-next-line no-void
    void callback();
  }, [join, phase]);

  useEffect(
    () => () => {
      MySwal.close();
    },
    []
  );

  useEffect(() => {
    if (!userId || !prevUsers) {
      return;
    }

    const isEnter = users.length - prevUsers.length > 0;
    const { usersA, usersB } = isEnter
      ? { usersA: users, usersB: prevUsers }
      : { usersA: prevUsers, usersB: users };

    usersA
      .filter(({ id }) => userId !== id)
      .filter(({ id }) => !usersB.some(({ id: prevId }) => id === prevId))
      .forEach(({ name }) => {
        toast.success(`${name}さんが${isEnter ? "入室" : "退室"}しました`);
      });
  }, [prevUsers, userId, users]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    if (room.status === "start") {
      toast.success("開始しました");

      return;
    }

    if (room.status === "wait") {
      toast.success("公開しました");
    }
  }, [room.status, userId]);

  return (
    <>
      <Seo nofollow={true} noindex={true} />
      <Room
        adminUserId={room.adminId}
        cards={cards}
        onLeave={handleLeave}
        onStart={handleStart}
        onStop={handleStop}
        selectedValue={selectedValue}
        status={room.status}
        userId={userId}
        users={users}
      />
    </>
  );
}
