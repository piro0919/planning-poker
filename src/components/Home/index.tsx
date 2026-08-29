import { useTranslations } from "next-intl";
import { MouseEventHandler } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import styles from "./style.module.scss";
import LocaleSwitch from "@/components/LocaleSwitch";
import { courgette } from "@/libs/fonts";

type FieldValues = {
  roomId: string;
};

export type HomeProps = {
  onCreate: MouseEventHandler<HTMLButtonElement>;
  onSubmit: SubmitHandler<FieldValues>;
};

export default function Home({ onCreate, onSubmit }: HomeProps): JSX.Element {
  const t = useTranslations("Home");
  const { handleSubmit, register } = useForm<FieldValues>({
    defaultValues: {
      roomId: "",
    },
  });

  return (
    <div className={styles.wrapper}>
      <LocaleSwitch />
      <main className={styles.main}>
        <h1 className={`${courgette.className} ${styles.heading1}`}>
          Planning Poker
        </h1>
        <div className={styles.buttonsWrapper}>
          <button className={styles.button} onClick={onCreate}>
            {t("create")}
          </button>
          <div className={styles.separator}>|</div>
          <form
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className={styles.existingBlock}>
              <input
                {...register("roomId", { required: true })}
                className={styles.input}
                placeholder={t("roomIdPlaceholder")}
              />
              <button className={styles.button} type="submit">
                {t("join")}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
