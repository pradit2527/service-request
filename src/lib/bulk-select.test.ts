import { describe, expect, it } from "vitest";
import { MAX_BULK, selectedIds } from "./bulk-select";

describe("selectedIds", () => {
  it("keeps the ids that were ticked, in order", () => {
    expect(selectedIds(["a", "b", "c"])).toEqual(["a", "b", "c"]);
  });

  it("drops duplicates, blanks and anything that is not text (a file upload, say)", () => {
    expect(selectedIds(["a", "a", " ", "", " b ", new File([], "x.txt")])).toEqual(["a", "b"]);
  });

  it("stops at the limit, so one click cannot start an unbounded amount of work", () => {
    const many = Array.from({ length: MAX_BULK + 20 }, (_, i) => `id-${i}`);
    expect(selectedIds(many)).toHaveLength(MAX_BULK);
    expect(selectedIds(many, 3)).toEqual(["id-0", "id-1", "id-2"]);
    expect(MAX_BULK).toBe(50);
  });

  it("gives nothing when nothing was ticked", () => {
    expect(selectedIds([])).toEqual([]);
  });
});
