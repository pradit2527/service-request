// Small statistics for the IT team's home page: requests filed per day, and a summary of that series. Pure module.

import { bangkokDateString } from "./report-params";

/** `count` requests were filed on `date`; `closed` of them are closed by now, the rest are still open. */
export type DayCount = { date: string; count: number; closed: number };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * One entry per day for the last `days` days, oldest first and ending with today, where a day runs from midnight to
 * midnight in Bangkok. Days with nothing filed count 0; requests outside the window are ignored.
 */
export function dailyCounts(requests: { createdAt: Date; closed: boolean }[], now: Date, days: number): DayCount[] {
  // Bangkok has no daylight saving, so a day is always 24 hours.
  const series: DayCount[] = Array.from({ length: days }, (_, index) => ({
    date: bangkokDateString(new Date(now.getTime() - (days - 1 - index) * DAY_MS)),
    count: 0,
    closed: 0,
  }));
  const byDate = new Map(series.map((day) => [day.date, day]));
  for (const request of requests) {
    const day = byDate.get(bangkokDateString(request.createdAt));
    if (!day) continue;
    day.count += 1;
    if (request.closed) day.closed += 1;
  }
  return series;
}

/**
 * A round scale for a chart's value axis: the top (at least `maxValue`) and the ticks from 0 to it, one, two or five
 * (times a power of ten) apart, so there are at most five steps. It never comes out flat: the least top is 1.
 */
export function niceScale(maxValue: number): { max: number; ticks: number[] } {
  const target = Math.max(1, Math.ceil(maxValue));
  for (let magnitude = 1; ; magnitude *= 10) {
    for (const base of [1, 2, 5]) {
      const step = base * magnitude;
      const steps = Math.ceil(target / step);
      if (steps <= 5) return { max: steps * step, ticks: Array.from({ length: steps + 1 }, (_, index) => index * step) };
    }
  }
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
