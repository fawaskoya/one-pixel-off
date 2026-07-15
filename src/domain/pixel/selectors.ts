import {
  PIXEL_MAX_SESSION_SCORE,
  PIXEL_ROUND_DURATION_MS,
  PIXEL_SESSION_ROUNDS,
} from "./constants";
import { totalPixelScore } from "./scoring";
import type {
  PixelGameState,
  PixelPuzzleDescriptor,
  PixelRoundOutcome,
} from "./types";

export function selectCurrentPuzzle(
  state: PixelGameState,
): PixelPuzzleDescriptor {
  const index =
    state.phase === "session_result"
      ? 4
      : state.roundIndex;
  return state.progress.prepared.rounds[index];
}

export function selectRemainingMs(
  state: PixelGameState,
  proposedNowMs = state.lastNowMs,
): number {
  if (state.phase !== "playing" || !Number.isFinite(proposedNowMs)) {
    return 0;
  }
  const effectiveNowMs = Math.max(state.lastNowMs, proposedNowMs);
  return Math.max(
    0,
    Math.min(PIXEL_ROUND_DURATION_MS, state.deadlineMs - effectiveNowMs),
  );
}

export function selectRoundProgress(state: PixelGameState): Readonly<{
  current: number;
  total: typeof PIXEL_SESSION_ROUNDS;
}> {
  return {
    current:
      state.phase === "session_result"
        ? PIXEL_SESSION_ROUNDS
        : state.roundIndex + 1,
    total: PIXEL_SESSION_ROUNDS,
  };
}

export function selectOutcomes(
  state: PixelGameState,
): readonly PixelRoundOutcome[] {
  return state.progress.outcomes;
}

export function selectTotalScore(state: PixelGameState): number {
  return totalPixelScore(state.progress.outcomes);
}

export function selectFoundRounds(state: PixelGameState): number {
  return state.progress.outcomes.filter(
    (outcome) => outcome.result === "found",
  ).length;
}

export function selectTotalWrongTaps(state: PixelGameState): number {
  const resolved = state.progress.outcomes.reduce(
    (total, outcome) => total + outcome.wrongCellIndexes.length,
    0,
  );
  return (
    resolved +
    (state.phase === "playing" ? state.wrongCellIndexes.length : 0)
  );
}

export function selectScoreBounds(): Readonly<{
  minimum: 0;
  maximum: typeof PIXEL_MAX_SESSION_SCORE;
}> {
  return { minimum: 0, maximum: PIXEL_MAX_SESSION_SCORE };
}

export function selectResultPattern(
  state: PixelGameState,
): readonly ("found" | "timeout")[] {
  return state.progress.outcomes.map((outcome) => outcome.result);
}
