import {
  PIXEL_ROUND_DURATION_MS,
  PIXEL_STATE_VERSION,
} from "./constants";
import { isPreparedPixelSessionValid } from "./invariants";
import { scoreFoundRound } from "./scoring";
import type {
  PixelDomainResult,
  PixelGameAction,
  PixelGameState,
  PixelGuard,
  PixelRoundOutcome,
  PixelSessionProgress,
  PlayingState,
  PreparedPixelSession,
  ReadyState,
  RoundIndex,
  RoundResultState,
} from "./types";

function usablePhaseToken(value: string): boolean {
  return value.trim().length > 0 && value.length <= 128;
}

function nextPhaseToken(
  current: string,
  candidate: string,
  suffix: string,
): string {
  return usablePhaseToken(candidate) && candidate !== current
    ? candidate
    : `${current}:${suffix}`.slice(0, 128);
}

function finiteNow(lastNowMs: number, proposedNowMs: number): number | null {
  if (!Number.isFinite(proposedNowMs)) {
    return null;
  }
  return Math.max(lastNowMs, proposedNowMs);
}

function guardMatches(
  state: ReadyState | PlayingState | RoundResultState,
  guard: PixelGuard,
): boolean {
  return (
    state.progress.prepared.sessionId === guard.sessionId &&
    state.roundIndex === guard.roundIndex &&
    state.phaseToken === guard.phaseToken
  );
}

function appendOutcome(
  progress: PixelSessionProgress,
  outcome: PixelRoundOutcome,
): PixelSessionProgress {
  return { ...progress, outcomes: [...progress.outcomes, outcome] };
}

function timeoutState(
  state: PlayingState,
  lastNowMs: number,
  resultPhaseToken: string,
): RoundResultState {
  const puzzle = state.progress.prepared.rounds[state.roundIndex];
  const outcome: PixelRoundOutcome = {
    roundIndex: state.roundIndex,
    puzzleId: puzzle.id,
    result: "timeout",
    startedAtMs: state.startedAtMs,
    endedAtMs: state.deadlineMs,
    elapsedMs: PIXEL_ROUND_DURATION_MS,
    remainingMs: 0,
    wrongCellIndexes: state.wrongCellIndexes,
    score: 0,
  };
  return {
    stateVersion: PIXEL_STATE_VERSION,
    phase: "round_result",
    lastNowMs,
    progress: appendOutcome(state.progress, outcome),
    roundIndex: state.roundIndex,
    phaseToken: nextPhaseToken(
      state.phaseToken,
      resultPhaseToken,
      "result",
    ),
    outcome,
  };
}

export function advancePixelClock(
  state: PlayingState,
  proposedNowMs: number,
  resultPhaseToken: string,
): PlayingState | RoundResultState {
  const nowMs = finiteNow(state.lastNowMs, proposedNowMs);
  if (nowMs === null) {
    return state;
  }
  if (nowMs >= state.deadlineMs) {
    return timeoutState(state, nowMs, resultPhaseToken);
  }
  if (nowMs === state.lastNowMs) {
    return state;
  }
  return { ...state, lastNowMs: nowMs };
}

export function createPixelGameState(
  prepared: PreparedPixelSession,
  nowMsInput = 0,
  phaseToken = "ready:0",
): PixelDomainResult<ReadyState> {
  if (
    !isPreparedPixelSessionValid(prepared) ||
    !Number.isFinite(nowMsInput) ||
    !usablePhaseToken(phaseToken)
  ) {
    return {
      ok: false,
      error: {
        code: "INVALID_SESSION",
        message: "A valid generated session is required.",
      },
    };
  }
  return {
    ok: true,
    value: {
      stateVersion: PIXEL_STATE_VERSION,
      phase: "ready",
      lastNowMs: nowMsInput,
      progress: { prepared, outcomes: [] },
      roundIndex: 0,
      phaseToken,
    },
  };
}

function foundState(
  state: PlayingState,
  nowMs: number,
  resultPhaseToken: string,
): RoundResultState {
  const puzzle = state.progress.prepared.rounds[state.roundIndex];
  const elapsedMs = Math.max(
    0,
    Math.min(PIXEL_ROUND_DURATION_MS, nowMs - state.startedAtMs),
  );
  const remainingMs = PIXEL_ROUND_DURATION_MS - elapsedMs;
  const outcome: PixelRoundOutcome = {
    roundIndex: state.roundIndex,
    puzzleId: puzzle.id,
    result: "found",
    startedAtMs: state.startedAtMs,
    endedAtMs: nowMs,
    elapsedMs,
    remainingMs,
    wrongCellIndexes: state.wrongCellIndexes,
    score: scoreFoundRound(remainingMs, state.wrongCellIndexes.length),
  };
  return {
    stateVersion: PIXEL_STATE_VERSION,
    phase: "round_result",
    lastNowMs: nowMs,
    progress: appendOutcome(state.progress, outcome),
    roundIndex: state.roundIndex,
    phaseToken: nextPhaseToken(
      state.phaseToken,
      resultPhaseToken,
      "result",
    ),
    outcome,
  };
}

export function pixelGameReducer(
  state: PixelGameState,
  action: PixelGameAction,
): PixelGameState {
  switch (action.type) {
    case "START_ROUND": {
      if (state.phase !== "ready" || !guardMatches(state, action.guard)) {
        return state;
      }
      const nowMs = finiteNow(state.lastNowMs, action.nowMs);
      if (nowMs === null) {
        return state;
      }
      return {
        stateVersion: PIXEL_STATE_VERSION,
        phase: "playing",
        lastNowMs: nowMs,
        progress: state.progress,
        roundIndex: state.roundIndex,
        phaseToken: nextPhaseToken(
          state.phaseToken,
          action.playingPhaseToken,
          "playing",
        ),
        startedAtMs: nowMs,
        deadlineMs: nowMs + PIXEL_ROUND_DURATION_MS,
        wrongCellIndexes: [],
      };
    }

    case "CLOCK_TICK": {
      if (state.phase !== "playing" || !guardMatches(state, action.guard)) {
        return state;
      }
      return advancePixelClock(
        state,
        action.nowMs,
        action.resultPhaseToken,
      );
    }

    case "TAP_CELL": {
      if (
        state.phase !== "playing" ||
        !guardMatches(state, action.guard) ||
        !Number.isFinite(action.nowMs)
      ) {
        return state;
      }
      const advanced = advancePixelClock(
        state,
        action.nowMs,
        action.resultPhaseToken,
      );
      if (advanced.phase !== "playing") {
        return advanced;
      }
      const puzzle = advanced.progress.prepared.rounds[advanced.roundIndex];
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
        wrongCellIndexes: [...advanced.wrongCellIndexes, action.cellIndex],
      };
    }

    case "NEXT_ROUND": {
      if (
        state.phase !== "round_result" ||
        !guardMatches(state, action.guard)
      ) {
        return state;
      }
      const nowMs = finiteNow(state.lastNowMs, action.nowMs);
      if (nowMs === null) {
        return state;
      }
      if (state.roundIndex === 4) {
        return {
          stateVersion: PIXEL_STATE_VERSION,
          phase: "session_result",
          lastNowMs: nowMs,
          progress: state.progress,
          completedAtMs: nowMs,
        };
      }
      const roundIndex = (state.roundIndex + 1) as RoundIndex;
      return {
        stateVersion: PIXEL_STATE_VERSION,
        phase: "ready",
        lastNowMs: nowMs,
        progress: state.progress,
        roundIndex,
        phaseToken: nextPhaseToken(
          state.phaseToken,
          action.nextPhaseToken,
          `ready:${roundIndex}`,
        ),
      };
    }
  }
}

export function guardForPixelState(
  state: ReadyState | PlayingState | RoundResultState,
): PixelGuard {
  return {
    sessionId: state.progress.prepared.sessionId,
    roundIndex: state.roundIndex,
    phaseToken: state.phaseToken,
  };
}
