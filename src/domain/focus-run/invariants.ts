import {
  GLYPH_FAMILIES,
  normalizePixelSeed,
  pixelPuzzleInvariantViolations,
  scoreFoundRound,
} from "../pixel";
import {
  FOCUS_RUN_CHECKPOINT_INTERVAL,
  FOCUS_RUN_GENERATION_VERSION,
  FOCUS_RUN_MAX_BOARD_NUMBER,
  FOCUS_RUN_MAX_CHARGES,
  FOCUS_RUN_RECENT_OUTCOME_LIMIT,
  FOCUS_RUN_RECOVERY_BONUS_MS,
  FOCUS_RUN_RULES_VERSION,
  FOCUS_RUN_SCHEMA_VERSION,
  FOCUS_RUN_STATE_VERSION,
  focusRunBaseDurationMs,
} from "./constants";
import {
  focusRunDifficultyForBoard,
  isFocusRunBoardNumber,
} from "./generator";
import type {
  FocusRunBoard,
  FocusRunOutcome,
  FocusRunState,
} from "./types";

function safeCount(value: unknown, maximum = Number.MAX_SAFE_INTEGER): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= maximum
  );
}

function usablePhaseToken(value: string): boolean {
  return value.trim().length > 0 && value.length <= 128;
}

function hasUniqueIntegers(values: readonly number[]): boolean {
  return values.every(Number.isInteger) && new Set(values).size === values.length;
}

function boardViolations(board: FocusRunBoard, path: string): string[] {
  const violations: string[] = [];
  if (!isFocusRunBoardNumber(board.boardNumber)) {
    violations.push(`${path}.number`);
    return violations;
  }
  const expectedBase = focusRunBaseDurationMs(board.boardNumber);
  if (
    board.difficulty !== focusRunDifficultyForBoard(board.boardNumber) ||
    board.baseDurationMs !== expectedBase ||
    (board.recoveryBonusMs !== 0 &&
      board.recoveryBonusMs !== FOCUS_RUN_RECOVERY_BONUS_MS) ||
    board.durationMs !== board.baseDurationMs + board.recoveryBonusMs ||
    board.puzzle.difficulty !== board.difficulty ||
    board.puzzle.roundIndex !== (board.boardNumber - 1) % 5
  ) {
    violations.push(`${path}.policy`);
  }
  violations.push(
    ...pixelPuzzleInvariantViolations(board.puzzle).map(
      (violation) => `${path}.${violation}`,
    ),
  );
  return violations;
}

function outcomeViolations(outcome: FocusRunOutcome, path: string): string[] {
  const violations: string[] = [];
  if (
    !isFocusRunBoardNumber(outcome.boardNumber) ||
    outcome.puzzleId.length < 1 ||
    outcome.puzzleId.length > 96 ||
    !Number.isFinite(outcome.startedAtMs) ||
    !Number.isFinite(outcome.endedAtMs) ||
    outcome.endedAtMs < outcome.startedAtMs ||
    !Number.isFinite(outcome.elapsedMs) ||
    !Number.isFinite(outcome.remainingMs) ||
    outcome.elapsedMs < 0 ||
    outcome.remainingMs < 0 ||
    !hasUniqueIntegers(outcome.wrongCellIndexes)
  ) {
    violations.push(`${path}.shape`);
    return violations;
  }
  const baseDuration = focusRunBaseDurationMs(outcome.boardNumber);
  if (
    outcome.durationMs !== baseDuration &&
    outcome.durationMs !== baseDuration + FOCUS_RUN_RECOVERY_BONUS_MS
  ) {
    violations.push(`${path}.duration`);
  }
  if (outcome.result === "found") {
    if (
      Math.abs(outcome.elapsedMs + outcome.remainingMs - outcome.durationMs) >
        0.001 ||
      outcome.score !==
        scoreFoundRound(outcome.remainingMs, outcome.wrongCellIndexes.length) ||
      (outcome.chargeDelta !== 0 && outcome.chargeDelta !== 1) ||
      Math.abs(outcome.endedAtMs - outcome.startedAtMs - outcome.elapsedMs) >
        0.001 ||
      outcome.clean !== (outcome.wrongCellIndexes.length === 0)
    ) {
      violations.push(`${path}.found`);
    }
  } else if (
    outcome.result !== "timeout" ||
    outcome.elapsedMs !== outcome.durationMs ||
    outcome.endedAtMs - outcome.startedAtMs !== outcome.durationMs ||
    outcome.remainingMs !== 0 ||
    outcome.score !== 0 ||
    outcome.chargeDelta !== -1 ||
    outcome.clean
  ) {
    violations.push(`${path}.timeout`);
  }
  return violations;
}

export function focusRunStateInvariantViolations(
  state: FocusRunState,
): readonly string[] {
  const violations: string[] = [];
  const { prepared, aggregates, recentOutcomes } = state.progress;
  if (
    state.stateVersion !== FOCUS_RUN_STATE_VERSION ||
    !Number.isFinite(state.lastNowMs)
  ) {
    violations.push("state.envelope");
  }
  if (
    prepared.schemaVersion !== FOCUS_RUN_SCHEMA_VERSION ||
    prepared.generationVersion !== FOCUS_RUN_GENERATION_VERSION ||
    prepared.rulesVersion !== FOCUS_RUN_RULES_VERSION ||
    normalizePixelSeed(prepared.seed) !== prepared.seed ||
    prepared.runId.length < 1 ||
    prepared.runId.length > 128 ||
    (prepared.variant !== "focus" && prepared.variant !== "weekly") ||
    prepared.maxBoards !==
      (prepared.variant === "weekly" ? 15 : FOCUS_RUN_MAX_BOARD_NUMBER)
  ) {
    violations.push("state.prepared");
  }
  if (
    !safeCount(aggregates.boardsPlayed, prepared.maxBoards) ||
    !safeCount(aggregates.finds, aggregates.boardsPlayed) ||
    !safeCount(aggregates.timeouts, aggregates.boardsPlayed) ||
    aggregates.finds + aggregates.timeouts !== aggregates.boardsPlayed ||
    !safeCount(aggregates.findStreak, aggregates.finds) ||
    !safeCount(aggregates.bestFindStreak, aggregates.finds) ||
    aggregates.bestFindStreak < aggregates.findStreak ||
    !safeCount(aggregates.cleanStreak, aggregates.findStreak) ||
    !safeCount(aggregates.bestCleanStreak, aggregates.bestFindStreak) ||
    aggregates.bestCleanStreak < aggregates.cleanStreak ||
    !safeCount(aggregates.charges, FOCUS_RUN_MAX_CHARGES) ||
    !safeCount(aggregates.score)
  ) {
    violations.push("state.aggregates");
  }
  const familyKeys = Object.keys(aggregates.familyFinds).sort();
  const expectedFamilyKeys = [...GLYPH_FAMILIES].sort();
  const familyFindTotal = GLYPH_FAMILIES.reduce(
    (total, familyId) => total + aggregates.familyFinds[familyId],
    0,
  );
  if (
    familyKeys.length !== expectedFamilyKeys.length ||
    familyKeys.some((key, index) => key !== expectedFamilyKeys[index]) ||
    GLYPH_FAMILIES.some(
      (familyId) => !safeCount(aggregates.familyFinds[familyId], aggregates.finds),
    ) ||
    familyFindTotal !== aggregates.finds
  ) {
    violations.push("state.family_finds");
  }
  if (
    recentOutcomes.length > FOCUS_RUN_RECENT_OUTCOME_LIMIT ||
    recentOutcomes.length > aggregates.boardsPlayed
  ) {
    violations.push("state.recent_count");
  }
  const firstRecentBoard = aggregates.boardsPlayed - recentOutcomes.length + 1;
  recentOutcomes.forEach((outcome, index) => {
    if (outcome.boardNumber !== firstRecentBoard + index) {
      violations.push(`state.recent_${index}.sequence`);
    }
    violations.push(...outcomeViolations(outcome, `state.recent_${index}`));
  });

  switch (state.phase) {
    case "ready":
      violations.push(...boardViolations(state.board, "state.board"));
      if (
        !usablePhaseToken(state.phaseToken) ||
        state.board.boardNumber !== aggregates.boardsPlayed + 1 ||
        aggregates.charges === 0
      ) {
        violations.push("state.ready");
      }
      break;
    case "playing":
      violations.push(...boardViolations(state.board, "state.board"));
      if (
        !usablePhaseToken(state.phaseToken) ||
        state.board.boardNumber !== aggregates.boardsPlayed + 1 ||
        state.deadlineMs - state.startedAtMs !== state.board.durationMs ||
        state.lastNowMs < state.startedAtMs ||
        state.lastNowMs >= state.deadlineMs ||
        !hasUniqueIntegers(state.wrongCellIndexes) ||
        state.wrongCellIndexes.some(
          (index) =>
            index < 0 ||
            index >= state.board.puzzle.cells.length ||
            index === state.board.puzzle.targetIndex,
        )
      ) {
        violations.push("state.playing");
      }
      break;
    case "round_result":
      violations.push(...boardViolations(state.board, "state.board"));
      if (
        !usablePhaseToken(state.phaseToken) ||
        state.board.boardNumber !== aggregates.boardsPlayed ||
        state.outcome !== recentOutcomes.at(-1) ||
        state.outcome.puzzleId !== state.board.puzzle.id
      ) {
        violations.push("state.round_result");
      }
      break;
    case "checkpoint":
      if (
        !usablePhaseToken(state.phaseToken) ||
        aggregates.boardsPlayed === 0 ||
        aggregates.boardsPlayed % FOCUS_RUN_CHECKPOINT_INTERVAL !== 0 ||
        state.checkpointNumber !==
          aggregates.boardsPlayed / FOCUS_RUN_CHECKPOINT_INTERVAL ||
        aggregates.charges === 0 ||
        aggregates.boardsPlayed >= prepared.maxBoards
      ) {
        violations.push("state.checkpoint");
      }
      break;
    case "run_result":
      if (
        !Number.isFinite(state.completedAtMs) ||
        state.completedAtMs > state.lastNowMs ||
        (state.finishReason === "charges_exhausted" && aggregates.charges !== 0) ||
        (state.finishReason === "weekly_completed" &&
          (prepared.variant !== "weekly" || aggregates.boardsPlayed !== 15)) ||
        (state.finishReason === "board_limit_reached" &&
          (prepared.variant !== "focus" ||
            aggregates.boardsPlayed !== FOCUS_RUN_MAX_BOARD_NUMBER)) ||
        (state.finishReason === "player_finished" &&
          (aggregates.boardsPlayed === 0 ||
            aggregates.boardsPlayed % FOCUS_RUN_CHECKPOINT_INTERVAL !== 0))
      ) {
        violations.push("state.run_result");
      }
      break;
  }
  return violations;
}

export function isFocusRunStateValid(state: FocusRunState): boolean {
  return focusRunStateInvariantViolations(state).length === 0;
}

export function assertFocusRunStateInvariants(state: FocusRunState): void {
  const violations = focusRunStateInvariantViolations(state);
  if (violations.length > 0) {
    throw new Error(`Focus Run invariant failed: ${violations[0]}`);
  }
}
