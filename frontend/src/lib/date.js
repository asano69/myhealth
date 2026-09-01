// Single source of truth for the display style (currently "17 Jul 2026").
// Change these options to change the format everywhere the app
// shows a date, without touching any call site.
const DATE_FORMAT_OPTIONS = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const displayFormatter = new Intl.DateTimeFormat("en-GB", DATE_FORMAT_OPTIONS);

// Converts a stored date string ("YYYY-MM-DD") into its display form.
// Storage keeps the hyphenated ISO form since it's what sorts and
// filters correctly in PocketBase queries; only the rendered text
// changes here.
//
// Parsed as UTC (appending "T00:00:00Z") so the date doesn't shift by a
// day in timezones behind UTC, since "YYYY-MM-DD" alone is otherwise
// interpreted as UTC midnight by Date but displayed in local time by
// Intl.DateTimeFormat.
export function formatDisplayDate(date) {
  const parsed = new Date(`${date}T00:00:00Z`);
  return displayFormatter.format(parsed);
}

// Shifts a "YYYY-MM-DD" date string by the given number of days
// (positive or negative), returning the result in the same
// "YYYY-MM-DD" format. Parsed/shifted in UTC (see formatDisplayDate
// above) so day-of-month arithmetic doesn't drift across timezones
// behind UTC.
export function shiftDate(date, days) {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

// Today's date as "YYYY-MM-DD", the storage format used throughout the
// app (see formatDisplayDate above for the human-readable form).
export function todayDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// Day of week for a "YYYY-MM-DD" date string: 0 = Sunday ... 6 =
// Saturday. Parsed as UTC (see shiftDate/formatDisplayDate above) so it
// stays consistent with the rest of this module.
export function dayOfWeek(date) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}
