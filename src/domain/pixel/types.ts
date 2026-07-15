export type PixelSessionMode = "quick" | "daily" | "challenge";
export type DifficultyTier = "beginner" | "steady" | "tricky" | "expert";

export type RoundIndex = 0 | 1 | 2 | 3 | 4;
export type GridSize = 4 | 5 | 6;

export type PaletteId =
  | "ink-coral"
  | "navy-mint"
  | "plum-lemon"
  | "forest-sky"
  | "cocoa-peach"
  | "slate-lilac";

export type GlyphFamilyId =
  | "rings"
  | "stripes"
  | "arrows"
  | "corners"
  | "dots"
  | "diamonds"
  | "chevrons"
  | "orbit";

export type ColorRole = "background" | "primary" | "accent" | "none";
export type VectorPrimitiveKind = "circle" | "rect" | "line" | "polygon";

/**
 * Geometry is deliberately numeric and integer-only so an SVG, Canvas, or
 * native renderer can draw the same puzzle without parsing arbitrary markup.
 *
 * circle:  [cx, cy, radius]
 * rect:    [x, y, width, height, cornerRadius]
 * line:    [x1, y1, x2, y2]
 * polygon: [x1, y1, x2, y2, ...]
 *
 * rotationDeg is applied around the fixed view-box center (50, 50). Color
 * roles are resolved through the puzzle's curated palette, never raw input.
 */
export type VectorPrimitive = Readonly<{
  kind: VectorPrimitiveKind;
  geometry: readonly number[];
  fill: ColorRole;
  stroke: ColorRole;
  strokeWidth: number;
  rotationDeg: number;
}>;

export type VectorGlyphDescriptor = Readonly<{
  familyId: GlyphFamilyId;
  viewBoxSize: 100;
  primitives: readonly VectorPrimitive[];
}>;

export type MutationKind =
  | "offset"
  | "size"
  | "spacing"
  | "stroke"
  | "rotation";

export type MutationDescriptor = Readonly<{
  kind: MutationKind;
  primitiveIndex: number;
  field: "geometry" | "strokeWidth" | "rotationDeg";
  coordinateIndex: number | null;
  from: number;
  to: number;
  delta: number;
}>;

export type PuzzleCellDescriptor = Readonly<{
  index: number;
  row: number;
  column: number;
  glyph: VectorGlyphDescriptor;
  mutation: MutationDescriptor | null;
}>;

export type PixelPuzzleDescriptor = Readonly<{
  schemaVersion: 1;
  generationVersion: 1;
  id: string;
  roundIndex: RoundIndex;
  difficulty: DifficultyTier;
  gridSize: GridSize;
  paletteId: PaletteId;
  familyId: GlyphFamilyId;
  sourceGlyph: VectorGlyphDescriptor;
  targetIndex: number;
  mutation: MutationDescriptor;
  cells: readonly PuzzleCellDescriptor[];
}>;

export type PuzzleTuple = readonly [
  PixelPuzzleDescriptor,
  PixelPuzzleDescriptor,
  PixelPuzzleDescriptor,
  PixelPuzzleDescriptor,
  PixelPuzzleDescriptor,
];

export type PreparedPixelSession = Readonly<{
  schemaVersion: 1;
  generationVersion: 1;
  sessionId: string;
  mode: PixelSessionMode;
  seed: string;
  dailyDateUtc: string | null;
  rounds: PuzzleTuple;
}>;

export type PixelRoundResultKind = "found" | "timeout";

export type PixelRoundOutcome = Readonly<{
  roundIndex: RoundIndex;
  puzzleId: string;
  result: PixelRoundResultKind;
  startedAtMs: number;
  endedAtMs: number;
  elapsedMs: number;
  remainingMs: number;
  wrongCellIndexes: readonly number[];
  score: number;
}>;

export type PixelSessionProgress = Readonly<{
  prepared: PreparedPixelSession;
  outcomes: readonly PixelRoundOutcome[];
}>;

type BaseState = Readonly<{
  stateVersion: 1;
  lastNowMs: number;
}>;

export type ReadyState = BaseState &
  Readonly<{
    phase: "ready";
    progress: PixelSessionProgress;
    roundIndex: RoundIndex;
    phaseToken: string;
  }>;

export type PlayingState = BaseState &
  Readonly<{
    phase: "playing";
    progress: PixelSessionProgress;
    roundIndex: RoundIndex;
    phaseToken: string;
    startedAtMs: number;
    deadlineMs: number;
    wrongCellIndexes: readonly number[];
  }>;

export type RoundResultState = BaseState &
  Readonly<{
    phase: "round_result";
    progress: PixelSessionProgress;
    roundIndex: RoundIndex;
    phaseToken: string;
    outcome: PixelRoundOutcome;
  }>;

export type SessionResultState = BaseState &
  Readonly<{
    phase: "session_result";
    progress: PixelSessionProgress;
    completedAtMs: number;
  }>;

export type PixelGameState =
  | ReadyState
  | PlayingState
  | RoundResultState
  | SessionResultState;

export type PixelGuard = Readonly<{
  sessionId: string;
  roundIndex: RoundIndex;
  phaseToken: string;
}>;

export type PixelGameAction =
  | Readonly<{
      type: "START_ROUND";
      nowMs: number;
      guard: PixelGuard;
      playingPhaseToken: string;
    }>
  | Readonly<{
      type: "TAP_CELL";
      nowMs: number;
      guard: PixelGuard;
      cellIndex: number;
      resultPhaseToken: string;
    }>
  | Readonly<{
      type: "CLOCK_TICK";
      nowMs: number;
      guard: PixelGuard;
      resultPhaseToken: string;
    }>
  | Readonly<{
      type: "NEXT_ROUND";
      nowMs: number;
      guard: PixelGuard;
      nextPhaseToken: string;
    }>;

export type PixelDomainErrorCode =
  | "INVALID_SEED"
  | "INVALID_DATE"
  | "INVALID_SESSION"
  | "TOKEN_INVALID"
  | "TOKEN_UNSUPPORTED";

export type PixelDomainError = Readonly<{
  code: PixelDomainErrorCode;
  message: string;
}>;

export type PixelDomainResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; error: PixelDomainError }>;

export type ChallengePayloadV1 = Readonly<{
  v: 1;
  g: 1;
  s: string;
}>;
