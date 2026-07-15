import type { PixelSessionMode } from "@/domain/pixel";

const STORAGE_KEY = "one-pixel-off:stats:v1";
const MAX_SCORE = 1_250;

export type PixelStats = Readonly<{
  schemaVersion: 1;
  sessionsCompleted: number;
  roundsFound: number;
  totalScore: number;
  bestScore: number;
  dailyDatesCompleted: readonly string[];
}>;

export type PixelSessionRecord = Readonly<{
  sessionId: string;
  mode: PixelSessionMode;
  dailyDateUtc: string | null;
  roundsFound: number;
  score: number;
}>;

const emptyStats = (): PixelStats => ({
  schemaVersion: 1,
  sessionsCompleted: 0,
  roundsFound: 0,
  totalScore: 0,
  bestScore: 0,
  dailyDatesCompleted: [],
});

function isSafeCount(value: unknown, maximum = Number.MAX_SAFE_INTEGER): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= maximum;
}

function validateStats(value: unknown): PixelStats | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  if (
    item.schemaVersion !== 1 ||
    !isSafeCount(item.sessionsCompleted) ||
    !isSafeCount(item.roundsFound) ||
    !isSafeCount(item.totalScore) ||
    !isSafeCount(item.bestScore, MAX_SCORE) ||
    !Array.isArray(item.dailyDatesCompleted) ||
    item.dailyDatesCompleted.length > 400 ||
    item.dailyDatesCompleted.some(
      (date) => typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date),
    )
  ) {
    return null;
  }
  return {
    schemaVersion: 1,
    sessionsCompleted: item.sessionsCompleted,
    roundsFound: item.roundsFound,
    totalScore: item.totalScore,
    bestScore: item.bestScore,
    dailyDatesCompleted: [...new Set(item.dailyDatesCompleted as string[])].slice(-400),
  };
}

export function loadPixelStats(): PixelStats {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return emptyStats();
    return validateStats(JSON.parse(raw) as unknown) ?? emptyStats();
  } catch {
    return emptyStats();
  }
}

export function recordPixelSession(record: PixelSessionRecord): boolean {
  if (
    record.sessionId.length === 0 ||
    record.sessionId.length > 128 ||
    !isSafeCount(record.roundsFound, 5) ||
    !isSafeCount(record.score, MAX_SCORE)
  ) {
    return false;
  }

  try {
    const current = loadPixelStats();
    const dates =
      record.mode === "daily" && record.dailyDateUtc
        ? [...new Set([...current.dailyDatesCompleted, record.dailyDateUtc])].slice(-400)
        : current.dailyDatesCompleted;
    const next: PixelStats = {
      schemaVersion: 1,
      sessionsCompleted: current.sessionsCompleted + 1,
      roundsFound: current.roundsFound + record.roundsFound,
      totalScore: current.totalScore + record.score,
      bestScore: Math.max(current.bestScore, record.score),
      dailyDatesCompleted: dates,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}
