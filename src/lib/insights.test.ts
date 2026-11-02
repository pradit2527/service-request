import { describe, expect, it } from "vitest";
import { dailyCounts, niceScale, trendSummary } from "./insights";

// 2026-11-02 17:00 in Bangkok (UTC+7).
const NOW = new Date("2026-11-02T10:00:00Z");

const filed = (iso: string, closed = false) => ({ createdAt: new Date(iso), closed });

describe("dailyCounts", () => {
  it("gives one entry per day, oldest first, ending today in Bangkok", () => {
    const series = dailyCounts([], NOW, 3);
    expect(series.map((day) => day.date)).toEqual(["2026-10-31", "2026-11-01", "2026-11-02"]);
    expect(series.every((day) => day.count === 0 && day.closed === 0)).toBe(true);
  });

  it("counts the requests of each day and leaves empty days at zero", () => {
    const entries = [filed("2026-11-02T03:00:00Z"), filed("2026-11-02T08:00:00Z"), filed("2026-10-31T05:00:00Z")];
    expect(dailyCounts(entries, NOW, 3).map((day) => day.count)).toEqual([1, 0, 2]);
  });

  it("counts how many of the day's requests are closed, so the rest are still open", () => {
    const entries = [filed("2026-11-02T03:00:00Z", true), filed("2026-11-02T04:00:00Z"), filed("2026-11-02T05:00:00Z", true), filed("2026-11-01T05:00:00Z")];
    expect(dailyCounts(entries, NOW, 2)).toEqual([
      { date: "2026-11-01", count: 1, closed: 0 },
      { date: "2026-11-02", count: 3, closed: 2 },
    ]);
  });

  it("puts a request on the day it was filed in Bangkok, so midnight there starts a new day", () => {
    const afterMidnight = filed("2026-11-01T17:30:00Z"); // 2 Nov 00:30 in Bangkok
    const beforeMidnight = filed("2026-11-01T16:59:00Z"); // 1 Nov 23:59 in Bangkok
    const series = dailyCounts([afterMidnight, beforeMidnight], NOW, 2);
    expect(series).toEqual([
      { date: "2026-11-01", count: 1, closed: 0 },
      { date: "2026-11-02", count: 1, closed: 0 },
    ]);
  });

  it("ignores requests outside the window", () => {
    const tooOld = filed("2026-10-01T05:00:00Z");
    const future = filed("2026-11-05T05:00:00Z");
    expect(dailyCounts([tooOld, future], NOW, 3).map((day) => day.count)).toEqual([0, 0, 0]);
  });
});

describe("trendSummary", () => {
  const series = (counts: number[]) => counts.map((count, index) => ({ date: `2026-10-${String(index + 1).padStart(2, "0")}`, count, closed: 0 }));

  it("totals the latest period and the one before it", () => {
    const counts = [...Array(14).fill(1), ...Array(14).fill(3)];
    expect(trendSummary(series(counts), 14)).toMatchObject({ total: 42, previousTotal: 14, change: 28 });
  });

  it("averages per day to one decimal and finds the busiest day", () => {
    const counts = [...Array(14).fill(0), 0, 0, 5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2];
    const summary = trendSummary(series(counts), 14);
    expect(summary.total).toBe(8);
    expect(summary.averagePerDay).toBe(0.6);
    expect(summary.peak).toEqual({ date: "2026-10-17", count: 5, closed: 0 });
  });

  it("says there is no peak when nothing was filed", () => {
    expect(trendSummary(series(Array(28).fill(0)), 14).peak).toBeNull();
  });

  it("copes with a series shorter than two periods", () => {
    expect(trendSummary(series([2, 3]), 14)).toMatchObject({ total: 5, previousTotal: 0 });
  });
});

describe("niceScale", () => {
  it("gives the axis a round top and at most five steps", () => {
    expect(niceScale(4)).toEqual({ max: 4, ticks: [0, 1, 2, 3, 4] });
    expect(niceScale(6)).toEqual({ max: 6, ticks: [0, 2, 4, 6] });
    expect(niceScale(13)).toEqual({ max: 15, ticks: [0, 5, 10, 15] });
    expect(niceScale(87)).toEqual({ max: 100, ticks: [0, 20, 40, 60, 80, 100] });
    expect(niceScale(101)).toEqual({ max: 150, ticks: [0, 50, 100, 150] });
  });

  it("never gives a flat axis, even when there is nothing to show", () => {
    expect(niceScale(0)).toEqual({ max: 1, ticks: [0, 1] });
  });
});
