"use client";

export type FocusCheckpointProps = {
  boardNumber: number;
  score: number;
  findStreak: number;
  bestCleanStreak: number;
  charges: number;
  maxCharges?: number;
  onContinue: () => void;
  onFinish: () => void;
  continueDisabled?: boolean;
};

export function FocusCheckpoint({
  boardNumber,
  score,
  findStreak,
  bestCleanStreak,
  charges,
  maxCharges = 3,
  onContinue,
  onFinish,
  continueDisabled = false,
}: FocusCheckpointProps) {
  const headingId = `focus-checkpoint-${Math.max(1, Math.floor(boardNumber))}`;

  return (
    <section
      aria-labelledby={headingId}
      aria-live="polite"
      className="focus-checkpoint"
    >
      <p className="eyebrow">Checkpoint / {boardNumber} boards inspected</p>
      <h1 className="focus-checkpoint__title" id={headingId}>Bank it or go deeper?</h1>
      <p className="focus-checkpoint__copy">
        Your progress is safe on this screen. Continue into a harder sector, or finish now and
        lock in this run.
      </p>

      <dl className="focus-checkpoint__stats" aria-label="Current run snapshot">
        <div>
          <dt>Score</dt>
          <dd>{score}</dd>
        </div>
        <div>
          <dt>Find streak</dt>
          <dd>{findStreak}</dd>
        </div>
        <div>
          <dt>Best clean streak</dt>
          <dd>{bestCleanStreak}</dd>
        </div>
        <div>
          <dt>Focus charges</dt>
          <dd>{charges}/{maxCharges}</dd>
        </div>
      </dl>

      <div className="focus-checkpoint__actions">
        <button
          className="button button--signal button--large"
          disabled={continueDisabled}
          onClick={onContinue}
          type="button"
        >
          Continue run
        </button>
        <button className="button button--secondary" onClick={onFinish} type="button">
          Finish and save
        </button>
      </div>
    </section>
  );
}
