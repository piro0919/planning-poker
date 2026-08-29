import { MouseEventHandler } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import styles from "./style.module.scss";
import { courgette } from "@/libs/fonts";

type FieldValues = {
  roomId: string;
};

export type HomeProps = {
  onCreate: MouseEventHandler<HTMLButtonElement>;
  onSubmit: SubmitHandler<FieldValues>;
};

export default function Home({ onCreate, onSubmit }: HomeProps): JSX.Element {
  const { handleSubmit, register } = useForm<FieldValues>({
    defaultValues: {
      roomId: "",
    },
  });

  return (
    <div className={styles.wrapper}>
      <main className={styles.main}>
        <h1 className={`${courgette.className} ${styles.heading1}`}>
          Planning Poker
        </h1>
        <div className={styles.buttonsWrapper}>
          <button className={styles.button} onClick={onCreate}>
            新しい部屋を作成
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
                placeholder="部屋IDを入力"
              />
              <button className={styles.button} type="submit">
                参加
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
