import { describe, expect, it } from "vitest";
import { pageItems, paginate } from "./pagination";

describe("paginate", () => {
  it("gives one page for an empty list", () => {
    expect(paginate(0, 1, 14)).toEqual({ page: 1, pageCount: 1, skip: 0 });
  });

  it("skips the rows of the earlier pages", () => {
    expect(paginate(15, 2, 14)).toEqual({ page: 2, pageCount: 2, skip: 14 });
  });

  it("falls back to the last page when the requested one no longer exists, e.g. after deleting its only row", () => {
    expect(paginate(14, 2, 14)).toEqual({ page: 1, pageCount: 1, skip: 0 });
    expect(paginate(15, 9, 14)).toEqual({ page: 2, pageCount: 2, skip: 14 });
  });

  it("treats a page below 1 or a non-number as the first page", () => {
    expect(paginate(30, 0, 14).page).toBe(1);
    expect(paginate(30, -3, 14).page).toBe(1);
    expect(paginate(30, Number.NaN, 14).page).toBe(1);
  });
});

describe("pageItems", () => {
  it("shows a single page for a short list", () => {
    expect(pageItems(1, 1)).toEqual([1]);
  });

  it("shows every page when there are only a few", () => {
    expect(pageItems(1, 3)).toEqual([1, 2, 3]);
    expect(pageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("keeps the first and last page and skips the middle of a long list", () => {
    expect(pageItems(1, 10)).toEqual([1, 2, "gap", 10]);
    expect(pageItems(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
    expect(pageItems(10, 10)).toEqual([1, "gap", 9, 10]);
  });

  it("shows the page itself instead of a gap that would hide only one page", () => {
    expect(pageItems(4, 6)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, "gap", 7]);
  });

  it("never lists a page twice or outside the range", () => {
    for (let pageCount = 1; pageCount <= 12; pageCount++) {
      for (let current = 1; current <= pageCount; current++) {
        const numbers = pageItems(current, pageCount).filter((item): item is number => item !== "gap");
        expect(new Set(numbers).size).toBe(numbers.length);
        expect(numbers).toContain(current);
        expect(Math.min(...numbers)).toBe(1);
        expect(Math.max(...numbers)).toBe(pageCount);
      }
    }
  });
});
