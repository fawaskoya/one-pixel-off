const UTC_DAY_MS = 86_400_000;
const UTC_DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

export type DailyActivityCell = Readonly<{
  date: string;
  completed: boolean;
  isToday: boolean;
}>;

export type DailyActivity = Readonly<{
  currentStreak: number;
  longestStreak: number;
  daysPlayedLast7: number;
  sevenDayCells: readonly DailyActivityCell[];
}>;

function utcDayFromDateKey(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = UTC_DATE_KEY.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return Math.floor(date.getTime() / UTC_DAY_MS);
}

function dateKeyFromUtcDay(utcDay: number): string {
  const date = new Date(utcDay * UTC_DAY_MS);
  return [
    date.getUTCFullYear().toString().padStart(4, "0"),
    (date.getUTCMonth() + 1).toString().padStart(2, "0"),
    date.getUTCDate().toString().padStart(2, "0"),
  ].join("-");
}

function currentUtcDateKey(): string {
  const now = new Date();
  return [
    now.getUTCFullYear().toString().padStart(4, "0"),
    (now.getUTCMonth() + 1).toString().padStart(2, "0"),
    now.getUTCDate().toString().padStart(2, "0"),
  ].join("-");
}

/**
 * Derives UTC activity from completion dates without reading or writing
 * storage. Supplying todayDateString makes the result clock-independent;
 * omitted or invalid values use the current UTC calendar date.
 *
 * A streak completed through yesterday remains current while today is still
 * open. Duplicate, malformed, impossible, and future completion dates are
 * ignored.
 */
export function deriveDailyActivity(
  completedDateStrings: readonly unknown[],
  todayDateString?: string,
): DailyActivity {
  const todayUtcDay =
    utcDayFromDateKey(todayDateString) ??
    (utcDayFromDateKey(currentUtcDateKey()) as number);
  const completedDays = new Set<number>();

  for (const value of completedDateStrings) {
    const utcDay = utcDayFromDateKey(value);
    if (utcDay !== null && utcDay <= todayUtcDay) {
      completedDays.add(utcDay);
    }
  }

  const orderedDays = [...completedDays].sort((left, right) => left - right);
  let longestStreak = 0;
  let consecutive = 0;
  let previous: number | null = null;
  for (const utcDay of orderedDays) {
    consecutive = previous !== null && utcDay === previous + 1
      ? consecutive + 1
      : 1;
    longestStreak = Math.max(longestStreak, consecutive);
    previous = utcDay;
  }

  const currentAnchor = completedDays.has(todayUtcDay)
    ? todayUtcDay
    : completedDays.has(todayUtcDay - 1)
      ? todayUtcDay - 1
      : null;
  let currentStreak = 0;
  if (currentAnchor !== null) {
    while (completedDays.has(currentAnchor - currentStreak)) {
      currentStreak += 1;
    }
  }

  const sevenDayCells: DailyActivityCell[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const utcDay = todayUtcDay - offset;
    sevenDayCells.push({
      date: dateKeyFromUtcDay(utcDay),
      completed: completedDays.has(utcDay),
      isToday: offset === 0,
    });
  }

  return {
    currentStreak,
    longestStreak,
    daysPlayedLast7: sevenDayCells.filter((cell) => cell.completed).length,
    sevenDayCells,
  };
}
