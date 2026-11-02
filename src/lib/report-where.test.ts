import type { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { Viewer } from "./permissions";
import { dayRangeBangkok, parseRequestReportParams, parseUserReportParams, type RequestReportParams, type RequestScope } from "./report-params";
import { buildRequestReportWhere, buildSummaryWhere, buildUserReportWhere } from "./report-where";
import { OPEN_STATUSES, breachedWhere } from "./request-where";

const admin: Viewer = { id: "u-admin", role: "ADMIN" };
const all: RequestScope = { kind: "all" };
const mine: RequestScope = { kind: "approver", approverId: "m1" };
const NOW = new Date("2026-11-10T00:00:00Z");

function params(raw: Record<string, string> = {}): RequestReportParams {
  return parseRequestReportParams(raw, admin);
}

function clauses(where: Prisma.ServiceRequestWhereInput | Prisma.UserWhereInput): object[] {
  return where.AND as object[];
}

describe("buildRequestReportWhere", () => {
  it("hides deleted requests unless asked", () => {
    expect(clauses(buildRequestReportWhere(params(), all))).toContainEqual({ deletedAt: null });
    expect(clauses(buildRequestReportWhere(params({ deleted: "only" }), all))).toContainEqual({ deletedAt: { not: null } });
    const included = clauses(buildRequestReportWhere(params({ deleted: "include" }), all));
    expect(included.some((clause) => "deletedAt" in clause)).toBe(false);
  });

  it("limits a manager to the requests that name them as approver, whatever the address says", () => {
    const sneaky = { ...params(), approver: "u-other" };
    const list = clauses(buildRequestReportWhere(sneaky, mine));
    expect(list).toContainEqual({ approverId: "m1" });
    expect(list.filter((clause) => "approverId" in clause)).toEqual([{ approverId: "m1" }]);
  });

  it("lets an administrator filter by approver", () => {
    expect(clauses(buildRequestReportWhere(params({ approver: "m2" }), all))).toContainEqual({ approverId: "m2" });
    expect(clauses(buildRequestReportWhere(params(), all)).some((clause) => "approverId" in clause)).toBe(false);
  });

  it("applies the status, type, priority and assignee filters", () => {
    expect(clauses(buildRequestReportWhere(params({ status: "OPEN" }), all))).toContainEqual({ status: { in: OPEN_STATUSES } });
    expect(clauses(buildRequestReportWhere(params({ status: "COMPLETED" }), all))).toContainEqual({ status: "COMPLETED" });
    expect(clauses(buildRequestReportWhere(params({ type: "FIREWALL" }), all))).toContainEqual({ type: "FIREWALL" });
    expect(clauses(buildRequestReportWhere(params({ priority: "HIGH" }), all))).toContainEqual({ priority: "HIGH" });
    expect(clauses(buildRequestReportWhere(params({ assignee: "unassigned" }), all))).toContainEqual({ assigneeId: null });
    expect(clauses(buildRequestReportWhere(params({ assignee: "s1" }), all))).toContainEqual({ assigneeId: "s1" });
  });

  it("filters by the day the request was filed, in Bangkok time", () => {
    const where = buildRequestReportWhere(params({ from: "2026-11-01", to: "2026-11-05" }), all);
    expect(clauses(where)).toContainEqual({ createdAt: dayRangeBangkok("2026-11-01", "2026-11-05") });
  });

  it("filters by the manager's decision", () => {
    const decided = (toValue: string | { in: string[] }) => ({
      events: { some: { action: "STATUS_CHANGED", fromValue: "PENDING_APPROVAL", toValue } },
    });
    expect(clauses(buildRequestReportWhere(params({ result: "pending" }), all))).toContainEqual({ status: "PENDING_APPROVAL" });
    expect(clauses(buildRequestReportWhere(params({ result: "approved" }), all))).toContainEqual(decided({ in: ["SUBMITTED", "APPROVED"] }));
    expect(clauses(buildRequestReportWhere(params({ result: "rejected" }), all))).toContainEqual(decided("REJECTED"));
  });

  it("adds the SLA breach rule and the text search", () => {
    expect(clauses(buildRequestReportWhere(params({ sla: "breached" }), all, NOW))).toContainEqual(breachedWhere(NOW));
    const contains = { contains: "vpn", mode: "insensitive" };
    expect(clauses(buildRequestReportWhere(params({ q: "vpn" }), all))).toContainEqual({
      OR: [{ requestNo: contains }, { title: contains }, { requester: { name: contains } }, { requester: { email: contains } }],
    });
  });
});

describe("buildSummaryWhere", () => {
  const range = { from: "2026-11-01", to: "2026-11-30" };

  it("never counts deleted requests, whoever asks", () => {
    expect(clauses(buildSummaryWhere(all, range))).toContainEqual({ deletedAt: null });
    expect(clauses(buildSummaryWhere(mine, range))).toContainEqual({ deletedAt: null });
  });

  it("covers the range of days and the manager's own requests", () => {
    expect(clauses(buildSummaryWhere(all, range))).toContainEqual({ createdAt: dayRangeBangkok(range.from, range.to) });
    expect(clauses(buildSummaryWhere(mine, range))).toContainEqual({ approverId: "m1" });
    expect(clauses(buildSummaryWhere(all, range)).some((clause) => "approverId" in clause)).toBe(false);
  });
});

describe("buildUserReportWhere", () => {
  it("has no restriction without a filter", () => {
    expect(buildUserReportWhere(parseUserReportParams({}))).toEqual({ AND: [] });
  });

  it("applies the search, role, status and never-signed-in filters", () => {
    const contains = { contains: "som", mode: "insensitive" };
    const list = clauses(buildUserReportWhere(parseUserReportParams({ q: "som", role: "MANAGER", status: "inactive", login: "never" })));
    expect(list).toContainEqual({ OR: [{ name: contains }, { email: contains }, { department: contains }] });
    expect(list).toContainEqual({ role: "MANAGER" });
    expect(list).toContainEqual({ isActive: false });
    expect(list).toContainEqual({ lastLoginAt: null });
    expect(clauses(buildUserReportWhere(parseUserReportParams({ status: "active" })))).toContainEqual({ isActive: true });
  });
});
