import { describe, expect, it } from "vitest";
import { pageItems } from "./pagination";

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
