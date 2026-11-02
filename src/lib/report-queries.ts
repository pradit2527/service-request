// Queries behind the reports. Each one takes the viewer and applies the viewer's limit itself (a manager only
// ever gets the requests that name them as approver), so a page cannot widen it by mistake.

import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { paginate } from "./pagination";
import type { Viewer } from "./permissions";
import { PAGE_SIZE } from "./queries";
import { requestReportScope, type RequestReportParams } from "./report-params";
import { approvalOutcome, type ApprovalOutcome } from "./report-summary";
import { buildRequestReportWhere } from "./report-where";

const requestReportSelect = {
  id: true,
  requestNo: true,
  title: true,
  type: true,
  status: true,
  priority: true,
  neededBy: true,
  createdAt: true,
  deletedAt: true,
  // The fields the SLA chip reads.
  slaTier: true,
  firstResponseAt: true,
  responseDueAt: true,
  fulfillmentDueAt: true,
  closedAt: true,
  slaPausedAt: true,
  requester: { select: { name: true } },
  assignee: { select: { name: true } },
  approver: { select: { name: true } },
  // The manager's decision is the first change out of "waiting for approval".
  events: {
    where: { action: "STATUS_CHANGED", fromValue: "PENDING_APPROVAL" },
    orderBy: { createdAt: "asc" },
    take: 1,
    select: { toValue: true, createdAt: true },
  },
} satisfies Prisma.ServiceRequestSelect;

type RequestReportRecord = Prisma.ServiceRequestGetPayload<{ select: typeof requestReportSelect }>;
export type RequestReportRow = Omit<RequestReportRecord, "events"> & { outcome: ApprovalOutcome };

const SORT_COLUMNS = {
  requestNo: "requestNo",
  title: "title",
  status: "status",
  priority: "priority",
  createdAt: "createdAt",
  neededBy: "neededBy",
  fulfillmentDueAt: "fulfillmentDueAt",
} as const;

/** One page of the request report, or null when the viewer has no report. */
export async function listRequestReport(viewer: Viewer, params: RequestReportParams) {
  const scope = requestReportScope(viewer);
  if (!scope) return null;

  const where = buildRequestReportWhere(params, scope);
  const total = await db.serviceRequest.count({ where });
  const { page, pageCount, skip } = paginate(total, params.page, PAGE_SIZE);

  const records = await db.serviceRequest.findMany({
    where,
    select: requestReportSelect,
    orderBy: [{ [SORT_COLUMNS[params.sort]]: params.dir }, { id: "asc" }],
    skip,
    take: PAGE_SIZE,
  });

  const items: RequestReportRow[] = records.map(({ events, ...row }) => ({ ...row, outcome: approvalOutcome(row.status, events[0] ?? null) }));
  return { items, total, page, pageCount };
}
