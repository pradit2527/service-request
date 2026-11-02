import { describe, expect, it } from "vitest";
import {
  approvalOutcome,
  monthKeyBangkok,
  sortSummaryRows,
  summarizeRequests,
  type SummaryRow,
  type SummarySubject,
} from "./report-summary";

const NOW = new Date("2026-11-10T00:00:00Z");
const CREATED = new Date("2026-11-02T03:00:00Z");
const HOUR = 60 * 60 * 1000;

function subject(over: Partial<SummarySubject> = {}): SummarySubject {
  return {
    slaTier: "STANDARD",
    status: "SUBMITTED",
    createdAt: CREATED,
    firstResponseAt: null,
    responseDueAt: new Date("2026-11-03T03:00:00Z"),
    fulfillmentDueAt: new Date("2026-11-05T03:00:00Z"),
    closedAt: null,
    slaPausedAt: null,
    type: "FIREWALL",
    assigneeName: null,
    managerApprovedAt: null,
    ...over,
  };
}

describe("monthKeyBangkok", () => {
  it("names the month in Bangkok, so midnight there starts the next month", () => {
    expect(monthKeyBangkok(new Date("2026-10-31T17:30:00Z"))).toBe("2026-11");
    expect(monthKeyBangkok(new Date("2026-10-31T16:59:00Z"))).toBe("2026-10");
  });
});

describe("summarizeRequests at the 20,000-row cap", () => {
  it("groups one big group in linear time", () => {
    const rows = Array.from({ length: 50_000 }, () => subject());
    const started = performance.now();
    const { rows: groups, totals } = summarizeRequests(rows, "type", NOW);
    expect(performance.now() - started).toBeLessThan(1500);
    expect(groups).toHaveLength(1);
    expect(totals.total).toBe(50_000);
  });
});

describe("approvalOutcome", () => {
  const at = new Date("2026-11-03T05:00:00Z");

  it("reads the manager's decision from the first change out of waiting-for-approval", () => {
    expect(approvalOutcome("SUBMITTED", { toValue: "SUBMITTED", createdAt: at })).toEqual({ result: "approved", at });
    expect(approvalOutcome("IN_PROGRESS", { toValue: "APPROVED", createdAt: at })).toEqual({ result: "approved", at });
    expect(approvalOutcome("REJECTED", { toValue: "REJECTED", createdAt: at })).toEqual({ result: "rejected", at });
  });

  it("is pending while the request still waits and there is no decision", () => {
    expect(approvalOutcome("PENDING_APPROVAL", null)).toEqual({ result: "pending", at: null });
  });

  it("has no outcome for a request that never reached a decision", () => {
    expect(approvalOutcome("CANCELLED", null)).toEqual({ result: "none", at: null });
    expect(approvalOutcome("IN_PROGRESS", null)).toEqual({ result: "none", at: null });
  });
});

describe("summarizeRequests", () => {
  const completedOnTime = subject({
    status: "COMPLETED",
    firstResponseAt: new Date("2026-11-02T05:00:00Z"),
    closedAt: new Date("2026-11-04T03:00:00Z"),
    managerApprovedAt: new Date(CREATED.getTime() + 2 * HOUR),
  });
  const completedLate = subject({
    status: "COMPLETED",
    firstResponseAt: new Date("2026-11-02T04:00:00Z"),
    closedAt: new Date("2026-11-06T03:00:00Z"),
    managerApprovedAt: new Date(CREATED.getTime() + 4 * HOUR),
  });
  const rejected = subject({ status: "REJECTED", closedAt: new Date("2026-11-02T04:00:00Z") });
  const pending = subject({ status: "PENDING_APPROVAL", slaPausedAt: CREATED });

  it("counts each outcome, the SLA results and the average time to approve", () => {
    const { rows, totals } = summarizeRequests([completedOnTime, completedLate, rejected, pending], "type", NOW);
    expect(rows).toHaveLength(1);
    expect(totals).toMatchObject({ total: 4, completed: 2, rejected: 1, cancelled: 0, pendingApproval: 1, open: 1 });
    expect(totals.fulfillment).toEqual({ met: 1, breached: 1, rate: 0.5 });
    expect(totals.response).toEqual({ met: 2, breached: 0, rate: 1 });
    expect(totals.avgApprovalHours).toBe(3);
  });

  it("groups by type in key order, and the totals add up every group", () => {
    const rows = [subject({ type: "FIREWALL" }), subject({ type: "DATABASE" }), subject({ type: "DATABASE" })];
    const result = summarizeRequests(rows, "type", NOW);
    expect(result.rows.map((row) => [row.key, row.total])).toEqual([
      ["DATABASE", 2],
      ["FIREWALL", 1],
    ]);
    expect(result.totals.total).toBe(3);
  });

  it("groups by month using Bangkok time", () => {
    const result = summarizeRequests(
      [subject({ createdAt: new Date("2026-10-31T16:59:00Z") }), subject({ createdAt: new Date("2026-10-31T17:01:00Z") })],
      "month",
      NOW,
    );
    expect(result.rows.map((row) => row.key)).toEqual(["2026-10", "2026-11"]);
  });

  it("groups by assignee, with an empty key for requests nobody has taken", () => {
    const result = summarizeRequests([subject({ assigneeName: "Somsri" }), subject({ assigneeName: null })], "assignee", NOW);
    expect(result.rows.map((row) => row.key)).toEqual(["", "Somsri"]);
  });

  it("has no average when no request passed an approval, and zeros when there is nothing at all", () => {
    expect(summarizeRequests([subject()], "type", NOW).totals.avgApprovalHours).toBeNull();
    const empty = summarizeRequests([], "type", NOW);
    expect(empty.rows).toEqual([]);
    expect(empty.totals).toMatchObject({ total: 0, open: 0, completed: 0, rejected: 0, cancelled: 0, pendingApproval: 0, avgApprovalHours: null });
    expect(empty.totals.response).toEqual({ met: 0, breached: 0, rate: null });
  });

  it("rounds the average to one decimal place", () => {
    const rows = [
      subject({ managerApprovedAt: new Date(CREATED.getTime() + 1 * HOUR) }),
      subject({ managerApprovedAt: new Date(CREATED.getTime() + 2 * HOUR) }),
      subject({ managerApprovedAt: new Date(CREATED.getTime() + 2 * HOUR) }),
    ];
    expect(summarizeRequests(rows, "type", NOW).totals.avgApprovalHours).toBe(1.7);
  });
});

describe("sortSummaryRows", () => {
  function row(key: string, avgApprovalHours: number | null, rate: number | null = null): SummaryRow {
    return {
      key,
      total: 1,
      open: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0,
      pendingApproval: 0,
      response: { met: 0, breached: 0, rate },
      fulfillment: { met: 0, breached: 0, rate },
      avgApprovalHours,
    };
  }
  const rows = [row("b", 5), row("a", null), row("c", 2)];

  it("puts rows with no value last in both directions", () => {
    expect(sortSummaryRows(rows, "avgApprovalHours", "asc").map((r) => r.key)).toEqual(["c", "b", "a"]);
    expect(sortSummaryRows(rows, "avgApprovalHours", "desc").map((r) => r.key)).toEqual(["b", "c", "a"]);
  });

  it("sorts by the label (the key) and by a pass rate", () => {
    expect(sortSummaryRows(rows, "label", "desc").map((r) => r.key)).toEqual(["c", "b", "a"]);
    const rated = [row("x", null, 0.5), row("y", null, null), row("z", null, 0.9)];
    expect(sortSummaryRows(rated, "responseRate", "desc").map((r) => r.key)).toEqual(["z", "x", "y"]);
  });

  it("does not change the array it was given", () => {
    const copy = [...rows];
    sortSummaryRows(rows, "label", "desc");
    expect(rows).toEqual(copy);
  });
});
