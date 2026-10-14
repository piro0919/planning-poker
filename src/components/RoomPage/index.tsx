"use client";
import usePrevious from "@react-hook/previous";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Room, { RoomProps } from "@/components/Room";
import useRoomSocket, { UseRoomSocketParams } from "@/hooks/useRoomSocket";
import { useRouter } from "@/i18n/navigation";
import { takeRoomCreated } from "@/libs/createRoom";
import { DECK, NAME_MAX_LENGTH, normalizeName } from "@/libs/protocol";

const MySwal = withReactContent(Swal);

export type RoomPageProps = {
  roomId: string;
};

export default function RoomPage({ roomId }: RoomPageProps): React.JSX.Element {
  const router = useRouter();
  const t = useTranslations("Room");
  const [create] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return takeRoomCreated(roomId);
  });
  const handleError = useCallback<NonNullable<UseRoomSocketParams["onError"]>>(
    (code) => {
      toast.error(t(`errors.${code}`));
    },
    [t]
  );
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
  } = useRoomSocket({ create, roomId, onError: handleError });
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
      DECK.map((value) => ({
        value,
        onSelect: (): void => {
          vote(value);
        },
      })),
    [vote]
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
      toast.success(t("connected"));

      return;
    }

    toast.error(t("disconnected"));
  }, [connected, prevConnected, t]);

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
        inputAttributes: { maxlength: String(NAME_MAX_LENGTH) },
        inputValidator: (value) => {
          const normalized = normalizeName(value);

          if (!("code" in normalized)) {
            return null;
          }

          return normalized.code === "nameEmpty"
            ? t("nameRequired")
            : t("nameTooLong", { max: NAME_MAX_LENGTH });
        },
        titleText: t("namePrompt"),
      });

      if (typeof value !== "string") {
        return;
      }

      join(value);
    };

    // eslint-disable-next-line no-void
    void callback();
  }, [join, phase, t]);

  useEffect(
    () => (): void => {
      MySwal.close();
    },
    []
  );

  useEffect(() => {
    if (!userId || !prevUsers) {
      return;
    }

    // 入った人と抜けた人は別々に数える。同じ回に両方が起きても取りこぼさない。
    const others = (list: RoomProps["users"]): RoomProps["users"] =>
      list.filter(({ id }) => userId !== id);
    const missingFrom = (
      list: RoomProps["users"],
      from: RoomProps["users"]
    ): RoomProps["users"] =>
      others(list).filter(({ id }) => !from.some((user) => user.id === id));

    missingFrom(users, prevUsers).forEach(({ name }) => {
      toast.success(t("joined", { name }));
    });
    missingFrom(prevUsers, users).forEach(({ name }) => {
      toast.success(t("left", { name }));
    });
  }, [prevUsers, t, userId, users]);

  const prevStatus = usePrevious(room.status);

  useEffect(() => {
    // 状態が変わったときだけ知らせる。入室や繋ぎ直しで同じ状態を受け取っても黙る。
    if (!userId || prevStatus === undefined || prevStatus === room.status) {
      return;
    }

    if (room.status === "start") {
      toast.success(t("started"));

      return;
    }

    if (room.status === "wait") {
      toast.success(t("revealed"));
    }
  }, [prevStatus, room.status, t, userId]);

  return (
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
  );
}
