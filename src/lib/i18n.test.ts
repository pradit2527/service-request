import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { INTL_LOCALE, LANGS, isLang, l, makeT } from "./i18n";

// Guard for the three-language UI (Lao / Thai / English). It scans every source file and reports:
//  - Thai or Lao text that is not an argument of t(...) / l(...)         (untranslated text)
//  - t(...) / l(...) calls whose slots are mixed up or left empty          (Thai, Lao, English order)
//  - hard-coded locale names such as "th-TH"                               (use INTL_LOCALE instead)
// Restrict the scan while working on a few files:  I18N_ONLY=src/components/a.tsx,src/app/b.tsx npx vitest run src/lib/i18n.test.ts

const PROJECT = process.cwd();
const SRC = path.join(PROJECT, "src");
const THAI = /[฀-๿]/;
const LAO = /[຀-໿]/;
const LOCALES = new Set(Object.values(INTL_LOCALE));
const EXEMPT = new Set(["src/lib/i18n.ts"]); // defines the language names and locales

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

function textOf(node: ts.Node): string | null {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return node.head.text + node.templateSpans.map((s) => `\${}${s.literal.text}`).join("");
  return null;
}

type Issue = string;

function scan(file: string): Issue[] {
  const rel = path.relative(PROJECT, file).replaceAll("\\", "/");
  if (EXEMPT.has(rel)) return [];

  const source = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const issues: Issue[] = [];
  const covered = new Set<ts.Node>();
  const where = (node: ts.Node) => `${rel}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`;

  // Pass 1: t(th, lo, en) and l(th, lo, en) calls
  const checkCalls = (node: ts.Node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && (node.expression.text === "t" || node.expression.text === "l")) {
      const name = node.expression.text;
      const args = node.arguments;
      const first = args[0] ? textOf(args[0]) : null;

      if (args.length === 1 && first !== null) {
        issues.push(`${where(node)} ${name}("...") needs Thai, Lao and English: ${name}(th, lo, en)`);
      } else if (args.length === 2) {
        issues.push(`${where(node)} ${name}() needs three texts (Thai, Lao, English), found two`);
      } else if (args.length === 3) {
        const [th, lo, en] = args.map(textOf);
        args.forEach((a) => textOf(a) !== null && covered.add(a));
        if (th !== null && LAO.test(th)) issues.push(`${where(node)} Lao text in the Thai slot: ${JSON.stringify(th)}`);
        if (lo !== null && THAI.test(lo)) issues.push(`${where(node)} Thai text in the Lao slot: ${JSON.stringify(lo)}`);
        if (th !== null && lo !== null && THAI.test(th) && !LAO.test(lo)) issues.push(`${where(node)} Lao translation missing for ${JSON.stringify(th)}`);
        if (en !== null && (THAI.test(en) || LAO.test(en))) issues.push(`${where(node)} Thai/Lao text in the English slot: ${JSON.stringify(en)}`);
        if (th !== null && en !== null && THAI.test(th) && en.trim() === "") issues.push(`${where(node)} English text missing for ${JSON.stringify(th)}`);
      }
    }
    ts.forEachChild(node, checkCalls);
  };
  checkCalls(sf);

  const isCovered = (node: ts.Node): boolean => {
    for (let n: ts.Node | undefined = node; n; n = n.parent) if (covered.has(n)) return true;
    return false;
  };

  // Pass 2: any other Thai or Lao text, and hard-coded locales
  const checkText = (node: ts.Node) => {
    const text = ts.isJsxText(node) ? node.text : textOf(node);
    if (text !== null) {
      if ((THAI.test(text) || LAO.test(text)) && !isCovered(node)) {
        issues.push(`${where(node)} untranslated text outside t()/l(): ${JSON.stringify(text.trim().slice(0, 60))}`);
      }
      if (!ts.isJsxText(node) && LOCALES.has(text)) issues.push(`${where(node)} hard-coded locale ${JSON.stringify(text)}: use INTL_LOCALE[lang]`);
    }
    ts.forEachChild(node, checkText);
  };
  checkText(sf);

  return issues;
}

describe("i18n helpers", () => {
  it("lists Lao first, then Thai, then English", () => {
    expect([...LANGS]).toEqual(["lo", "th", "en"]);
  });

  it("recognises supported languages", () => {
    expect(isLang("lo") && isLang("th") && isLang("en")).toBe(true);
    expect(isLang("fr")).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });

  it("picks the text of the current language", () => {
    expect(makeT("th")("ไทย", "ລາວ", "English")).toBe("ไทย");
    expect(makeT("lo")("ไทย", "ລາວ", "English")).toBe("ລາວ");
    expect(makeT("en")("ไทย", "ລາວ", "English")).toBe("English");
  });

  it("resolves Localized values", () => {
    const value = l("ไทย", "ລາວ", "English");
    expect(makeT("lo")(value)).toBe("ລາວ");
    expect(makeT("en")(value)).toBe("English");
  });
});

describe("source text is translated", () => {
  it("has no untranslated or mixed-up text in any source file", () => {
    const only = process.env.I18N_ONLY?.split(",").map((p) => path.resolve(PROJECT, p.trim()));
    const files = listFiles(SRC).filter((f) => !only || only.includes(f));
    expect(files.length).toBeGreaterThan(0);
    expect(files.flatMap(scan)).toEqual([]);
  });
});
