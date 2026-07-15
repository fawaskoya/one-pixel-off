import { describe, expect, it } from "vitest";

import {
  GLYPH_FAMILIES,
  PIXEL_DIFFICULTY_CONFIG,
  PIXEL_GENERATION_VERSION,
  PIXEL_PALETTES,
  ROUND_DIFFICULTIES,
  assertPixelPuzzleInvariants,
  assertPixelSessionInvariants,
  createSeededRandom,
  dailySeedAt,
  dailySeedForDate,
  generatePixelPuzzle,
  generatePixelSession,
  isUtcDateKey,
  mulberry32,
  pixelPuzzleInvariantViolations,
  utcDateKeyFromEpochMs,
  xmur3,
} from "./index";
import type {
  DifficultyTier,
  GlyphFamilyId,
  MutationKind,
  PaletteId,
  PixelPuzzleDescriptor,
  PreparedPixelSession,
  RoundIndex,
} from "./types";

function expectSession(
  seed: string,
  mode: "quick" | "daily" | "challenge" = "quick",
  dailyDateUtc: string | null = null,
): PreparedPixelSession {
  const result = generatePixelSession({ mode, seed, dailyDateUtc });
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.value;
}

describe("pinned seeded generation", () => {
  it("pins xmur3 and mulberry32 fixtures", () => {
    expect(xmur3("pixel-fixture")()).toBe(1_501_323_770);
    const random = mulberry32(xmur3("pixel-fixture")());
    expect(Array.from({ length: 5 }, () => random())).toEqual([
      0.1887956983409822,
      0.19260986987501383,
      0.3917407102417201,
      0.5764393378049135,
      0.03159756935201585,
    ]);
  });

  it("normalizes Unicode before hashing", () => {
    const composed = createSeededRandom("caf\u00e9");
    const decomposed = createSeededRandom("cafe\u0301");
    expect(Array.from({ length: 20 }, () => composed())).toEqual(
      Array.from({ length: 20 }, () => decomposed()),
    );
  });

  it("recreates the exact session for an identical seed and version", () => {
    const first = expectSession("determinism-seed-001");
    const second = expectSession("determinism-seed-001");
    expect(second).toEqual(first);
    expect(first.generationVersion).toBe(PIXEL_GENERATION_VERSION);
    expect(first.rounds).toHaveLength(5);
  });

  it("uses the same generated puzzles when a quick seed becomes a challenge", () => {
    const quick = expectSession("shareable-seed-123", "quick");
    const challenge = expectSession("shareable-seed-123", "challenge");
    expect(challenge.rounds).toEqual(quick.rounds);
    expect(challenge.sessionId).not.toBe(quick.sessionId);
  });

  it("rejects empty, control-containing, oversized, and non-URL-safe seeds", () => {
    for (const seed of ["", "has space", "line\nbreak", "?query", "x".repeat(97)]) {
      const result = generatePixelSession({ mode: "quick", seed });
      expect(result).toMatchObject({
        ok: false,
        error: { code: "INVALID_SEED" },
      });
    }
  });
});

describe("procedural vector puzzle invariants", () => {
  it("ships curated palettes and at least six code-generated glyph families", () => {
    expect(PIXEL_PALETTES.length).toBeGreaterThanOrEqual(5);
    expect(new Set(PIXEL_PALETTES.map((palette) => palette.id)).size).toBe(
      PIXEL_PALETTES.length,
    );
    expect(GLYPH_FAMILIES.length).toBeGreaterThanOrEqual(6);
    expect(new Set(GLYPH_FAMILIES).size).toBe(GLYPH_FAMILIES.length);
  });

  it.each(GLYPH_FAMILIES)(
    "generates valid integer-only %s vector descriptors",
    (familyId) => {
      const puzzle = generatePixelPuzzle({
        seed: `family-${familyId}`,
        roundIndex: 2,
        difficulty: "tricky",
        familyId,
        paletteId: "ink-coral",
      });
      expect(() => assertPixelPuzzleInvariants(puzzle)).not.toThrow();
      for (const cell of puzzle.cells) {
        for (const item of cell.glyph.primitives) {
          expect(item.geometry.every(Number.isInteger)).toBe(true);
          expect(Number.isInteger(item.strokeWidth)).toBe(true);
          expect(Number.isInteger(item.rotationDeg)).toBe(true);
        }
      }
    },
  );

  it("creates exactly one target cell with exactly one scalar mutation", () => {
    const session = expectSession("one-and-only-target");
    for (const puzzle of session.rounds) {
      const mutatedCells = puzzle.cells.filter(
        (cell) => cell.mutation !== null,
      );
      expect(mutatedCells).toHaveLength(1);
      expect(mutatedCells[0]?.index).toBe(puzzle.targetIndex);
      expect(mutatedCells[0]?.mutation).toEqual(puzzle.mutation);

      for (const cell of puzzle.cells) {
        if (cell.index !== puzzle.targetIndex) {
          expect(cell.glyph).toEqual(puzzle.sourceGlyph);
        }
      }
      expect(pixelPuzzleInvariantViolations(puzzle)).toEqual([]);
    }
  });

  it("detects a forged second mutation", () => {
    const original = expectSession("forged-mutation").rounds[0];
    const innocentIndex = original.targetIndex === 0 ? 1 : 0;
    const cells = [...original.cells];
    cells[innocentIndex] = {
      ...cells[innocentIndex],
      mutation: original.mutation,
    };
    const forged = { ...original, cells } as PixelPuzzleDescriptor;
    expect(pixelPuzzleInvariantViolations(forged)).toContain(
      `puzzle.cell_${innocentIndex}.unexpected_mutation`,
    );
  });

  it("keeps every grid between 4x4 and 6x6 with bounded target coordinates", () => {
    const observed = new Set<number>();
    for (let seedIndex = 0; seedIndex < 200; seedIndex += 1) {
      const session = expectSession(`grid-seed-${seedIndex}`);
      assertPixelSessionInvariants(session);
      for (const puzzle of session.rounds) {
        observed.add(puzzle.gridSize);
        expect(puzzle.gridSize).toBeGreaterThanOrEqual(4);
        expect(puzzle.gridSize).toBeLessThanOrEqual(6);
        expect(puzzle.cells).toHaveLength(puzzle.gridSize ** 2);
        expect(puzzle.targetIndex).toBeGreaterThanOrEqual(0);
        expect(puzzle.targetIndex).toBeLessThan(puzzle.cells.length);
        expect(puzzle.cells[puzzle.targetIndex]).toMatchObject({
          row: Math.floor(puzzle.targetIndex / puzzle.gridSize),
          column: puzzle.targetIndex % puzzle.gridSize,
        });
      }
    }
    expect([...observed].sort()).toEqual([4, 5, 6]);
  });

  it("applies the five-round difficulty curve and safe nonzero deltas", () => {
    for (let seedIndex = 0; seedIndex < 100; seedIndex += 1) {
      const session = expectSession(`delta-seed-${seedIndex}`);
      session.rounds.forEach((puzzle, index) => {
        expect(puzzle.difficulty).toBe(ROUND_DIFFICULTIES[index]);
        expect(
          PIXEL_DIFFICULTY_CONFIG[puzzle.difficulty].magnitudes[
            puzzle.mutation.kind
          ],
        ).toContain(Math.abs(puzzle.mutation.delta));
        expect(puzzle.mutation.to).toBe(
          puzzle.mutation.from + puzzle.mutation.delta,
        );
      });
    }
  });

  it("keeps every mutation above the hard-but-visible perceptual floor", () => {
    const tiers: readonly DifficultyTier[] = [
      "beginner",
      "steady",
      "tricky",
      "expert",
    ];
    const floors: Readonly<
      Record<DifficultyTier, Readonly<Record<MutationKind, number>>>
    > = {
      beginner: { offset: 8, size: 8, spacing: 8, stroke: 3, rotation: 10 },
      steady: { offset: 6, size: 6, spacing: 6, stroke: 2, rotation: 8 },
      tricky: { offset: 5, size: 5, spacing: 5, stroke: 2, rotation: 7 },
      expert: { offset: 4, size: 4, spacing: 4, stroke: 1, rotation: 6 },
    };
    const observed = new Map<string, Set<number>>();

    for (const difficulty of tiers) {
      for (const familyId of GLYPH_FAMILIES) {
        for (let seedIndex = 0; seedIndex < 100; seedIndex += 1) {
          const puzzle = generatePixelPuzzle({
            seed: `visibility-${difficulty}-${familyId}-${seedIndex}`,
            roundIndex: 0,
            difficulty,
            familyId,
            paletteId: "ink-coral",
          });
          const magnitude = Math.abs(puzzle.mutation.delta);
          const policy = PIXEL_DIFFICULTY_CONFIG[difficulty].magnitudes[
            puzzle.mutation.kind
          ];

          expect(policy).toContain(magnitude);
          expect(magnitude).toBeGreaterThanOrEqual(
            floors[difficulty][puzzle.mutation.kind],
          );
          expect(puzzle.mutation.to).toBe(
            puzzle.mutation.from + puzzle.mutation.delta,
          );
          expect(pixelPuzzleInvariantViolations(puzzle)).toEqual([]);

          const policyKey = `${difficulty}:${puzzle.mutation.kind}`;
          const magnitudes = observed.get(policyKey) ?? new Set<number>();
          magnitudes.add(magnitude);
          observed.set(policyKey, magnitudes);
        }
      }
    }

    for (const difficulty of tiers) {
      for (const kind of [
        "offset",
        "size",
        "spacing",
        "stroke",
        "rotation",
      ] as const) {
        expect(observed.get(`${difficulty}:${kind}`)).toEqual(
          new Set(PIXEL_DIFFICULTY_CONFIG[difficulty].magnitudes[kind]),
        );
      }
    }
  });

  it("rejects a mutation magnitude outside its stated difficulty policy", () => {
    const original = generatePixelPuzzle({
      seed: "forged-too-small-difficulty",
      roundIndex: 0,
      difficulty: "beginner",
      familyId: "dots",
      paletteId: "ink-coral",
    });
    const forged = { ...original, difficulty: "expert" } as PixelPuzzleDescriptor;

    expect(pixelPuzzleInvariantViolations(forged)).toContain(
      "puzzle.mutation_magnitude",
    );
  });

  it("generates all catalog families across a deterministic seed sample", () => {
    const observed = new Set<GlyphFamilyId>();
    for (let index = 0; index < 30; index += 1) {
      expectSession(`coverage-${index}`).rounds.forEach((round) =>
        observed.add(round.familyId),
      );
    }
    expect(observed).toEqual(new Set(GLYPH_FAMILIES));
  });

  it("supports direct deterministic construction for every tier and palette", () => {
    const paletteIds = PIXEL_PALETTES.map((palette) => palette.id);
    for (let roundIndex = 0; roundIndex < 5; roundIndex += 1) {
      const puzzle = generatePixelPuzzle({
        seed: `direct-${roundIndex}`,
        roundIndex: roundIndex as RoundIndex,
        difficulty: ROUND_DIFFICULTIES[roundIndex]!,
        familyId: GLYPH_FAMILIES[roundIndex] as GlyphFamilyId,
        paletteId: paletteIds[roundIndex] as PaletteId,
      });
      expect(() => assertPixelPuzzleInvariants(puzzle)).not.toThrow();
    }
  });
});

describe("UTC daily seeds", () => {
  it("changes only at the UTC midnight boundary", () => {
    const before = Date.UTC(2026, 6, 14, 23, 59, 59, 999);
    const atMidnight = before + 1;
    expect(utcDateKeyFromEpochMs(before)).toBe("2026-07-14");
    expect(utcDateKeyFromEpochMs(atMidnight)).toBe("2026-07-15");
    expect(dailySeedAt(before)).toEqual({
      ok: true,
      value: "opo|daily|g1|2026-07-14",
    });
    expect(dailySeedAt(atMidnight)).toEqual({
      ok: true,
      value: "opo|daily|g1|2026-07-15",
    });
  });

  it("accepts real leap days and rejects impossible calendar dates", () => {
    expect(isUtcDateKey("2024-02-29")).toBe(true);
    for (const value of ["2023-02-29", "2026-13-01", "2026-04-31", "15-07-2026"] ) {
      expect(isUtcDateKey(value)).toBe(false);
      expect(dailySeedForDate(value)).toMatchObject({
        ok: false,
        error: { code: "INVALID_DATE" },
      });
    }
    expect(dailySeedAt(Number.NaN)).toMatchObject({
      ok: false,
      error: { code: "INVALID_DATE" },
    });
  });

  it("requires a daily session seed to match its date exactly", () => {
    const seed = dailySeedForDate("2026-07-15");
    expect(seed.ok).toBe(true);
    if (!seed.ok) {
      throw new Error(seed.error.message);
    }
    const session = expectSession(seed.value, "daily", "2026-07-15");
    expect(session.dailyDateUtc).toBe("2026-07-15");
    expect(() => assertPixelSessionInvariants(session)).not.toThrow();

    expect(
      generatePixelSession({
        mode: "daily",
        seed: seed.value,
        dailyDateUtc: "2026-07-16",
      }),
    ).toMatchObject({ ok: false, error: { code: "INVALID_SEED" } });
  });
});
