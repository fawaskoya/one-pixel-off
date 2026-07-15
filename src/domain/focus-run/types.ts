import type {
  DifficultyTier,
  GlyphFamilyId,
  PixelDomainResult,
  PixelPuzzleDescriptor,
} from "../pixel";

export type FocusRunVariant = "focus" | "weekly";
export type FocusRunFinishReason =
  | "charges_exhausted"
  | "player_finished"
  | "weekly_completed"
  | "board_limit_reached";
export type FocusRunResultKind = "found" | "timeout";

export type FocusRunConfig = Readonly<{
  variant?: FocusRunVariant;
}>;

export type PreparedFocusRun = Readonly<{
  schemaVersion: 1;
  generationVersion: 1;
  rulesVersion: 1;
  runId: string;
  seed: string;
  variant: FocusRunVariant;
  maxBoards: number;
}>;

export type FocusRunBoard = Readonly<{
  boardNumber: number;
  difficulty: DifficultyTier;
  baseDurationMs: number;
  recoveryBonusMs: 0 | 2_000;
  durationMs: number;
  puzzle: PixelPuzzleDescriptor;
}>;

export type FocusRunOutcome = Readonly<{
  boardNumber: number;
  puzzleId: string;
  result: FocusRunResultKind;
  startedAtMs: number;
  endedAtMs: number;
  elapsedMs: number;
  remainingMs: number;
  durationMs: number;
  wrongCellIndexes: readonly number[];
  clean: boolean;
  score: number;
  chargeDelta: -1 | 0 | 1;
}>;

export type FocusRunAggregates = Readonly<{
  boardsPlayed: number;
  finds: number;
  timeouts: number;
  findStreak: number;
  bestFindStreak: number;
  cleanStreak: number;
  bestCleanStreak: number;
  charges: number;
  score: number;
  familyFinds: Readonly<Record<GlyphFamilyId, number>>;
}>;

export type FocusRunProgress = Readonly<{
  prepared: PreparedFocusRun;
  aggregates: FocusRunAggregates;
  recentOutcomes: readonly FocusRunOutcome[];
}>;

type FocusRunBaseState = Readonly<{
  stateVersion: 1;
  lastNowMs: number;
  progress: FocusRunProgress;
}>;

export type FocusRunReadyState = FocusRunBaseState &
  Readonly<{
    phase: "ready";
    board: FocusRunBoard;
    phaseToken: string;
  }>;

export type FocusRunPlayingState = FocusRunBaseState &
  Readonly<{
    phase: "playing";
    board: FocusRunBoard;
    phaseToken: string;
    startedAtMs: number;
    deadlineMs: number;
    wrongCellIndexes: readonly number[];
  }>;

export type FocusRunRoundResultState = FocusRunBaseState &
  Readonly<{
    phase: "round_result";
    board: FocusRunBoard;
    phaseToken: string;
    outcome: FocusRunOutcome;
  }>;

export type FocusRunCheckpointState = FocusRunBaseState &
  Readonly<{
    phase: "checkpoint";
    checkpointNumber: number;
    phaseToken: string;
  }>;

export type FocusRunResultState = FocusRunBaseState &
  Readonly<{
    phase: "run_result";
    completedAtMs: number;
    finishReason: FocusRunFinishReason;
  }>;

export type FocusRunState =
  | FocusRunReadyState
  | FocusRunPlayingState
  | FocusRunRoundResultState
  | FocusRunCheckpointState
  | FocusRunResultState;

export type FocusRunGuard = Readonly<{
  runId: string;
  boardNumber: number;
  phaseToken: string;
}>;

export type FocusRunAction =
  | Readonly<{
      type: "START_BOARD";
      nowMs: number;
      guard: FocusRunGuard;
      playingPhaseToken: string;
    }>
  | Readonly<{
      type: "TAP_CELL";
      nowMs: number;
      guard: FocusRunGuard;
      cellIndex: number;
      resultPhaseToken: string;
    }>
  | Readonly<{
      type: "CLOCK_TICK";
      nowMs: number;
      guard: FocusRunGuard;
      resultPhaseToken: string;
    }>
  | Readonly<{
      type: "ADVANCE_AFTER_RESULT";
      nowMs: number;
      guard: FocusRunGuard;
      nextPhaseToken: string;
    }>
  | Readonly<{
      type: "CONTINUE_RUN";
      nowMs: number;
      guard: FocusRunGuard;
      nextPhaseToken: string;
    }>
  | Readonly<{
      type: "FINISH_RUN";
      nowMs: number;
      guard: FocusRunGuard;
    }>;

export type FocusRunDomainResult<T> = PixelDomainResult<T>;
