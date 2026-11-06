const HOUR_PATTERN = /(\d+(?:\.\d+)?)\s*\+?\s*(?:hours|hour|hrs|hr|h)\b/i;
const MINUTE_PATTERN = /(\d+(?:\.\d+)?)\s*\+?\s*(?:minutes|minute|mins|min|m)\b/i;
const BARE_NUMBER_PATTERN = /(\d+(?:\.\d+)?)/;

export const DEFAULT_REPAIR_DURATION_MIN = 60;

/**
 * Parses a free-text repair duration (e.g. "2 hours", "45 mins", "1 hour 30 mins",
 * "3+ hours", "90") into whole minutes for the backend `estimatedRepairTimeMin`.
 * Falls back to `fallbackMinutes` when the input is empty or unparseable
 * (e.g. the generic "Standard" label) so a real, non-hardcoded value is still sent.
 */
export function parseDurationToMinutes(
  input: string | number | null | undefined,
  fallbackMinutes: number = DEFAULT_REPAIR_DURATION_MIN,
): number {
  const fallback =
    Number.isFinite(fallbackMinutes) && fallbackMinutes > 0
      ? Math.round(fallbackMinutes)
      : DEFAULT_REPAIR_DURATION_MIN;

  if (input === null || input === undefined) return fallback;
  if (typeof input === "number") {
    return Number.isFinite(input) && input > 0 ? Math.round(input) : fallback;
  }

  const raw = input.trim().toLowerCase();
  if (raw === "") return fallback;

  let total = 0;
  let matched = false;

  const hours = raw.match(HOUR_PATTERN);
  if (hours) {
    total += Number.parseFloat(hours[1]) * 60;
    matched = true;
  }

  const minutes = raw.match(MINUTE_PATTERN);
  if (minutes) {
    total += Number.parseFloat(minutes[1]);
    matched = true;
  }

  if (!matched) {
    const bare = raw.match(BARE_NUMBER_PATTERN);
    if (bare) {
      total = Number.parseFloat(bare[1]);
      matched = true;
    }
  }

  if (!matched || !Number.isFinite(total) || total <= 0) return fallback;
  return Math.round(total);
}
