// Turns the report parameters into query conditions. Pure module (it only builds query objects).
//
// The manager's limit and the "hide deleted requests" rule are added here, not by the pages, so a report
// cannot be built without them.

import type { Prisma } from "@prisma/client";
import { dayRangeBangkok, type RequestReportParams, type RequestScope, type UserReportParams } from "./report-params";
import { REQUEST_CATEGORIES } from "./request-types";
import { OPEN_STATUSES, breachedWhere } from "./request-where";

export function buildRequestReportWhere(params: RequestReportParams, scope: RequestScope, now: Date = new Date()): Prisma.ServiceRequestWhereInput {
  const and: Prisma.ServiceRequestWhereInput[] = [];

  if (params.deleted === "only") and.push({ deletedAt: { not: null } });
  else if (params.deleted !== "include") and.push({ deletedAt: null });

  if (scope.kind === "approver") and.push({ approverId: scope.approverId });

  if (params.status === "OPEN") and.push({ status: { in: OPEN_STATUSES } });
  else if (params.status) and.push({ status: params.status });
  if (params.type) and.push({ type: params.type });
  const category = REQUEST_CATEGORIES.find((item) => item.key === params.category);
  if (category) and.push({ type: { in: [...category.types] } });
  if (params.priority) and.push({ priority: params.priority });

  const created = dayRangeBangkok(params.from, params.to);
  if (created.gte || created.lte) and.push({ createdAt: created });

  if (params.assignee === "unassigned") and.push({ assigneeId: null });
  else if (params.assignee) and.push({ assigneeId: params.assignee });
  // Only an administrator's report can pick the approver; a manager's is already limited to themselves.
  if (params.approver && scope.kind === "all") and.push({ approverId: params.approver });

  if (params.result === "pending") and.push({ status: "PENDING_APPROVAL" });
  else if (params.result === "approved") {
    and.push({ events: { some: { action: "STATUS_CHANGED", fromValue: "PENDING_APPROVAL", toValue: { in: ["SUBMITTED", "APPROVED"] } } } });
  } else if (params.result === "rejected") {
    and.push({ events: { some: { action: "STATUS_CHANGED", fromValue: "PENDING_APPROVAL", toValue: "REJECTED" } } });
  }

  if (params.slaBreached) and.push(breachedWhere(now));

  const q = params.q.trim();
  if (q) {
    const contains = { contains: q, mode: "insensitive" as const };
    and.push({ OR: [{ requestNo: contains }, { title: contains }, { requester: { name: contains } }, { requester: { email: contains } }] });
  }

  return { AND: and };
}

/** The requests the summary counts: not deleted, filed in the range of days, and inside the viewer's limit. */
export function buildSummaryWhere(scope: RequestScope, range: { from: string; to: string }): Prisma.ServiceRequestWhereInput {
  const and: Prisma.ServiceRequestWhereInput[] = [{ deletedAt: null }];
  if (scope.kind === "approver") and.push({ approverId: scope.approverId });
  and.push({ createdAt: dayRangeBangkok(range.from, range.to) });
  return { AND: and };
}

export function buildUserReportWhere(params: UserReportParams): Prisma.UserWhereInput {
  const and: Prisma.UserWhereInput[] = [];
  const q = params.q.trim();
  if (q) {
    const contains = { contains: q, mode: "insensitive" as const };
    and.push({ OR: [{ name: contains }, { email: contains }, { department: contains }] });
  }
  if (params.role) and.push({ role: params.role });
  if (params.status) and.push({ isActive: params.status === "active" });
  if (params.login === "never") and.push({ lastLoginAt: null });
  return { AND: and };
}
