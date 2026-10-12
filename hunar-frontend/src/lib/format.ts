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

/**
 * Helper to build an ISO preferredVisitTime from date and time slot or specific time.
 * Standard slots use a seconds offset of 1 to be uniquely identifiable.
 */
export function buildPreferredVisitTime(
  preferredDate?: string,
  preferredTimeSlot?: string,
): string | undefined {
  if (!preferredDate || !preferredDate.trim()) return undefined;
  const rawDate = preferredDate.trim();
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(rawDate);
  if (!dateMatch) return undefined;

  const year = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10) - 1;
  const day = parseInt(dateMatch[3], 10);

  if (!preferredTimeSlot || !preferredTimeSlot.trim()) {
    const d = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return d.toISOString();
  }

  const slot = preferredTimeSlot.trim();

  // Preset window slots (seconds = 1 identifies standard preset windows)
  if (
    slot === "8:00 AM – 12:00 PM" ||
    slot === "8:00 AM - 12:00 PM" ||
    /morning|صبح/i.test(slot)
  ) {
    const d = new Date(year, month, day, 9, 0, 1, 0);
    return d.toISOString();
  }

  if (
    slot === "12:00 PM – 4:00 PM" ||
    slot === "12:00 PM - 4:00 PM" ||
    /afternoon|دوپہر/i.test(slot)
  ) {
    const d = new Date(year, month, day, 13, 0, 1, 0);
    return d.toISOString();
  }

  if (
    slot === "4:00 PM – 8:00 PM" ||
    slot === "4:00 PM - 8:00 PM" ||
    /evening|شام/i.test(slot)
  ) {
    const d = new Date(year, month, day, 17, 0, 1, 0);
    return d.toISOString();
  }

  // Specific time (e.g., "5:30 PM", "11:00 AM", "17:30")
  const timeMatch = slot.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const meridiem = (timeMatch[3] || "").toLowerCase();

    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;

    const d = new Date(year, month, day, hours, minutes, 0, 0);
    return d.toISOString();
  }

  const d = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  return d.toISOString();
}

/**
 * Extracts human-readable time slot label from a stored preferredVisitTime ISO string.
 * Returns "" if date-only (flexible) or empty.
 */
export function extractTimeSlotFromVisitTime(
  value?: string | null,
  isUrdu: boolean = false,
): string {
  if (!value) return "";
  const raw = value.trim();
  if (!raw || isDateOnlyTimestamp(raw)) return "";

  const date = parseDisplayDate(raw);
  if (!date) return "";

  const seconds = date.getSeconds();
  const hours = date.getHours();

  if (seconds === 1) {
    if (hours >= 8 && hours <= 11) {
      return isUrdu ? "صبح (8:00 AM - 12:00 PM)" : "Morning (8:00 AM - 12:00 PM)";
    }
    if (hours >= 12 && hours <= 15) {
      return isUrdu ? "دوپہر (12:00 PM - 4:00 PM)" : "Afternoon (12:00 PM - 4:00 PM)";
    }
    if (hours >= 16 && hours <= 20) {
      return isUrdu ? "شام (4:00 PM - 8:00 PM)" : "Evening (4:00 PM - 8:00 PM)";
    }
  }

  // Specific time formatting
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Formats a preferred visit time/window into a clean, human-readable string.
 * Handles raw ISO strings (e.g. "2026-10-10T00:00:00.000Z"), date-only strings,
 * standard window presets, and specific timestamps.
 */
export function formatPreferredTiming(
  value?: string | null,
  isUrdu: boolean = false,
  isUrgent: boolean = false,
): string {
  if (
    isUrgent ||
    value === "asap" ||
    value === "EMERGENCY" ||
    value === "URGENT" ||
    (typeof value === "string" && /immediate|asap|جلد از جلد|30.?60/i.test(value))
  ) {
    return isUrdu ? "⚡ فوری آمد (30 تا 60 منٹ)" : "⚡ Immediate (Within 30–60 mins)";
  }
  if (!value) return isUrdu ? "مناسب وقت" : "Flexible Timing";
  const raw = value.trim();
  if (!raw) return isUrdu ? "مناسب وقت" : "Flexible Timing";

  // If already a human-readable label without ISO pattern, return as-is
  const date = parseDisplayDate(raw);
  if (!date) return raw;

  const now = new Date();
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const isToday = isSameDay(date, now);
  const isTomorrow = isSameDay(date, tomorrow);

  const formattedDate = formatJobDate(raw);

  if (isDateOnlyTimestamp(raw)) {
    if (isToday) {
      return isUrdu ? `آج (${formattedDate}) • مناسب وقت` : `Today (${formattedDate}) • Flexible Timing`;
    }
    if (isTomorrow) {
      return isUrdu ? `کل (${formattedDate}) • مناسب وقت` : `Tomorrow (${formattedDate}) • Flexible Timing`;
    }
    return isUrdu ? `${formattedDate} • مناسب وقت` : `${formattedDate} • Flexible Timing`;
  }

  const slotOrTime = extractTimeSlotFromVisitTime(raw, isUrdu);
  const datePrefix = isToday
    ? isUrdu
      ? `آج (${formattedDate})`
      : `Today (${formattedDate})`
    : isTomorrow
    ? isUrdu
      ? `کل (${formattedDate})`
      : `Tomorrow (${formattedDate})`
    : formattedDate;

  return slotOrTime ? `${datePrefix} • ${slotOrTime}` : datePrefix;
}

