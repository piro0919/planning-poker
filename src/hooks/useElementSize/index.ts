import { useState } from "react";
import { useIsomorphicLayoutEffect } from "usehooks-ts";

export type ElementSize = {
  height: number;
  width: number;
};

// usehooks-ts 3 で消えた useElementSize の置き換え。
// 要素は後から現れることがあるので、ref オブジェクトではなく関数の ref で受け取る。
// 窓の大きさが同じでも、並ぶ人数が変われば要素の大きさは変わる。要素そのものを見張る。
export default function useElementSize<T extends HTMLElement>(): [
  (node: T | null) => void,
  ElementSize,
] {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState<ElementSize>({ height: 0, width: 0 });

  useIsomorphicLayoutEffect(() => {
    if (!element) {
      setSize({ height: 0, width: 0 });

      return;
    }

    const handleSize = (): void => {
      setSize({ height: element.offsetHeight, width: element.offsetWidth });
    };
    const observer = new ResizeObserver(handleSize);

    handleSize();
    observer.observe(element);

    return (): void => {
      observer.disconnect();
    };
  }, [element]);

  return [setElement, size];
}
