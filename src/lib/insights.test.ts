import { describe, expect, it } from "vitest";
import { dailyCounts, trendSummary } from "./insights";

// 2026-11-02 17:00 in Bangkok (UTC+7).
const NOW = new Date("2026-11-02T10:00:00Z");

describe("dailyCounts", () => {
  it("gives one entry per day, oldest first, ending today in Bangkok", () => {
    const series = dailyCounts([], NOW, 3);
    expect(series.map((day) => day.date)).toEqual(["2026-10-31", "2026-11-01", "2026-11-02"]);
    expect(series.every((day) => day.count === 0)).toBe(true);
  });

  it("counts the requests of each day and leaves empty days at zero", () => {
    const dates = [new Date("2026-11-02T03:00:00Z"), new Date("2026-11-02T08:00:00Z"), new Date("2026-10-31T05:00:00Z")];
    expect(dailyCounts(dates, NOW, 3).map((day) => day.count)).toEqual([1, 0, 2]);
  });

  it("puts a request on the day it was filed in Bangkok, so midnight there starts a new day", () => {
    const afterMidnight = new Date("2026-11-01T17:30:00Z"); // 2 Nov 00:30 in Bangkok
    const beforeMidnight = new Date("2026-11-01T16:59:00Z"); // 1 Nov 23:59 in Bangkok
    const series = dailyCounts([afterMidnight, beforeMidnight], NOW, 2);
    expect(series).toEqual([
      { date: "2026-11-01", count: 1 },
      { date: "2026-11-02", count: 1 },
    ]);
  });

  it("ignores requests outside the window", () => {
    const tooOld = new Date("2026-10-01T05:00:00Z");
    const future = new Date("2026-11-05T05:00:00Z");
    expect(dailyCounts([tooOld, future], NOW, 3).map((day) => day.count)).toEqual([0, 0, 0]);
  });
});

describe("trendSummary", () => {
  const series = (counts: number[]) => counts.map((count, index) => ({ date: `2026-10-${String(index + 1).padStart(2, "0")}`, count }));

  it("totals the latest period and the one before it", () => {
    const counts = [...Array(14).fill(1), ...Array(14).fill(3)];
    expect(trendSummary(series(counts), 14)).toMatchObject({ total: 42, previousTotal: 14, change: 28 });
  });

  it("averages per day to one decimal and finds the busiest day", () => {
    const counts = [...Array(14).fill(0), 0, 0, 5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2];
    const summary = trendSummary(series(counts), 14);
    expect(summary.total).toBe(8);
    expect(summary.averagePerDay).toBe(0.6);
    expect(summary.peak).toEqual({ date: "2026-10-17", count: 5 });
  });

  it("says there is no peak when nothing was filed", () => {
    expect(trendSummary(series(Array(28).fill(0)), 14).peak).toBeNull();
  });

  it("copes with a series shorter than two periods", () => {
    expect(trendSummary(series([2, 3]), 14)).toMatchObject({ total: 5, previousTotal: 0 });
  });
});
