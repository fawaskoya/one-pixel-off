import { describe, expect, it } from "vitest";

import {
  PIXEL_MAX_SESSION_SCORE,
  PIXEL_ROUND_DURATION_MS,
  assertPixelStateInvariants,
  createPixelGameState,
  createSeededRandom,
  generatePixelSession,
  guardForPixelState,
  pixelGameReducer,
  scoreFoundRound,
  selectCurrentPuzzle,
  selectFoundRounds,
  selectRemainingMs,
  selectResultPattern,
  selectRoundProgress,
  selectScoreBounds,
  selectTotalScore,
  selectTotalWrongTaps,
} from "./index";
import type {
  PixelGameAction,
  PixelGameState,
  PlayingState,
  PreparedPixelSession,
  ReadyState,
  RoundResultState,
} from "./types";

function prepared(seed = "reducer-session"): PreparedPixelSession {
  const result = generatePixelSession({ mode: "quick", seed });
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.value;
}

function ready(seed = "reducer-session", nowMs = 1_000): ReadyState {
  const result = createPixelGameState(prepared(seed), nowMs, "ready-0");
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  assertPixelStateInvariants(result.value);
  return result.value;
}

function startRound(state: ReadyState, nowMs = state.lastNowMs): PlayingState {
  const next = pixelGameReducer(state, {
    type: "START_ROUND",
    nowMs,
    guard: guardForPixelState(state),
    playingPhaseToken: `playing-${state.roundIndex}`,
  });
  expect(next.phase).toBe("playing");
  if (next.phase !== "playing") {
    throw new Error(`Expected playing, received ${next.phase}`);
  }
  assertPixelStateInvariants(next);
  return next;
}

function tapTarget(
  state: PlayingState,
  elapsedMs = 1_000,
): RoundResultState {
  const puzzle = selectCurrentPuzzle(state);
  const next = pixelGameReducer(state, {
    type: "TAP_CELL",
    nowMs: state.startedAtMs + elapsedMs,
    guard: guardForPixelState(state),
    cellIndex: puzzle.targetIndex,
    resultPhaseToken: `result-${state.roundIndex}`,
  });
  expect(next.phase).toBe("round_result");
  if (next.phase !== "round_result") {
    throw new Error(`Expected result, received ${next.phase}`);
  }
  assertPixelStateInvariants(next);
  return next;
}

function continueAfterResult(state: RoundResultState): PixelGameState {
  const next = pixelGameReducer(state, {
    type: "NEXT_ROUND",
    nowMs: state.lastNowMs + 250,
    guard: guardForPixelState(state),
    nextPhaseToken: `ready-${state.roundIndex + 1}`,
  });
  assertPixelStateInvariants(next);
  return next;
}

function firstWrongCell(state: PlayingState): number {
  const puzzle = selectCurrentPuzzle(state);
  return puzzle.targetIndex === 0 ? 1 : 0;
}

describe("pixel reducer timing and taps", () => {
  it("starts a round with one absolute 15-second deadline", () => {
    const initial = ready();
    const state = startRound(initial, 1_234);
    expect(state.startedAtMs).toBe(1_234);
    expect(state.deadlineMs).toBe(16_234);
    expect(state.deadlineMs - state.startedAtMs).toBe(
      PIXEL_ROUND_DURATION_MS,
    );
    expect(selectRemainingMs(state)).toBe(15_000);
    expect(selectRemainingMs(state, state.startedAtMs + 4_250)).toBe(10_750);
  });

  it("records unique wrong cells, continues play, and then scores a correct tap", () => {
    const playing = startRound(ready("wrong-then-right"));
    const puzzle = selectCurrentPuzzle(playing);
    const wrongCells = puzzle.cells
      .map((cell) => cell.index)
      .filter((index) => index !== puzzle.targetIndex)
      .slice(0, 2);
    const firstAction = {
      type: "TAP_CELL",
      nowMs: playing.startedAtMs + 1_000,
      guard: guardForPixelState(playing),
      cellIndex: wrongCells[0]!,
      resultPhaseToken: "result-0",
    } as const;
    const afterFirst = pixelGameReducer(playing, firstAction);
    expect(afterFirst).toMatchObject({
      phase: "playing",
      wrongCellIndexes: [wrongCells[0]],
    });
    if (afterFirst.phase !== "playing") {
      throw new Error("Expected play to continue after a wrong tap");
    }

    const duplicate = pixelGameReducer(afterFirst, firstAction);
    expect(duplicate).toBe(afterFirst);

    const afterSecond = pixelGameReducer(afterFirst, {
      ...firstAction,
      nowMs: playing.startedAtMs + 2_000,
      guard: guardForPixelState(afterFirst),
      cellIndex: wrongCells[1]!,
    });
    expect(afterSecond).toMatchObject({
      phase: "playing",
      wrongCellIndexes: wrongCells,
    });
    if (afterSecond.phase !== "playing") {
      throw new Error("Expected play to continue after a wrong tap");
    }
    const result = pixelGameReducer(afterSecond, {
      ...firstAction,
      nowMs: playing.startedAtMs + 3_000,
      guard: guardForPixelState(afterSecond),
      cellIndex: puzzle.targetIndex,
    });
    expect(result).toMatchObject({
      phase: "round_result",
      outcome: {
        result: "found",
        elapsedMs: 3_000,
        remainingMs: 12_000,
        wrongCellIndexes: wrongCells,
        score: 180,
      },
    });
    assertPixelStateInvariants(result);
  });

  it("awards the boundary scores for an immediate and last-millisecond find", () => {
    const immediate = tapTarget(startRound(ready("instant")), 0);
    expect(immediate.outcome.score).toBe(250);

    const lastMoment = tapTarget(startRound(ready("last-moment")), 14_999);
    expect(lastMoment.outcome).toMatchObject({
      result: "found",
      elapsedMs: 14_999,
      remainingMs: 1,
      score: 100,
    });
  });

  it("supports fractional monotonic-clock timestamps", () => {
    const initial = ready("fractional-clock", 1_000.25);
    const playing = startRound(initial, 1_100.5);
    const result = tapTarget(playing, 1_234.75);
    expect(result.outcome).toMatchObject({
      elapsedMs: 1_234.75,
      remainingMs: 13_765.25,
    });
    expect(() => assertPixelStateInvariants(result)).not.toThrow();
  });

  it("resolves a tap at the exact deadline as timeout at that deadline", () => {
    const playing = startRound(ready("deadline-tie"));
    const action = {
      type: "TAP_CELL",
      nowMs: playing.deadlineMs,
      guard: guardForPixelState(playing),
      cellIndex: selectCurrentPuzzle(playing).targetIndex,
      resultPhaseToken: "result-timeout",
    } as const;
    const result = pixelGameReducer(playing, action);
    expect(result).toMatchObject({
      phase: "round_result",
      outcome: {
        result: "timeout",
        endedAtMs: playing.deadlineMs,
        elapsedMs: 15_000,
        remainingMs: 0,
        score: 0,
      },
    });
    assertPixelStateInvariants(result);
    expect(pixelGameReducer(result, action)).toBe(result);
  });

  it("resolves a late clock callback at the exact logical deadline", () => {
    const playing = startRound(ready("late-clock"));
    const result = pixelGameReducer(playing, {
      type: "CLOCK_TICK",
      nowMs: playing.deadlineMs + 60_000,
      guard: guardForPixelState(playing),
      resultPhaseToken: "late-result",
    });
    expect(result).toMatchObject({
      phase: "round_result",
      lastNowMs: playing.deadlineMs + 60_000,
      outcome: {
        result: "timeout",
        endedAtMs: playing.deadlineMs,
      },
    });
    assertPixelStateInvariants(result);
  });

  it("preserves unique wrong guesses on timeout without recording the deadline tap", () => {
    const playing = startRound(ready("wrong-timeout"));
    const wrongCell = firstWrongCell(playing);
    const wrong = pixelGameReducer(playing, {
      type: "TAP_CELL",
      nowMs: playing.startedAtMs + 2_000,
      guard: guardForPixelState(playing),
      cellIndex: wrongCell,
      resultPhaseToken: "result",
    });
    if (wrong.phase !== "playing") {
      throw new Error("Expected play after wrong tap");
    }
    const result = pixelGameReducer(wrong, {
      type: "TAP_CELL",
      nowMs: wrong.deadlineMs,
      guard: guardForPixelState(wrong),
      cellIndex: wrongCell === 0 ? 1 : 0,
      resultPhaseToken: "result",
    });
    expect(result).toMatchObject({
      phase: "round_result",
      outcome: { result: "timeout", wrongCellIndexes: [wrongCell] },
    });
    assertPixelStateInvariants(result);
  });

  it("clamps a regressing clock and ignores invalid cell indexes", () => {
    const playing = startRound(ready("clock-regression"), 5_000);
    const ticked = pixelGameReducer(playing, {
      type: "CLOCK_TICK",
      nowMs: 8_000,
      guard: guardForPixelState(playing),
      resultPhaseToken: "result",
    });
    expect(ticked).toMatchObject({ phase: "playing", lastNowMs: 8_000 });
    if (ticked.phase !== "playing") {
      throw new Error("Expected playing");
    }
    const regressed = pixelGameReducer(ticked, {
      type: "TAP_CELL",
      nowMs: 7_000,
      guard: guardForPixelState(ticked),
      cellIndex: -1,
      resultPhaseToken: "result",
    });
    expect(regressed).toBe(ticked);
    assertPixelStateInvariants(regressed);
  });

  it("does not accept a correct tap with a non-finite timestamp", () => {
    const playing = startRound(ready("invalid-timestamp"));
    const targetIndex = selectCurrentPuzzle(playing).targetIndex;
    for (const nowMs of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const result = pixelGameReducer(playing, {
        type: "TAP_CELL",
        nowMs,
        guard: guardForPixelState(playing),
        cellIndex: targetIndex,
        resultPhaseToken: "result",
      });
      expect(result).toBe(playing);
    }
  });
});

describe("guards, idempotency, and session completion", () => {
  it("ignores stale guarded taps, ticks, and starts without advancing time", () => {
    const initial = ready("stale-ready");
    const staleReadyGuard = {
      ...guardForPixelState(initial),
      phaseToken: "old-ready",
    };
    const staleStart = pixelGameReducer(initial, {
      type: "START_ROUND",
      nowMs: 99_000,
      guard: staleReadyGuard,
      playingPhaseToken: "playing",
    });
    expect(staleStart).toBe(initial);

    const playing = startRound(initial);
    const staleGuard = { ...guardForPixelState(playing), roundIndex: 4 as const };
    const staleTap = pixelGameReducer(playing, {
      type: "TAP_CELL",
      nowMs: playing.deadlineMs + 1,
      guard: staleGuard,
      cellIndex: selectCurrentPuzzle(playing).targetIndex,
      resultPhaseToken: "result",
    });
    const staleTick = pixelGameReducer(playing, {
      type: "CLOCK_TICK",
      nowMs: playing.deadlineMs + 1,
      guard: staleGuard,
      resultPhaseToken: "result",
    });
    expect(staleTap).toBe(playing);
    expect(staleTick).toBe(playing);
  });

  it("makes duplicate terminal and continue actions idempotent", () => {
    const playing = startRound(ready("duplicates"));
    const action = {
      type: "TAP_CELL",
      nowMs: playing.startedAtMs + 1_000,
      guard: guardForPixelState(playing),
      cellIndex: selectCurrentPuzzle(playing).targetIndex,
      resultPhaseToken: "result-0",
    } as const;
    const result = pixelGameReducer(playing, action);
    expect(result.phase).toBe("round_result");
    expect(pixelGameReducer(result, action)).toBe(result);
    if (result.phase !== "round_result") {
      throw new Error("Expected result");
    }
    const nextAction = {
      type: "NEXT_ROUND",
      nowMs: result.lastNowMs,
      guard: guardForPixelState(result),
      nextPhaseToken: "ready-1",
    } as const;
    const next = pixelGameReducer(result, nextAction);
    expect(next).toMatchObject({ phase: "ready", roundIndex: 1 });
    expect(pixelGameReducer(next, nextAction)).toBe(next);
  });

  it("completes exactly five mixed rounds and never creates round six", () => {
    let state: PixelGameState = ready("five-round-finish");
    for (let roundIndex = 0; roundIndex < 5; roundIndex += 1) {
      expect(state).toMatchObject({ phase: "ready", roundIndex });
      if (state.phase !== "ready") {
        throw new Error("Expected ready");
      }
      const playing = startRound(state, state.lastNowMs + 100);
      if (roundIndex % 2 === 0) {
        state = tapTarget(playing, 1_000 + roundIndex * 100);
      } else {
        state = pixelGameReducer(playing, {
          type: "CLOCK_TICK",
          nowMs: playing.deadlineMs,
          guard: guardForPixelState(playing),
          resultPhaseToken: `result-${roundIndex}`,
        });
      }
      expect(state.phase).toBe("round_result");
      assertPixelStateInvariants(state);
      if (state.phase !== "round_result") {
        throw new Error("Expected result");
      }
      state = continueAfterResult(state);
    }
    expect(state).toMatchObject({
      phase: "session_result",
      progress: { outcomes: { length: 5 } },
    });
    expect(selectResultPattern(state)).toEqual([
      "found",
      "timeout",
      "found",
      "timeout",
      "found",
    ]);
    expect(selectFoundRounds(state)).toBe(3);
    expect(selectRoundProgress(state)).toEqual({ current: 5, total: 5 });
    expect(selectTotalScore(state)).toBeGreaterThan(0);
    expect(selectTotalScore(state)).toBeLessThanOrEqual(
      PIXEL_MAX_SESSION_SCORE,
    );
    assertPixelStateInvariants(state);
  });

  it("maintains invariants through a deterministic invalid-action corpus", () => {
    const random = createSeededRandom("reducer-fuzz-actions");
    let state: PixelGameState = ready("fuzz-state");
    for (let step = 0; step < 2_000; step += 1) {
      const currentGuard =
        state.phase === "session_result"
          ? { sessionId: "finished", roundIndex: 0 as const, phaseToken: "none" }
          : guardForPixelState(state);
      const guard =
        random() < 0.3
          ? { ...currentGuard, phaseToken: `${currentGuard.phaseToken}:stale` }
          : currentGuard;
      const nowMs =
        state.lastNowMs + Math.floor((random() - 0.25) * 20_000);
      const choice = Math.floor(random() * 4);
      let action: PixelGameAction;
      if (choice === 0) {
        action = {
          type: "START_ROUND",
          nowMs,
          guard,
          playingPhaseToken: `p-${step}`,
        };
      } else if (choice === 1) {
        action = {
          type: "TAP_CELL",
          nowMs,
          guard,
          cellIndex: Math.floor(random() * 42) - 3,
          resultPhaseToken: `x-${step}`,
        };
      } else if (choice === 2) {
        action = {
          type: "CLOCK_TICK",
          nowMs,
          guard,
          resultPhaseToken: `t-${step}`,
        };
      } else {
        action = {
          type: "NEXT_ROUND",
          nowMs,
          guard,
          nextPhaseToken: `n-${step}`,
        };
      }
      state = pixelGameReducer(state, action);
      assertPixelStateInvariants(state);
      expect(state.progress.outcomes.length).toBeLessThanOrEqual(5);
    }
  });
});

describe("scoring and selectors", () => {
  it("keeps every found score deterministic and bounded", () => {
    for (let remaining = -1_000; remaining <= 16_000; remaining += 37) {
      for (let wrong = -2; wrong <= 40; wrong += 1) {
        const score = scoreFoundRound(remaining, wrong);
        expect(Number.isInteger(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(25);
        expect(score).toBeLessThanOrEqual(250);
        expect(scoreFoundRound(remaining, wrong)).toBe(score);
      }
    }
    expect(scoreFoundRound(15_000, 0)).toBe(250);
    expect(scoreFoundRound(0, 0)).toBe(100);
    expect(scoreFoundRound(0, 99)).toBe(25);
    expect(selectScoreBounds()).toEqual({ minimum: 0, maximum: 1_250 });
  });

  it("derives current puzzle and wrong-tap totals without duplicating state", () => {
    const playing = startRound(ready("selector-story"));
    const wrongCell = firstWrongCell(playing);
    const wrong = pixelGameReducer(playing, {
      type: "TAP_CELL",
      nowMs: playing.startedAtMs + 500,
      guard: guardForPixelState(playing),
      cellIndex: wrongCell,
      resultPhaseToken: "result",
    });
    expect(wrong.phase).toBe("playing");
    expect(selectTotalWrongTaps(wrong)).toBe(1);
    expect(selectCurrentPuzzle(wrong).roundIndex).toBe(0);
    expect(selectRoundProgress(wrong)).toEqual({ current: 1, total: 5 });
  });
});
