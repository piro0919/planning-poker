import dayjs from "dayjs";
import { CSSProperties, useMemo } from "react";
import { FaCheckCircle, FaCrown } from "react-icons/fa";
import { TailSpin } from "react-loader-spinner";
import { useElementSize, useWindowSize } from "usehooks-ts";
import styles from "./style.module.scss";

type User = {
  createdDate: string;
  hasVoted: boolean;
  id: string;
  name: string;
  value: string;
};

export type BoardProps = {
  adminUserId: string;
  status: "reserve" | "start" | "wait";
  userId: string;
  users: User[];
};

export default function Board({
  adminUserId,
  status,
  userId,
  users: propUsers,
}: BoardProps): JSX.Element {
  const users = useMemo(
    () =>
      propUsers
        .sort(({ createdDate: createdDateA }, { createdDate: createdDateB }) =>
          dayjs(createdDateA).isBefore(createdDateB) ? 1 : -1
        )
        .sort(({ id }) => (userId === id ? -1 : 1)),
    [propUsers, userId]
  );
  const { height: windowHeight, width: windowWidth } = useWindowSize();
  const repeatCount = useMemo(() => {
    const indexList = [1, 2, 3, 4];
    const memberCount = users.length;
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
  }, [users.length, windowHeight, windowWidth]);
  const [ref, { height = 0, width = 0 }] = useElementSize();
  const cardStyle = useMemo<CSSProperties>(
    () =>
      height / 88 > width / 63
        ? {
            width: "100%",
          }
        : { height: "100%" },
    [height, width]
  );
  const items = useMemo(
    () =>
      users.map(({ hasVoted, id, name, value }, index) => (
        <li className={styles.item} key={id}>
          <div className={styles.cardWrapper} ref={index ? undefined : ref}>
            <div
              className={`${styles.card} ${
                status === "reserve" || status === "start" ? styles.loading : ""
              }`}
              style={cardStyle}
            >
              {hasVoted && status === "start" ? (
                <FaCheckCircle color="#61d345" size={64} />
              ) : null}
              {!hasVoted && status === "start" ? (
                <TailSpin color="#61d345" height={64} width={64} />
              ) : null}
              {status === "wait" ? value : null}
            </div>
          </div>
          <div className={styles.nameBlock}>
            {adminUserId === id ? <FaCrown color="#ead665" /> : null}
            {userId === id ? "あなた" : `${name}さん`}
          </div>
        </li>
      )),
    [adminUserId, cardStyle, ref, status, userId, users]
  );

  return (
    <ul
      className={styles.list}
      style={{ gridTemplateColumns: `repeat(${repeatCount}, 1fr)` }}
    >
      {items}
    </ul>
  );
}
