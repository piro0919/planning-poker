"use client";
import { MouseEventHandler, useMemo } from "react";
import { FaCheckCircle, FaCrown } from "react-icons/fa";
import { TailSpin } from "react-loader-spinner";
import Spacer from "react-spacer";
import { useElementSize, useWindowSize } from "usehooks-ts";
import styles from "./style.module.scss";

type Card = {
  label: string;
  onSelect: MouseEventHandler<HTMLDivElement>;
};

type User = {
  card: string;
  id: string;
  isAdmin: boolean;
  name: string;
};

export type RoomProps = {
  cards: Card[];
  isAdmin: boolean;
  onLeave: MouseEventHandler<HTMLButtonElement>;
  onStart: MouseEventHandler<HTMLButtonElement>;
  onStop: MouseEventHandler<HTMLButtonElement>;
  status: string;
  userId: string;
  users: User[];
};

export default function Room({
  cards,
  isAdmin,
  onLeave,
  onStart,
  onStop,
  status,
  userId,
  users: propUsers,
}: RoomProps): JSX.Element {
  const users = useMemo(
    () => propUsers.sort(({ id }) => (userId === id ? -1 : 1)),
    [propUsers, userId]
  );
  const { height: windowHeight, width: windowWidth } = useWindowSize();
  const [ref, { height, width }] = useElementSize();
  const memberCount = useMemo(() => users.length, [users.length]);
  const repeatCount = useMemo(() => {
    const indexList = [1, 2, 3, 4];
    const maxRepeatCount = indexList.find(
      (index) => memberCount <= index * (index - 1)
    );

    if (!maxRepeatCount) {
      return 0;
    }

    if (
      memberCount >
      maxRepeatCount * (maxRepeatCount - 1) - (maxRepeatCount - 1)
    ) {
      return windowHeight > windowWidth ? maxRepeatCount - 1 : maxRepeatCount;
    }

    return maxRepeatCount - 1;
  }, [memberCount, windowHeight, windowWidth]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.menuBlock}>
        <div className={styles.menuInner}>
          {isAdmin && (status === "reserve" || status === "wait") ? (
            <button
              className={styles.button}
              disabled={users.filter(({ id }) => userId !== id).length < 1}
              onClick={onStart}
            >
              開始する
            </button>
          ) : null}
          {isAdmin && status === "start" ? (
            <button
              className={styles.button}
              disabled={users.every(({ card }) => !card)}
              onClick={onStop}
            >
              締め切る
            </button>
          ) : null}
          <Spacer grow={1} />
          {status === "reserve" ? (
            <div className={styles.reserveLabel}>待機中</div>
          ) : null}
          {status === "start" ? (
            <div className={styles.startLabel}>投票中</div>
          ) : null}
          {status === "wait" ? (
            <div className={styles.waitLabel}>公開中</div>
          ) : null}
          <button className={styles.button} onClick={onLeave}>
            退出する
          </button>
        </div>
      </div>
      <div className={styles.inner}>
        <div className={styles.membersBlock}>
          <ul
            className={styles.list}
            style={{ gridTemplateColumns: `repeat(${repeatCount}, 1fr)` }}
          >
            {users.map(({ card, id, isAdmin, name }, index) => (
              <li className={styles.item} key={id}>
                <div
                  className={styles.cardWrapper}
                  ref={index ? undefined : ref}
                >
                  {status === "reserve" || status === "start" ? (
                    <div
                      className={`${styles.card} ${styles.loading}`}
                      style={
                        height / 88 > width / 63
                          ? {
                              width: "100%",
                            }
                          : { height: "100%" }
                      }
                    >
                      {card ? (
                        <FaCheckCircle color="#61d345" size={64} />
                      ) : null}
                      {!card && status === "start" ? (
                        <TailSpin color="#61d345" height={64} width={64} />
                      ) : null}
                    </div>
                  ) : (
                    <div
                      className={styles.card}
                      style={
                        height / 88 > width / 63
                          ? {
                              width: "100%",
                            }
                          : { height: "100%" }
                      }
                    >
                      {card}
                    </div>
                  )}
                </div>
                <div className={styles.nameBlock}>
                  {isAdmin ? <FaCrown color="#ead665" /> : null}
                  {userId === id ? "あなた" : `${name}さん`}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.myBlock}>
          <div className={styles.cardsWrapper}>
            {cards.map(({ label, onSelect }, index, cards) => (
              <div
                className={`${styles.myCard} ${
                  users.some(({ card, id }) => card === label && userId === id)
                    ? styles.selected
                    : ""
                }`}
                key={label}
                onClick={status === "start" ? onSelect : undefined}
                style={{
                  left: `calc(100% / ${cards.length - 1} * ${index} - 100% / ${
                    cards.length - 4
                  } / ${cards.length - 1} * ${index})`,
                  width: `calc(100% / ${cards.length - 4})`,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
