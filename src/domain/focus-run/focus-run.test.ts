import { describe, expect, it } from "vitest";

import {
  GLYPH_FAMILIES,
  PIXEL_DIFFICULTY_CONFIG,
  type MutationKind,
} from "../pixel";
import {
  FOCUS_RUN_MAX_BOARD_NUMBER,
  FOCUS_RUN_RECENT_OUTCOME_LIMIT,
  assertFocusRunStateInvariants,
  createFocusRunState,
  focusRunDifficultyForBoard,
  focusRunIsoWeekKeyFromEpochMs,
  focusRunReducer,
  focusRunStateInvariantViolations,
  focusRunWeeklySeedAt,
  generateFocusRunBoard,
  guardForFocusRunState,
  selectFocusRunHud,
  selectFocusRunRecoveryActive,
  selectFocusRunRemainingMs,
  type FocusRunCheckpointState,
  type FocusRunPlayingState,
  type FocusRunReadyState,
  type FocusRunRoundResultState,
  type FocusRunState,
} from "./index";

function ready(
  seed = "focus-test-seed",
  variant: "focus" | "weekly" = "focus",
): FocusRunReadyState {
  const result = createFocusRunState(seed, 1_000, "ready:1", { variant });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  assertFocusRunStateInvariants(result.value);
  return result.value;
}

function start(state: FocusRunReadyState): FocusRunPlayingState {
  const next = focusRunReducer(state, {
    type: "START_BOARD",
    nowMs: state.lastNowMs + 100,
    guard: guardForFocusRunState(state),
    playingPhaseToken: `playing:${state.board.boardNumber}`,
  });
  expect(next.phase).toBe("playing");
  if (next.phase !== "playing") throw new Error("Expected playing state");
  assertFocusRunStateInvariants(next);
  return next;
}

function find(
  state: FocusRunPlayingState,
  elapsedMs = 1_000,
): FocusRunRoundResultState {
  const next = focusRunReducer(state, {
    type: "TAP_CELL",
    nowMs: state.startedAtMs + elapsedMs,
    guard: guardForFocusRunState(state),
    cellIndex: state.board.puzzle.targetIndex,
    resultPhaseToken: `result:${state.board.boardNumber}`,
  });
  expect(next.phase).toBe("round_result");
  if (next.phase !== "round_result") throw new Error("Expected result state");
  assertFocusRunStateInvariants(next);
  return next;
}

function timeout(state: FocusRunPlayingState): FocusRunRoundResultState {
  const next = focusRunReducer(state, {
    type: "CLOCK_TICK",
    nowMs: state.deadlineMs,
    guard: guardForFocusRunState(state),
    resultPhaseToken: `timeout:${state.board.boardNumber}`,
  });
  expect(next.phase).toBe("round_result");
  if (next.phase !== "round_result") throw new Error("Expected result state");
  assertFocusRunStateInvariants(next);
  return next;
}

function advance(state: FocusRunRoundResultState): FocusRunState {
  const next = focusRunReducer(state, {
    type: "ADVANCE_AFTER_RESULT",
    nowMs: state.lastNowMs + 50,
    guard: guardForFocusRunState(state),
    nextPhaseToken: `next:${state.board.boardNumber}`,
  });
  assertFocusRunStateInvariants(next);
  return next;
}

function continueCheckpoint(
  state: FocusRunCheckpointState,
): FocusRunReadyState {
  const next = focusRunReducer(state, {
    type: "CONTINUE_RUN",
    nowMs: state.lastNowMs + 50,
    guard: guardForFocusRunState(state),
    nextPhaseToken: `continue:${state.checkpointNumber}`,
  });
  expect(next.phase).toBe("ready");
  if (next.phase !== "ready") throw new Error("Expected ready state");
  assertFocusRunStateInvariants(next);
  return next;
}

function nextReady(state: FocusRunRoundResultState): FocusRunReadyState {
  const next = advance(state);
  if (next.phase === "checkpoint") return continueCheckpoint(next);
  expect(next.phase).toBe("ready");
  if (next.phase !== "ready") throw new Error("Expected ready state");
  return next;
}

function solveBoards(
  initial: FocusRunReadyState,
  count: number,
): FocusRunRoundResultState {
  let state = initial;
  let result = find(start(state));
  for (let solved = 1; solved < count; solved += 1) {
    state = nextReady(result);
    result = find(start(state));
  }
  return result;
}

describe("Focus Run deterministic board policy", () => {
  it("derives stable, distinct boards from run seed and board number", () => {
    const first = generateFocusRunBoard({ seed: "stable-run", boardNumber: 17 });
    expect(generateFocusRunBoard({ seed: "stable-run", boardNumber: 17 })).toEqual(
      first,
    );
    expect(generateFocusRunBoard({ seed: "stable-run", boardNumber: 18 }).puzzle.id)
      .not.toBe(first.puzzle.id);
    expect(generateFocusRunBoard({ seed: "different-run", boardNumber: 17 }).puzzle)
      .not.toEqual(first.puzzle);
  });

  it("uses every family exactly once in each deterministic eight-board deck", () => {
    for (const blockStart of [1, 9, 17]) {
      const families = Array.from({ length: 8 }, (_, offset) =>
        generateFocusRunBoard({
          seed: "family-deck",
          boardNumber: blockStart + offset,
        }).puzzle.familyId,
      );
      expect(new Set(families)).toEqual(new Set(GLYPH_FAMILIES));
    }
  });

  it("applies the approved sector ramp without going beyond expert", () => {
    expect(Array.from({ length: 5 }, (_, index) => focusRunDifficultyForBoard(index + 1)))
      .toEqual(["beginner", "steady", "tricky", "tricky", "expert"]);
    expect(Array.from({ length: 5 }, (_, index) => focusRunDifficultyForBoard(index + 6)))
      .toEqual(["steady", "tricky", "tricky", "expert", "expert"]);
    expect(Array.from({ length: 5 }, (_, index) => focusRunDifficultyForBoard(index + 11)))
      .toEqual(["tricky", "tricky", "expert", "expert", "expert"]);
    expect(focusRunDifficultyForBoard(16)).toBe("expert");
    expect(focusRunDifficultyForBoard(99_999)).toBe("expert");
  });

  it("keeps every dense Expert board above the generation-2 visibility floor", () => {
    const floors = {
      offset: 5,
      size: 5,
      spacing: 5,
      stroke: 2,
      rotation: 7,
    } satisfies Readonly<Record<MutationKind, number>>;
    const expertBoards = [5, 9, 10, 13, 14, 15, 16, 32] as const;

    for (let seedIndex = 0; seedIndex < 50; seedIndex += 1) {
      for (const boardNumber of expertBoards) {
        const board = generateFocusRunBoard({
          seed: `expert-visibility-${seedIndex}`,
          boardNumber,
        });
        const magnitude = Math.abs(board.puzzle.mutation.delta);

        expect(board.difficulty).toBe("expert");
        expect(board.puzzle.gridSize).toBe(6);
        expect(magnitude).toBeGreaterThanOrEqual(
          floors[board.puzzle.mutation.kind],
        );
        expect(
          PIXEL_DIFFICULTY_CONFIG.expert.magnitudes[
            board.puzzle.mutation.kind
          ],
        ).toContain(magnitude);
      }
    }
  });

  it("uses 15/14/13/12-second sectors and a one-board recovery bonus", () => {
    for (const [boardNumber, durationMs] of [
      [1, 15_000],
      [5, 15_000],
      [6, 14_000],
      [10, 14_000],
      [11, 13_000],
      [15, 13_000],
      [16, 12_000],
      [1_000, 12_000],
    ] as const) {
      expect(generateFocusRunBoard({ seed: "timers", boardNumber }).durationMs)
        .toBe(durationMs);
    }
    const recovered = generateFocusRunBoard({
      seed: "timers",
      boardNumber: 16,
      recoveryBonusMs: 2_000,
    });
    expect(recovered).toMatchObject({ baseDurationMs: 12_000, durationMs: 14_000 });
  });

  it("rejects unsafe board and recovery boundaries", () => {
    for (const boardNumber of [0, -1, 1.5, Number.NaN, FOCUS_RUN_MAX_BOARD_NUMBER + 1]) {
      expect(() => generateFocusRunBoard({ seed: "bounds", boardNumber })).toThrow(
        RangeError,
      );
    }
    expect(() =>
      generateFocusRunBoard({
        seed: "bounds",
        boardNumber: FOCUS_RUN_MAX_BOARD_NUMBER,
      }),
    ).not.toThrow();
    expect(() =>
      generateFocusRunBoard({
        seed: "bounds",
        boardNumber: 1,
        recoveryBonusMs: 1_000 as 2_000,
      }),
    ).toThrow(RangeError);
  });
});

describe("Focus Run reducer", () => {
  it("starts with three charges and increments both solve streaks on a first tap", () => {
    const initial = ready();
    expect(selectFocusRunHud(initial)).toMatchObject({
      charges: 3,
      findStreak: 0,
      cleanStreak: 0,
    });
    const result = find(start(initial));
    expect(result.outcome.clean).toBe(true);
    expect(selectFocusRunHud(result)).toMatchObject({
      charges: 3,
      findStreak: 1,
      cleanStreak: 1,
      bestCleanStreak: 1,
    });
    expect(result.progress.aggregates.familyFinds[result.board.puzzle.familyId]).toBe(1);
  });

  it("breaks a clean streak on the first wrong tap without consuming a charge", () => {
    const second = nextReady(find(start(ready("wrong-clean"))));
    const playing = start(second);
    const wrongIndex = playing.board.puzzle.targetIndex === 0 ? 1 : 0;
    const wrong = focusRunReducer(playing, {
      type: "TAP_CELL",
      nowMs: playing.startedAtMs + 100,
      guard: guardForFocusRunState(playing),
      cellIndex: wrongIndex,
      resultPhaseToken: "unused",
    });
    expect(wrong.phase).toBe("playing");
    if (wrong.phase !== "playing") throw new Error("Expected playing");
    assertFocusRunStateInvariants(wrong);
    expect(wrong.progress.aggregates).toMatchObject({ charges: 3, cleanStreak: 0 });

    const duplicate = focusRunReducer(wrong, {
      type: "TAP_CELL",
      nowMs: wrong.lastNowMs,
      guard: guardForFocusRunState(wrong),
      cellIndex: wrongIndex,
      resultPhaseToken: "unused",
    });
    expect(duplicate).toBe(wrong);
    const result = find(wrong);
    expect(result.outcome).toMatchObject({ clean: false, chargeDelta: 0 });
    expect(result.progress.aggregates).toMatchObject({
      charges: 3,
      findStreak: 2,
      cleanStreak: 0,
      bestCleanStreak: 1,
    });
  });

  it("consumes one charge, resets streaks, and grants transparent +2s recovery", () => {
    const afterFind = nextReady(find(start(ready("timeout-recovery"))));
    const result = timeout(start(afterFind));
    expect(result.outcome).toMatchObject({ result: "timeout", chargeDelta: -1 });
    expect(result.progress.aggregates).toMatchObject({
      charges: 2,
      findStreak: 0,
      cleanStreak: 0,
    });
    const recovered = nextReady(result);
    expect(recovered.board).toMatchObject({ recoveryBonusMs: 2_000 });
    expect(selectFocusRunRecoveryActive(recovered)).toBe(true);
    const following = nextReady(find(start(recovered)));
    expect(following.board.recoveryBonusMs).toBe(0);
  });

  it("restores one capped charge at each five-find streak milestone", () => {
    const timedOut = timeout(start(ready("charge-restore")));
    const current = nextReady(timedOut);
    const fifthFind = solveBoards(current, 5);
    expect(fifthFind.progress.aggregates).toMatchObject({
      findStreak: 5,
      charges: 3,
    });
    expect(fifthFind.outcome.chargeDelta).toBe(1);

    const fullChargeMilestone = solveBoards(ready("charge-cap"), 5);
    expect(fullChargeMilestone.progress.aggregates.charges).toBe(3);
    expect(fullChargeMilestone.outcome.chargeDelta).toBe(0);
  });

  it("ends only after three timeouts and never charges for wrong taps", () => {
    let state: FocusRunState = ready("three-strikes");
    for (let miss = 0; miss < 3; miss += 1) {
      if (state.phase !== "ready") throw new Error("Expected ready");
      const playing = start(state);
      const wrongIndex = playing.board.puzzle.targetIndex === 0 ? 1 : 0;
      const wrong = focusRunReducer(playing, {
        type: "TAP_CELL",
        nowMs: playing.startedAtMs + 50,
        guard: guardForFocusRunState(playing),
        cellIndex: wrongIndex,
        resultPhaseToken: "unused",
      });
      expect(wrong.progress.aggregates.charges).toBe(3 - miss);
      if (wrong.phase !== "playing") throw new Error("Expected playing");
      const result = timeout(wrong);
      expect(result.progress.aggregates.charges).toBe(2 - miss);
      state = advance(result);
    }
    expect(state).toMatchObject({
      phase: "run_result",
      finishReason: "charges_exhausted",
      progress: { aggregates: { charges: 0, timeouts: 3 } },
    });
  });

  it("ignores stale events without moving the clock or duplicating outcomes", () => {
    const playing = start(ready("stale-events"));
    const staleGuard = {
      ...guardForFocusRunState(playing),
      phaseToken: "stale",
    };
    const staleTap = focusRunReducer(playing, {
      type: "TAP_CELL",
      nowMs: playing.deadlineMs + 100,
      guard: staleGuard,
      cellIndex: playing.board.puzzle.targetIndex,
      resultPhaseToken: "result",
    });
    const staleTick = focusRunReducer(playing, {
      type: "CLOCK_TICK",
      nowMs: playing.deadlineMs + 100,
      guard: staleGuard,
      resultPhaseToken: "result",
    });
    expect(staleTap).toBe(playing);
    expect(staleTick).toBe(playing);

    const result = find(playing);
    const repeated = focusRunReducer(result, {
      type: "TAP_CELL",
      nowMs: result.lastNowMs + 1,
      guard: guardForFocusRunState(result),
      cellIndex: result.board.puzzle.targetIndex,
      resultPhaseToken: "again",
    });
    expect(repeated).toBe(result);
    expect(repeated.progress.recentOutcomes).toHaveLength(1);
  });

  it("treats a target tap at the exact deadline as a timeout", () => {
    const playing = start(ready("deadline"));
    const result = focusRunReducer(playing, {
      type: "TAP_CELL",
      nowMs: playing.deadlineMs,
      guard: guardForFocusRunState(playing),
      cellIndex: playing.board.puzzle.targetIndex,
      resultPhaseToken: "deadline-result",
    });
    expect(result).toMatchObject({
      phase: "round_result",
      outcome: { result: "timeout" },
      progress: { aggregates: { charges: 2 } },
    });
  });

  it("offers checkpoints after each five boards, then supports continue or finish", () => {
    const fifth = solveBoards(ready("checkpoint"), 5);
    const checkpoint = advance(fifth);
    expect(checkpoint).toMatchObject({ phase: "checkpoint", checkpointNumber: 1 });
    if (checkpoint.phase !== "checkpoint") throw new Error("Expected checkpoint");
    const continued = continueCheckpoint(checkpoint);
    expect(continued.board.boardNumber).toBe(6);

    const finishCheckpoint = advance(solveBoards(ready("finish-checkpoint"), 5));
    if (finishCheckpoint.phase !== "checkpoint") throw new Error("Expected checkpoint");
    const finished = focusRunReducer(finishCheckpoint, {
      type: "FINISH_RUN",
      nowMs: finishCheckpoint.lastNowMs + 10,
      guard: guardForFocusRunState(finishCheckpoint),
    });
    expect(finished).toMatchObject({
      phase: "run_result",
      finishReason: "player_finished",
    });
    assertFocusRunStateInvariants(finished);
  });

  it("completes the deterministic weekly gauntlet after board 15", () => {
    const fifteenth = solveBoards(ready("weekly-gauntlet", "weekly"), 15);
    const finished = advance(fifteenth);
    expect(finished).toMatchObject({
      phase: "run_result",
      finishReason: "weekly_completed",
      progress: {
        prepared: { variant: "weekly", maxBoards: 15 },
        aggregates: { boardsPlayed: 15, finds: 15 },
      },
    });
    expect(finished.progress.recentOutcomes).toHaveLength(
      FOCUS_RUN_RECENT_OUTCOME_LIMIT,
    );
  });

  it("keeps history bounded while mastery counts remain exact", () => {
    const twelfth = solveBoards(ready("bounded-history"), 12);
    expect(twelfth.progress.recentOutcomes.map((outcome) => outcome.boardNumber))
      .toEqual([8, 9, 10, 11, 12]);
    expect(
      Object.values(twelfth.progress.aggregates.familyFinds).reduce(
        (total, count) => total + count,
        0,
      ),
    ).toBe(12);
    expect(twelfth.progress.aggregates.finds).toBe(12);
    assertFocusRunStateInvariants(twelfth);
  });

  it("exposes pure timer/HUD selectors and monotonic time", () => {
    const playing = start(ready("selectors"));
    expect(selectFocusRunRemainingMs(playing)).toBe(15_000);
    expect(selectFocusRunRemainingMs(playing, playing.startedAtMs + 4_250)).toBe(
      10_750,
    );
    expect(selectFocusRunRemainingMs(playing, playing.startedAtMs - 100)).toBe(
      15_000,
    );
    expect(selectFocusRunHud(playing)).toMatchObject({
      boardsPlayed: 0,
      charges: 3,
      score: 0,
    });
  });

  it("detects forged aggregate and mastery state", () => {
    const state = find(start(ready("forgery")));
    const forged = {
      ...state,
      progress: {
        ...state.progress,
        aggregates: {
          ...state.progress.aggregates,
          familyFinds: {
            ...state.progress.aggregates.familyFinds,
            rings: 99,
          },
        },
      },
    } as FocusRunState;
    expect(focusRunStateInvariantViolations(forged)).toContain(
      "state.family_finds",
    );
  });
});

describe("versioned UTC weekly seed", () => {
  it("uses ISO week-years correctly across New Year boundaries", () => {
    expect(focusRunIsoWeekKeyFromEpochMs(Date.UTC(2020, 11, 31))).toBe(
      "2020-W53",
    );
    expect(focusRunIsoWeekKeyFromEpochMs(Date.UTC(2021, 0, 1))).toBe(
      "2020-W53",
    );
    expect(focusRunIsoWeekKeyFromEpochMs(Date.UTC(2021, 0, 4))).toBe(
      "2021-W01",
    );
    expect(focusRunIsoWeekKeyFromEpochMs(Date.UTC(2025, 11, 29))).toBe(
      "2026-W01",
    );
  });

  it("returns one stable versioned seed per ISO week and rejects nonfinite time", () => {
    const monday = Date.UTC(2026, 6, 13);
    expect(focusRunWeeklySeedAt(monday)).toEqual({
      ok: true,
      value: "opo|focus-weekly|g2|2026-W29",
    });
    expect(focusRunWeeklySeedAt(monday + 6 * 86_400_000)).toEqual(
      focusRunWeeklySeedAt(monday),
    );
    expect(focusRunWeeklySeedAt(Number.NaN)).toMatchObject({
      ok: false,
      error: { code: "INVALID_DATE" },
    });
  });
});
