// The statistics behind the summary report, and how a manager's decision is read from the history. Pure module.

import { bangkokDateString, type SortDir, type SummaryGroup, type SummarySort } from "./report-params";
import type { RequestType } from "./request-types";
import { DEFAULT_CALENDAR, evaluateSla, tally, type Calendar, type PassRate, type SlaSubject } from "./sla";
import { isClosed, type RequestStatus } from "./status";

const HOUR_MS = 60 * 60 * 1000;

/** The month (`YYYY-MM`) a moment falls in, in Bangkok time. */
export function monthKeyBangkok(date: Date): string {
  return bangkokDateString(date).slice(0, 7);
}

// ---------------------------------------------------------------------------------------------
// Approval outcome
// ---------------------------------------------------------------------------------------------

/** The first change out of "waiting for manager approval": where it went and when. */
export type ApprovalDecision = { toValue: string | null; createdAt: Date };

export type ApprovalOutcome = { result: "approved" | "rejected" | "pending" | "none"; at: Date | null };

/**
 * What the manager decided about a request. `APPROVED` is the value the old workflow wrote; the current one
 * moves an approved request to `SUBMITTED` (waiting for IT).
 */
export function approvalOutcome(status: RequestStatus, decision: ApprovalDecision | null): ApprovalOutcome {
  if (decision) {
    if (decision.toValue === "SUBMITTED" || decision.toValue === "APPROVED") return { result: "approved", at: decision.createdAt };
    if (decision.toValue === "REJECTED") return { result: "rejected", at: decision.createdAt };
  }
  if (!decision && status === "PENDING_APPROVAL") return { result: "pending", at: null };
  return { result: "none", at: null };
}

// ---------------------------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------------------------

export type SummarySubject = SlaSubject & {
  type: RequestType;
  assigneeName: string | null;
  managerApprovedAt: Date | null;
};

export type SummaryRow = {
  /** The request type, the month (`YYYY-MM`) or the assignee's name (empty when nobody has taken it). */
  key: string;
  total: number;
  open: number;
  completed: number;
  rejected: number;
  cancelled: number;
  pendingApproval: number;
  response: PassRate;
  fulfillment: PassRate;
  /** Hours from filing to the manager's approval, averaged over the requests that were approved. */
  avgApprovalHours: number | null;
};

function keyOf(row: SummarySubject, group: SummaryGroup): string {
  if (group === "type") return row.type;
  if (group === "month") return monthKeyBangkok(row.createdAt);
  return row.assigneeName ?? "";
}

function summarize(key: string, rows: SummarySubject[], now: Date, cal: Calendar): SummaryRow {
  const clocks = rows.map((row) => evaluateSla(row, now, cal));
  const approvalHours = rows
    .filter((row): row is SummarySubject & { managerApprovedAt: Date } => row.managerApprovedAt !== null)
    .map((row) => (row.managerApprovedAt.getTime() - row.createdAt.getTime()) / HOUR_MS);
  const count = (status: RequestStatus) => rows.filter((row) => row.status === status).length;

  return {
    key,
    total: rows.length,
    open: rows.filter((row) => !isClosed(row.status)).length,
    completed: count("COMPLETED"),
    rejected: count("REJECTED"),
    cancelled: count("CANCELLED"),
    pendingApproval: count("PENDING_APPROVAL"),
    response: tally(clocks.map((clock) => clock.response.state)),
    fulfillment: tally(clocks.map((clock) => clock.fulfillment.state)),
    avgApprovalHours:
      approvalHours.length > 0 ? Math.round((approvalHours.reduce((sum, hours) => sum + hours, 0) / approvalHours.length) * 10) / 10 : null,
  };
}

/** One row per group (in key order) and a row for all of them together. */
export function summarizeRequests(
  rows: SummarySubject[],
  group: SummaryGroup,
  now: Date = new Date(),
  cal: Calendar = DEFAULT_CALENDAR,
): { rows: SummaryRow[]; totals: SummaryRow } {
  const groups = new Map<string, SummarySubject[]>();
  for (const row of rows) {
    const key = keyOf(row, group);
    const members = groups.get(key);
    if (members) members.push(row);
    else groups.set(key, [row]);
  }
  const summaries = [...groups.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, members]) => summarize(key, members, now, cal));
  return { rows: summaries, totals: summarize("", rows, now, cal) };
}

type NumericSort = Exclude<SummarySort, "label" | "responseRate" | "fulfillmentRate">;

function sortValue(row: SummaryRow, sort: SummarySort): string | number | null {
  if (sort === "label") return row.key;
  if (sort === "responseRate") return row.response.rate;
  if (sort === "fulfillmentRate") return row.fulfillment.rate;
  return row[sort as NumericSort];
}

/** The rows ordered by a column; rows with no value (a rate or an average that does not exist) come last either way. */
export function sortSummaryRows(rows: SummaryRow[], sort: SummarySort, dir: SortDir): SummaryRow[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = sortValue(a, sort);
    const y = sortValue(b, sort);
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return (x < y ? -1 : x > y ? 1 : 0) * sign;
  });
}
