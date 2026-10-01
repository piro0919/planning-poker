import { MouseEventHandler, useMemo } from "react";
import styles from "./style.module.scss";
import useBreakpoint from "@/hooks/useBreakpoint";

type Card = {
  onSelect: MouseEventHandler<HTMLDivElement>;
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
        <div
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
        </div>
      )),
    [cardWidth, cards, selectedValue, status]
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.scrollBlock}>
        <div className={styles.inner}>{items}</div>
      </div>
    </div>
  );
}
