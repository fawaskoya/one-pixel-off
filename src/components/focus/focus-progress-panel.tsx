export type FocusFamilyMastery = {
  id: string;
  label: string;
  finds: number;
  target: number;
  mastered?: boolean;
};

export type FocusProgressSnapshot = {
  bestScore: number;
  highestBoard: number;
  bestFindStreak: number;
  bestCleanStreak: number;
  familyMastery?: readonly FocusFamilyMastery[];
};

export type FocusDailyActivityDay = {
  date: string;
  label?: string;
  completed: boolean;
  isToday?: boolean;
};

export type FocusDailyActivity = {
  currentStreak: number;
  longestStreak: number;
  daysPlayedLast7: number;
  sevenDayCells: readonly FocusDailyActivityDay[];
};

export type FocusAchievement = {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  progress?: number;
  goal?: number;
};

export type FocusProgressPanelProps = {
  progress: FocusProgressSnapshot;
  dailyActivity: FocusDailyActivity;
  achievements: readonly FocusAchievement[];
  heading?: string;
};

function boundedProgress(value: number, target: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(Math.max(1, target), value));
}

export function FocusProgressPanel({
  progress,
  dailyActivity,
  achievements,
  heading = "Your focus record",
}: FocusProgressPanelProps) {
  const headingId = "focus-progress-title";
  const families = progress.familyMastery ?? [];
  const completedToday = dailyActivity.sevenDayCells.some(
    (day) => day.isToday && day.completed,
  );

  return (
    <section aria-labelledby={headingId} className="focus-progress">
      <div className="focus-progress__heading">
        <p className="eyebrow">Saved on this device</p>
        <h2 id={headingId}>{heading}</h2>
      </div>

      <dl className="focus-progress__bests" aria-label="Personal bests">
        <div>
          <dt>Best score</dt>
          <dd>{progress.bestScore}</dd>
        </div>
        <div>
          <dt>Highest board</dt>
          <dd>{progress.highestBoard}</dd>
        </div>
        <div>
          <dt>Find streak</dt>
          <dd>{progress.bestFindStreak}</dd>
        </div>
        <div>
          <dt>Clean streak</dt>
          <dd>{progress.bestCleanStreak}</dd>
        </div>
      </dl>

      <div className="focus-progress__daily" aria-labelledby="focus-daily-title">
        <div className="focus-progress__section-heading">
          <div>
            <h3 id="focus-daily-title">Daily activity</h3>
            <p>
              {dailyActivity.daysPlayedLast7} of the last 7 days · {dailyActivity.currentStreak} day
              {dailyActivity.currentStreak === 1 ? "" : "s"} current streak
            </p>
          </div>
          <p className="focus-progress__today" data-complete={completedToday}>
            {completedToday ? "Today complete" : "Today open"}
          </p>
        </div>

        <ol className="focus-activity-strip" aria-label="Last seven days">
          {dailyActivity.sevenDayCells.map((day) => (
            <li data-complete={day.completed} data-today={day.isToday || undefined} key={day.date}>
              <time dateTime={day.date}>{day.label ?? day.date.slice(5)}</time>
              <i aria-hidden="true" />
              <span className="sr-only">
                {day.completed ? "Daily scan completed" : "Daily scan not completed"}
                {day.isToday ? "; today" : ""}
              </span>
            </li>
          ))}
        </ol>
        <p className="focus-progress__longest">Longest daily streak: {dailyActivity.longestStreak}</p>
      </div>

      <div className="focus-progress__achievements" aria-labelledby="focus-achievements-title">
        <div className="focus-progress__section-heading">
          <h3 id="focus-achievements-title">Mastery badges</h3>
          <span>{achievements.filter((achievement) => achievement.achieved).length}/{achievements.length} unlocked</span>
        </div>
        <ul className="focus-achievement-list">
          {achievements.map((achievement) => {
            const hasMeter = achievement.goal !== undefined && achievement.goal > 0;
            const meterValue = hasMeter
              ? boundedProgress(achievement.progress ?? 0, achievement.goal ?? 1)
              : 0;
            return (
              <li data-unlocked={achievement.achieved} key={achievement.id}>
                <div className="focus-achievement-list__copy">
                  <h4>{achievement.title}</h4>
                  <p>{achievement.description}</p>
                </div>
                <span className="focus-achievement-list__state">
                  {achievement.achieved ? "Unlocked" : "In progress"}
                </span>
                {hasMeter ? (
                  <progress
                    aria-label={`${achievement.title}: ${meterValue} of ${achievement.goal}`}
                    max={achievement.goal}
                    value={meterValue}
                  >
                    {meterValue} of {achievement.goal}
                  </progress>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      {families.length > 0 ? (
        <div className="focus-progress__families" aria-labelledby="focus-families-title">
          <div className="focus-progress__section-heading">
            <h3 id="focus-families-title">Pattern family mastery</h3>
            <span>{families.filter((family) => family.mastered).length}/{families.length} mastered</span>
          </div>
          <ul className="focus-family-list">
            {families.map((family) => {
              const safeTarget = Math.max(1, family.target);
              const meterValue = boundedProgress(family.finds, safeTarget);
              return (
                <li data-mastered={family.mastered || undefined} key={family.id}>
                  <div>
                    <strong>{family.label}</strong>
                    <span>{family.finds}/{safeTarget} finds</span>
                  </div>
                  <progress
                    aria-label={`${family.label}: ${meterValue} of ${safeTarget} finds`}
                    max={safeTarget}
                    value={meterValue}
                  >
                    {meterValue} of {safeTarget}
                  </progress>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
