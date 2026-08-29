"use client";
import copy from "copy-to-clipboard";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import toast from "react-hot-toast";
import Home, { HomeProps } from "@/components/Home";
import Seo from "@/components/Seo";

/** 部屋を作った本人だけが、この印を持って最初の接続に来る。 */
const CREATE_KEY = "create-room";

export default function Page(): JSX.Element {
  const router = useRouter();
  const handleCreate = useCallback<HomeProps["onCreate"]>(() => {
    const roomId = window.crypto.randomUUID();

    // 部屋の実体は、この印を持った接続が届いたときに Worker 側で作られる。
    window.sessionStorage.setItem(CREATE_KEY, roomId);

    copy(`${window.location.origin}/rooms/${roomId}`);

    toast.success("部屋のURLをコピーしました");

    router.push(`/rooms/${roomId}`);
  }, [router]);
  const handleSubmit: HomeProps["onSubmit"] = ({ roomId }) => {
    router.push(`/rooms/${roomId.split("/").at(-1) || ""}`);
  };

  return (
    <>
      <Seo type="website" />
      <Home onCreate={handleCreate} onSubmit={handleSubmit} />
    </>
  );
}
