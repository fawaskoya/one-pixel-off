import type { DifficultyTier, RoundIndex } from "./types";

export const PIXEL_SCHEMA_VERSION = 1 as const;
export const PIXEL_GENERATION_VERSION = 2 as const;
export const PIXEL_STATE_VERSION = 1 as const;
export const PIXEL_SESSION_ROUNDS = 5 as const;
export const PIXEL_ROUND_DURATION_MS = 15_000 as const;
export const PIXEL_MAX_ROUND_SCORE = 250 as const;
export const PIXEL_MAX_SESSION_SCORE =
  PIXEL_SESSION_ROUNDS * PIXEL_MAX_ROUND_SCORE;

export const ROUND_DIFFICULTIES: readonly [
  DifficultyTier,
  DifficultyTier,
  DifficultyTier,
  DifficultyTier,
  DifficultyTier,
] = ["beginner", "steady", "tricky", "tricky", "expert"];

export const ROUND_INDEXES: readonly RoundIndex[] = [0, 1, 2, 3, 4];

export const SEED_MIN_LENGTH = 1;
export const SEED_MAX_LENGTH = 128;
export const CHALLENGE_SEED_MAX_LENGTH = 96;
export const CHALLENGE_TOKEN_MAX_LENGTH = 256;
