import {
  GLYPH_FAMILIES,
  PIXEL_PALETTES,
  chooseOne,
  createSeededRandom,
  generatePixelPuzzle,
  randomInteger,
  type DifficultyTier,
  type RoundIndex,
} from "../pixel";
import {
  FOCUS_RUN_GENERATION_VERSION,
  FOCUS_RUN_MAX_BOARD_NUMBER,
  FOCUS_RUN_MIN_BOARD_NUMBER,
  FOCUS_RUN_RECOVERY_BONUS_MS,
  focusRunBaseDurationMs,
} from "./constants";
import type { FocusRunBoard } from "./types";

export function isFocusRunBoardNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= FOCUS_RUN_MIN_BOARD_NUMBER &&
    value <= FOCUS_RUN_MAX_BOARD_NUMBER
  );
}

export function focusRunDifficultyForBoard(
  boardNumber: number,
): DifficultyTier {
  if (!isFocusRunBoardNumber(boardNumber)) {
    throw new RangeError("Focus Run board number is outside the safe range.");
  }
  const opening: readonly DifficultyTier[] = [
    "beginner",
    "steady",
    "tricky",
    "tricky",
    "expert",
  ];
  const secondSector: readonly DifficultyTier[] = [
    "steady",
    "tricky",
    "tricky",
    "expert",
    "expert",
  ];
  const thirdSector: readonly DifficultyTier[] = [
    "tricky",
    "tricky",
    "expert",
    "expert",
    "expert",
  ];
  if (boardNumber <= 5) return opening[boardNumber - 1] as DifficultyTier;
  if (boardNumber <= 10) {
    return secondSector[boardNumber - 6] as DifficultyTier;
  }
  if (boardNumber <= 15) {
    return thirdSector[boardNumber - 11] as DifficultyTier;
  }
  return "expert";
}

function familyForBoard(seed: string, boardNumber: number) {
  const block = Math.floor((boardNumber - 1) / GLYPH_FAMILIES.length);
  const index = (boardNumber - 1) % GLYPH_FAMILIES.length;
  const random = createSeededRandom(
    `${seed}|focus-g${FOCUS_RUN_GENERATION_VERSION}|family-block:${block}`,
  );
  const deck = [...GLYPH_FAMILIES];
  for (let cursor = deck.length - 1; cursor > 0; cursor -= 1) {
    const swapIndex = randomInteger(random, 0, cursor);
    [deck[cursor], deck[swapIndex]] = [
      deck[swapIndex] as (typeof deck)[number],
      deck[cursor] as (typeof deck)[number],
    ];
  }
  return deck[index] as (typeof GLYPH_FAMILIES)[number];
}

export function generateFocusRunBoard(input: Readonly<{
  seed: string;
  boardNumber: number;
  recoveryBonusMs?: 0 | typeof FOCUS_RUN_RECOVERY_BONUS_MS;
}>): FocusRunBoard {
  if (!isFocusRunBoardNumber(input.boardNumber)) {
    throw new RangeError("Focus Run board number is outside the safe range.");
  }
  const recoveryBonusMs = input.recoveryBonusMs ?? 0;
  if (
    recoveryBonusMs !== 0 &&
    recoveryBonusMs !== FOCUS_RUN_RECOVERY_BONUS_MS
  ) {
    throw new RangeError("Focus Run recovery bonus is unsupported.");
  }

  const scheduleRandom = createSeededRandom(
    `${input.seed}|focus-g${FOCUS_RUN_GENERATION_VERSION}|b${input.boardNumber}|schedule`,
  );
  const familyId = familyForBoard(input.seed, input.boardNumber);
  const paletteId = chooseOne(scheduleRandom, PIXEL_PALETTES).id;
  const difficulty = focusRunDifficultyForBoard(input.boardNumber);
  const derivedSeed = `${input.seed}|focus-g${FOCUS_RUN_GENERATION_VERSION}|b${input.boardNumber}`;
  const roundIndex = ((input.boardNumber - 1) % 5) as RoundIndex;
  const puzzle = generatePixelPuzzle({
    seed: derivedSeed,
    roundIndex,
    difficulty,
    familyId,
    paletteId,
  });
  const baseDurationMs = focusRunBaseDurationMs(input.boardNumber);

  return {
    boardNumber: input.boardNumber,
    difficulty,
    baseDurationMs,
    recoveryBonusMs,
    durationMs: baseDurationMs + recoveryBonusMs,
    puzzle,
  };
}
