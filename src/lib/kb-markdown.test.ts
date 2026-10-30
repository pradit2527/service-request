import { describe, expect, it } from "vitest";
import { isKbCategory, kbCategoryLabel } from "./kb";
import { parseInline, parseMarkdown } from "./kb-markdown";

describe("parseInline", () => {
  it("splits bold and code spans from plain text", () => {
    expect(parseInline("เปิด **Wi-Fi** แล้วพิมพ์ `ipconfig` ได้เลย")).toEqual([
      { type: "text", text: "เปิด " },
      { type: "bold", text: "Wi-Fi" },
      { type: "text", text: " แล้วพิมพ์ " },
      { type: "code", text: "ipconfig" },
      { type: "text", text: " ได้เลย" },
    ]);
  });

  it("leaves unmatched markers as text", () => {
    expect(parseInline("2 ** 3 = 8")).toEqual([{ type: "text", text: "2 ** 3 = 8" }]);
  });
});

describe("parseMarkdown", () => {
  it("parses headings, paragraphs and lists", () => {
    const blocks = parseMarkdown(["## ขั้นตอน", "", "ทำตามนี้", "ต่อกัน", "", "- ข้อหนึ่ง", "- ข้อสอง", "", "1. แรก", "2. สอง"].join("\n"));
    expect(blocks).toEqual([
      { type: "heading", level: 2, inlines: [{ type: "text", text: "ขั้นตอน" }] },
      { type: "paragraph", inlines: [{ type: "text", text: "ทำตามนี้ ต่อกัน" }] },
      { type: "ul", items: [[{ type: "text", text: "ข้อหนึ่ง" }], [{ type: "text", text: "ข้อสอง" }]] },
      { type: "ol", items: [[{ type: "text", text: "แรก" }], [{ type: "text", text: "สอง" }]] },
    ]);
  });

  it("keeps code blocks verbatim", () => {
    const blocks = parseMarkdown("```\nping 8.8.8.8\n  indent\n```");
    expect(blocks).toEqual([{ type: "code", text: "ping 8.8.8.8\n  indent" }]);
  });

  it("treats a level-1 heading as a section heading and ### as a sub-heading", () => {
    const blocks = parseMarkdown("# A\n### B");
    expect(blocks.map((b) => (b.type === "heading" ? b.level : null))).toEqual([2, 3]);
  });

  it("never turns markup into HTML: angle brackets stay text", () => {
    const [block] = parseMarkdown("<script>alert(1)</script>");
    expect(block).toEqual({ type: "paragraph", inlines: [{ type: "text", text: "<script>alert(1)</script>" }] });
  });

  it("handles empty input and Windows line endings", () => {
    expect(parseMarkdown("")).toEqual([]);
    expect(parseMarkdown("- a\r\n- b")).toHaveLength(1);
  });

  it("switches list types when the marker changes", () => {
    const blocks = parseMarkdown("- a\n1. b");
    expect(blocks.map((b) => b.type)).toEqual(["ul", "ol"]);
  });
});

describe("knowledge base categories", () => {
  it("recognises categories and labels them", () => {
    expect(isKbCategory("network")).toBe(true);
    expect(isKbCategory("nope")).toBe(false);
    for (const lang of ["lo", "th", "en"] as const) expect(kbCategoryLabel("network", lang)).toContain("Wi-Fi");
    expect(kbCategoryLabel("account", "en")).toBe("Accounts & passwords");
    expect(kbCategoryLabel("unknown", "lo")).toBe("unknown");
  });
});
