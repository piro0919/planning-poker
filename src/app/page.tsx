"use client";
import axios, { AxiosResponse } from "axios";
import copy from "copy-to-clipboard";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import toast from "react-hot-toast";
import Home, { HomeProps } from "components/Home";
import { PostData } from "pages/api/rooms";

export default function Page(): JSX.Element {
  const router = useRouter();
  const handleCreate = useCallback<HomeProps["onCreate"]>(async () => {
    sessionStorage.setItem("is-admin", "true");

    const myPromise = axios.post<PostData, AxiosResponse<PostData>>(
      "/api/rooms"
    );
    const {
      data: { id },
    } = await toast.promise(myPromise, {
      error: "新しい部屋を作成に失敗しました…",
      loading: "新しい部屋を作成中です…",
      success: "新しい部屋を作成しました",
    });

    copy(`${window.location.origin}/rooms/${id}`);

    toast.success("部屋のURLをコピーしました");

    router.push(`/rooms/${id}`);
  }, [router]);
  const handleSubmit: HomeProps["onSubmit"] = ({ roomId }) => {
    router.push(`/rooms/${roomId.split("/").at(-1) || ""}`);
  };

  return <Home onCreate={handleCreate} onSubmit={handleSubmit} />;
}
