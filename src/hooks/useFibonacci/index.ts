import { useMemo } from "react";
import { DECK } from "@/libs/protocol";

export type FibonacciData = {
  fibonacci: string[];
};

export default function useFibonacci(): FibonacciData {
  const fibonacci = useMemo<FibonacciData["fibonacci"]>(() => [...DECK], []);

  return { fibonacci };
}
