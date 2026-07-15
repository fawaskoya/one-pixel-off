"use client";

import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  PIXEL_PALETTES,
  PIXEL_ROUND_DURATION_MS,
  createPixelGameState,
  dailySeedAt,
  encodePixelChallengeToken,
  generatePixelSession,
  guardForPixelState,
  pixelGameReducer,
  selectCurrentPuzzle,
  selectFoundRounds,
  selectRemainingMs,
  selectTotalScore,
  selectTotalWrongTaps,
  type ColorRole,
  type PixelGameAction,
  type PixelGameState,
  type PixelSessionMode,
  type PreparedPixelSession,
  type VectorGlyphDescriptor,
  type VectorPrimitive,
} from "@/domain/pixel";
import { recordPixelSession } from "@/lib/client/pixel-storage";
import { shareChallenge, type ShareOutcome } from "@/lib/client/share";

type GameShellProps = {
  initialMode?: PixelSessionMode;
  challengeSeed?: string;
  challengeTokenId?: string;
  challengeError?: string;
};

type PuzzleBoardProps = {
  state: Exclude<PixelGameState, { phase: "ready" | "session_result" }>;
  onCell: (index: number) => void;
};

const modeCopy: Record<PixelSessionMode, string> = {
  quick: "Quick scan",
  daily: "Daily scan",
  challenge: "Friend challenge",
};

function colorForRole(
  role: ColorRole,
  palette: (typeof PIXEL_PALETTES)[number],
): string {
  if (role === "none") return "none";
  return palette[role];
}

function PrimitiveShape({
  primitive,
  palette,
}: {
  primitive: VectorPrimitive;
  palette: (typeof PIXEL_PALETTES)[number];
}) {
  const shared = {
    fill: colorForRole(primitive.fill, palette),
    stroke: colorForRole(primitive.stroke, palette),
    strokeWidth: primitive.strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    vectorEffect: "non-scaling-stroke" as const,
    transform:
      primitive.rotationDeg === 0
        ? undefined
        : `rotate(${primitive.rotationDeg} 50 50)`,
  };

  if (primitive.kind === "circle") {
    const [cx, cy, radius] = primitive.geometry;
    return <circle {...shared} cx={cx} cy={cy} r={radius} />;
  }
  if (primitive.kind === "rect") {
    const [x, y, width, height, radius] = primitive.geometry;
    return <rect {...shared} x={x} y={y} width={width} height={height} rx={radius} />;
  }
  if (primitive.kind === "line") {
    const [x1, y1, x2, y2] = primitive.geometry;
    return <line {...shared} x1={x1} y1={y1} x2={x2} y2={y2} />;
  }
  const points: string[] = [];
  for (let index = 0; index < primitive.geometry.length; index += 2) {
    points.push(`${primitive.geometry[index]},${primitive.geometry[index + 1]}`);
  }
  return <polygon {...shared} points={points.join(" ")} />;
}

const Glyph = memo(function Glyph({
  glyph,
  palette,
}: {
  glyph: VectorGlyphDescriptor;
  palette: (typeof PIXEL_PALETTES)[number];
}) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 100 100">
      {glyph.primitives.map((primitive, index) => (
        <PrimitiveShape key={`${primitive.kind}-${index}`} primitive={primitive} palette={palette} />
      ))}
    </svg>
  );
});

function RoundTrack({ current, completed }: { current: number; completed: number }) {
  return (
    <span className="round-track" aria-label={`Round ${current} of 5`}>
      {[0, 1, 2, 3, 4].map((index) => (
        <i
          aria-hidden="true"
          data-complete={index < completed}
          data-current={index === current - 1}
          key={index}
        />
      ))}
    </span>
  );
}

function PuzzleBoard({ state, onCell }: PuzzleBoardProps) {
  const puzzle = selectCurrentPuzzle(state);
  const palette = PIXEL_PALETTES.find((item) => item.id === puzzle.paletteId) ?? PIXEL_PALETTES[0];
  const isPlaying = state.phase === "playing";
  const wrongIndexes = isPlaying ? state.wrongCellIndexes : state.outcome.wrongCellIndexes;
  const wrongIndexSet = new Set(wrongIndexes);
  const reveal = state.phase === "round_result";
  const boardStyle = {
    "--puzzle-columns": puzzle.gridSize,
  } as CSSProperties;

  return (
    <div className="puzzle-frame">
      <div
        className="puzzle-board"
        role="group"
        aria-label={`${puzzle.gridSize} by ${puzzle.gridSize} pattern grid`}
        style={boardStyle}
      >
        {puzzle.cells.map((cell) => (
          <button
            aria-label={`Tile ${cell.row + 1}, ${cell.column + 1}`}
            aria-pressed={wrongIndexSet.has(cell.index)}
            className="puzzle-cell"
            data-target={reveal && cell.index === puzzle.targetIndex ? true : undefined}
            data-wrong={wrongIndexSet.has(cell.index) ? true : undefined}
            disabled={!isPlaying}
            key={cell.index}
            onClick={() => onCell(cell.index)}
            style={{
              "--cell-background": palette.background,
              "--cell-foreground": palette.primary,
            } as CSSProperties}
            type="button"
          >
            <Glyph glyph={cell.glyph} palette={palette} />
          </button>
        ))}
      </div>
      <div className="puzzle-instruction">
        <span>{puzzle.familyId} / {puzzle.difficulty}</span>
        <span>{reveal ? "target revealed" : "select one tile"}</span>
      </div>
    </div>
  );
}

function freshQuickSeed(): string {
  const bytes = new Uint32Array(2);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    bytes[0] = Date.now() >>> 0;
    bytes[1] = Math.floor(Math.random() * 0xffffffff);
  }
  return `quick-${Date.now().toString(36)}-${bytes[0].toString(36)}-${bytes[1].toString(36)}`;
}

function shareMessage(outcome: ShareOutcome): string {
  if (outcome === "shared") return "Challenge sent.";
  if (outcome === "copied") return "Challenge link copied.";
  if (outcome === "cancelled") return "Sharing cancelled.";
  return "Copy the challenge link below.";
}

export function GameShell({
  initialMode = "quick",
  challengeSeed,
  challengeTokenId,
  challengeError,
}: GameShellProps) {
  const lockedChallenge = Boolean(challengeSeed);
  const [selectedMode, setSelectedMode] = useState<"quick" | "daily">(
    initialMode === "daily" ? "daily" : "quick",
  );
  const [state, setState] = useState<PixelGameState | null>(null);
  const [setupError, setSetupError] = useState<string | null>(challengeError ?? null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [manualShareUrl, setManualShareUrl] = useState<string | null>(null);
  const recordedSessions = useRef(new Set<string>());
  const tokenSequence = useRef(0);

  const nextToken = (label: string) => {
    tokenSequence.current += 1;
    return `${label}:${tokenSequence.current}`;
  };

  const send = (action: PixelGameAction) => {
    setState((current) => (current ? pixelGameReducer(current, action) : current));
  };

  const prepareSession = () => {
    setSetupError(null);
    setShareFeedback(null);
    setManualShareUrl(null);

    let sessionResult;
    if (lockedChallenge && challengeSeed) {
      sessionResult = generatePixelSession({ mode: "challenge", seed: challengeSeed });
    } else if (selectedMode === "daily") {
      const daily = dailySeedAt(Date.now());
      if (!daily.ok) {
        setSetupError("The daily seed could not be prepared on this device.");
        return;
      }
      const dailyDateUtc = daily.value.slice(-10);
      sessionResult = generatePixelSession({
        mode: "daily",
        seed: daily.value,
        dailyDateUtc,
      });
    } else {
      sessionResult = generatePixelSession({ mode: "quick", seed: freshQuickSeed() });
    }

    if (!sessionResult.ok) {
      setSetupError(sessionResult.error.message);
      return;
    }
    const initial = createPixelGameState(sessionResult.value, Date.now(), nextToken("ready"));
    if (!initial.ok) {
      setSetupError(initial.error.message);
      return;
    }
    setState(initial.value);
  };

  const phase = state?.phase ?? "setup";
  const activeSessionId = state?.progress.prepared.sessionId ?? "";
  const activeRoundIndex = state && state.phase !== "session_result" ? state.roundIndex : -1;
  const activePhaseToken = state && state.phase !== "session_result" ? state.phaseToken : "";

  useEffect(() => {
    if (phase !== "playing" || activeRoundIndex < 0) return;
    const guard = {
      sessionId: activeSessionId,
      roundIndex: activeRoundIndex as 0 | 1 | 2 | 3 | 4,
      phaseToken: activePhaseToken,
    };
    const interval = window.setInterval(() => {
      setState((current) =>
        current
          ? pixelGameReducer(current, {
              type: "CLOCK_TICK",
              nowMs: Date.now(),
              guard,
              resultPhaseToken: `${activePhaseToken}:timeout`,
            })
          : current,
      );
    }, 100);
    return () => window.clearInterval(interval);
  }, [phase, activeSessionId, activeRoundIndex, activePhaseToken]);

  const completedSessionId = state?.phase === "session_result" ? state.progress.prepared.sessionId : "";
  const completedMode = state?.phase === "session_result" ? state.progress.prepared.mode : null;
  const completedDailyDate = state?.phase === "session_result" ? state.progress.prepared.dailyDateUtc : null;
  const completedFound = state?.phase === "session_result" ? selectFoundRounds(state) : 0;
  const completedScore = state?.phase === "session_result" ? selectTotalScore(state) : 0;

  useEffect(() => {
    if (!completedSessionId || !completedMode) return;
    if (recordedSessions.current.has(completedSessionId)) return;
    recordedSessions.current.add(completedSessionId);
    recordPixelSession({
      sessionId: completedSessionId,
      mode: completedMode,
      dailyDateUtc: completedDailyDate,
      roundsFound: completedFound,
      score: completedScore,
    });
  }, [completedSessionId, completedMode, completedDailyDate, completedFound, completedScore]);

  const startRound = () => {
    if (state?.phase !== "ready") return;
    send({
      type: "START_ROUND",
      nowMs: Date.now(),
      guard: guardForPixelState(state),
      playingPhaseToken: nextToken("playing"),
    });
  };

  const tapCell = (cellIndex: number) => {
    if (state?.phase !== "playing") return;
    send({
      type: "TAP_CELL",
      nowMs: Date.now(),
      guard: guardForPixelState(state),
      cellIndex,
      resultPhaseToken: nextToken("result"),
    });
  };

  const nextRound = () => {
    if (state?.phase !== "round_result") return;
    send({
      type: "NEXT_ROUND",
      nowMs: Date.now(),
      guard: guardForPixelState(state),
      nextPhaseToken: nextToken("ready"),
    });
  };

  const resetToSetup = (mode: "quick" | "daily" = "quick") => {
    setState(null);
    setSelectedMode(mode);
    setSetupError(null);
    setShareFeedback(null);
    setManualShareUrl(null);
  };

  const handleShare = async (prepared: PreparedPixelSession, score: number) => {
    const encoded = encodePixelChallengeToken(prepared.seed);
    if (!encoded.ok) {
      setShareFeedback("This scan could not be encoded as a challenge.");
      return;
    }
    const url = `${window.location.origin}/challenge/${encoded.value}`;
    const outcome = await shareChallenge(url, score);
    setShareFeedback(shareMessage(outcome));
    setManualShareUrl(outcome === "manual-copy-required" ? url : null);
  };

  if (state === null) {
    return (
      <section className="pixel-play-page pixel-play-page--setup">
        <div className="pixel-game-shell">
          <div className="pixel-panel">
            <p className="eyebrow">Visual inspection / five rounds</p>
            <h1 className="pixel-title">
              {lockedChallenge ? "Challenge received." : "Choose your scan."}
            </h1>
            <p className="pixel-copy">
              {lockedChallenge
                ? "A friend locked these five boards to a seed. You get the exact same anomalies—what you do with them is up to your eyes."
                : "Each session is generated on this device. Find one altered tile per board before the 15-second clock reaches zero."}
            </p>

            {setupError ? <p className="game-error" role="alert">{setupError}</p> : null}

            {!lockedChallenge ? (
              <fieldset className="setup-fieldset">
                <legend>Scan mode</legend>
                <div className="mode-grid">
                  <div className="mode-card">
                    <input
                      checked={selectedMode === "quick"}
                      id="mode-quick"
                      name="mode"
                      onChange={() => setSelectedMode("quick")}
                      type="radio"
                    />
                    <label htmlFor="mode-quick">
                      <strong>Quick scan</strong>
                      <small>A fresh seed and five new boards every time.</small>
                    </label>
                  </div>
                  <div className="mode-card">
                    <input
                      checked={selectedMode === "daily"}
                      id="mode-daily"
                      name="mode"
                      onChange={() => setSelectedMode("daily")}
                      type="radio"
                    />
                    <label htmlFor="mode-daily">
                      <strong>Daily scan</strong>
                      <small>The same UTC-dated boards for everyone today.</small>
                    </label>
                  </div>
                </div>
              </fieldset>
            ) : (
              <p className="game-notice">
                Challenge integrity: {challengeTokenId?.slice(0, 8) ?? "verified"}
              </p>
            )}

            <div className="setup-facts" aria-label="Game facts">
              <span><strong>05</strong>boards</span>
              <span><strong>15s</strong>each</span>
              <span><strong>01</strong>anomaly</span>
            </div>
            <button className="button button--signal button--large" onClick={prepareSession} type="button">
              {lockedChallenge ? "Accept challenge" : "Prepare scan"}
            </button>
            <p className="setup-footnote">No login · No uploads · No AI generation · Results stay local</p>
          </div>
        </div>
      </section>
    );
  }

  const prepared = state.progress.prepared;

  if (state.phase === "ready") {
    const puzzle = selectCurrentPuzzle(state);
    return (
      <section className="game-overlay game-overlay--ready">
        <div className="pixel-game-shell">
          <div className="pixel-panel">
            <div className="pixel-hud">
              <RoundTrack current={state.roundIndex + 1} completed={state.progress.outcomes.length} />
              <span>{modeCopy[prepared.mode]}</span>
            </div>
            <p className="eyebrow">Round {state.roundIndex + 1} / {puzzle.difficulty}</p>
            <h1 className="pixel-title">Eyes ready?</h1>
            <p className="pixel-copy">
              The board stays hidden until you begin. Find the only changed tile;
              wrong taps cost points but do not end the round.
            </p>
            <button className="button button--signal button--large" onClick={startRound} type="button">
              Start round {state.roundIndex + 1}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (state.phase === "playing") {
    const remainingMs = selectRemainingMs(state);
    const seconds = (remainingMs / 1000).toFixed(1);
    const timerStyle = {
      "--timer-progress": `${(remainingMs / PIXEL_ROUND_DURATION_MS) * 100}%`,
    } as CSSProperties;
    return (
      <section className="game-overlay game-overlay--playing">
        <div className="pixel-stage">
          <div className="pixel-hud">
            <RoundTrack current={state.roundIndex + 1} completed={state.progress.outcomes.length} />
            <span>Wrong taps: {state.wrongCellIndexes.length}</span>
          </div>
          <div className="pixel-timer" data-urgent={remainingMs <= 5_000} aria-label={`${Math.ceil(remainingMs / 1000)} seconds remaining`} role="timer">
            {seconds}
          </div>
          <div className="timer-rail" data-urgent={remainingMs <= 5_000} style={timerStyle} aria-hidden="true"><i /></div>
          <PuzzleBoard state={state} onCell={tapCell} />
          <p className="wrong-feedback" aria-live="polite">
            {state.wrongCellIndexes.length > 0
              ? `${state.wrongCellIndexes.length} unique miss${state.wrongCellIndexes.length === 1 ? "" : "es"} — keep scanning`
              : "One tile breaks the pattern"}
          </p>
        </div>
      </section>
    );
  }

  if (state.phase === "round_result") {
    const found = state.outcome.result === "found";
    return (
      <section className="game-overlay game-overlay--result">
        <div className="pixel-game-shell">
          <div className="pixel-hud">
            <RoundTrack current={state.roundIndex + 1} completed={state.progress.outcomes.length} />
            <span>{state.outcome.wrongCellIndexes.length} wrong</span>
          </div>
          <div className="pixel-panel result-panel" aria-live="polite">
            <div className="result-layout">
              <div className="result-overview">
                <p className="eyebrow">Round {state.roundIndex + 1} inspected</p>
                <div className={`result-mark${found ? "" : " result-mark--miss"}`} aria-hidden="true">
                  {found ? "✓" : "×"}
                </div>
                <h1 className="result-title">{found ? "Anomaly found." : "Time exposed it."}</h1>
                <p className="result-copy">
                  {found
                    ? `You found the ${selectCurrentPuzzle(state).mutation.kind} change with ${(state.outcome.remainingMs / 1000).toFixed(1)} seconds left.`
                    : `The altered tile is outlined below. It changed one ${selectCurrentPuzzle(state).mutation.kind} value.`}
                </p>
                <p className="score-pill">+{state.outcome.score} points</p>
              </div>
              <div className="result-board">
                <PuzzleBoard state={state} onCell={() => undefined} />
              </div>
            </div>
            <div className="game-actions result-actions">
              <button className="button button--signal" onClick={nextRound} type="button">
                {state.roundIndex === 4 ? "See scan report" : "Next board"}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const score = selectTotalScore(state);
  const found = selectFoundRounds(state);
  const wrong = selectTotalWrongTaps(state);
  return (
    <section className="pixel-play-page pixel-play-page--summary">
      <div className="pixel-game-shell">
        <div className="pixel-panel" aria-live="polite">
          <p className="eyebrow">Inspection complete</p>
          <h1 className="pixel-title">{found === 5 ? "Flawless focus." : found >= 3 ? "Sharp scan." : "Eyes calibrated."}</h1>
          <p className="pixel-copy">
            You found {found} of 5 anomalies in {modeCopy[prepared.mode].toLowerCase()} mode.
            The board recipe can now be replayed as a challenge.
          </p>
          <div className="summary-grid">
            <p className="summary-stat"><strong>{score}</strong><span>total score</span></p>
            <p className="summary-stat"><strong>{found}/5</strong><span>found</span></p>
            <p className="summary-stat"><strong>{wrong}</strong><span>wrong taps</span></p>
          </div>
          {shareFeedback ? <p className="share-feedback" role="status">{shareFeedback}</p> : null}
          {manualShareUrl ? (
            <div className="manual-share">
              <label htmlFor="challenge-url">Challenge URL</label>
              <input id="challenge-url" onFocus={(event) => event.currentTarget.select()} readOnly value={manualShareUrl} />
            </div>
          ) : null}
          <div className="game-actions game-actions--summary">
            <button className="button button--signal" onClick={() => void handleShare(prepared, score)} type="button">
              Challenge a friend
            </button>
            <button className="button button--secondary" onClick={() => resetToSetup("quick")} type="button">
              New quick scan
            </button>
            <button className="button button--ghost" onClick={() => resetToSetup("daily")} type="button">
              Daily scan
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
