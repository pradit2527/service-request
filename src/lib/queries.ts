// Read queries. Every function takes the viewer and applies visibility rules itself,
// so a page cannot accidentally show another employee's requests or internal notes.

import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { isKbCategory } from "./kb";
import type { Role } from "./labels";
import { paginate } from "./pagination";
import { canEditKb, canManageSystem, canViewRequest, isStaff, type Viewer } from "./permissions";
import type { RequestType } from "./request-types";
import { evaluateSla, startOfMonthBangkok, tally, type PassRate, type SlaSubject } from "./sla";
import { getSlaCalendar } from "./sla-calendar";
import { CLOSED_STATUSES, REQUEST_STATUSES, type RequestStatus } from "./status";

export const PAGE_SIZE = 14;

export const OPEN_STATUSES: RequestStatus[] = REQUEST_STATUSES.filter((s) => !CLOSED_STATUSES.includes(s));

const rowSelect = {
  id: true,
  requestNo: true,
  title: true,
  type: true,
  status: true,
  priority: true,
  neededBy: true,
  createdAt: true,
  updatedAt: true,
  requestedForName: true,
  slaTier: true,
  firstResponseAt: true,
  responseDueAt: true,
  fulfillmentDueAt: true,
  closedAt: true,
  slaPausedAt: true,
  deletedAt: true,
  requester: { select: { name: true } },
  assignee: { select: { name: true } },
} satisfies Prisma.ServiceRequestSelect;

export type RequestRow = Prisma.ServiceRequestGetPayload<{ select: typeof rowSelect }>;

export type ListFilters = {
  q?: string;
  status?: RequestStatus | "OPEN" | "WAITING";
  type?: RequestType;
  scope?: "assigned" | "unassigned";
  sla?: "breached";
  page?: number;
  /** System management: every request (not only the viewer's own), if the viewer may manage the system. */
  console?: boolean;
  /** With `console`: also show deleted requests ("include") or only those ("only"). Ignored otherwise. */
  deleted?: "include" | "only";
};

/** Requests whose response or fulfillment deadline has passed while the clock was running. */
function breachedWhere(now: Date): Prisma.ServiceRequestWhereInput {
  return {
    status: { in: OPEN_STATUSES },
    slaPausedAt: null,
    OR: [{ fulfillmentDueAt: { lt: now } }, { AND: [{ firstResponseAt: null }, { responseDueAt: { lt: now } }] }],
  };
}

export async function listRequests(viewer: Viewer, filters: ListFilters) {
  const staff = isStaff(viewer);
  const manage = filters.console === true && canManageSystem(viewer);
  const and: Prisma.ServiceRequestWhereInput[] = [];

  // Deleted requests are hidden from everybody except in system management.
  if (manage && filters.deleted === "only") and.push({ deletedAt: { not: null } });
  else if (!(manage && filters.deleted === "include")) and.push({ deletedAt: null });

  if (!staff && !manage) and.push({ OR: [{ requesterId: viewer.id }, { approverId: viewer.id }] });
  else if (staff && filters.scope === "assigned") and.push({ assigneeId: viewer.id });
  else if (staff && filters.scope === "unassigned") and.push({ assigneeId: null });

  if (staff && filters.sla === "breached") and.push(breachedWhere(new Date()));

  if (filters.status === "OPEN") and.push({ status: { in: OPEN_STATUSES } });
  else if (filters.status === "WAITING") and.push({ status: { in: ["NEED_INFO", "ON_HOLD"] } });
  else if (filters.status) and.push({ status: filters.status });

  if (filters.type) and.push({ type: filters.type });

  const q = filters.q?.trim();
  if (q) {
    const contains = { contains: q, mode: "insensitive" as const };
    and.push({
      OR: [
        { requestNo: contains },
        { title: contains },
        ...(staff || manage ? [{ requester: { name: contains } }, { requester: { email: contains } }] : []),
      ],
    });
  }

  const where: Prisma.ServiceRequestWhereInput = { AND: and };
  const total = await db.serviceRequest.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page ?? 1), pageCount);

  const items = await db.serviceRequest.findMany({
    where,
    select: rowSelect,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return { items, total, page, pageCount };
}

export async function getRequestDetail(viewer: Viewer, id: string) {
  const staff = isStaff(viewer);
  const request = await db.serviceRequest.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, name: true, email: true, department: true, phone: true } },
      assignee: { select: { id: true, name: true } },
      approver: { select: { id: true, name: true, department: true } },
      decidedBy: { select: { name: true } },
      deletedBy: { select: { name: true } },
      comments: {
        where: staff ? {} : { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, role: true } } },
      },
      events: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { name: true } } },
      },
    },
  });
  if (!request || !canViewRequest(viewer, request)) return null;
  // A deleted request can still be opened from system management, to restore it.
  if (request.deletedAt && !canManageSystem(viewer)) return null;
  return request;
}

export type RequestDetail = NonNullable<Awaited<ReturnType<typeof getRequestDetail>>>;

export function listAssignableStaff() {
  return db.user.findMany({
    where: { isActive: true, role: { in: ["IT_STAFF", "ADMIN"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/** Managers a requester can pick as approver (never themselves). */
export function listApprovers(excludeUserId: string) {
  return db.user.findMany({
    where: { isActive: true, role: "MANAGER", id: { not: excludeUserId } },
    select: { id: true, name: true, department: true },
    orderBy: { name: "asc" },
  });
}

/** Active users an administrator or manager can file a request for. */
export function listRequesterOptions() {
  return db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, department: true, phone: true, role: true },
    orderBy: { name: "asc" },
  });
}

export function listPendingApprovals(userId: string) {
  return db.serviceRequest.findMany({
    where: { approverId: userId, status: "PENDING_APPROVAL", deletedAt: null },
    select: rowSelect,
    orderBy: { createdAt: "asc" },
  });
}

export function countPendingApprovals(userId: string) {
  return db.serviceRequest.count({ where: { approverId: userId, status: "PENDING_APPROVAL", deletedAt: null } });
}

export async function getEmployeeDashboard(viewer: Viewer) {
  const mine: Prisma.ServiceRequestWhereInput = { requesterId: viewer.id, deletedAt: null };
  const [grouped, recent] = await Promise.all([
    db.serviceRequest.groupBy({ by: ["status"], where: mine, _count: { _all: true } }),
    db.serviceRequest.findMany({ where: mine, select: rowSelect, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);
  return { counts: toStatusCounts(grouped), recent };
}

// Requests assigned to an IT person that are still being worked on (not waiting for a manager, not closed).
const MY_TASK_STATUSES: RequestStatus[] = ["IN_REVIEW", "NEED_INFO", "ON_HOLD", "APPROVED", "IN_PROGRESS"];

/** The open requests assigned to this IT person, most recently touched first. */
export function listMyTasks(userId: string) {
  return db.serviceRequest.findMany({
    where: { assigneeId: userId, status: { in: MY_TASK_STATUSES }, deletedAt: null },
    select: rowSelect,
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
}

export function countMyTasks(userId: string) {
  return db.serviceRequest.count({ where: { assigneeId: userId, status: { in: MY_TASK_STATUSES }, deletedAt: null } });
}

export async function getStaffDashboard() {
  const [grouped, unassigned, queue] = await Promise.all([
    db.serviceRequest.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { _all: true } }),
    db.serviceRequest.count({ where: { assigneeId: null, status: { in: ["SUBMITTED", "IN_REVIEW"] }, deletedAt: null } }),
    db.serviceRequest.findMany({
      where: { status: "SUBMITTED", deletedAt: null },
      select: rowSelect,
      orderBy: { createdAt: "asc" },
      take: 8,
    }),
  ]);
  return { counts: toStatusCounts(grouped), unassigned, queue };
}

function toStatusCounts(grouped: { status: RequestStatus; _count: { _all: number } }[]) {
  const counts = Object.fromEntries(REQUEST_STATUSES.map((s) => [s, 0])) as Record<RequestStatus, number>;
  for (const row of grouped) counts[row.status] = row._count._all;
  return counts;
}

// ---------------------------------------------------------------------------------------------
// SLA
// ---------------------------------------------------------------------------------------------

const slaSelect = {
  slaTier: true,
  status: true,
  createdAt: true,
  firstResponseAt: true,
  responseDueAt: true,
  fulfillmentDueAt: true,
  closedAt: true,
  slaPausedAt: true,
} satisfies Prisma.ServiceRequestSelect;

export type SlaOverview = {
  breachedOpen: number;
  atRisk: number;
  paused: number;
  monthRequests: number;
  response: PassRate;
  fulfillment: PassRate;
};

/** Open-request SLA health plus this month's pass rates (requests created this month). */
export async function getSlaOverview(now: Date = new Date()): Promise<SlaOverview> {
  const cal = getSlaCalendar();
  const monthStart = startOfMonthBangkok(now, cal);

  const [open, month] = await Promise.all([
    db.serviceRequest.findMany({ where: { status: { in: OPEN_STATUSES }, deletedAt: null }, select: slaSelect }),
    db.serviceRequest.findMany({ where: { createdAt: { gte: monthStart }, deletedAt: null }, select: slaSelect }),
  ]);

  let breachedOpen = 0;
  let atRisk = 0;
  let paused = 0;
  for (const request of open) {
    const { response, fulfillment } = evaluateSla(request as SlaSubject, now, cal);
    const clocks = [response, fulfillment];
    if (clocks.some((c) => c.state === "breached")) breachedOpen++;
    else if (clocks.some((c) => c.state === "paused")) paused++;
    else if (clocks.some((c) => c.state === "running" && (c.percentUsed ?? 0) >= 0.8)) atRisk++;
  }

  const evaluated = month.map((request) => evaluateSla(request as SlaSubject, now, cal));
  return {
    breachedOpen,
    atRisk,
    paused,
    monthRequests: month.length,
    response: tally(evaluated.map((e) => e.response.state)),
    fulfillment: tally(evaluated.map((e) => e.fulfillment.state)),
  };
}

// ---------------------------------------------------------------------------------------------
// Knowledge base
// ---------------------------------------------------------------------------------------------

const articleSelect = {
  id: true,
  title: true,
  category: true,
  summary: true,
  isPublished: true,
  updatedAt: true,
} satisfies Prisma.KbArticleSelect;

export type ArticleRow = Prisma.KbArticleGetPayload<{ select: typeof articleSelect }>;

export async function searchArticles(viewer: Viewer, params: { q?: string; category?: string }): Promise<ArticleRow[]> {
  const and: Prisma.KbArticleWhereInput[] = [];
  if (!canEditKb(viewer)) and.push({ isPublished: true });
  if (params.category && isKbCategory(params.category)) and.push({ category: params.category });

  // Every word must appear somewhere in the title, summary or body.
  const words = (params.q ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 6);
  for (const word of words) {
    const contains = { contains: word, mode: "insensitive" as const };
    and.push({ OR: [{ title: contains }, { summary: contains }, { body: contains }] });
  }

  return db.kbArticle.findMany({ where: { AND: and }, select: articleSelect, orderBy: { updatedAt: "desc" }, take: 40 });
}

export async function getArticle(viewer: Viewer, id: string) {
  const article = await db.kbArticle.findUnique({
    where: { id },
    include: { author: { select: { name: true } } },
  });
  if (!article || (!article.isPublished && !canEditKb(viewer))) return null;
  return article;
}

// ---------------------------------------------------------------------------------------------
// System management
// ---------------------------------------------------------------------------------------------

export type UserListFilters = { q?: string; role?: Role; status?: "active" | "inactive"; page?: number };

export async function listUsersForAdmin(filters: UserListFilters) {
  const where: Prisma.UserWhereInput = {};
  const q = filters.q?.trim();
  if (q) {
    const contains = { contains: q, mode: "insensitive" as const };
    where.OR = [{ name: contains }, { email: contains }];
  }
  if (filters.role) where.role = filters.role;
  if (filters.status) where.isActive = filters.status === "active";

  const total = await db.user.count({ where });
  const { page, pageCount, skip } = paginate(total, filters.page ?? 1, PAGE_SIZE);
  const items = await db.user.findMany({
    where,
    select: { id: true, name: true, email: true, department: true, role: true, isActive: true, lastLoginAt: true },
    orderBy: [{ role: "desc" }, { name: "asc" }],
    skip,
    take: PAGE_SIZE,
  });
  return { items, total, page, pageCount };
}

/** Every article, published or not, for system management. */
export async function listArticlesForAdmin(filters: { q?: string; page?: number }) {
  const where: Prisma.KbArticleWhereInput = {};
  const q = filters.q?.trim();
  if (q) {
    const contains = { contains: q, mode: "insensitive" as const };
    where.OR = [{ title: contains }, { summary: contains }];
  }

  const total = await db.kbArticle.count({ where });
  const { page, pageCount, skip } = paginate(total, filters.page ?? 1, PAGE_SIZE);
  const items = await db.kbArticle.findMany({ where, select: articleSelect, orderBy: { updatedAt: "desc" }, skip, take: PAGE_SIZE });
  return { items, total, page, pageCount };
}
