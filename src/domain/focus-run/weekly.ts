import { FOCUS_RUN_GENERATION_VERSION } from "./constants";
import type { FocusRunDomainResult } from "./types";

export function focusRunIsoWeekKeyFromEpochMs(epochMs: number): string | null {
  if (!Number.isFinite(epochMs)) return null;
  const input = new Date(epochMs);
  if (Number.isNaN(input.getTime())) return null;

  const date = new Date(
    Date.UTC(
      input.getUTCFullYear(),
      input.getUTCMonth(),
      input.getUTCDate(),
    ),
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const isoYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${isoYear}-W${week.toString().padStart(2, "0")}`;
}

export function focusRunWeeklySeedAt(
  epochMs: number,
): FocusRunDomainResult<string> {
  const key = focusRunIsoWeekKeyFromEpochMs(epochMs);
  if (key === null) {
    return {
      ok: false,
      error: { code: "INVALID_DATE", message: "Expected a finite timestamp." },
    };
  }
  return {
    ok: true,
    value: `opo|focus-weekly|g${FOCUS_RUN_GENERATION_VERSION}|${key}`,
  };
}
