import type { CSSProperties } from "react";

export type FocusRunHudProps = {
  boardNumber: number;
  charges: number;
  maxCharges?: number;
  findStreak: number;
  cleanStreak: number;
  score: number;
  difficulty: string;
  remainingMs: number;
  durationMs: number;
  urgent?: boolean;
  recovery?: boolean;
  timerActive?: boolean;
};

function wholeNumber(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function FocusRunHud({
  boardNumber,
  charges,
  maxCharges = 3,
  findStreak,
  cleanStreak,
  score,
  difficulty,
  remainingMs,
  durationMs,
  urgent = false,
  recovery = false,
  timerActive = true,
}: FocusRunHudProps) {
  const safeMaxCharges = Math.max(1, Math.min(12, wholeNumber(maxCharges)));
  const safeCharges = Math.min(safeMaxCharges, wholeNumber(charges));
  const safeDurationMs = Math.max(1, wholeNumber(durationMs));
  const safeRemainingMs = Math.min(safeDurationMs, wholeNumber(remainingMs));
  const seconds = (safeRemainingMs / 1000).toFixed(1);
  const timerStyle = {
    "--focus-time-progress": `${(safeRemainingMs / safeDurationMs) * 100}%`,
  } as CSSProperties;

  return (
    <header className="focus-hud" aria-label="Focus Run status">
      <div className="focus-hud__lead">
        <p className="focus-hud__board">
          <span>Board</span>
          <strong>{Math.max(1, wholeNumber(boardNumber))}</strong>
        </p>
        <p className="focus-hud__difficulty">
          <span>Level</span>
          <strong>{difficulty}</strong>
        </p>
        {recovery ? (
          <p className="focus-hud__recovery" role="status">
            Bonus +2s
          </p>
        ) : null}
      </div>

      <div
        className="focus-charge-meter"
        aria-label={`${safeCharges} of ${safeMaxCharges} focus charges available`}
        role="img"
      >
        <span className="focus-charge-meter__label" aria-hidden="true">Focus</span>
        <span className="focus-charge-meter__pips" aria-hidden="true">
          {Array.from({ length: safeMaxCharges }, (_, index) => (
            <i data-active={index < safeCharges} key={index} />
          ))}
        </span>
        <strong aria-hidden="true">{safeCharges}/{safeMaxCharges}</strong>
      </div>

      <dl className="focus-hud__streaks">
        <div>
          <dt>Find streak</dt>
          <dd>{wholeNumber(findStreak)}</dd>
        </div>
        <div>
          <dt>Clean streak</dt>
          <dd>{wholeNumber(cleanStreak)}</dd>
        </div>
        <div>
          <dt>Score</dt>
          <dd>{wholeNumber(score)}</dd>
        </div>
      </dl>

      <div className="focus-timer" data-urgent={urgent || undefined} style={timerStyle}>
        <span className="focus-timer__label">{timerActive ? "Time" : "Time limit"}</span>
        <time
          aria-label={
            timerActive
              ? `${Math.ceil(safeRemainingMs / 1000)} seconds remaining`
              : `${Math.ceil(safeDurationMs / 1000)} second time limit`
          }
          className="focus-timer__value"
          dateTime={`PT${seconds}S`}
          role={timerActive ? "timer" : undefined}
        >
          {seconds}
        </time>
        <progress
          aria-label={timerActive ? "Time remaining" : "Board time limit"}
          className="focus-timer__progress"
          max={safeDurationMs}
          value={safeRemainingMs}
        >
          {Math.round((safeRemainingMs / safeDurationMs) * 100)}%
        </progress>
      </div>
    </header>
  );
}
