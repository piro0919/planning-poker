"use client";
import copy from "copy-to-clipboard";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import toast from "react-hot-toast";
import Home, { HomeProps } from "@/components/Home";
import { useRouter } from "@/i18n/navigation";
import { markRoomCreated } from "@/libs/createRoom";

export default function HomePage(): React.JSX.Element {
  const router = useRouter();
  const t = useTranslations("Home");
  const handleCreate = useCallback<HomeProps["onCreate"]>(() => {
    const roomId = window.crypto.randomUUID();

    // 部屋の実体は、この印を持った接続が届いたときに Worker 側で作られる。
    markRoomCreated(roomId);

    copy(`${window.location.origin}/rooms/${roomId}`);

    toast.success(t("urlCopied"));

    router.push(`/rooms/${roomId}`);
  }, [router, t]);
  const handleSubmit: HomeProps["onSubmit"] = ({ roomId }) => {
    router.push(`/rooms/${roomId.split("/").at(-1) || ""}`);
  };

  return <Home onCreate={handleCreate} onSubmit={handleSubmit} />;
}
