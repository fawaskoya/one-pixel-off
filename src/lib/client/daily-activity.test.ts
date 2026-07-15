import { afterEach, describe, expect, it, vi } from "vitest";
import { deriveDailyActivity } from "./daily-activity";

afterEach(() => {
  vi.useRealTimers();
});

describe("deriveDailyActivity", () => {
  it("derives current and longest UTC streaks", () => {
    const activity = deriveDailyActivity(
      [
        "2026-07-01",
        "2026-07-02",
        "2026-07-04",
        "2026-07-12",
        "2026-07-13",
        "2026-07-14",
        "2026-07-15",
      ],
      "2026-07-15",
    );

    expect(activity.currentStreak).toBe(4);
    expect(activity.longestStreak).toBe(4);
    expect(activity.daysPlayedLast7).toBe(4);
    expect(activity.sevenDayCells[0]?.date).toBe("2026-07-09");
    expect(activity.sevenDayCells[6]).toEqual({
      date: "2026-07-15",
      completed: true,
      isToday: true,
    });
  });

  it("keeps yesterday's streak current while today is still open", () => {
    const activity = deriveDailyActivity(
      ["2026-07-11", "2026-07-12", "2026-07-13", "2026-07-14"],
      "2026-07-15",
    );
    expect(activity.currentStreak).toBe(4);
    expect(activity.longestStreak).toBe(4);
    expect(activity.sevenDayCells.at(-1)?.completed).toBe(false);
  });

  it("resets current streak after a full missed UTC day", () => {
    const activity = deriveDailyActivity(
      ["2026-07-10", "2026-07-11", "2026-07-13"],
      "2026-07-15",
    );
    expect(activity.currentStreak).toBe(0);
    expect(activity.longestStreak).toBe(2);
  });

  it("deduplicates and ignores malformed, impossible, and future dates", () => {
    const activity = deriveDailyActivity(
      [
        "2026-07-13",
        "2026-07-14",
        "2026-07-14",
        "2026-07-15",
        "2026-07-16",
        "2026-02-30",
        "2026-7-15",
        "not-a-date",
        123,
        null,
      ],
      "2026-07-15",
    );
    expect(activity.currentStreak).toBe(3);
    expect(activity.longestStreak).toBe(3);
    expect(activity.daysPlayedLast7).toBe(3);
  });

  it("builds a chronological seven-day window across month and leap-day boundaries", () => {
    const activity = deriveDailyActivity(
      ["2024-02-27", "2024-02-29", "2024-03-01"],
      "2024-03-02",
    );
    expect(activity.sevenDayCells.map(({ date }) => date)).toEqual([
      "2024-02-25",
      "2024-02-26",
      "2024-02-27",
      "2024-02-28",
      "2024-02-29",
      "2024-03-01",
      "2024-03-02",
    ]);
    expect(activity.daysPlayedLast7).toBe(3);
    expect(activity.currentStreak).toBe(2);
    expect(activity.longestStreak).toBe(2);
  });

  it("returns seven empty cells for no valid completions", () => {
    const activity = deriveDailyActivity([], "2026-01-01");
    expect(activity).toMatchObject({
      currentStreak: 0,
      longestStreak: 0,
      daysPlayedLast7: 0,
    });
    expect(activity.sevenDayCells).toHaveLength(7);
    expect(activity.sevenDayCells.map(({ date }) => date)).toEqual([
      "2025-12-26",
      "2025-12-27",
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
      "2025-12-31",
      "2026-01-01",
    ]);
    expect(activity.sevenDayCells.every(({ completed }) => !completed)).toBe(true);
  });

  it("uses the actual UTC day when today is omitted or invalid", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T23:59:59.999Z"));
    expect(
      deriveDailyActivity(["2026-07-15"]).sevenDayCells.at(-1)?.date,
    ).toBe("2026-07-15");
    expect(
      deriveDailyActivity(["2026-07-15"], "invalid").currentStreak,
    ).toBe(1);
  });
});
