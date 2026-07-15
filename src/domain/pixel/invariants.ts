import { isGlyphFamilyId, isPaletteId } from "./catalog";
import {
  PIXEL_GENERATION_VERSION,
  PIXEL_MAX_ROUND_SCORE,
  PIXEL_ROUND_DURATION_MS,
  PIXEL_SCHEMA_VERSION,
  PIXEL_SESSION_ROUNDS,
  PIXEL_STATE_VERSION,
  ROUND_DIFFICULTIES,
} from "./constants";
import { dailySeedForDate, isUtcDateKey } from "./daily";
import { isPixelMutationMagnitudeAllowed } from "./difficulty";
import { normalizePixelSeed } from "./generator";
import { scoreFoundRound } from "./scoring";
import type {
  MutationDescriptor,
  PixelGameState,
  PixelPuzzleDescriptor,
  PixelRoundOutcome,
  PreparedPixelSession,
  VectorGlyphDescriptor,
  VectorPrimitive,
} from "./types";

function isIntegerInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function isFiniteInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function hasUniqueIntegers(values: readonly number[]): boolean {
  return (
    values.every(Number.isInteger) && new Set(values).size === values.length
  );
}

function primitiveViolations(
  value: VectorPrimitive,
  path: string,
): string[] {
  const violations: string[] = [];
  const expectedGeometryLength =
    value.kind === "circle"
      ? 3
      : value.kind === "rect"
        ? 5
        : value.kind === "line"
          ? 4
          : null;
  if (
    expectedGeometryLength === null
      ? value.geometry.length < 6 || value.geometry.length % 2 !== 0
      : value.geometry.length !== expectedGeometryLength
  ) {
    violations.push(`${path}.geometry_shape`);
  }
  if (
    !value.geometry.every((coordinate) =>
      isIntegerInRange(coordinate, 0, 100),
    )
  ) {
    violations.push(`${path}.integer_geometry`);
  }
  if (value.kind === "circle") {
    const [cx, cy, radius] = value.geometry;
    if (
      radius === undefined ||
      cx === undefined ||
      cy === undefined ||
      radius < 1 ||
      cx - radius < 0 ||
      cx + radius > 100 ||
      cy - radius < 0 ||
      cy + radius > 100
    ) {
      violations.push(`${path}.circle_bounds`);
    }
  }
  if (value.kind === "rect") {
    const [x, y, width, height, radius] = value.geometry;
    if (
      x === undefined ||
      y === undefined ||
      width === undefined ||
      height === undefined ||
      radius === undefined ||
      width < 1 ||
      height < 1 ||
      x + width > 100 ||
      y + height > 100 ||
      radius > Math.min(width, height) / 2
    ) {
      violations.push(`${path}.rect_bounds`);
    }
  }
  if (
    !isIntegerInRange(value.strokeWidth, 0, 20) ||
    (value.stroke === "none" && value.strokeWidth !== 0) ||
    (value.stroke !== "none" && value.strokeWidth < 1)
  ) {
    violations.push(`${path}.stroke`);
  }
  if (!isIntegerInRange(value.rotationDeg, -180, 180)) {
    violations.push(`${path}.rotation`);
  }
  return violations;
}

function glyphViolations(
  value: VectorGlyphDescriptor,
  path: string,
): string[] {
  const violations: string[] = [];
  if (!isGlyphFamilyId(value.familyId)) {
    violations.push(`${path}.family`);
  }
  if (value.viewBoxSize !== 100 || value.primitives.length === 0) {
    violations.push(`${path}.shape`);
  }
  value.primitives.forEach((item, index) => {
    violations.push(...primitiveViolations(item, `${path}.primitive_${index}`));
  });
  return violations;
}

type ScalarDifference = Readonly<{
  primitiveIndex: number;
  field: "geometry" | "strokeWidth" | "rotationDeg";
  coordinateIndex: number | null;
  from: number;
  to: number;
}>;

function glyphScalarDifferences(
  source: VectorGlyphDescriptor,
  candidate: VectorGlyphDescriptor,
): ScalarDifference[] | null {
  if (
    source.familyId !== candidate.familyId ||
    source.viewBoxSize !== candidate.viewBoxSize ||
    source.primitives.length !== candidate.primitives.length
  ) {
    return null;
  }
  const differences: ScalarDifference[] = [];
  for (
    let primitiveIndex = 0;
    primitiveIndex < source.primitives.length;
    primitiveIndex += 1
  ) {
    const left = source.primitives[primitiveIndex] as VectorPrimitive;
    const right = candidate.primitives[primitiveIndex] as VectorPrimitive;
    if (
      left.kind !== right.kind ||
      left.fill !== right.fill ||
      left.stroke !== right.stroke ||
      left.geometry.length !== right.geometry.length
    ) {
      return null;
    }
    for (
      let coordinateIndex = 0;
      coordinateIndex < left.geometry.length;
      coordinateIndex += 1
    ) {
      const from = left.geometry[coordinateIndex] as number;
      const to = right.geometry[coordinateIndex] as number;
      if (from !== to) {
        differences.push({
          primitiveIndex,
          field: "geometry",
          coordinateIndex,
          from,
          to,
        });
      }
    }
    if (left.strokeWidth !== right.strokeWidth) {
      differences.push({
        primitiveIndex,
        field: "strokeWidth",
        coordinateIndex: null,
        from: left.strokeWidth,
        to: right.strokeWidth,
      });
    }
    if (left.rotationDeg !== right.rotationDeg) {
      differences.push({
        primitiveIndex,
        field: "rotationDeg",
        coordinateIndex: null,
        from: left.rotationDeg,
        to: right.rotationDeg,
      });
    }
  }
  return differences;
}

function mutationMatchesDifference(
  mutation: MutationDescriptor,
  difference: ScalarDifference,
): boolean {
  return (
    mutation.primitiveIndex === difference.primitiveIndex &&
    mutation.field === difference.field &&
    mutation.coordinateIndex === difference.coordinateIndex &&
    mutation.from === difference.from &&
    mutation.to === difference.to &&
    mutation.delta === difference.to - difference.from &&
    mutation.delta !== 0
  );
}

export function pixelPuzzleInvariantViolations(
  puzzle: PixelPuzzleDescriptor,
): readonly string[] {
  const violations: string[] = [];
  if (
    puzzle.schemaVersion !== PIXEL_SCHEMA_VERSION ||
    puzzle.generationVersion !== PIXEL_GENERATION_VERSION
  ) {
    violations.push("puzzle.version");
  }
  if (!isIntegerInRange(puzzle.roundIndex, 0, 4)) {
    violations.push("puzzle.round_index");
  }
  if (!["beginner", "steady", "tricky", "expert"].includes(puzzle.difficulty)) {
    violations.push("puzzle.difficulty");
  }
  if (![4, 5, 6].includes(puzzle.gridSize)) {
    violations.push("puzzle.grid_size");
  }
  if (
    !isPixelMutationMagnitudeAllowed(
      puzzle.difficulty,
      puzzle.mutation.kind,
      puzzle.mutation.delta,
    )
  ) {
    violations.push("puzzle.mutation_magnitude");
  }
  if (!isPaletteId(puzzle.paletteId) || !isGlyphFamilyId(puzzle.familyId)) {
    violations.push("puzzle.catalog_reference");
  }
  if (
    puzzle.sourceGlyph.familyId !== puzzle.familyId ||
    puzzle.id.length < 1 ||
    puzzle.id.length > 96
  ) {
    violations.push("puzzle.identity");
  }
  violations.push(...glyphViolations(puzzle.sourceGlyph, "puzzle.source"));

  const cellCount = puzzle.gridSize * puzzle.gridSize;
  if (
    puzzle.cells.length !== cellCount ||
    !isIntegerInRange(puzzle.targetIndex, 0, cellCount - 1)
  ) {
    violations.push("puzzle.cell_count");
  }
  let mutatedCellCount = 0;
  puzzle.cells.forEach((cell, index) => {
    if (
      cell.index !== index ||
      cell.row !== Math.floor(index / puzzle.gridSize) ||
      cell.column !== index % puzzle.gridSize
    ) {
      violations.push(`puzzle.cell_${index}.position`);
    }
    violations.push(...glyphViolations(cell.glyph, `puzzle.cell_${index}`));
    const differences = glyphScalarDifferences(puzzle.sourceGlyph, cell.glyph);
    if (index === puzzle.targetIndex) {
      mutatedCellCount += cell.mutation === null ? 0 : 1;
      if (
        cell.mutation === null ||
        differences === null ||
        differences.length !== 1 ||
        !mutationMatchesDifference(cell.mutation, differences[0] as ScalarDifference) ||
        !mutationMatchesDifference(puzzle.mutation, differences[0] as ScalarDifference)
      ) {
        violations.push("puzzle.target_mutation");
      }
    } else if (
      cell.mutation !== null ||
      differences === null ||
      differences.length !== 0
    ) {
      violations.push(`puzzle.cell_${index}.unexpected_mutation`);
    }
  });
  if (mutatedCellCount !== 1) {
    violations.push("puzzle.exactly_one_target");
  }
  return violations;
}

export function assertPixelPuzzleInvariants(
  puzzle: PixelPuzzleDescriptor,
): void {
  const violations = pixelPuzzleInvariantViolations(puzzle);
  if (violations.length > 0) {
    throw new Error(`Pixel puzzle invariant failed: ${violations[0]}`);
  }
}

export function pixelSessionInvariantViolations(
  session: PreparedPixelSession,
): readonly string[] {
  const violations: string[] = [];
  if (
    session.schemaVersion !== PIXEL_SCHEMA_VERSION ||
    session.generationVersion !== PIXEL_GENERATION_VERSION ||
    session.rounds.length !== PIXEL_SESSION_ROUNDS ||
    session.sessionId.length < 1 ||
    normalizePixelSeed(session.seed) !== session.seed
  ) {
    violations.push("session.envelope");
  }
  if (!(["quick", "daily", "challenge"] as const).includes(session.mode)) {
    violations.push("session.mode");
  }
  if (session.mode === "daily") {
    const expected =
      isUtcDateKey(session.dailyDateUtc) &&
      dailySeedForDate(session.dailyDateUtc);
    if (!expected || !expected.ok || expected.value !== session.seed) {
      violations.push("session.daily");
    }
  } else if (session.dailyDateUtc !== null) {
    violations.push("session.unexpected_daily_date");
  }

  session.rounds.forEach((round, index) => {
    if (
      round.roundIndex !== index ||
      round.difficulty !== ROUND_DIFFICULTIES[index]
    ) {
      violations.push(`session.round_${index}.sequence`);
    }
    violations.push(...pixelPuzzleInvariantViolations(round));
  });
  if (new Set(session.rounds.map((round) => round.id)).size !== 5) {
    violations.push("session.unique_round_ids");
  }
  if (new Set(session.rounds.map((round) => round.familyId)).size !== 5) {
    violations.push("session.unique_families");
  }
  return violations;
}

export function isPreparedPixelSessionValid(
  session: PreparedPixelSession,
): boolean {
  return pixelSessionInvariantViolations(session).length === 0;
}

export function assertPixelSessionInvariants(
  session: PreparedPixelSession,
): void {
  const violations = pixelSessionInvariantViolations(session);
  if (violations.length > 0) {
    throw new Error(`Pixel session invariant failed: ${violations[0]}`);
  }
}

function outcomeViolations(
  outcome: PixelRoundOutcome,
  session: PreparedPixelSession,
): string[] {
  const violations: string[] = [];
  const puzzle = session.rounds[outcome.roundIndex];
  if (
    puzzle === undefined ||
    puzzle.id !== outcome.puzzleId ||
    !Number.isFinite(outcome.startedAtMs) ||
    !Number.isFinite(outcome.endedAtMs) ||
    outcome.endedAtMs < outcome.startedAtMs ||
    !isFiniteInRange(outcome.elapsedMs, 0, PIXEL_ROUND_DURATION_MS) ||
    !isFiniteInRange(outcome.remainingMs, 0, PIXEL_ROUND_DURATION_MS) ||
    !hasUniqueIntegers(outcome.wrongCellIndexes)
  ) {
    violations.push(`outcome_${outcome.roundIndex}.shape`);
    return violations;
  }
  if (
    outcome.wrongCellIndexes.some(
      (index) =>
        index < 0 ||
        index >= puzzle.cells.length ||
        index === puzzle.targetIndex,
    )
  ) {
    violations.push(`outcome_${outcome.roundIndex}.wrong_cells`);
  }
  if (outcome.result === "found") {
    if (
      Math.abs(
        outcome.elapsedMs + outcome.remainingMs - PIXEL_ROUND_DURATION_MS,
      ) > 0.001 ||
      outcome.score !==
        scoreFoundRound(
          outcome.remainingMs,
          outcome.wrongCellIndexes.length,
        ) ||
      !isIntegerInRange(outcome.score, 25, PIXEL_MAX_ROUND_SCORE)
    ) {
      violations.push(`outcome_${outcome.roundIndex}.found`);
    }
  } else if (
    outcome.result !== "timeout" ||
    outcome.elapsedMs !== PIXEL_ROUND_DURATION_MS ||
    outcome.remainingMs !== 0 ||
    outcome.score !== 0 ||
    outcome.endedAtMs - outcome.startedAtMs !== PIXEL_ROUND_DURATION_MS
  ) {
    violations.push(`outcome_${outcome.roundIndex}.timeout`);
  }
  return violations;
}

function usablePhaseToken(value: string): boolean {
  return value.trim().length > 0 && value.length <= 128;
}

export function pixelStateInvariantViolations(
  state: PixelGameState,
): readonly string[] {
  const violations = [...pixelSessionInvariantViolations(state.progress.prepared)];
  if (
    state.stateVersion !== PIXEL_STATE_VERSION ||
    !Number.isFinite(state.lastNowMs)
  ) {
    violations.push("state.envelope");
  }
  state.progress.outcomes.forEach((outcome, index) => {
    if (outcome.roundIndex !== index) {
      violations.push(`state.outcome_${index}.sequence`);
    }
    violations.push(...outcomeViolations(outcome, state.progress.prepared));
  });
  if (state.progress.outcomes.length > PIXEL_SESSION_ROUNDS) {
    violations.push("state.outcome_count");
  }

  switch (state.phase) {
    case "ready":
      if (
        !usablePhaseToken(state.phaseToken) ||
        state.progress.outcomes.length !== state.roundIndex
      ) {
        violations.push("state.ready");
      }
      break;
    case "playing": {
      const puzzle = state.progress.prepared.rounds[state.roundIndex];
      if (
        !usablePhaseToken(state.phaseToken) ||
        state.progress.outcomes.length !== state.roundIndex ||
        state.deadlineMs - state.startedAtMs !== PIXEL_ROUND_DURATION_MS ||
        state.lastNowMs < state.startedAtMs ||
        state.lastNowMs >= state.deadlineMs ||
        !hasUniqueIntegers(state.wrongCellIndexes) ||
        state.wrongCellIndexes.some(
          (index) =>
            index < 0 ||
            index >= puzzle.cells.length ||
            index === puzzle.targetIndex,
        )
      ) {
        violations.push("state.playing");
      }
      break;
    }
    case "round_result":
      if (
        !usablePhaseToken(state.phaseToken) ||
        state.progress.outcomes.length !== state.roundIndex + 1 ||
        state.outcome !== state.progress.outcomes[state.roundIndex]
      ) {
        violations.push("state.round_result");
      }
      break;
    case "session_result":
      if (
        state.progress.outcomes.length !== PIXEL_SESSION_ROUNDS ||
        !Number.isFinite(state.completedAtMs) ||
        state.completedAtMs > state.lastNowMs
      ) {
        violations.push("state.session_result");
      }
      break;
  }
  return violations;
}

export function assertPixelStateInvariants(state: PixelGameState): void {
  const violations = pixelStateInvariantViolations(state);
  if (violations.length > 0) {
    throw new Error(`Pixel state invariant failed: ${violations[0]}`);
  }
}
