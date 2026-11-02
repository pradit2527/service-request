import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// Guard for soft-deleted requests. A deleted request must disappear from every list, count and dashboard,
// and no server action may act on one. This scans the source, so a query added later without the filter fails here.

const SRC = path.join(process.cwd(), "src");
const READS = ["findMany", "findFirst", "count", "groupBy"];

function serviceRequestCalls(text: string, methods: string[]) {
  const source = ts.createSourceFile("scan.ts", text, ts.ScriptTarget.Latest, true);
  const found: { statement: string; text: string; line: number }[] = [];

  function nameOf(statement: ts.Statement): string {
    if (ts.isFunctionDeclaration(statement) && statement.name) return statement.name.text;
    if (ts.isVariableStatement(statement)) return statement.declarationList.declarations[0].name.getText(source);
    return "<top level>";
  }

  function visit(node: ts.Node, statement: ts.Statement) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const access = node.expression;
      const owner = access.expression;
      if (methods.includes(access.name.text) && ts.isPropertyAccessExpression(owner) && owner.name.text === "serviceRequest") {
        found.push({
          statement: nameOf(statement),
          text: statement.getText(source),
          line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
        });
      }
    }
    ts.forEachChild(node, (child) => visit(child, statement));
  }

  for (const statement of source.statements) visit(statement, statement);
  return found;
}

/** Names of the functions that read requests but never mention any of `markers` (the deleted filter or a builder that adds it). */
function unguardedReads(text: string, markers: string[]): string[] {
  return serviceRequestCalls(text, READS)
    .filter((call) => !markers.some((marker) => call.text.includes(marker)))
    .map((call) => `${call.statement} (line ${call.line})`);
}

describe("soft-deleted requests", () => {
  it("are filtered out by every read in queries.ts", () => {
    const text = fs.readFileSync(path.join(SRC, "lib", "queries.ts"), "utf8");
    expect(serviceRequestCalls(text, READS).length).toBeGreaterThan(5);
    expect(unguardedReads(text, ["deletedAt"])).toEqual([]);
  });

  it("cannot be reached by id from a server action without the filter", () => {
    const dir = path.join(SRC, "app", "actions");
    const offenders = fs
      .readdirSync(dir)
      .filter((name) => name.endsWith(".ts"))
      .flatMap((name) =>
        serviceRequestCalls(fs.readFileSync(path.join(dir, name), "utf8"), ["findUnique"]).map((call) => `${name} line ${call.line}`),
      );
    expect(offenders).toEqual([]);
  });
});

describe("the scan for unguarded reads", () => {
  it("reports a function that reads requests with no deleted filter and no builder", () => {
    const text = `async function leaky() { return db.serviceRequest.findMany({ where: { status: "COMPLETED" } }); }`;
    expect(unguardedReads(text, ["buildRequestReportWhere", "deletedAt"])).toEqual(["leaky (line 1)"]);
  });

  it("accepts a function that goes through the report where builder or filters deletedAt itself", () => {
    const builder = `async function ok() { return db.serviceRequest.count({ where: buildRequestReportWhere(params, scope) }); }`;
    const filtered = `async function ok() { return db.serviceRequest.findMany({ where: { deletedAt: null } }); }`;
    expect(unguardedReads(builder, ["buildRequestReportWhere", "deletedAt"])).toEqual([]);
    expect(unguardedReads(filtered, ["buildRequestReportWhere", "deletedAt"])).toEqual([]);
  });
});

describe("report-queries.ts", () => {
  const file = path.join(SRC, "lib", "report-queries.ts");

  it.runIf(fs.existsSync(file))("reads requests only through the report where builders or with a deletedAt filter", () => {
    const text = fs.readFileSync(file, "utf8");
    expect(serviceRequestCalls(text, READS).length).toBeGreaterThan(0);
    expect(unguardedReads(text, ["buildRequestReportWhere", "buildSummaryWhere", "deletedAt"])).toEqual([]);
  });
});
