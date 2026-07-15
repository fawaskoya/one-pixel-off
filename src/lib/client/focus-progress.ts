import { GLYPH_FAMILIES, type GlyphFamilyId } from "../../domain/pixel";

export const FOCUS_PROGRESS_STORAGE_KEY =
  "one-pixel-off:focus-progress:v1";

export const FOCUS_PROGRESS_SCHEMA_VERSION = 1 as const;

/**
 * Progress is intentionally local and aggregate-only. Number.MAX_SAFE_INTEGER
 * is the saturation boundary so malformed JSON and extremely long-running
 * profiles cannot make later additions unsafe.
 */
export const FOCUS_PROGRESS_MAXIMUM = Number.MAX_SAFE_INTEGER;

export const FOCUS_FAMILY_MILESTONES = [5, 25, 100] as const;

export type FocusFamilyFinds = Readonly<Record<GlyphFamilyId, number>>;

export type FocusProgress = Readonly<{
  schemaVersion: 1;
  focusRunsCompleted: number;
  totalFinds: number;
  bestScore: number;
  highestBoard: number;
  bestFindStreak: number;
  bestCleanStreak: number;
  findsByFamily: FocusFamilyFinds;
}>;

export type FocusRunRecord = Readonly<{
  score: number;
  highestBoard: number;
  bestFindStreak: number;
  bestCleanStreak: number;
  /** Missing known families are treated as zero. Unknown keys are rejected. */
  findsByFamily: Readonly<Partial<Record<GlyphFamilyId, number>>>;
}>;

type NormalizedFocusRunRecord = Readonly<
  Omit<FocusRunRecord, "findsByFamily"> & {
    findsByFamily: FocusFamilyFinds;
  }
>;

export type FocusAchievement = Readonly<{
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  progress: number;
  goal: number;
  familyId: GlyphFamilyId | null;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emptyFamilyFinds(): Record<GlyphFamilyId, number> {
  return Object.fromEntries(
    GLYPH_FAMILIES.map((familyId) => [familyId, 0]),
  ) as Record<GlyphFamilyId, number>;
}

export function emptyFocusProgress(): FocusProgress {
  return {
    schemaVersion: FOCUS_PROGRESS_SCHEMA_VERSION,
    focusRunsCompleted: 0,
    totalFinds: 0,
    bestScore: 0,
    highestBoard: 0,
    bestFindStreak: 0,
    bestCleanStreak: 0,
    findsByFamily: emptyFamilyFinds(),
  };
}

function normalizedAggregate(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.min(FOCUS_PROGRESS_MAXIMUM, Math.floor(value));
}

function normalizeFamilyFinds(value: unknown): FocusFamilyFinds {
  const normalized = emptyFamilyFinds();
  if (!isRecord(value)) return normalized;

  for (const familyId of GLYPH_FAMILIES) {
    normalized[familyId] = normalizedAggregate(value[familyId]);
  }
  return normalized;
}

/**
 * Converts untrusted persisted data into the exact v1 aggregate shape.
 * Unknown fields/families are stripped, bad counters become zero, and large
 * counters saturate. A different or missing schema version starts fresh.
 */
export function normalizeFocusProgress(value: unknown): FocusProgress {
  if (!isRecord(value) || value.schemaVersion !== FOCUS_PROGRESS_SCHEMA_VERSION) {
    return emptyFocusProgress();
  }

  const findsByFamily = normalizeFamilyFinds(value.findsByFamily);
  const totalFinds = Object.values(findsByFamily).reduce(safeAdd, 0);
  const highestBoard = normalizedAggregate(value.highestBoard);
  const bestFindStreak = Math.min(
    normalizedAggregate(value.bestFindStreak),
    totalFinds,
    highestBoard,
  );
  const bestCleanStreak = Math.min(
    normalizedAggregate(value.bestCleanStreak),
    bestFindStreak,
  );

  return {
    schemaVersion: FOCUS_PROGRESS_SCHEMA_VERSION,
    focusRunsCompleted: normalizedAggregate(value.focusRunsCompleted),
    totalFinds,
    bestScore: normalizedAggregate(value.bestScore),
    highestBoard,
    bestFindStreak,
    bestCleanStreak,
    findsByFamily,
  };
}

function safeAdd(left: number, right: number): number {
  return Math.min(FOCUS_PROGRESS_MAXIMUM, left + right);
}

function normalizeRunRecord(value: unknown): NormalizedFocusRunRecord | null {
  if (!isRecord(value) || !isRecord(value.findsByFamily)) return null;

  const allowedKeys = new Set<string>(GLYPH_FAMILIES);
  if (Object.keys(value.findsByFamily).some((key) => !allowedKeys.has(key))) {
    return null;
  }

  const numericFields = [
    value.score,
    value.highestBoard,
    value.bestFindStreak,
    value.bestCleanStreak,
    ...Object.values(value.findsByFamily),
  ];
  if (
    numericFields.some(
      (item) =>
        typeof item !== "number" ||
        !Number.isSafeInteger(item) ||
        item < 0,
    )
  ) {
    return null;
  }

  const findsByFamily = normalizeFamilyFinds(value.findsByFamily);
  const runFinds = Object.values(findsByFamily).reduce(safeAdd, 0);
  const highestBoard = value.highestBoard as number;
  const bestFindStreak = value.bestFindStreak as number;
  const bestCleanStreak = value.bestCleanStreak as number;

  if (
    bestCleanStreak > bestFindStreak ||
    bestFindStreak > runFinds ||
    runFinds > highestBoard
  ) {
    return null;
  }

  return {
    score: value.score as number,
    highestBoard,
    bestFindStreak,
    bestCleanStreak,
    findsByFamily,
  };
}

/** Pure aggregate merge. Returns null when the run record is inconsistent. */
export function mergeFocusRun(
  currentValue: unknown,
  runValue: unknown,
): FocusProgress | null {
  const run = normalizeRunRecord(runValue);
  if (run === null) return null;

  const current = normalizeFocusProgress(currentValue);
  const runFinds = Object.values(run.findsByFamily).reduce(safeAdd, 0);
  const findsByFamily = emptyFamilyFinds();
  for (const familyId of GLYPH_FAMILIES) {
    findsByFamily[familyId] = safeAdd(
      current.findsByFamily[familyId],
      run.findsByFamily[familyId],
    );
  }

  return {
    schemaVersion: FOCUS_PROGRESS_SCHEMA_VERSION,
    focusRunsCompleted: safeAdd(current.focusRunsCompleted, 1),
    totalFinds: safeAdd(current.totalFinds, runFinds),
    bestScore: Math.max(current.bestScore, run.score),
    highestBoard: Math.max(current.highestBoard, run.highestBoard),
    bestFindStreak: Math.max(current.bestFindStreak, run.bestFindStreak),
    bestCleanStreak: Math.max(current.bestCleanStreak, run.bestCleanStreak),
    findsByFamily,
  };
}

function familyTitle(familyId: GlyphFamilyId): string {
  return `${familyId.charAt(0).toUpperCase()}${familyId.slice(1)}`;
}

/** Achievement flags and progress are always derived, never persisted. */
export function deriveFocusAchievements(
  progressValue: unknown,
): readonly FocusAchievement[] {
  const progress = normalizeFocusProgress(progressValue);
  const familiesSeen = GLYPH_FAMILIES.filter(
    (familyId) => progress.findsByFamily[familyId] > 0,
  ).length;
  const achievements: FocusAchievement[] = [
    {
      id: "clean-five",
      title: "Clean Five",
      description: "Find five anomalies in a row without a wrong tap.",
      achieved: progress.bestCleanStreak >= 5,
      progress: Math.min(progress.bestCleanStreak, 5),
      goal: 5,
      familyId: null,
    },
    {
      id: "every-angle",
      title: "Every Angle",
      description: "Find an anomaly in every pattern family.",
      achieved: familiesSeen === GLYPH_FAMILIES.length,
      progress: familiesSeen,
      goal: GLYPH_FAMILIES.length,
      familyId: null,
    },
    {
      id: "deep-focus",
      title: "Deep Focus",
      description: "Reach board 20 in a Focus Run.",
      achieved: progress.highestBoard >= 20,
      progress: Math.min(progress.highestBoard, 20),
      goal: 20,
      familyId: null,
    },
  ];

  for (const familyId of GLYPH_FAMILIES) {
    const familyFinds = progress.findsByFamily[familyId];
    for (const milestone of FOCUS_FAMILY_MILESTONES) {
      achievements.push({
        id: `family-${familyId}-${milestone}`,
        title: `${familyTitle(familyId)} ${milestone}`,
        description: `Find ${milestone} ${familyId} anomalies.`,
        achieved: familyFinds >= milestone,
        progress: Math.min(familyFinds, milestone),
        goal: milestone,
        familyId,
      });
    }
  }

  return achievements;
}

export function loadFocusProgress(): FocusProgress {
  try {
    const raw = window.localStorage.getItem(FOCUS_PROGRESS_STORAGE_KEY);
    if (raw === null) return emptyFocusProgress();
    return normalizeFocusProgress(JSON.parse(raw) as unknown);
  } catch {
    return emptyFocusProgress();
  }
}

export function recordFocusRun(runValue: FocusRunRecord): boolean {
  try {
    const raw = window.localStorage.getItem(FOCUS_PROGRESS_STORAGE_KEY);
    const current =
      raw === null
        ? emptyFocusProgress()
        : normalizeFocusProgress(JSON.parse(raw) as unknown);
    const next = mergeFocusRun(current, runValue);
    if (next === null) return false;
    window.localStorage.setItem(
      FOCUS_PROGRESS_STORAGE_KEY,
      JSON.stringify(next),
    );
    return true;
  } catch {
    return false;
  }
}
