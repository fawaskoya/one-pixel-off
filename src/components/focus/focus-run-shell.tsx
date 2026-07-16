"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FOCUS_RUN_MAX_CHARGES,
  createFocusRunState,
  focusRunReducer,
  focusRunWeeklySeedAt,
  guardForFocusRunState,
  selectFocusRunRemainingMs,
  type FocusRunAction,
  type FocusRunState,
  type FocusRunVariant,
} from "@/domain/focus-run";
import { GLYPH_FAMILIES, type GlyphFamilyId } from "@/domain/pixel";
import {
  deriveDailyActivity,
  type DailyActivity,
} from "@/lib/client/daily-activity";
import {
  deriveFocusAchievements,
  emptyFocusProgress,
  loadFocusProgress,
  recordFocusRun,
  type FocusProgress,
} from "@/lib/client/focus-progress";
import { loadPixelStats } from "@/lib/client/pixel-storage";
import { shareFocusRun, type ShareOutcome } from "@/lib/client/share";
import {
  PuzzleBoard,
  useGameInputModality,
} from "@/components/game/puzzle-board";
import { FocusCheckpoint } from "./focus-checkpoint";
import {
  FocusProgressPanel,
  type FocusAchievement,
  type FocusDailyActivity,
  type FocusProgressSnapshot,
} from "./focus-progress-panel";
import { FocusRunHud } from "./focus-run-hud";
import { FocusRunSummary } from "./focus-run-summary";

type FocusRunShellProps = Readonly<{
  initialVariant?: FocusRunVariant;
  sharedSeed?: string;
  initialError?: string;
}>;

const EMPTY_DAILY_ACTIVITY: DailyActivity = {
  currentStreak: 0,
  longestStreak: 0,
  daysPlayedLast7: 0,
  sevenDayCells: [],
};

const variantCopy: Record<FocusRunVariant, Readonly<{
  eyebrow: string;
  name: string;
  description: string;
}>> = {
  focus: {
    eyebrow: "Endless visual endurance",
    name: "Focus Run",
    description:
      "Keep solving until all three focus charges are gone. Every five boards is a clean stopping point.",
  },
  weekly: {
    eyebrow: "Shared weekly test",
    name: "Weekly 15",
    description:
      "A deterministic 15-board gauntlet that stays identical for everyone for the UTC week.",
  },
};

function freshFocusSeed(): string {
  const bytes = new Uint32Array(2);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    bytes[0] = Date.now() >>> 0;
    bytes[1] = Math.floor(Math.random() * 0xffffffff);
  }
  return `focus-${Date.now().toString(36)}-${bytes[0].toString(36)}-${bytes[1].toString(36)}`;
}

function shareMessage(outcome: ShareOutcome): string {
  if (outcome === "shared") return "Run sent.";
  if (outcome === "copied") return "Run link copied.";
  if (outcome === "cancelled") return "Sharing cancelled.";
  return "Copy the run link below.";
}

function familyLabel(familyId: GlyphFamilyId): string {
  return `${familyId.charAt(0).toUpperCase()}${familyId.slice(1)}`;
}

function progressSnapshot(progress: FocusProgress): FocusProgressSnapshot {
  return {
    bestScore: progress.bestScore,
    highestBoard: progress.highestBoard,
    bestFindStreak: progress.bestFindStreak,
    bestCleanStreak: progress.bestCleanStreak,
    familyMastery: GLYPH_FAMILIES.map((familyId) => {
      const finds = progress.findsByFamily[familyId];
      const target = finds < 5 ? 5 : finds < 25 ? 25 : 100;
      return {
        id: familyId,
        label: familyLabel(familyId),
        finds,
        target,
        mastered: finds >= 100,
      };
    }),
  };
}

function dailyActivitySnapshot(activity: DailyActivity): FocusDailyActivity {
  return {
    currentStreak: activity.currentStreak,
    longestStreak: activity.longestStreak,
    daysPlayedLast7: activity.daysPlayedLast7,
    sevenDayCells: activity.sevenDayCells.map((day) => ({
      date: day.date,
      label: new Intl.DateTimeFormat("en", {
        weekday: "short",
        timeZone: "UTC",
      }).format(new Date(`${day.date}T00:00:00Z`)),
      completed: day.completed,
      isToday: day.isToday,
    })),
  };
}

function achievementSnapshots(
  progress: FocusProgress,
): readonly FocusAchievement[] {
  return deriveFocusAchievements(progress)
    .filter((achievement) => achievement.familyId === null)
    .map((achievement) => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      achieved: achievement.achieved,
      progress: achievement.progress,
      goal: achievement.goal,
    }));
}

function finishReasonCopy(state: Extract<FocusRunState, { phase: "run_result" }>): string {
  switch (state.finishReason) {
    case "charges_exhausted":
      return "That timeout spent your final focus charge. The run is complete; its local save status appears below.";
    case "player_finished":
      return "You finished at a checkpoint. The run is complete; its local save status appears below.";
    case "weekly_completed":
      return "All 15 weekly boards inspected. This exact gauntlet remains available until the UTC week changes.";
    case "board_limit_reached":
      return "You reached the engine's safe board limit and completed the run.";
  }
}

export function FocusRunShell({
  initialVariant = "focus",
  sharedSeed,
  initialError,
}: FocusRunShellProps) {
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] =
    useState<FocusRunVariant>(initialVariant);
  const [state, setState] = useState<FocusRunState | null>(null);
  const [setupError, setSetupError] = useState<string | null>(
    initialError ?? null,
  );
  const [progress, setProgress] = useState<FocusProgress>(() =>
    emptyFocusProgress(),
  );
  const [dailyActivity, setDailyActivity] =
    useState<DailyActivity>(EMPTY_DAILY_ACTIVITY);
  const [isPersonalBest, setIsPersonalBest] = useState(false);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [manualShareUrl, setManualShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [focusBoardOnStart, setFocusBoardOnStart] = useState(false);
  const recordedCompletions = useRef(new Set<string>());
  const tokenSequence = useRef(0);
  const screenRef = useRef<HTMLElement | null>(null);
  const previousPhaseRef = useRef<string>("lobby");
  const inputModality = useGameInputModality();

  const nextToken = (label: string) => {
    tokenSequence.current += 1;
    return `${label}:${tokenSequence.current}`;
  };

  const refreshLocalProgress = () => {
    setProgress(loadFocusProgress());
    setDailyActivity(
      deriveDailyActivity(loadPixelStats().dailyDatesCompleted),
    );
  };

  useEffect(() => {
    const timeout = window.setTimeout(refreshLocalProgress, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const send = (action: FocusRunAction) => {
    setState((current) =>
      current ? focusRunReducer(current, action) : current,
    );
  };

  const startRun = (variant: FocusRunVariant = selectedVariant) => {
    setSetupError(null);
    setShareFeedback(null);
    setManualShareUrl(null);
    setIsSharing(false);
    setIsPersonalBest(false);
    setSaveWarning(null);

    let seed = sharedSeed;
    if (!seed && variant === "weekly") {
      const weekly = focusRunWeeklySeedAt(Date.now());
      if (!weekly.ok) {
        setSetupError(weekly.error.message);
        return;
      }
      seed = weekly.value;
    }
    seed ??= freshFocusSeed();

    const created = createFocusRunState(
      seed,
      Date.now(),
      nextToken("focus-ready"),
      { variant },
    );
    if (!created.ok) {
      setSetupError(created.error.message);
      return;
    }
    setSelectedVariant(variant);
    setState(created.value);
  };

  const phase = state?.phase ?? "lobby";
  const playingRunId =
    state?.phase === "playing" ? state.progress.prepared.runId : "";
  const playingBoardNumber =
    state?.phase === "playing" ? state.board.boardNumber : -1;
  const playingPhaseToken =
    state?.phase === "playing" ? state.phaseToken : "";
  const completedAtMs =
    state?.phase === "run_result" ? state.completedAtMs : null;
  const completedRunId =
    state?.phase === "run_result" ? state.progress.prepared.runId : "";
  const completedProgress =
    state?.phase === "run_result" ? state.progress : null;

  useEffect(() => {
    const phaseChanged = previousPhaseRef.current !== phase;
    previousPhaseRef.current = phase;
    if (!phaseChanged || phase === "playing" || inputModality.current !== "keyboard") {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      const primaryAction =
        screenRef.current?.querySelector<HTMLElement>(".button--signal:not(:disabled)") ??
        screenRef.current?.querySelector<HTMLElement>("button:not(:disabled), a[href]");
      primaryAction?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [inputModality, phase]);

  useEffect(() => {
    if (
      phase !== "playing" ||
      !playingRunId ||
      playingBoardNumber < 1 ||
      !playingPhaseToken
    ) {
      return;
    }
    const guard = {
      runId: playingRunId,
      boardNumber: playingBoardNumber,
      phaseToken: playingPhaseToken,
    };
    const interval = window.setInterval(() => {
      setState((current) =>
        current
          ? focusRunReducer(current, {
              type: "CLOCK_TICK",
              nowMs: Date.now(),
              guard,
              resultPhaseToken: `${playingPhaseToken}:timeout`,
            })
          : current,
      );
    }, 100);
    return () => window.clearInterval(interval);
  }, [phase, playingRunId, playingBoardNumber, playingPhaseToken]);

  useEffect(() => {
    if (
      completedAtMs === null ||
      !completedRunId ||
      completedProgress === null
    ) {
      return;
    }
    const completionKey = `${completedRunId}:${completedAtMs}`;
    if (recordedCompletions.current.has(completionKey)) return;
    recordedCompletions.current.add(completionKey);

    const before = loadFocusProgress();
    const { aggregates } = completedProgress;
    const saved = recordFocusRun({
      score: aggregates.score,
      highestBoard: aggregates.boardsPlayed,
      bestFindStreak: aggregates.bestFindStreak,
      bestCleanStreak: aggregates.bestCleanStreak,
      findsByFamily: aggregates.familyFinds,
    });
    const brokePersonalRecord =
      aggregates.score > before.bestScore ||
      aggregates.boardsPlayed > before.highestBoard ||
      aggregates.bestFindStreak > before.bestFindStreak ||
      aggregates.bestCleanStreak > before.bestCleanStreak;
    setIsPersonalBest(saved && brokePersonalRecord);
    setSaveWarning(
      saved
        ? null
        : "This browser blocked local progress. The run is complete, but its records could not be saved on this device.",
    );
    refreshLocalProgress();
  }, [completedAtMs, completedRunId, completedProgress]);

  const startBoard = () => {
    if (state?.phase !== "ready") return;
    setFocusBoardOnStart(inputModality.current === "keyboard");
    send({
      type: "START_BOARD",
      nowMs: Date.now(),
      guard: guardForFocusRunState(state),
      playingPhaseToken: nextToken("focus-playing"),
    });
  };

  const tapCell = (cellIndex: number) => {
    if (state?.phase !== "playing") return;
    send({
      type: "TAP_CELL",
      nowMs: Date.now(),
      guard: guardForFocusRunState(state),
      cellIndex,
      resultPhaseToken: nextToken("focus-result"),
    });
  };

  const advanceAfterResult = () => {
    if (state?.phase !== "round_result") return;
    send({
      type: "ADVANCE_AFTER_RESULT",
      nowMs: Date.now(),
      guard: guardForFocusRunState(state),
      nextPhaseToken: nextToken("focus-next"),
    });
  };

  const continueRun = () => {
    if (state?.phase !== "checkpoint") return;
    send({
      type: "CONTINUE_RUN",
      nowMs: Date.now(),
      guard: guardForFocusRunState(state),
      nextPhaseToken: nextToken("focus-ready"),
    });
  };

  const finishRun = () => {
    if (state?.phase !== "checkpoint") return;
    send({
      type: "FINISH_RUN",
      nowMs: Date.now(),
      guard: guardForFocusRunState(state),
    });
  };

  const handleShare = async (
    completed: Extract<FocusRunState, { phase: "run_result" }>,
  ) => {
    if (isSharing) return;
    setIsSharing(true);
    const params = new URLSearchParams();
    if (completed.progress.prepared.variant === "weekly") {
      params.set("mode", "weekly");
    }
    params.set(
      "g",
      completed.progress.prepared.generationVersion.toString(),
    );
    params.set("r", completed.progress.prepared.rulesVersion.toString());
    params.set("seed", completed.progress.prepared.seed);
    const url = `${window.location.origin}/focus?${params.toString()}`;
    try {
      const outcome = await shareFocusRun(
        url,
        completed.progress.aggregates.score,
        completed.progress.aggregates.finds,
      );
      setShareFeedback(shareMessage(outcome));
      setManualShareUrl(outcome === "manual-copy-required" ? url : null);
    } catch {
      setShareFeedback("Sharing is unavailable. Copy the run link below.");
      setManualShareUrl(url);
    } finally {
      setIsSharing(false);
    }
  };

  if (state === null) {
    const copy = variantCopy[selectedVariant];
    const mappedProgress = progressSnapshot(progress);
    const mappedDailyActivity = dailyActivitySnapshot(dailyActivity);
    const mappedAchievements = achievementSnapshots(progress);
    return (
      <section className="focus-page focus-page--lobby" ref={screenRef}>
        <div className="focus-shell">
          <div className="focus-lobby">
            <div className="focus-lobby__intro">
              <p className="eyebrow">{copy.eyebrow}</p>
              <h1>{sharedSeed ? "A run is waiting." : "Stay sharp. Go deeper."}</h1>
              <p>
                {sharedSeed
                  ? `This link locks the ${copy.name} board sequence. Your result still stays on this device.`
                  : "Solve continuously as the timer tightens. Timeouts spend focus; accurate finds build the streak that can earn it back."}
              </p>
            </div>

            {!sharedSeed ? (
              <fieldset className="focus-mode-picker">
                <legend>Choose a run</legend>
                <div className="focus-mode-grid">
                  {(["focus", "weekly"] as const).map((variant) => (
                    <div className="focus-mode-card" key={variant}>
                      <input
                        checked={selectedVariant === variant}
                        id={`focus-mode-${variant}`}
                        name="focus-mode"
                        onChange={() => setSelectedVariant(variant)}
                        type="radio"
                      />
                      <label htmlFor={`focus-mode-${variant}`}>
                        <span>{variant === "focus" ? "Open run" : "15 boards"}</span>
                        <strong>{variantCopy[variant].name}</strong>
                        <small>{variantCopy[variant].description}</small>
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            ) : (
              <p className="focus-shared-notice">Shared seed accepted locally</p>
            )}

            <div className="focus-rule-grid" aria-label="Focus Run rules">
              <p><strong>03</strong><span>focus charges</span></p>
              <p><strong>05</strong><span>board checkpoints</span></p>
              <p><strong>+1</strong><span>charge per five-find streak</span></p>
              <p><strong>12s</strong><span>minimum timer</span></p>
            </div>

            {setupError ? (
              <p className="game-error" role="alert">{setupError}</p>
            ) : null}

            <button
              className="button button--signal button--large focus-lobby__start"
              onClick={() => startRun()}
              type="button"
            >
              Start {copy.name}
            </button>
            <p className="setup-footnote">
              Wrong taps break the clean streak, not a charge · Progress saves locally
            </p>
          </div>

          <div className="focus-progress-column">
            <FocusProgressPanel
              achievements={mappedAchievements}
              dailyActivity={mappedDailyActivity}
              progress={mappedProgress}
            />
            <Link className="button button--secondary" href="/play?mode=daily">
              Play today&apos;s Daily Scan
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const { aggregates, prepared } = state.progress;

  if (state.phase === "ready") {
    return (
      <section className="focus-page focus-page--ready" ref={screenRef}>
        <div className="focus-stage focus-stage--ready">
          <FocusRunHud
            boardNumber={state.board.boardNumber}
            charges={aggregates.charges}
            cleanStreak={aggregates.cleanStreak}
            difficulty={state.board.difficulty}
            durationMs={state.board.durationMs}
            findStreak={aggregates.findStreak}
            recovery={state.board.recoveryBonusMs > 0}
            remainingMs={state.board.durationMs}
            score={aggregates.score}
            timerActive={false}
          />
          <div className="focus-ready-card">
            <p className="eyebrow">
              {prepared.variant === "weekly" ? "Weekly 15" : "Focus Run"} / sector {Math.ceil(state.board.boardNumber / 5)}
            </p>
            <h1>{state.board.recoveryBonusMs > 0 ? "Take the recovery." : "Eyes ready?"}</h1>
            <p>
              {state.board.recoveryBonusMs > 0
                ? "The last timeout added two seconds to this board. The anomaly remains just as fair."
                : "The board stays hidden until you start. A wrong tile breaks the clean streak, but only timeouts spend focus."}
            </p>
            <button className="button button--signal button--large" onClick={startBoard} type="button">
              Start board {state.board.boardNumber}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (state.phase === "playing") {
    const remainingMs = selectFocusRunRemainingMs(state);
    return (
      <section className="focus-page focus-page--playing" ref={screenRef}>
        <div className="focus-stage">
          <FocusRunHud
            boardNumber={state.board.boardNumber}
            charges={aggregates.charges}
            cleanStreak={aggregates.cleanStreak}
            difficulty={state.board.difficulty}
            durationMs={state.board.durationMs}
            findStreak={aggregates.findStreak}
            recovery={state.board.recoveryBonusMs > 0}
            remainingMs={remainingMs}
            score={aggregates.score}
            urgent={remainingMs <= 4_000}
          />
          <PuzzleBoard
            focusFirstCell={focusBoardOnStart}
            interactive
            onCell={tapCell}
            puzzle={state.board.puzzle}
            wrongCellIndexes={state.wrongCellIndexes}
          />
          <p className="wrong-feedback" aria-live="polite">
            {state.wrongCellIndexes.length > 0
              ? `Clean streak broken · ${state.wrongCellIndexes.length} unique miss${state.wrongCellIndexes.length === 1 ? "" : "es"}`
              : "One tile breaks the pattern"}
          </p>
        </div>
      </section>
    );
  }

  if (state.phase === "round_result") {
    const found = state.outcome.result === "found";
    const runEnds = aggregates.charges === 0;
    const runAtBoardLimit = aggregates.boardsPlayed >= prepared.maxBoards;
    return (
      <section className="focus-page focus-page--result" ref={screenRef}>
        <div className="focus-stage focus-stage--result">
          <div className="focus-result-card" aria-live="polite">
            <div className="focus-result-card__copy">
              <p className="eyebrow">Board {state.board.boardNumber} inspected</p>
              <div className={`result-mark${found ? "" : " result-mark--miss"}`} aria-hidden="true">
                {found ? "✓" : "×"}
              </div>
              <h1>{found ? "Anomaly found." : "Focus spent."}</h1>
              <p>
                {found
                  ? state.outcome.clean
                    ? `Clean find with ${(state.outcome.remainingMs / 1000).toFixed(1)} seconds left.`
                    : `Recovered after ${state.outcome.wrongCellIndexes.length} unique miss${state.outcome.wrongCellIndexes.length === 1 ? "" : "es"}.`
                  : runEnds
                    ? "The target is outlined. All three focus charges have now been spent."
                    : "The target is outlined. Your next board receives a transparent two-second recovery bonus."}
              </p>
              <div className="focus-result-card__pills">
                <span>+{state.outcome.score} points</span>
                <span>{aggregates.charges}/{FOCUS_RUN_MAX_CHARGES} focus</span>
                {state.outcome.chargeDelta === 1 ? <span>1 focus restored</span> : null}
              </div>
            </div>
            <div className="focus-result-card__board">
              <PuzzleBoard
                interactive={false}
                puzzle={state.board.puzzle}
                revealTarget
                wrongCellIndexes={state.outcome.wrongCellIndexes}
              />
            </div>
            <div className="focus-result-card__action">
              <button className="button button--signal" onClick={advanceAfterResult} type="button">
                {prepared.variant === "weekly" && runAtBoardLimit
                  ? "See weekly report"
                  : runEnds || runAtBoardLimit
                    ? "See run report"
                    : aggregates.boardsPlayed % 5 === 0
                      ? "Open checkpoint"
                      : "Next board"}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (state.phase === "checkpoint") {
    return (
      <section className="focus-page focus-page--checkpoint" ref={screenRef}>
        <div className="focus-stage focus-stage--checkpoint">
          <FocusCheckpoint
            bestCleanStreak={aggregates.bestCleanStreak}
            boardNumber={aggregates.boardsPlayed}
            charges={aggregates.charges}
            findStreak={aggregates.findStreak}
            onContinue={continueRun}
            onFinish={finishRun}
            score={aggregates.score}
          />
        </div>
      </section>
    );
  }

  const personalRecords = progressSnapshot(progress);
  return (
    <section className="focus-page focus-page--summary" ref={screenRef}>
      <div className="focus-shell focus-shell--summary">
        <div>
          <FocusRunSummary
            bestCleanStreak={Math.max(personalRecords.bestCleanStreak, aggregates.bestCleanStreak)}
            bestFindStreak={Math.max(personalRecords.bestFindStreak, aggregates.bestFindStreak)}
            boardsCleared={aggregates.finds}
            highestBoard={Math.max(personalRecords.highestBoard, aggregates.boardsPlayed)}
            isPersonalBest={isPersonalBest}
            onClassic={() => router.push("/play")}
            onRetry={() => startRun(prepared.variant)}
            reason={finishReasonCopy(state)}
            score={aggregates.score}
            title={
              prepared.variant === "weekly"
                ? state.finishReason === "weekly_completed"
                  ? "Weekly 15 complete."
                  : "Weekly run ended."
                : "Focus Run complete."
            }
          />
          <div className="focus-share-panel">
            {saveWarning ? <p className="game-error" role="alert">{saveWarning}</p> : null}
            <button
              aria-busy={isSharing}
              className="button button--ghost"
              disabled={isSharing}
              onClick={() => void handleShare(state)}
              type="button"
            >
              {isSharing ? "Preparing share…" : "Share this board sequence"}
            </button>
            <button
              className="button button--ghost"
              onClick={() => {
                setState(null);
                if (sharedSeed) {
                  setSelectedVariant("focus");
                  router.replace("/focus");
                }
              }}
              type="button"
            >
              {sharedSeed ? "Choose another run" : "Back to run selection"}
            </button>
            {shareFeedback ? <p role="status">{shareFeedback}</p> : null}
            {manualShareUrl ? (
              <div className="manual-share">
                <label htmlFor="focus-run-url">Run URL</label>
                <input
                  id="focus-run-url"
                  onFocus={(event) => event.currentTarget.select()}
                  readOnly
                  value={manualShareUrl}
                />
              </div>
            ) : null}
          </div>
        </div>
        <div className="focus-progress-column">
          <FocusProgressPanel
            achievements={achievementSnapshots(progress)}
            dailyActivity={dailyActivitySnapshot(dailyActivity)}
            progress={personalRecords}
          />
          <Link className="button button--secondary" href="/play?mode=daily">
            Play today&apos;s Daily Scan
          </Link>
        </div>
      </div>
    </section>
  );
}
