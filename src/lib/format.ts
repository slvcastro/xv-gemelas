/** Operations run on Yucatán time (UTC-6 all year, no daylight saving). */
export const EVENT_TIME_ZONE = "America/Merida";

const dateTime = new Intl.DateTimeFormat("es-MX", {
  timeZone: EVENT_TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
const timeOnly = new Intl.DateTimeFormat("es-MX", { timeZone: EVENT_TIME_ZONE, hour: "numeric", minute: "2-digit" });

export function formatDateTime(value: Date | string | null | undefined) {
  return value ? dateTime.format(new Date(value)) : null;
}

export function formatTime(value: Date | string | null | undefined) {
  return value ? timeOnly.format(new Date(value)) : null;
}

export const people = (n: number) => `${n} persona${n === 1 ? "" : "s"}`;

const longDate = new Intl.DateTimeFormat("es-MX", { timeZone: EVENT_TIME_ZONE, day: "numeric", month: "long" });
const longDateWeekday = new Intl.DateTimeFormat("es-MX", {
  timeZone: EVENT_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});
const isoDate = new Intl.DateTimeFormat("en-CA", { timeZone: EVENT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** "10 de noviembre" (Yucatán time). */
export function formatLongDate(value: Date | string | null | undefined) {
  return value ? longDate.format(new Date(value)) : null;
}

/** "martes 10 de noviembre" (Yucatán time). */
export function formatLongDateWeekday(value: Date | string | null | undefined) {
  return value ? longDateWeekday.format(new Date(value)) : null;
}

/** Value for <input type="date"> ("2026-11-10"), in Yucatán time. */
export function toDateInputValue(value: Date | string | null | undefined) {
  return value ? isoDate.format(new Date(value)) : "";
}

/** Yucatán is UTC-6 all year (no daylight saving since 2022). */
const YUCATAN_OFFSET_MS = 6 * 60 * 60 * 1000;

/**
 * "2026-11-10" → the last second of that day in Yucatán (2026-11-11T05:59:59Z), so a deadline
 * "antes del 10 de noviembre" still accepts answers during the whole day. Null if the text is not a valid date.
 */
export function endOfDayInYucatan(dateInput: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput.trim());
  if (!match) return null;
  const [y, m, d] = match.slice(1).map(Number);
  const utc = Date.UTC(y, m - 1, d, 23, 59, 59);
  const check = new Date(Date.UTC(y, m - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return null;
  return new Date(utc + YUCATAN_OFFSET_MS);
}

/** Excel serial date of the Yucatán wall-clock time (what Excel shows as "dd/mm/aaaa hh:mm"). */
export function toExcelSerial(value: Date) {
  return (value.getTime() - YUCATAN_OFFSET_MS) / 86_400_000 + 25_569;
}
