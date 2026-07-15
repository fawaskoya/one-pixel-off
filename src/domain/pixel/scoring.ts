import {
  PIXEL_MAX_ROUND_SCORE,
  PIXEL_MAX_SESSION_SCORE,
  PIXEL_ROUND_DURATION_MS,
} from "./constants";
import type { PixelRoundOutcome } from "./types";

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * A find is worth 100 plus a millisecond-based speed bonus, minus 20 points
 * per unique wrong cell. The floor keeps even a messy success positive while
 * timeout remains zero. The result is always an integer in [25, 250].
 */
export function scoreFoundRound(
  remainingMsInput: number,
  uniqueWrongCellCountInput: number,
): number {
  const remainingMs = clamp(remainingMsInput, 0, PIXEL_ROUND_DURATION_MS);
  const uniqueWrongCellCount = Math.max(
    0,
    Math.floor(
      Number.isFinite(uniqueWrongCellCountInput)
        ? uniqueWrongCellCountInput
        : 0,
    ),
  );
  const raw =
    100 + Math.floor(remainingMs / 100) - uniqueWrongCellCount * 20;
  return Math.min(PIXEL_MAX_ROUND_SCORE, Math.max(25, raw));
}

export function totalPixelScore(
  outcomes: readonly PixelRoundOutcome[],
): number {
  return Math.min(
    PIXEL_MAX_SESSION_SCORE,
    outcomes.reduce((total, outcome) => total + outcome.score, 0),
  );
}
