import { describe, expect, it } from "vitest";
import { safeReturn } from "./safe-return";

const FALLBACK = "/x";

describe("safeReturn", () => {
  it("keeps a path inside the reports", () => {
    expect(safeReturn("/reports/requests?q=a&page=2", FALLBACK)).toBe("/reports/requests?q=a&page=2");
    expect(safeReturn("/reports", FALLBACK)).toBe("/reports");
    expect(safeReturn("/reports?sort=title", FALLBACK)).toBe("/reports?sort=title");
  });

  it("keeps a path inside the system management pages", () => {
    expect(safeReturn("/admin/users", FALLBACK)).toBe("/admin/users");
    expect(safeReturn("/admin", FALLBACK)).toBe("/admin");
  });

  it("refuses anything that could leave the site or reach another area", () => {
    const bad = [
      "//evil.com",
      "/\\evil.com",
      "https://evil.com",
      "/other",
      "/reportsx",
      "/adminx/users",
      "/reports/../api",
      "javascript:alert(1)",
      "/reports/a\nb",
      "/reports/a\rb",
      "",
    ];
    for (const value of bad) expect(safeReturn(value, FALLBACK)).toBe(FALLBACK);
  });

  it("falls back for a missing value and for one that is too long", () => {
    expect(safeReturn(null, FALLBACK)).toBe(FALLBACK);
    expect(safeReturn(undefined, FALLBACK)).toBe(FALLBACK);
    expect(safeReturn(`/reports/${"a".repeat(2001)}`, FALLBACK)).toBe(FALLBACK);
  });
});
