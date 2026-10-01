import { useMemo } from "react";
import styles from "./style.module.scss";
import Board, { BoardProps } from "@/components/Board";
import Control, { ControlProps } from "@/components/Control";
import Hand, { HandProps } from "@/components/Hand";

export type RoomProps = Pick<
  BoardProps,
  "adminUserId" | "status" | "userId" | "users"
> &
  Pick<
    ControlProps,
    "onLeave" | "onStart" | "onStop" | "status" | "userId" | "users"
  > &
  Pick<HandProps, "cards" | "selectedValue" | "status">;

export default function Room({
  adminUserId,
  cards,
  onLeave,
  onStart,
  onStop,
  selectedValue,
  status,
  userId,
  users,
}: RoomProps): React.JSX.Element {
  const isAdmin = useMemo<ControlProps["isAdmin"]>(
    () => !!adminUserId && adminUserId === userId,
    [adminUserId, userId]
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.controlBlock}>
        <div className={styles.controlInner}>
          <Control
            isAdmin={isAdmin}
            onLeave={onLeave}
            onStart={onStart}
            onStop={onStop}
            status={status}
            userId={userId}
            users={users}
          />
        </div>
      </div>
      <main className={styles.main}>
        <div className={styles.boardBlock}>
          <Board
            adminUserId={adminUserId}
            status={status}
            userId={userId}
            users={users}
          />
        </div>
        <Hand cards={cards} selectedValue={selectedValue} status={status} />
      </main>
    </div>
  );
}
