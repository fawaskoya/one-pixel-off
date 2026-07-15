import { PIXEL_GENERATION_VERSION } from "./constants";
import type { PixelDomainResult } from "./types";

const UTC_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isUtcDateKey(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const match = UTC_DATE_PATTERN.exec(value);
  if (match === null) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const epochMs = Date.UTC(year, month - 1, day);
  const date = new Date(epochMs);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function utcDateKeyFromEpochMs(epochMs: number): string | null {
  if (!Number.isFinite(epochMs)) {
    return null;
  }
  const date = new Date(epochMs);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

export function dailySeedForDate(
  dateUtc: string,
): PixelDomainResult<string> {
  if (!isUtcDateKey(dateUtc)) {
    return {
      ok: false,
      error: { code: "INVALID_DATE", message: "Expected a real UTC date." },
    };
  }
  return {
    ok: true,
    value: `opo|daily|g${PIXEL_GENERATION_VERSION}|${dateUtc}`,
  };
}

export function dailySeedAt(epochMs: number): PixelDomainResult<string> {
  const dateUtc = utcDateKeyFromEpochMs(epochMs);
  if (dateUtc === null) {
    return {
      ok: false,
      error: { code: "INVALID_DATE", message: "Expected a finite timestamp." },
    };
  }
  return dailySeedForDate(dateUtc);
}
