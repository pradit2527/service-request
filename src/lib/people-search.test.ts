import { describe, expect, it } from "vitest";
import { MAX_PEOPLE_RESULTS, formatPersonLabel, peopleWhere, searchTerms } from "./people-search";

describe("peopleWhere", () => {
  it("looks only at active people other than the one who is searching", () => {
    const where = peopleWhere(["dech"], "me");
    expect(where.isActive).toBe(true);
    expect(where.id).toEqual({ not: "me" });
  });

  it("needs every word to match the name or the department, whatever the case", () => {
    expect(peopleWhere(["somying", "finance"], "me").AND).toEqual([
      { OR: [{ name: { contains: "somying", mode: "insensitive" } }, { department: { contains: "somying", mode: "insensitive" } }] },
      { OR: [{ name: { contains: "finance", mode: "insensitive" } }, { department: { contains: "finance", mode: "insensitive" } }] },
    ]);
  });
});

describe("searchTerms", () => {
  it("splits what was typed into words, so each one can match the name or the department", () => {
    expect(searchTerms("สมหญิง การเงิน")).toEqual(["สมหญิง", "การเงิน"]);
  });

  it("ignores extra spaces, tabs and line breaks around and between the words", () => {
    expect(searchTerms("  decha \t  ning \n")).toEqual(["decha", "ning"]);
  });

  it("gives no terms for nothing typed, so nothing is searched", () => {
    expect(searchTerms("")).toEqual([]);
    expect(searchTerms("   ")).toEqual([]);
    expect(searchTerms(null)).toEqual([]);
  });

  it("keeps the search small: at most four words of at most forty characters", () => {
    expect(searchTerms("a b c d e f")).toEqual(["a", "b", "c", "d"]);
    expect(searchTerms("x".repeat(60))).toEqual(["x".repeat(40)]);
  });
});

describe("formatPersonLabel", () => {
  it("writes the name and the department the way the field asks for them", () => {
    expect(formatPersonLabel({ name: "Decha Ning", department: "CTO" })).toBe("Decha Ning · CTO");
  });

  it("writes only the name when the person has no department", () => {
    expect(formatPersonLabel({ name: "Decha Ning", department: null })).toBe("Decha Ning");
    expect(formatPersonLabel({ name: "Decha Ning", department: "  " })).toBe("Decha Ning");
  });
});

describe("MAX_PEOPLE_RESULTS", () => {
  it("is a short list that fits under the field", () => {
    expect(MAX_PEOPLE_RESULTS).toBe(8);
  });
});
