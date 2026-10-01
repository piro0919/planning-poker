import { useCallback, useState } from "react";
import { useEventListener, useIsomorphicLayoutEffect } from "usehooks-ts";

export type ElementSize = {
  height: number;
  width: number;
};

// usehooks-ts 3 で消えた useElementSize の置き換え。
// 要素は後から現れることがあるので、ref オブジェクトではなく関数の ref で受け取る。
export default function useElementSize<T extends HTMLElement>(): [
  (node: T | null) => void,
  ElementSize
] {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState<ElementSize>({ height: 0, width: 0 });
  const handleSize = useCallback(() => {
    setSize({
      height: element?.offsetHeight ?? 0,
      width: element?.offsetWidth ?? 0,
    });
  }, [element]);

  useEventListener("resize", handleSize);

  useIsomorphicLayoutEffect(() => {
    handleSize();
  }, [handleSize, element?.offsetHeight, element?.offsetWidth]);

  return [setElement, size];
}
