// Small statistics for the IT team's home page: requests filed per day, and a summary of that series. Pure module.

import { bangkokDateString } from "./report-params";

export type DayCount = { date: string; count: number };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * One entry per day for the last `days` days, oldest first and ending with today, where a day runs from midnight to
 * midnight in Bangkok. Days with nothing filed count 0; dates outside the window are ignored.
 */
export function dailyCounts(dates: Date[], now: Date, days: number): DayCount[] {
  // Bangkok has no daylight saving, so a day is always 24 hours.
  const series: DayCount[] = Array.from({ length: days }, (_, index) => ({
    date: bangkokDateString(new Date(now.getTime() - (days - 1 - index) * DAY_MS)),
    count: 0,
  }));
  const byDate = new Map(series.map((day) => [day.date, day]));
  for (const date of dates) {
    const day = byDate.get(bangkokDateString(date));
    if (day) day.count += 1;
  }
  return series;
}

export type TrendSummary = {
  /** Filed in the latest `period` days. */
  total: number;
  /** Filed in the `period` days before that. */
  previousTotal: number;
  change: number;
  averagePerDay: number;
  /** The busiest of the latest days (the latest one on a tie); null when nothing was filed. */
  peak: DayCount | null;
};

/** The latest `period` days of a daily series, compared with the period before them. */
export function trendSummary(series: DayCount[], period: number): TrendSummary {
  const latest = series.slice(-period);
  const previous = series.slice(-2 * period, -period);
  const sum = (days: DayCount[]) => days.reduce((total, day) => total + day.count, 0);

  const total = sum(latest);
  const previousTotal = sum(previous);
  let peak: DayCount | null = null;
  for (const day of latest) {
    if (day.count > 0 && (peak === null || day.count >= peak.count)) peak = day;
  }

  return {
    total,
    previousTotal,
    change: total - previousTotal,
    averagePerDay: latest.length === 0 ? 0 : Math.round((total / latest.length) * 10) / 10,
    peak,
  };
}
