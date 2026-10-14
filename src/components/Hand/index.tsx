import { MouseEventHandler, useMemo } from "react";
import styles from "./style.module.scss";
import useBreakpoint from "@/hooks/useBreakpoint";

type Card = {
  onSelect: MouseEventHandler<HTMLButtonElement>;
  value: string;
};

export type HandProps = {
  cards: Card[];
  selectedValue: string;
  status: "reserve" | "start" | "wait";
};

export default function Hand({
  cards,
  selectedValue,
  status,
}: HandProps): React.JSX.Element {
  const { breakpoint } = useBreakpoint();
  const cardWidth = useMemo(
    () =>
      breakpoint === "mobile" || breakpoint === "tablet"
        ? "108px"
        : `100% / ${cards.length - 4}`,
    [breakpoint, cards.length]
  );
  const items = useMemo(
    () =>
      cards.map(({ onSelect, value }, index, cards) => (
        // キーボードでも選べるよう button にする。disabled は文字色を変えるので使わず、
        // 投票中以外は押しても何も起きないことを aria-disabled で伝える。
        <button
          aria-disabled={status !== "start"}
          aria-pressed={selectedValue === value}
          className={`${styles.card} ${
            selectedValue === value ? styles.selected : ""
          }`}
          key={value}
          onClick={status === "start" ? onSelect : undefined}
          style={{
            left: `calc(100% / ${
              cards.length - 1
            } * ${index} - ${cardWidth} / ${cards.length - 1} * ${index})`,
            width: `calc(${cardWidth})`,
          }}
        >
          {value}
        </button>
      )),
    [cardWidth, cards, selectedValue, status]
  );

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.scrollBlock}
        // 札にフォーカスが当たると、ブラウザが札の下端を見せようと縦にもずらす。
        // 縦は持ち上がった札の分だけはみ出させているので、常に上端へ戻す。
        onScroll={({ currentTarget }) => {
          if (currentTarget.scrollTop) {
            currentTarget.scrollTop = 0;
          }
        }}
      >
        <div className={styles.inner}>{items}</div>
      </div>
    </div>
  );
}
