"use client";

export type FocusRunSummaryProps = {
  reason: string;
  score: number;
  boardsCleared: number;
  highestBoard: number;
  bestFindStreak: number;
  bestCleanStreak: number;
  isPersonalBest?: boolean;
  onRetry: () => void;
  onClassic: () => void;
  title?: string;
};

export function FocusRunSummary({
  reason,
  score,
  boardsCleared,
  highestBoard,
  bestFindStreak,
  bestCleanStreak,
  isPersonalBest = false,
  onRetry,
  onClassic,
  title = "Focus Run complete.",
}: FocusRunSummaryProps) {
  const headingId = "focus-run-summary-title";

  return (
    <section
      aria-labelledby={headingId}
      aria-live="polite"
      className="focus-summary"
    >
      <p className="eyebrow">Run report</p>
      <h1 className="focus-summary__title" id={headingId}>{title}</h1>
      <p className="focus-summary__reason">{reason}</p>
      {isPersonalBest ? (
        <p className="focus-summary__record" role="status">New personal best</p>
      ) : null}

      <div className="focus-summary__score" aria-label={`${score} total points`}>
        <strong>{score}</strong>
        <span>Total score</span>
      </div>

      <dl className="focus-summary__stats" aria-label="Run and personal records">
        <div>
          <dt>Boards cleared</dt>
          <dd>{boardsCleared}</dd>
        </div>
        <div>
          <dt>Highest board</dt>
          <dd>{highestBoard}</dd>
        </div>
        <div>
          <dt>Best find streak</dt>
          <dd>{bestFindStreak}</dd>
        </div>
        <div>
          <dt>Best clean streak</dt>
          <dd>{bestCleanStreak}</dd>
        </div>
      </dl>

      <div className="focus-summary__actions">
        <button className="button button--signal button--large" onClick={onRetry} type="button">
          Start another run
        </button>
        <button className="button button--secondary" onClick={onClassic} type="button">
          Play Classic Five
        </button>
      </div>
    </section>
  );
}
