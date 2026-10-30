import { DEFAULT_CALENDAR, type Calendar } from "./sla";

/** Public holidays from SLA_HOLIDAYS (comma separated YYYY-MM-DD). Invalid entries are ignored. */
export function slaHolidayList(): string[] {
  return (process.env.SLA_HOLIDAYS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));
}

export function getSlaCalendar(): Calendar {
  const holidays = slaHolidayList();
  return holidays.length > 0 ? { ...DEFAULT_CALENDAR, holidays: new Set(holidays) } : DEFAULT_CALENDAR;
}
