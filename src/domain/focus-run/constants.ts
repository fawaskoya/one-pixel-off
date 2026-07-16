export const FOCUS_RUN_SCHEMA_VERSION = 1 as const;
export const FOCUS_RUN_GENERATION_VERSION = 2 as const;
export const FOCUS_RUN_RULES_VERSION = 1 as const;
export const FOCUS_RUN_STATE_VERSION = 1 as const;

export const FOCUS_RUN_STARTING_CHARGES = 3 as const;
export const FOCUS_RUN_MAX_CHARGES = 3 as const;
export const FOCUS_RUN_STREAK_RESTORE_INTERVAL = 5 as const;
export const FOCUS_RUN_CHECKPOINT_INTERVAL = 5 as const;
export const FOCUS_RUN_RECOVERY_BONUS_MS = 2_000 as const;
export const FOCUS_RUN_RECENT_OUTCOME_LIMIT = 5 as const;
export const FOCUS_RUN_MIN_BOARD_NUMBER = 1 as const;
export const FOCUS_RUN_MAX_BOARD_NUMBER = 1_000_000 as const;

export function focusRunBaseDurationMs(boardNumber: number): number {
  if (boardNumber <= 5) return 15_000;
  if (boardNumber <= 10) return 14_000;
  if (boardNumber <= 15) return 13_000;
  return 12_000;
}
