import type {
  FocusRunBoard,
  FocusRunOutcome,
  FocusRunState,
} from "./types";

export function selectFocusRunBoard(
  state: FocusRunState,
): FocusRunBoard | null {
  return state.phase === "ready" ||
    state.phase === "playing" ||
    state.phase === "round_result"
    ? state.board
    : null;
}

export function selectFocusRunRemainingMs(
  state: FocusRunState,
  proposedNowMs = state.lastNowMs,
): number {
  if (state.phase !== "playing" || !Number.isFinite(proposedNowMs)) return 0;
  const effectiveNowMs = Math.max(state.lastNowMs, proposedNowMs);
  return Math.max(
    0,
    Math.min(state.board.durationMs, state.deadlineMs - effectiveNowMs),
  );
}

export function selectFocusRunHud(state: FocusRunState) {
  const { aggregates } = state.progress;
  return {
    boardsPlayed: aggregates.boardsPlayed,
    finds: aggregates.finds,
    findStreak: aggregates.findStreak,
    bestFindStreak: aggregates.bestFindStreak,
    cleanStreak: aggregates.cleanStreak,
    bestCleanStreak: aggregates.bestCleanStreak,
    charges: aggregates.charges,
    score: aggregates.score,
  } as const;
}

export function selectFocusRunRecentOutcomes(
  state: FocusRunState,
): readonly FocusRunOutcome[] {
  return state.progress.recentOutcomes;
}

export function selectFocusRunIsCheckpoint(state: FocusRunState): boolean {
  return state.phase === "checkpoint";
}

export function selectFocusRunRecoveryActive(state: FocusRunState): boolean {
  const board = selectFocusRunBoard(state);
  return board?.recoveryBonusMs === 2_000;
}
