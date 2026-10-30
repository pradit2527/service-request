import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("keeps same-origin paths with query strings", () => {
    expect(safeNext("/requests")).toBe("/requests");
    expect(safeNext("/requests?status=OPEN&page=2")).toBe("/requests?status=OPEN&page=2");
  });

  it("falls back to the home page for empty values", () => {
    expect(safeNext(undefined)).toBe("/");
    expect(safeNext(null)).toBe("/");
    expect(safeNext("")).toBe("/");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
    expect(safeNext("javascript:alert(1)")).toBe("/");
  });

  it("rejects header-injection characters", () => {
    expect(safeNext("/ok\r\nSet-Cookie: x=1")).toBe("/");
  });
});
