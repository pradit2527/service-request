// Queries behind the reports. Each one takes the viewer and applies the viewer's limit itself (a manager only
// ever gets the requests that name them as approver), so a page cannot widen it by mistake.

import "server-only";
import type { Prisma } from "@prisma/client";
import type { EditableRequest } from "@/components/request-edit-form";
import { db } from "./db";
import { paginate } from "./pagination";
import type { Viewer } from "./permissions";
import { PAGE_SIZE } from "./queries";
import { parseRequestReportParams, requestReportScope, type RequestReportParams } from "./report-params";
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

/**
 * The request behind the edit pop-up of the report: only if it is inside the viewer's limit and not deleted.
 * Null otherwise, so a made-up `edit=` in the address opens nothing.
 */
export async function getRequestReportRecord(viewer: Viewer, id: string) {
  const scope = requestReportScope(viewer);
  if (!scope) return null;

  const record = await db.serviceRequest.findFirst({
    where: { AND: [{ id }, buildRequestReportWhere(parseRequestReportParams({}, viewer), scope)] },
    select: {
      id: true,
      requestNo: true,
      title: true,
      description: true,
      priority: true,
      neededBy: true,
      requestedForName: true,
      approverId: true,
      status: true,
      requesterId: true,
    },
  });
  if (!record) return null;

  const request: EditableRequest = {
    id: record.id,
    title: record.title,
    description: record.description,
    priority: record.priority,
    neededBy: record.neededBy ? record.neededBy.toISOString().slice(0, 10) : "",
    requestedForName: record.requestedForName ?? "",
    approverId: record.approverId ?? "",
  };
  return { request, requestNo: record.requestNo, status: record.status, requesterId: record.requesterId };
}
