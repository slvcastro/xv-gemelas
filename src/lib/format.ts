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
