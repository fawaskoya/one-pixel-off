import { afterEach, describe, expect, it, vi } from "vitest";
import { GLYPH_FAMILIES, type GlyphFamilyId } from "../../domain/pixel";
import {
  FOCUS_FAMILY_MILESTONES,
  FOCUS_PROGRESS_MAXIMUM,
  FOCUS_PROGRESS_STORAGE_KEY,
  deriveFocusAchievements,
  emptyFocusProgress,
  loadFocusProgress,
  mergeFocusRun,
  normalizeFocusProgress,
  recordFocusRun,
  type FocusRunRecord,
} from "./focus-progress";

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) {
    values.set(FOCUS_PROGRESS_STORAGE_KEY, initial);
  }
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
    clear: vi.fn(() => values.clear()),
    key: vi.fn((index: number) => [...values.keys()][index] ?? null),
    get length() {
      return values.size;
    },
  } satisfies Storage;
}

function familyFinds(
  values: Partial<Record<GlyphFamilyId, number>> = {},
): Partial<Record<GlyphFamilyId, number>> {
  return values;
}

function run(
  overrides: Partial<FocusRunRecord> = {},
): FocusRunRecord {
  return {
    score: 900,
    highestBoard: 6,
    bestFindStreak: 4,
    bestCleanStreak: 3,
    findsByFamily: familyFinds({ rings: 4 }),
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("focus progress normalization", () => {
  it("creates a complete zeroed v1 aggregate", () => {
    expect(emptyFocusProgress()).toEqual({
      schemaVersion: 1,
      focusRunsCompleted: 0,
      totalFinds: 0,
      bestScore: 0,
      highestBoard: 0,
      bestFindStreak: 0,
      bestCleanStreak: 0,
      findsByFamily: Object.fromEntries(
        GLYPH_FAMILIES.map((familyId) => [familyId, 0]),
      ),
    });
    expect(FOCUS_PROGRESS_STORAGE_KEY).not.toBe("one-pixel-off:stats:v1");
  });

  it("starts fresh for malformed and unsupported schemas", () => {
    expect(normalizeFocusProgress(null)).toEqual(emptyFocusProgress());
    expect(normalizeFocusProgress([])).toEqual(emptyFocusProgress());
    expect(normalizeFocusProgress({ schemaVersion: 2 })).toEqual(
      emptyFocusProgress(),
    );
  });

  it("salvages valid aggregates, strips extras, and canonicalizes counters", () => {
    const normalized = normalizeFocusProgress({
      schemaVersion: 1,
      focusRunsCompleted: 2.9,
      totalFinds: 999_999,
      bestScore: Number.POSITIVE_INFINITY,
      highestBoard: 12,
      bestFindStreak: 99,
      bestCleanStreak: 50,
      unexpectedUnlocks: ["deep-focus"],
      findsByFamily: {
        rings: 7.8,
        stripes: -4,
        arrows: "many",
        corners: FOCUS_PROGRESS_MAXIMUM + 100,
        unknown: 800,
      },
    });

    expect(normalized.focusRunsCompleted).toBe(2);
    expect(normalized.bestScore).toBe(0);
    expect(normalized.findsByFamily.rings).toBe(7);
    expect(normalized.findsByFamily.stripes).toBe(0);
    expect(normalized.findsByFamily.arrows).toBe(0);
    expect(normalized.findsByFamily.corners).toBe(FOCUS_PROGRESS_MAXIMUM);
    expect("unknown" in normalized.findsByFamily).toBe(false);
    expect(normalized.totalFinds).toBe(FOCUS_PROGRESS_MAXIMUM);
    expect(normalized.bestFindStreak).toBe(12);
    expect(normalized.bestCleanStreak).toBe(12);
    expect("unexpectedUnlocks" in normalized).toBe(false);
  });
});

describe("focus progress merging and persistence", () => {
  it("merges cumulative finds while retaining personal bests", () => {
    const first = mergeFocusRun(emptyFocusProgress(), run());
    expect(first).not.toBeNull();
    const second = mergeFocusRun(
      first,
      run({
        score: 1_400,
        highestBoard: 11,
        bestFindStreak: 7,
        bestCleanStreak: 5,
        findsByFamily: familyFinds({ rings: 2, orbit: 5 }),
      }),
    );

    expect(second).toMatchObject({
      focusRunsCompleted: 2,
      totalFinds: 11,
      bestScore: 1_400,
      highestBoard: 11,
      bestFindStreak: 7,
      bestCleanStreak: 5,
    });
    expect(second?.findsByFamily.rings).toBe(6);
    expect(second?.findsByFamily.orbit).toBe(5);
  });

  it("saturates cumulative aggregates instead of overflowing", () => {
    const current = normalizeFocusProgress({
      schemaVersion: 1,
      focusRunsCompleted: FOCUS_PROGRESS_MAXIMUM,
      totalFinds: FOCUS_PROGRESS_MAXIMUM,
      bestScore: FOCUS_PROGRESS_MAXIMUM,
      highestBoard: FOCUS_PROGRESS_MAXIMUM,
      bestFindStreak: FOCUS_PROGRESS_MAXIMUM,
      bestCleanStreak: FOCUS_PROGRESS_MAXIMUM,
      findsByFamily: { rings: FOCUS_PROGRESS_MAXIMUM },
    });
    const next = mergeFocusRun(
      current,
      run({
        score: 1,
        highestBoard: 1,
        bestFindStreak: 1,
        bestCleanStreak: 1,
        findsByFamily: familyFinds({ rings: 1 }),
      }),
    );

    expect(next?.focusRunsCompleted).toBe(FOCUS_PROGRESS_MAXIMUM);
    expect(next?.totalFinds).toBe(FOCUS_PROGRESS_MAXIMUM);
    expect(next?.findsByFamily.rings).toBe(FOCUS_PROGRESS_MAXIMUM);
    expect(next?.bestScore).toBe(FOCUS_PROGRESS_MAXIMUM);
  });

  it.each([
    ["negative", run({ score: -1 })],
    ["fraction", run({ highestBoard: 6.5 })],
    [
      "clean streak beyond find streak",
      run({ bestFindStreak: 2, bestCleanStreak: 3 }),
    ],
    [
      "find streak beyond recorded finds",
      run({ bestFindStreak: 5, bestCleanStreak: 0 }),
    ],
    [
      "more finds than boards reached",
      run({ highestBoard: 3, bestFindStreak: 0, bestCleanStreak: 0 }),
    ],
    [
      "unknown family",
      {
        ...run(),
        findsByFamily: { rings: 4, squares: 1 },
      },
    ],
  ])("rejects an inconsistent %s record", (_label, invalidRun) => {
    expect(mergeFocusRun(emptyFocusProgress(), invalidRun)).toBeNull();
  });

  it("loads empty progress and records an exact aggregate payload", () => {
    const localStorage = memoryStorage();
    vi.stubGlobal("window", { localStorage });
    expect(loadFocusProgress()).toEqual(emptyFocusProgress());

    expect(recordFocusRun(run())).toBe(true);
    expect(loadFocusProgress()).toMatchObject({
      focusRunsCompleted: 1,
      totalFinds: 4,
      bestScore: 900,
      highestBoard: 6,
      bestFindStreak: 4,
      bestCleanStreak: 3,
    });

    const stored = JSON.parse(
      localStorage.setItem.mock.calls[0]?.[1] ?? "null",
    ) as Record<string, unknown>;
    expect(Object.keys(stored).sort()).toEqual(
      [
        "schemaVersion",
        "focusRunsCompleted",
        "totalFinds",
        "bestScore",
        "highestBoard",
        "bestFindStreak",
        "bestCleanStreak",
        "findsByFamily",
      ].sort(),
    );
  });

  it("does not write an invalid run", () => {
    const localStorage = memoryStorage();
    vi.stubGlobal("window", { localStorage });
    expect(recordFocusRun(run({ bestCleanStreak: 5 }))).toBe(false);
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it("fails closed on malformed JSON and unavailable storage", () => {
    vi.stubGlobal("window", { localStorage: memoryStorage("not-json") });
    expect(loadFocusProgress()).toEqual(emptyFocusProgress());
    expect(recordFocusRun(run())).toBe(false);

    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new DOMException("blocked", "SecurityError");
        },
        setItem: () => {
          throw new DOMException("full", "QuotaExceededError");
        },
      },
    });
    expect(loadFocusProgress()).toEqual(emptyFocusProgress());
    expect(recordFocusRun(run())).toBe(false);
  });
});

describe("derived focus achievements", () => {
  it("derives core and family milestones without stored unlock flags", () => {
    const findsByFamily = Object.fromEntries(
      GLYPH_FAMILIES.map((familyId) => [familyId, familyId === "rings" ? 26 : 1]),
    ) as Record<GlyphFamilyId, number>;
    const progress = normalizeFocusProgress({
      schemaVersion: 1,
      focusRunsCompleted: 3,
      totalFinds: 100,
      bestScore: 4_000,
      highestBoard: 22,
      bestFindStreak: 8,
      bestCleanStreak: 5,
      findsByFamily,
      unlocks: [],
    });
    const achievements = deriveFocusAchievements(progress);

    expect(achievements).toHaveLength(
      3 + GLYPH_FAMILIES.length * FOCUS_FAMILY_MILESTONES.length,
    );
    expect(achievements.find(({ id }) => id === "clean-five")?.achieved).toBe(true);
    expect(achievements.find(({ id }) => id === "every-angle")?.achieved).toBe(true);
    expect(achievements.find(({ id }) => id === "deep-focus")?.achieved).toBe(true);
    expect(achievements.find(({ id }) => id === "family-rings-25")?.achieved).toBe(true);
    expect(achievements.find(({ id }) => id === "family-rings-100")?.progress).toBe(26);
    expect(achievements.find(({ id }) => id === "family-stripes-5")?.achieved).toBe(false);
  });
});
