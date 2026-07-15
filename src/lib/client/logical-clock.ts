export type LogicalClock = Readonly<{
  now: () => number;
}>;

export function createLogicalClock(): LogicalClock {
  let lastNow = 0;
  const hasPerformanceClock =
    typeof performance !== "undefined" && typeof performance.now === "function";
  const wallAnchor = Date.now();
  const performanceAnchor = hasPerformanceClock ? performance.now() : 0;

  return {
    now() {
      const proposed = hasPerformanceClock
        ? wallAnchor + (performance.now() - performanceAnchor)
        : Date.now();
      lastNow = Math.max(lastNow, proposed);
      return lastNow;
    },
  };
}
