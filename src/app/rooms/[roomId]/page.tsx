"use client";
import usePrevious from "@react-hook/previous";
import axios, { AxiosResponse } from "axios";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useEventListener } from "usehooks-ts";
import Room, { RoomProps } from "components/Room";
import db from "libs/db";
import { PostData, PostParams } from "pages/api/rooms/[roomId]/users";

const MySwal = withReactContent(Swal);

export type PageProps = {
  params: { roomId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function Page({ params: { roomId } }: PageProps): JSX.Element {
  const [userId, setUserId] = useState<RoomProps["userId"]>("");
  const [isAdmin, setIsAdmin] = useState<RoomProps["isAdmin"]>(false);
  const [users, setUsers] = useState<RoomProps["users"]>([]);
  const prevUsers = usePrevious(users);
  const router = useRouter();
  const handleLeave = useCallback<RoomProps["onLeave"]>(() => {
    router.push("/");
  }, [router]);
  const handleStart = useCallback<RoomProps["onStart"]>(async () => {
    const myPromise = axios.put(`/api/rooms/${roomId}/status`, {
      status: "start",
    });

    await toast.promise(myPromise, {
      error: "開始に失敗しました…",
      loading: "開始中です…",
      success: "開始しました",
    });
  }, [roomId]);
  const [status, setStatus] = useState<RoomProps["status"]>("");
  const cards = useMemo<RoomProps["cards"]>(
    () =>
      [
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
      ].map((fibonacci) => ({
        label: fibonacci,
        onSelect: async (): Promise<void> => {
          const myPromise = axios.put(
            `/api/rooms/${roomId}/users/${userId}/card`,
            {
              card: fibonacci,
            }
          );

          await toast.promise(myPromise, {
            error: "投票に失敗しました…",
            loading: "投票中です…",
            success: "投票しました",
          });

          if (
            users.filter(({ id }) => userId !== id).some(({ card }) => !card)
          ) {
            return;
          }

          await axios.put(`/api/rooms/${roomId}/status`, {
            status: "wait",
          });
        },
      })),
    [roomId, userId, users]
  );
  const handleStop = useCallback<RoomProps["onStop"]>(async () => {
    await axios.put(`/api/rooms/${roomId}/status`, {
      status: "wait",
    });
  }, [roomId]);

  useEffect(() => {
    setIsAdmin(!!sessionStorage.getItem("is-admin"));

    return () => {
      sessionStorage.removeItem("isAdmin");
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line no-void
    void MySwal.fire({
      allowOutsideClick: false,
      icon: "question",
      input: "text",
      inputValidator: (value) => (value ? null : "お名前が入力されていません"),
      titleText: "お名前を入力してください",
    }).then(async ({ value }) => {
      if (typeof value !== "string") {
        return;
      }

      const myPromise = axios.post<
        PostData,
        AxiosResponse<PostData>,
        PostParams
      >(`/api/rooms/${roomId}/users`, {
        card: "",
        isAdmin: !!sessionStorage.getItem("is-admin"),
        name: value,
      });
      const {
        data: { id },
      } = await toast.promise(myPromise, {
        error: "入室に失敗しました…",
        loading: "入室中です…",
        success: "入室しました",
      });

      setUserId(id);
    });

    return () => {
      MySwal.close();
    };
  }, [roomId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "rooms", roomId, "users"),
      (snapshot) => {
        let users: {
          card: string;
          id: string;
          isAdmin: boolean;
          name: string;
        }[] = [];

        snapshot.forEach((result) => {
          const { card, isAdmin, name } = result.data();
          const id = result.id;

          users = [
            ...users,
            {
              id,
              card: card as string,
              isAdmin: isAdmin as boolean,
              name: name as string,
            },
          ];
        });

        setUsers(users);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  useEffect(() => {
    if (!userId || !prevUsers || users.length === prevUsers.length) {
      return;
    }

    const isEnter = users.length - prevUsers.length > 0;

    if (isEnter) {
      users
        .filter(({ id }) => userId !== id)
        .filter(({ id }) => !prevUsers.some(({ id: prevId }) => id === prevId))
        .forEach(({ name }) => {
          toast.success(`${name}さんが入室しました`);
        });

      return;
    }

    prevUsers
      .filter(({ id }) => userId !== id)
      .filter(({ id: prevId }) => !users.some(({ id }) => prevId === id))
      .forEach(({ name }) => {
        toast(`${name}さんが退室しました`);
      });
  }, [prevUsers, userId, users]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "rooms", roomId), (doc) => {
      if (!doc.exists()) {
        router.push("/404");

        return;
      }

      const data = doc.data();

      setStatus(data?.status as string);
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, router]);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  useEffect(() => {
    if (!userId) {
      return;
    }

    return async () => {
      const myPromise = users.filter(({ id }) => userId !== id).length
        ? axios.delete(`/api/rooms/${roomId}/users/${userId}`)
        : axios.delete(`/api/rooms/${roomId}`);

      await toast.promise(myPromise, {
        error: "退室に失敗しました…",
        loading: "退室中です…",
        success: "退室しました",
      });
    };
  }, [roomId, userId, users]);

  useEffect(() => {
    const callback = async (): Promise<void> => {
      if (status !== "start") {
        return;
      }

      await axios.put(`/api/rooms/${roomId}/users/${userId}/card`, {
        card: "",
      });
    };

    // eslint-disable-next-line no-void
    void callback();
  }, [roomId, status, userId]);

  useEffect(() => {
    if (status !== "wait") {
      return;
    }

    toast.success("公開しました");
  }, [status]);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  useEventListener("beforeunload", async (e) => {
    e.preventDefault();

    if (!users.filter(({ id }) => userId !== id).length) {
      await axios.delete(`/api/rooms/${roomId}`);

      return;
    }

    if (!userId) {
      return;
    }

    await axios.delete(`/api/rooms/${roomId}/users/${userId}`);
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  useEffect(() => {
    if (userId) {
      return;
    }

    return async () => {
      await axios.delete(`/api/rooms/${roomId}/users/${userId}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <Room
      cards={cards}
      isAdmin={isAdmin}
      onLeave={handleLeave}
      onStart={handleStart}
      onStop={handleStop}
      status={status}
      userId={userId}
      users={users}
    />
  );
}
