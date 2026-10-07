const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const UTC_MIDNIGHT_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T00:00:00(?:\.000)?(?:Z|[+-]\d{2}:?\d{2})$/;

/**
 * Parses any date-ish API/label string for display purposes.
 *
 * Date-only values ("2026-10-06") and API timestamps pinned to UTC midnight
 * ("2026-10-06T00:00:00.000Z", as produced by `new Date("YYYY-MM-DD").toISOString()`)
 * carry a calendar date, not an instant. They are converted to local midnight of
 * that SAME calendar date so the day never shifts across timezones.
 *
 * Real timestamps (createdAt, completedAt, ...) are returned as-is so they
 * format in the viewer's local timezone.
 *
 * Returns null when the value is not a date (e.g. "Today", "آج").
 */
export function parseDisplayDate(value?: string | null): Date | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;

  const match = DATE_ONLY_PATTERN.exec(raw) ?? UTC_MIDNIGHT_PATTERN.exec(raw);
  if (match) {
    const local = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(local.getTime()) ? null : local;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Human-friendly job date: "Oct 6, 2026".
 * Returns "" for empty values (so callers can apply their own fallback)
 * and the original string for non-date labels such as "Today".
 */
export function formatJobDate(value?: string | null): string {
  if (!value) return "";
  const raw = value.trim();
  if (!raw) return "";
  const date = parseDisplayDate(raw);
  return date ? DATE_FORMAT.format(date) : raw;
}

/**
 * True when a value carries a calendar date but no meaningful time
 * ("2026-10-06" or an ISO timestamp pinned to 00:00 UTC, which is how
 * `new Date("YYYY-MM-DD").toISOString()` round-trips a picked date).
 * Clock times derived from such values are timezone artifacts.
 */
export function isDateOnlyTimestamp(value?: string | null): boolean {
  if (!value) return false;
  const raw = value.trim();
  return DATE_ONLY_PATTERN.test(raw) || UTC_MIDNIGHT_PATTERN.test(raw);
}

/**
 * Combines a job date with its time slot label:
 * "Oct 6, 2026 • Morning (8:00 AM - 12:00 PM)".
 * Falls back to whichever part is available.
 */
export function formatDateSlot(
  date?: string | null,
  slot?: string | null,
): string {
  const formattedDate = formatJobDate(date);
  const formattedSlot = (slot ?? "").trim();
  if (formattedDate && formattedSlot) return `${formattedDate} • ${formattedSlot}`;
  return formattedDate || formattedSlot || "";
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const raw = iso.trim();
  if (!raw) return "—";
  const date = parseDisplayDate(raw);
  return date ? DATE_TIME_FORMAT.format(date) : raw;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const raw = iso.trim();
  if (!raw) return "—";
  const date = parseDisplayDate(raw);
  return date ? DATE_FORMAT.format(date) : raw;
}

export function formatTime(iso?: string | null): string {
  if (!iso) return "—";
  const raw = iso.trim();
  if (!raw) return "—";
  const date = parseDisplayDate(raw);
  return date ? TIME_FORMAT.format(date) : raw;
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "—";
  const date = parseDisplayDate(iso);
  if (!date) return "—";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Compact "Posted" label: relative time for real timestamps,
 * or the original value when it is already a human label.
 */
export function formatPostedAt(value?: string | null): string {
  if (!value) return "";
  const raw = value.trim();
  if (!raw) return "";
  return parseDisplayDate(raw) ? timeAgo(raw) : raw;
}

/** Local "YYYY-MM-DD" for the given (or current) date — never UTC-shifted. */
export function toLocalDateString(value: Date = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
