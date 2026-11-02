// Queries behind the reports. Each one takes the viewer and applies the viewer's limit itself (a manager only
// ever gets the requests that name them as approver), so a page cannot widen it by mistake.

import "server-only";
import type { Prisma } from "@prisma/client";
import type { EditableRequest } from "@/components/request-edit-form";
import type { UserFormInitial } from "@/components/user-form";
import { db } from "./db";
import type { Role } from "./labels";
import { paginate } from "./pagination";
import type { Viewer } from "./permissions";
import { PAGE_SIZE } from "./queries";
import { parseRequestReportParams, requestReportScope, type RequestReportParams, type UserReportParams } from "./report-params";
import { approvalOutcome, type ApprovalOutcome } from "./report-summary";
import { buildRequestReportWhere, buildUserReportWhere } from "./report-where";

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

// ---------------------------------------------------------------------------------------------
// Users (administrators only: the page checks the role)
// ---------------------------------------------------------------------------------------------

export type UserReportRow = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  role: Role;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  /** Requests the user filed, not counting deleted ones. */
  requestCount: number;
};

export async function listUserReport(params: UserReportParams) {
  const where = buildUserReportWhere(params);
  const total = await db.user.count({ where });
  const { page, pageCount, skip } = paginate(total, params.page, PAGE_SIZE);

  // People who never signed in have no date; they go last whichever way the column is sorted.
  const order: Prisma.UserOrderByWithRelationInput =
    params.sort === "lastLoginAt" ? { lastLoginAt: { sort: params.dir, nulls: "last" } } : { [params.sort]: params.dir };

  const records = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      _count: { select: { requests: { where: { deletedAt: null } } } },
    },
    orderBy: [order, { id: "asc" }],
    skip,
    take: PAGE_SIZE,
  });

  const items: UserReportRow[] = records.map(({ _count, ...user }) => ({ ...user, requestCount: _count.requests }));
  return { items, total, page, pageCount };
}

/** The user behind the edit pop-up of the user report. */
export async function getUserReportRecord(id: string): Promise<UserFormInitial | null> {
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, department: true, phone: true, isActive: true },
  });
  return user ? { ...user, department: user.department ?? "", phone: user.phone ?? "" } : null;
}
