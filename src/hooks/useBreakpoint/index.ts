import useOriginBreakpoint from "use-breakpoint";

const BREAKPOINTS = { desktop: 980, mobile: 375, tablet: 740, wide: 1300 };

export type BreakpointData = {
  breakpoint?: keyof typeof BREAKPOINTS;
};

export default function useBreakpoint(): BreakpointData {
  const { breakpoint } = useOriginBreakpoint(BREAKPOINTS);

  return {
    breakpoint: breakpoint ?? undefined,
  };
}
