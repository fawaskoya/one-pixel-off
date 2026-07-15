import { GLYPH_FAMILIES, PIXEL_PALETTES, primitive } from "./catalog";
import {
  CHALLENGE_SEED_MAX_LENGTH,
  PIXEL_GENERATION_VERSION,
  PIXEL_SCHEMA_VERSION,
  ROUND_DIFFICULTIES,
} from "./constants";
import { dailySeedForDate, isUtcDateKey } from "./daily";
import { PIXEL_DIFFICULTY_CONFIG } from "./difficulty";
import {
  chooseOne,
  createSeededRandom,
  randomInteger,
  stableSeedHash,
  type SeededRandom,
} from "./prng";
import type {
  DifficultyTier,
  GlyphFamilyId,
  MutationDescriptor,
  MutationKind,
  PaletteId,
  PixelDomainResult,
  PixelPuzzleDescriptor,
  PixelSessionMode,
  PreparedPixelSession,
  PuzzleCellDescriptor,
  PuzzleTuple,
  RoundIndex,
  VectorGlyphDescriptor,
  VectorPrimitive,
} from "./types";

const SAFE_SEED_PATTERN = /^[A-Za-z0-9._~:|-]+$/;

type MutationCandidate = Readonly<{
  kind: MutationKind;
  primitiveIndex: number;
  field: "geometry" | "strokeWidth" | "rotationDeg";
  coordinateIndex: number | null;
  minimum: number;
  maximum: number;
}>;

type PatternSource = Readonly<{
  glyph: VectorGlyphDescriptor;
  candidates: readonly MutationCandidate[];
}>;

function glyph(
  familyId: GlyphFamilyId,
  primitives: readonly VectorPrimitive[],
): VectorGlyphDescriptor {
  return { familyId, viewBoxSize: 100, primitives };
}

function patternForFamily(
  familyId: GlyphFamilyId,
  random: SeededRandom,
): PatternSource {
  const stroke = randomInteger(random, 3, 5);
  const accentFirst = random() < 0.5;

  switch (familyId) {
    case "rings": {
      const primitives = [
        primitive({ kind: "circle", geometry: [50, 50, 32], fill: "none", stroke: "primary", strokeWidth: stroke, rotationDeg: 0 }),
        primitive({ kind: "circle", geometry: [50, 50, 20], fill: "none", stroke: accentFirst ? "accent" : "primary", strokeWidth: stroke, rotationDeg: 0 }),
        primitive({ kind: "circle", geometry: [50, 50, 7], fill: "accent", stroke: "none", strokeWidth: 0, rotationDeg: 0 }),
      ];
      return {
        glyph: glyph(familyId, primitives),
        candidates: [
          { kind: "size", primitiveIndex: 0, field: "geometry", coordinateIndex: 2, minimum: 18, maximum: 44 },
          { kind: "offset", primitiveIndex: 1, field: "geometry", coordinateIndex: 0, minimum: 36, maximum: 64 },
          { kind: "offset", primitiveIndex: 1, field: "geometry", coordinateIndex: 1, minimum: 36, maximum: 64 },
          { kind: "stroke", primitiveIndex: 0, field: "strokeWidth", coordinateIndex: null, minimum: 1, maximum: 20 },
        ],
      };
    }

    case "stripes": {
      const primitives = [20, 35, 50, 65].map((x, index) =>
        primitive({
          kind: "rect",
          geometry: [x, 20, 9, 60, 3],
          fill: index === (accentFirst ? 1 : 2) ? "accent" : "primary",
          stroke: "none",
          strokeWidth: 0,
          rotationDeg: 0,
        }),
      );
      return {
        glyph: glyph(familyId, primitives),
        candidates: [
          { kind: "spacing", primitiveIndex: 1, field: "geometry", coordinateIndex: 0, minimum: 23, maximum: 47 },
          { kind: "offset", primitiveIndex: 2, field: "geometry", coordinateIndex: 1, minimum: 8, maximum: 32 },
          { kind: "size", primitiveIndex: 3, field: "geometry", coordinateIndex: 2, minimum: 6, maximum: 21 },
          { kind: "rotation", primitiveIndex: 0, field: "rotationDeg", coordinateIndex: null, minimum: -20, maximum: 20 },
        ],
      };
    }

    case "arrows": {
      const primitives = [
        primitive({ kind: "polygon", geometry: [18, 42, 62, 42, 62, 28, 84, 50, 62, 72, 62, 58, 18, 58], fill: "primary", stroke: "none", strokeWidth: 0, rotationDeg: chooseOne(random, [0, 90, 180, -90]) }),
        primitive({ kind: "line", geometry: [27, 50, 55, 50], fill: "none", stroke: "accent", strokeWidth: stroke, rotationDeg: 0 }),
      ];
      return {
        glyph: glyph(familyId, primitives),
        candidates: [
          { kind: "size", primitiveIndex: 0, field: "geometry", coordinateIndex: 6, minimum: 68, maximum: 96 },
          { kind: "offset", primitiveIndex: 0, field: "geometry", coordinateIndex: 7, minimum: 36, maximum: 64 },
          { kind: "spacing", primitiveIndex: 1, field: "geometry", coordinateIndex: 2, minimum: 41, maximum: 69 },
          { kind: "stroke", primitiveIndex: 1, field: "strokeWidth", coordinateIndex: null, minimum: 1, maximum: 20 },
        ],
      };
    }

    case "corners": {
      const primitives = [
        primitive({ kind: "line", geometry: [18, 42, 18, 18], fill: "none", stroke: "primary", strokeWidth: stroke, rotationDeg: 0 }),
        primitive({ kind: "line", geometry: [18, 18, 42, 18], fill: "none", stroke: "primary", strokeWidth: stroke, rotationDeg: 0 }),
        primitive({ kind: "line", geometry: [82, 58, 82, 82], fill: "none", stroke: "accent", strokeWidth: stroke, rotationDeg: 0 }),
        primitive({ kind: "line", geometry: [82, 82, 58, 82], fill: "none", stroke: "accent", strokeWidth: stroke, rotationDeg: 0 }),
      ];
      return {
        glyph: glyph(familyId, primitives),
        candidates: [
          { kind: "size", primitiveIndex: 0, field: "geometry", coordinateIndex: 1, minimum: 30, maximum: 54 },
          { kind: "spacing", primitiveIndex: 1, field: "geometry", coordinateIndex: 2, minimum: 30, maximum: 54 },
          { kind: "offset", primitiveIndex: 2, field: "geometry", coordinateIndex: 0, minimum: 70, maximum: 94 },
          { kind: "stroke", primitiveIndex: 3, field: "strokeWidth", coordinateIndex: null, minimum: 1, maximum: 20 },
        ],
      };
    }

    case "dots": {
      const primitives: VectorPrimitive[] = [];
      for (let row = 0; row < 3; row += 1) {
        for (let column = 0; column < 3; column += 1) {
          primitives.push(
            primitive({
              kind: "circle",
              geometry: [30 + column * 20, 30 + row * 20, 6],
              fill: row === 1 && column === 1 ? "accent" : "primary",
              stroke: "none",
              strokeWidth: 0,
              rotationDeg: 0,
            }),
          );
        }
      }
      return {
        glyph: glyph(familyId, primitives),
        candidates: [
          { kind: "offset", primitiveIndex: 4, field: "geometry", coordinateIndex: 0, minimum: 36, maximum: 64 },
          { kind: "offset", primitiveIndex: 4, field: "geometry", coordinateIndex: 1, minimum: 36, maximum: 64 },
          { kind: "size", primitiveIndex: 0, field: "geometry", coordinateIndex: 2, minimum: 1, maximum: 18 },
          { kind: "spacing", primitiveIndex: 8, field: "geometry", coordinateIndex: 0, minimum: 58, maximum: 82 },
        ],
      };
    }

    case "diamonds": {
      const primitives = [
        primitive({ kind: "polygon", geometry: [50, 12, 88, 50, 50, 88, 12, 50], fill: "primary", stroke: "none", strokeWidth: 0, rotationDeg: 0 }),
        primitive({ kind: "polygon", geometry: [50, 30, 70, 50, 50, 70, 30, 50], fill: "background", stroke: "accent", strokeWidth: stroke, rotationDeg: 0 }),
      ];
      return {
        glyph: glyph(familyId, primitives),
        candidates: [
          { kind: "size", primitiveIndex: 0, field: "geometry", coordinateIndex: 1, minimum: 0, maximum: 24 },
          { kind: "offset", primitiveIndex: 0, field: "geometry", coordinateIndex: 2, minimum: 76, maximum: 100 },
          { kind: "spacing", primitiveIndex: 1, field: "geometry", coordinateIndex: 3, minimum: 36, maximum: 64 },
          { kind: "stroke", primitiveIndex: 1, field: "strokeWidth", coordinateIndex: null, minimum: 1, maximum: 20 },
        ],
      };
    }

    case "chevrons": {
      const primitives = [
        primitive({ kind: "line", geometry: [18, 28, 50, 50], fill: "none", stroke: "primary", strokeWidth: stroke, rotationDeg: 0 }),
        primitive({ kind: "line", geometry: [50, 50, 18, 72], fill: "none", stroke: "primary", strokeWidth: stroke, rotationDeg: 0 }),
        primitive({ kind: "line", geometry: [50, 28, 82, 50], fill: "none", stroke: "accent", strokeWidth: stroke, rotationDeg: 0 }),
        primitive({ kind: "line", geometry: [82, 50, 50, 72], fill: "none", stroke: "accent", strokeWidth: stroke, rotationDeg: 0 }),
      ];
      return {
        glyph: glyph(familyId, primitives),
        candidates: [
          { kind: "offset", primitiveIndex: 0, field: "geometry", coordinateIndex: 1, minimum: 16, maximum: 40 },
          { kind: "spacing", primitiveIndex: 1, field: "geometry", coordinateIndex: 2, minimum: 6, maximum: 30 },
          { kind: "size", primitiveIndex: 2, field: "geometry", coordinateIndex: 2, minimum: 70, maximum: 94 },
          { kind: "stroke", primitiveIndex: 3, field: "strokeWidth", coordinateIndex: null, minimum: 1, maximum: 20 },
        ],
      };
    }

    case "orbit": {
      const primitives = [
        primitive({ kind: "circle", geometry: [50, 50, 30], fill: "none", stroke: "primary", strokeWidth: stroke, rotationDeg: 0 }),
        primitive({ kind: "circle", geometry: [50, 20, 7], fill: "accent", stroke: "none", strokeWidth: 0, rotationDeg: 0 }),
        primitive({ kind: "circle", geometry: [80, 50, 5], fill: "primary", stroke: "none", strokeWidth: 0, rotationDeg: 0 }),
        primitive({ kind: "circle", geometry: [50, 50, 8], fill: "primary", stroke: "none", strokeWidth: 0, rotationDeg: 0 }),
      ];
      return {
        glyph: glyph(familyId, primitives),
        candidates: [
          { kind: "size", primitiveIndex: 0, field: "geometry", coordinateIndex: 2, minimum: 18, maximum: 42 },
          { kind: "offset", primitiveIndex: 1, field: "geometry", coordinateIndex: 1, minimum: 8, maximum: 32 },
          { kind: "spacing", primitiveIndex: 2, field: "geometry", coordinateIndex: 0, minimum: 68, maximum: 92 },
          { kind: "size", primitiveIndex: 3, field: "geometry", coordinateIndex: 2, minimum: 1, maximum: 20 },
        ],
      };
    }
  }
}

function shuffled<T>(random: SeededRandom, source: readonly T[]): T[] {
  const output = [...source];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInteger(random, 0, index);
    [output[index], output[swapIndex]] = [
      output[swapIndex] as T,
      output[index] as T,
    ];
  }
  return output;
}

function readCandidateValue(
  source: VectorPrimitive,
  candidate: MutationCandidate,
): number {
  if (candidate.field === "geometry") {
    return source.geometry[candidate.coordinateIndex as number] as number;
  }
  return source[candidate.field];
}

function createMutation(
  source: VectorPrimitive,
  candidate: MutationCandidate,
  magnitude: number,
  random: SeededRandom,
): MutationDescriptor {
  const from = readCandidateValue(source, candidate);
  const signs = random() < 0.5 ? [1, -1] : [-1, 1];
  const sign = signs.find(
    (candidateSign) =>
      from + candidateSign * magnitude >= candidate.minimum &&
      from + candidateSign * magnitude <= candidate.maximum,
  );
  if (sign === undefined) {
    throw new RangeError("No safe mutation direction for generated glyph");
  }
  const to = from + sign * magnitude;
  return {
    kind: candidate.kind,
    primitiveIndex: candidate.primitiveIndex,
    field: candidate.field,
    coordinateIndex: candidate.coordinateIndex,
    from,
    to,
    delta: to - from,
  };
}

function mutateGlyph(
  source: VectorGlyphDescriptor,
  mutation: MutationDescriptor,
): VectorGlyphDescriptor {
  const primitives = source.primitives.map((item, primitiveIndex) => {
    if (primitiveIndex !== mutation.primitiveIndex) {
      return item;
    }
    if (mutation.field === "geometry") {
      const geometry = item.geometry.map((value, coordinateIndex) =>
        coordinateIndex === mutation.coordinateIndex ? mutation.to : value,
      );
      return { ...item, geometry };
    }
    return { ...item, [mutation.field]: mutation.to };
  });
  return { ...source, primitives };
}

export function normalizePixelSeed(seed: unknown): string | null {
  if (typeof seed !== "string") {
    return null;
  }
  const normalized = seed.normalize("NFC");
  if (
    normalized.length < 1 ||
    normalized.length > CHALLENGE_SEED_MAX_LENGTH ||
    !SAFE_SEED_PATTERN.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

export function generatePixelPuzzle(input: Readonly<{
  seed: string;
  roundIndex: RoundIndex;
  difficulty: DifficultyTier;
  familyId: GlyphFamilyId;
  paletteId: PaletteId;
}>): PixelPuzzleDescriptor {
  const random = createSeededRandom(
    `${input.seed}|g${PIXEL_GENERATION_VERSION}|r${input.roundIndex}`,
  );
  const configuration = PIXEL_DIFFICULTY_CONFIG[input.difficulty];
  const gridSize = chooseOne(random, configuration.gridSizes);
  const pattern = patternForFamily(input.familyId, random);
  const candidate = chooseOne(random, pattern.candidates);
  const sourcePrimitive = pattern.glyph.primitives[
    candidate.primitiveIndex
  ] as VectorPrimitive;
  const magnitude = chooseOne(
    random,
    configuration.magnitudes[candidate.kind],
  );
  const mutation = createMutation(sourcePrimitive, candidate, magnitude, random);
  const targetGlyph = mutateGlyph(pattern.glyph, mutation);
  const targetIndex = randomInteger(random, 0, gridSize * gridSize - 1);
  const cells: PuzzleCellDescriptor[] = [];

  for (let index = 0; index < gridSize * gridSize; index += 1) {
    cells.push({
      index,
      row: Math.floor(index / gridSize),
      column: index % gridSize,
      glyph: index === targetIndex ? targetGlyph : pattern.glyph,
      mutation: index === targetIndex ? mutation : null,
    });
  }

  return {
    schemaVersion: PIXEL_SCHEMA_VERSION,
    generationVersion: PIXEL_GENERATION_VERSION,
    id: `opo-g${PIXEL_GENERATION_VERSION}-r${input.roundIndex}-${stableSeedHash(`${input.seed}|${input.roundIndex}`)}`,
    roundIndex: input.roundIndex,
    difficulty: input.difficulty,
    gridSize,
    paletteId: input.paletteId,
    familyId: input.familyId,
    sourceGlyph: pattern.glyph,
    targetIndex,
    mutation,
    cells,
  };
}

export function generatePixelSession(input: Readonly<{
  mode: PixelSessionMode;
  seed: string;
  dailyDateUtc?: string | null;
}>): PixelDomainResult<PreparedPixelSession> {
  const seed = normalizePixelSeed(input.seed);
  if (seed === null) {
    return {
      ok: false,
      error: {
        code: "INVALID_SEED",
        message: "Seed must be a short URL-safe opaque value.",
      },
    };
  }

  const dailyDateUtc = input.dailyDateUtc ?? null;
  if (input.mode === "daily") {
    if (!isUtcDateKey(dailyDateUtc)) {
      return {
        ok: false,
        error: { code: "INVALID_DATE", message: "Daily mode needs a UTC date." },
      };
    }
    const expected = dailySeedForDate(dailyDateUtc);
    if (!expected.ok || expected.value !== seed) {
      return {
        ok: false,
        error: {
          code: "INVALID_SEED",
          message: "Daily seed does not match the supplied UTC date.",
        },
      };
    }
  } else if (dailyDateUtc !== null) {
    return {
      ok: false,
      error: {
        code: "INVALID_DATE",
        message: "Only daily sessions may carry a UTC date.",
      },
    };
  }

  const orderingRandom = createSeededRandom(
    `${seed}|g${PIXEL_GENERATION_VERSION}|session`,
  );
  const families = shuffled(orderingRandom, GLYPH_FAMILIES).slice(0, 5);
  const palettes = shuffled(orderingRandom, PIXEL_PALETTES).slice(0, 5);
  const createRound = (roundIndex: RoundIndex) =>
    generatePixelPuzzle({
      seed,
      roundIndex,
      difficulty: ROUND_DIFFICULTIES[roundIndex],
      familyId: families[roundIndex] as GlyphFamilyId,
      paletteId: (palettes[roundIndex] as (typeof PIXEL_PALETTES)[number]).id,
    });
  const rounds: PuzzleTuple = [
    createRound(0),
    createRound(1),
    createRound(2),
    createRound(3),
    createRound(4),
  ];

  return {
    ok: true,
    value: {
      schemaVersion: PIXEL_SCHEMA_VERSION,
      generationVersion: PIXEL_GENERATION_VERSION,
      sessionId: `opo-${input.mode}-g${PIXEL_GENERATION_VERSION}-${stableSeedHash(seed)}`,
      mode: input.mode,
      seed,
      dailyDateUtc: input.mode === "daily" ? dailyDateUtc : null,
      rounds,
    },
  };
}
