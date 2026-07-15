import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPixelStats, recordPixelSession } from "./pixel-storage";

const STORAGE_KEY = "one-pixel-off:stats:v1";

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(STORAGE_KEY, initial);
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
    clear: vi.fn(() => values.clear()),
    key: vi.fn((index: number) => [...values.keys()][index] ?? null),
    get length() { return values.size; },
  } satisfies Storage;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pixel aggregate storage", () => {
  it("starts from safe empty statistics", () => {
    vi.stubGlobal("window", { localStorage: memoryStorage() });
    expect(loadPixelStats()).toEqual({
      schemaVersion: 1,
      sessionsCompleted: 0,
      roundsFound: 0,
      totalScore: 0,
      bestScore: 0,
      dailyDatesCompleted: [],
    });
  });

  it("discards malformed and future-shaped data", () => {
    vi.stubGlobal("window", { localStorage: memoryStorage('{"schemaVersion":2}') });
    expect(loadPixelStats().sessionsCompleted).toBe(0);
  });

  it("records bounded session totals", () => {
    const localStorage = memoryStorage();
    vi.stubGlobal("window", { localStorage });
    expect(recordPixelSession({
      sessionId: "opo-quick-proof",
      mode: "quick",
      dailyDateUtc: null,
      roundsFound: 4,
      score: 815,
    })).toBe(true);
    expect(loadPixelStats()).toMatchObject({
      sessionsCompleted: 1,
      roundsFound: 4,
      totalScore: 815,
      bestScore: 815,
    });
  });

  it("deduplicates and bounds daily completion dates", () => {
    vi.stubGlobal("window", { localStorage: memoryStorage() });
    const record = {
      sessionId: "opo-daily-proof",
      mode: "daily" as const,
      dailyDateUtc: "2026-07-15",
      roundsFound: 5,
      score: 1_000,
    };
    expect(recordPixelSession(record)).toBe(true);
    expect(recordPixelSession({ ...record, sessionId: "opo-daily-proof-2" })).toBe(true);
    expect(loadPixelStats().dailyDatesCompleted).toEqual(["2026-07-15"]);
  });

  it("rejects impossible records without writing", () => {
    const localStorage = memoryStorage();
    vi.stubGlobal("window", { localStorage });
    expect(recordPixelSession({
      sessionId: "bad",
      mode: "quick",
      dailyDateUtc: null,
      roundsFound: 6,
      score: 1_251,
    })).toBe(false);
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it("keeps play non-blocking when storage throws", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => { throw new DOMException("blocked", "SecurityError"); },
        setItem: () => { throw new DOMException("full", "QuotaExceededError"); },
      },
    });
    expect(loadPixelStats().sessionsCompleted).toBe(0);
    expect(recordPixelSession({
      sessionId: "opo-quick-storage-blocked",
      mode: "quick",
      dailyDateUtc: null,
      roundsFound: 3,
      score: 600,
    })).toBe(false);
  });
});
