import {
  GLYPH_FAMILIES,
  normalizePixelSeed,
  scoreFoundRound,
  stableSeedHash,
  type GlyphFamilyId,
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
  FOCUS_RUN_STARTING_CHARGES,
  FOCUS_RUN_STATE_VERSION,
  FOCUS_RUN_STREAK_RESTORE_INTERVAL,
} from "./constants";
import { generateFocusRunBoard } from "./generator";
import type {
  FocusRunAction,
  FocusRunAggregates,
  FocusRunCheckpointState,
  FocusRunConfig,
  FocusRunDomainResult,
  FocusRunGuard,
  FocusRunOutcome,
  FocusRunPlayingState,
  FocusRunProgress,
  FocusRunReadyState,
  FocusRunResultState,
  FocusRunRoundResultState,
  FocusRunState,
} from "./types";

function emptyFamilyFinds(): Record<GlyphFamilyId, number> {
  return Object.fromEntries(
    GLYPH_FAMILIES.map((familyId) => [familyId, 0]),
  ) as Record<GlyphFamilyId, number>;
}

function initialAggregates(): FocusRunAggregates {
  return {
    boardsPlayed: 0,
    finds: 0,
    timeouts: 0,
    findStreak: 0,
    bestFindStreak: 0,
    cleanStreak: 0,
    bestCleanStreak: 0,
    charges: FOCUS_RUN_STARTING_CHARGES,
    score: 0,
    familyFinds: emptyFamilyFinds(),
  };
}

function usablePhaseToken(value: string): boolean {
  return value.trim().length > 0 && value.length <= 128;
}

function nextPhaseToken(current: string, candidate: string, suffix: string): string {
  return usablePhaseToken(candidate) && candidate !== current
    ? candidate
    : `${current}:${suffix}`.slice(0, 128);
}

function finiteNow(lastNowMs: number, proposedNowMs: number): number | null {
  if (!Number.isFinite(proposedNowMs)) return null;
  return Math.max(lastNowMs, proposedNowMs);
}

function boardNumberForState(
  state: Exclude<FocusRunState, FocusRunResultState>,
): number {
  return state.phase === "checkpoint"
    ? state.progress.aggregates.boardsPlayed
    : state.board.boardNumber;
}

function guardMatches(
  state: Exclude<FocusRunState, FocusRunResultState>,
  guard: FocusRunGuard,
): boolean {
  return (
    state.progress.prepared.runId === guard.runId &&
    boardNumberForState(state) === guard.boardNumber &&
    state.phaseToken === guard.phaseToken
  );
}

function appendRecent(
  progress: FocusRunProgress,
  outcome: FocusRunOutcome,
): readonly FocusRunOutcome[] {
  return [...progress.recentOutcomes, outcome].slice(
    -FOCUS_RUN_RECENT_OUTCOME_LIMIT,
  );
}

function safeScoreAdd(total: number, score: number): number {
  return Math.min(Number.MAX_SAFE_INTEGER, total + score);
}

export function createFocusRunState(
  seedInput: string,
  nowMsInput = 0,
  phaseToken = "focus-ready:1",
  config: FocusRunConfig = {},
): FocusRunDomainResult<FocusRunReadyState> {
  const seed = normalizePixelSeed(seedInput);
  const variant = config.variant ?? "focus";
  if (
    seed === null ||
    !Number.isFinite(nowMsInput) ||
    !usablePhaseToken(phaseToken) ||
    (variant !== "focus" && variant !== "weekly")
  ) {
    return {
      ok: false,
      error: {
        code: seed === null ? "INVALID_SEED" : "INVALID_SESSION",
        message: "A valid Focus Run seed and setup are required.",
      },
    };
  }

  const maxBoards = variant === "weekly" ? 15 : FOCUS_RUN_MAX_BOARD_NUMBER;
  const prepared = {
    schemaVersion: FOCUS_RUN_SCHEMA_VERSION,
    generationVersion: FOCUS_RUN_GENERATION_VERSION,
    rulesVersion: FOCUS_RUN_RULES_VERSION,
    runId: `opo-focus-${variant}-g${FOCUS_RUN_GENERATION_VERSION}-${stableSeedHash(seed)}`,
    seed,
    variant,
    maxBoards,
  } as const;
  const progress: FocusRunProgress = {
    prepared,
    aggregates: initialAggregates(),
    recentOutcomes: [],
  };

  return {
    ok: true,
    value: {
      stateVersion: FOCUS_RUN_STATE_VERSION,
      phase: "ready",
      lastNowMs: nowMsInput,
      progress,
      board: generateFocusRunBoard({ seed, boardNumber: 1 }),
      phaseToken,
    },
  };
}

function timeoutState(
  state: FocusRunPlayingState,
  lastNowMs: number,
  resultPhaseToken: string,
): FocusRunRoundResultState {
  const aggregates = state.progress.aggregates;
  const outcome: FocusRunOutcome = {
    boardNumber: state.board.boardNumber,
    puzzleId: state.board.puzzle.id,
    result: "timeout",
    startedAtMs: state.startedAtMs,
    endedAtMs: state.deadlineMs,
    elapsedMs: state.board.durationMs,
    remainingMs: 0,
    durationMs: state.board.durationMs,
    wrongCellIndexes: state.wrongCellIndexes,
    clean: false,
    score: 0,
    chargeDelta: -1,
  };
  const progress: FocusRunProgress = {
    ...state.progress,
    aggregates: {
      ...aggregates,
      boardsPlayed: aggregates.boardsPlayed + 1,
      timeouts: aggregates.timeouts + 1,
      findStreak: 0,
      cleanStreak: 0,
      charges: Math.max(0, aggregates.charges - 1),
    },
    recentOutcomes: appendRecent(state.progress, outcome),
  };
  return {
    stateVersion: FOCUS_RUN_STATE_VERSION,
    phase: "round_result",
    lastNowMs,
    progress,
    board: state.board,
    phaseToken: nextPhaseToken(state.phaseToken, resultPhaseToken, "timeout"),
    outcome,
  };
}

export function advanceFocusRunClock(
  state: FocusRunPlayingState,
  proposedNowMs: number,
  resultPhaseToken: string,
): FocusRunPlayingState | FocusRunRoundResultState {
  const nowMs = finiteNow(state.lastNowMs, proposedNowMs);
  if (nowMs === null) return state;
  if (nowMs >= state.deadlineMs) {
    return timeoutState(state, nowMs, resultPhaseToken);
  }
  if (nowMs === state.lastNowMs) return state;
  return { ...state, lastNowMs: nowMs };
}

function foundState(
  state: FocusRunPlayingState,
  nowMs: number,
  resultPhaseToken: string,
): FocusRunRoundResultState {
  const aggregates = state.progress.aggregates;
  const elapsedMs = Math.max(
    0,
    Math.min(state.board.durationMs, nowMs - state.startedAtMs),
  );
  const remainingMs = state.board.durationMs - elapsedMs;
  const clean = state.wrongCellIndexes.length === 0;
  const findStreak = aggregates.findStreak + 1;
  const cleanStreak = clean ? aggregates.cleanStreak + 1 : 0;
  const shouldRestore =
    findStreak % FOCUS_RUN_STREAK_RESTORE_INTERVAL === 0 &&
    aggregates.charges < FOCUS_RUN_MAX_CHARGES;
  const charges = shouldRestore ? aggregates.charges + 1 : aggregates.charges;
  const score = scoreFoundRound(remainingMs, state.wrongCellIndexes.length);
  const familyId = state.board.puzzle.familyId;
  const outcome: FocusRunOutcome = {
    boardNumber: state.board.boardNumber,
    puzzleId: state.board.puzzle.id,
    result: "found",
    startedAtMs: state.startedAtMs,
    endedAtMs: nowMs,
    elapsedMs,
    remainingMs,
    durationMs: state.board.durationMs,
    wrongCellIndexes: state.wrongCellIndexes,
    clean,
    score,
    chargeDelta: shouldRestore ? 1 : 0,
  };
  const progress: FocusRunProgress = {
    ...state.progress,
    aggregates: {
      ...aggregates,
      boardsPlayed: aggregates.boardsPlayed + 1,
      finds: aggregates.finds + 1,
      findStreak,
      bestFindStreak: Math.max(aggregates.bestFindStreak, findStreak),
      cleanStreak,
      bestCleanStreak: Math.max(aggregates.bestCleanStreak, cleanStreak),
      charges,
      score: safeScoreAdd(aggregates.score, score),
      familyFinds: {
        ...aggregates.familyFinds,
        [familyId]: aggregates.familyFinds[familyId] + 1,
      },
    },
    recentOutcomes: appendRecent(state.progress, outcome),
  };
  return {
    stateVersion: FOCUS_RUN_STATE_VERSION,
    phase: "round_result",
    lastNowMs: nowMs,
    progress,
    board: state.board,
    phaseToken: nextPhaseToken(state.phaseToken, resultPhaseToken, "found"),
    outcome,
  };
}

function readyForNextBoard(
  state: FocusRunRoundResultState | FocusRunCheckpointState,
  nowMs: number,
  nextPhaseTokenCandidate: string,
): FocusRunReadyState {
  const previousOutcome = state.progress.recentOutcomes.at(-1);
  const boardNumber = state.progress.aggregates.boardsPlayed + 1;
  const recoveryBonusMs =
    previousOutcome?.result === "timeout" ? FOCUS_RUN_RECOVERY_BONUS_MS : 0;
  return {
    stateVersion: FOCUS_RUN_STATE_VERSION,
    phase: "ready",
    lastNowMs: nowMs,
    progress: state.progress,
    board: generateFocusRunBoard({
      seed: state.progress.prepared.seed,
      boardNumber,
      recoveryBonusMs,
    }),
    phaseToken: nextPhaseToken(
      state.phaseToken,
      nextPhaseTokenCandidate,
      `ready:${boardNumber}`,
    ),
  };
}

function finishState(
  state: FocusRunRoundResultState | FocusRunCheckpointState,
  nowMs: number,
  finishReason: FocusRunResultState["finishReason"],
): FocusRunResultState {
  return {
    stateVersion: FOCUS_RUN_STATE_VERSION,
    phase: "run_result",
    lastNowMs: nowMs,
    progress: state.progress,
    completedAtMs: nowMs,
    finishReason,
  };
}

export function focusRunReducer(
  state: FocusRunState,
  action: FocusRunAction,
): FocusRunState {
  switch (action.type) {
    case "START_BOARD": {
      if (state.phase !== "ready" || !guardMatches(state, action.guard)) {
        return state;
      }
      const nowMs = finiteNow(state.lastNowMs, action.nowMs);
      if (nowMs === null) return state;
      return {
        stateVersion: FOCUS_RUN_STATE_VERSION,
        phase: "playing",
        lastNowMs: nowMs,
        progress: state.progress,
        board: state.board,
        phaseToken: nextPhaseToken(
          state.phaseToken,
          action.playingPhaseToken,
          "playing",
        ),
        startedAtMs: nowMs,
        deadlineMs: nowMs + state.board.durationMs,
        wrongCellIndexes: [],
      };
    }

    case "CLOCK_TICK": {
      if (state.phase !== "playing" || !guardMatches(state, action.guard)) {
        return state;
      }
      return advanceFocusRunClock(state, action.nowMs, action.resultPhaseToken);
    }

    case "TAP_CELL": {
      if (
        state.phase !== "playing" ||
        !guardMatches(state, action.guard) ||
        !Number.isFinite(action.nowMs)
      ) {
        return state;
      }
      const advanced = advanceFocusRunClock(
        state,
        action.nowMs,
        action.resultPhaseToken,
      );
      if (advanced.phase !== "playing") return advanced;
      const puzzle = advanced.board.puzzle;
      if (
        !Number.isInteger(action.cellIndex) ||
        action.cellIndex < 0 ||
        action.cellIndex >= puzzle.cells.length
      ) {
        return advanced;
      }
      if (action.cellIndex === puzzle.targetIndex) {
        return foundState(
          advanced,
          advanced.lastNowMs,
          action.resultPhaseToken,
        );
      }
      if (advanced.wrongCellIndexes.includes(action.cellIndex)) {
        return advanced;
      }
      return {
        ...advanced,
        progress:
          advanced.progress.aggregates.cleanStreak === 0
            ? advanced.progress
            : {
                ...advanced.progress,
                aggregates: {
                  ...advanced.progress.aggregates,
                  cleanStreak: 0,
                },
              },
        wrongCellIndexes: [...advanced.wrongCellIndexes, action.cellIndex],
      };
    }

    case "ADVANCE_AFTER_RESULT": {
      if (state.phase !== "round_result" || !guardMatches(state, action.guard)) {
        return state;
      }
      const nowMs = finiteNow(state.lastNowMs, action.nowMs);
      if (nowMs === null) return state;
      const { aggregates, prepared } = state.progress;
      if (aggregates.boardsPlayed >= prepared.maxBoards) {
        return finishState(
          state,
          nowMs,
          prepared.variant === "weekly"
            ? "weekly_completed"
            : "board_limit_reached",
        );
      }
      if (aggregates.charges === 0) {
        return finishState(state, nowMs, "charges_exhausted");
      }
      if (aggregates.boardsPlayed % FOCUS_RUN_CHECKPOINT_INTERVAL === 0) {
        return {
          stateVersion: FOCUS_RUN_STATE_VERSION,
          phase: "checkpoint",
          lastNowMs: nowMs,
          progress: state.progress,
          checkpointNumber:
            aggregates.boardsPlayed / FOCUS_RUN_CHECKPOINT_INTERVAL,
          phaseToken: nextPhaseToken(
            state.phaseToken,
            action.nextPhaseToken,
            "checkpoint",
          ),
        };
      }
      return readyForNextBoard(state, nowMs, action.nextPhaseToken);
    }

    case "CONTINUE_RUN": {
      if (state.phase !== "checkpoint" || !guardMatches(state, action.guard)) {
        return state;
      }
      const nowMs = finiteNow(state.lastNowMs, action.nowMs);
      if (nowMs === null) return state;
      return readyForNextBoard(state, nowMs, action.nextPhaseToken);
    }

    case "FINISH_RUN": {
      if (state.phase !== "checkpoint" || !guardMatches(state, action.guard)) {
        return state;
      }
      const nowMs = finiteNow(state.lastNowMs, action.nowMs);
      if (nowMs === null) return state;
      return finishState(state, nowMs, "player_finished");
    }
  }
}

export function guardForFocusRunState(
  state: Exclude<FocusRunState, FocusRunResultState>,
): FocusRunGuard {
  return {
    runId: state.progress.prepared.runId,
    boardNumber: boardNumberForState(state),
    phaseToken: state.phaseToken,
  };
}
