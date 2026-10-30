/** Counter key for a year, e.g. "SR-2026". */
export function counterKey(year: number): string {
  return `SR-${year}`;
}

/** Request number shown to users, e.g. "SR-2026-0042". */
export function formatRequestNo(year: number, sequence: number): string {
  return `${counterKey(year)}-${String(sequence).padStart(4, "0")}`;
}

/** Current year in Bangkok time, so the sequence resets at local midnight on 1 January. */
export function currentYearBangkok(now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "Asia/Bangkok" }).format(now));
}

/** Today's date as YYYY-MM-DD in Bangkok time. */
export function todayBangkok(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(now);
}
