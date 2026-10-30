import { describe, expect, it } from "vitest";
import { counterKey, currentYearBangkok, formatRequestNo, todayBangkok } from "./request-number";

describe("request numbers", () => {
  it("pads the sequence to four digits", () => {
    expect(formatRequestNo(2026, 1)).toBe("SR-2026-0001");
    expect(formatRequestNo(2026, 42)).toBe("SR-2026-0042");
  });

  it("does not truncate sequences beyond four digits", () => {
    expect(formatRequestNo(2026, 12345)).toBe("SR-2026-12345");
  });

  it("keys the counter by year", () => {
    expect(counterKey(2027)).toBe("SR-2027");
  });

  it("uses Bangkok time for the year and date", () => {
    // 2026-12-31 18:00 UTC is already 2027-01-01 01:00 in Bangkok
    const nye = new Date("2026-12-31T18:00:00Z");
    expect(currentYearBangkok(nye)).toBe(2027);
    expect(todayBangkok(nye)).toBe("2027-01-01");
  });
});
