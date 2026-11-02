// Reading the report address (search, filters, sort, page) into typed values. Pure module.
//
// Everything in the address is untrusted: a value outside its whitelist is dropped and the default is used,
// so a made-up address can never reach a query or break a page.

import { isPriority, isRole, type Priority, type Role } from "./labels";
import type { Viewer } from "./permissions";
import { isRequestType, type RequestType } from "./request-types";
import { CURRENT_STATUSES, type RequestStatus } from "./status";

export type SortDir = "asc" | "desc";
type Raw = Record<string, string | undefined>;

// Bangkok has no daylight saving, so a fixed offset is enough.
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const MAX_PAGE = 1_000_000;
const ID = /^[A-Za-z0-9_-]{1,64}$/;

function idOf(value: string | undefined): string | undefined {
  return value && ID.test(value) ? value : undefined;
}

function pageOf(value: string | undefined): number {
  const page = Number.parseInt(value ?? "", 10);
  return Number.isFinite(page) && page >= 1 ? Math.min(page, MAX_PAGE) : 1;
}

function searchOf(value: string | undefined): string {
  return (value ?? "").trim().slice(0, 100);
}

/** `value` if it is a real `YYYY-MM-DD` day, otherwise undefined. */
function dayOf(value: string | undefined): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const real = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return real ? value : undefined;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return (allowed as readonly string[]).includes(value ?? "") ? (value as T) : undefined;
}

function dirOf(value: string | undefined, fallback: SortDir): SortDir {
  return value === "asc" || value === "desc" ? value : fallback;
}

// ---------------------------------------------------------------------------------------------
// Dates (Bangkok)
// ---------------------------------------------------------------------------------------------

/** The day `date` falls on in Bangkok, as `YYYY-MM-DD`. */
export function bangkokDateString(date: Date): string {
  return new Date(date.getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

/** The instants covered by a range of Bangkok days, both end days included. */
export function dayRangeBangkok(from?: string, to?: string): { gte?: Date; lte?: Date } {
  const range: { gte?: Date; lte?: Date } = {};
  if (from) range.gte = new Date(`${from}T00:00:00+07:00`);
  if (to) range.lte = new Date(`${to}T23:59:59.999+07:00`);
  return range;
}

// ---------------------------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------------------------

/** `path` plus the parameters that are set: empty values, `false` and page one are left out, `true` is written as 1. */
export function buildReportHref(path: string, params: Record<string, string | number | boolean | null | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    if (key === "page" && value === 1) continue;
    query.set(key, value === true ? "1" : String(value));
  }
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}

// ---------------------------------------------------------------------------------------------
// Request report
// ---------------------------------------------------------------------------------------------

export const REQUEST_REPORT_SORTS = ["requestNo", "title", "status", "priority", "createdAt", "neededBy", "fulfillmentDueAt"] as const;

export type RequestReportParams = {
  q: string;
  status?: RequestStatus | "OPEN";
  type?: RequestType;
  priority?: Priority;
  from?: string;
  to?: string;
  slaBreached: boolean;
  assignee?: string;
  approver?: string;
  result?: "pending" | "approved" | "rejected";
  deleted?: "include" | "only";
  sort: (typeof REQUEST_REPORT_SORTS)[number];
  dir: SortDir;
  page: number;
  edit?: string;
};

export function parseRequestReportParams(raw: Raw, viewer: Viewer): RequestReportParams {
  const sort = oneOf(raw.sort, REQUEST_REPORT_SORTS) ?? "createdAt";
  let from = dayOf(raw.from);
  let to = dayOf(raw.to);
  if (from && to && from > to) [from, to] = [to, from];

  return {
    q: searchOf(raw.q),
    status: raw.status === "OPEN" ? "OPEN" : oneOf(raw.status, CURRENT_STATUSES),
    type: isRequestType(raw.type) ? raw.type : undefined,
    priority: isPriority(raw.priority) ? raw.priority : undefined,
    from,
    to,
    slaBreached: raw.sla === "breached",
    assignee: raw.assignee === "unassigned" ? "unassigned" : idOf(raw.assignee),
    // A manager's report is always their own requests, so the approver filter is for administrators only.
    approver: viewer.role === "ADMIN" ? idOf(raw.approver) : undefined,
    result: oneOf(raw.result, ["pending", "approved", "rejected"] as const),
    deleted: oneOf(raw.deleted, ["include", "only"] as const),
    sort,
    dir: dirOf(raw.dir, sort === "createdAt" ? "desc" : "asc"),
    page: pageOf(raw.page),
    edit: idOf(raw.edit),
  };
}

export type RequestScope = { kind: "all" } | { kind: "approver"; approverId: string };

/** Which requests this person's report may show; null when they have no report at all. */
export function requestReportScope(viewer: Viewer): RequestScope | null {
  if (viewer.role === "ADMIN") return { kind: "all" };
  if (viewer.role === "MANAGER") return { kind: "approver", approverId: viewer.id };
  return null;
}

// ---------------------------------------------------------------------------------------------
// User report
// ---------------------------------------------------------------------------------------------

export const USER_REPORT_SORTS = ["name", "email", "role", "lastLoginAt", "createdAt"] as const;

export type UserReportParams = {
  q: string;
  role?: Role;
  status?: "active" | "inactive";
  login?: "never";
  sort: (typeof USER_REPORT_SORTS)[number];
  dir: SortDir;
  page: number;
  edit?: string;
  adding: boolean;
};

export function parseUserReportParams(raw: Raw): UserReportParams {
  const sort = oneOf(raw.sort, USER_REPORT_SORTS) ?? "name";
  return {
    q: searchOf(raw.q),
    role: isRole(raw.role) ? raw.role : undefined,
    status: oneOf(raw.status, ["active", "inactive"] as const),
    login: oneOf(raw.login, ["never"] as const),
    sort,
    dir: dirOf(raw.dir, sort === "createdAt" || sort === "lastLoginAt" ? "desc" : "asc"),
    page: pageOf(raw.page),
    edit: idOf(raw.edit),
    adding: raw.new === "1",
  };
}

// ---------------------------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------------------------

export const SUMMARY_GROUPS = ["type", "month", "assignee"] as const;
export type SummaryGroup = (typeof SUMMARY_GROUPS)[number];

export const SUMMARY_SORTS = [
  "label",
  "total",
  "open",
  "completed",
  "rejected",
  "cancelled",
  "pendingApproval",
  "responseRate",
  "fulfillmentRate",
  "avgApprovalHours",
] as const;
export type SummarySort = (typeof SUMMARY_SORTS)[number];

export type SummaryParams = { from: string; to: string; group: SummaryGroup; sort: SummarySort; dir: SortDir };

export function parseSummaryParams(raw: Raw, now: Date): SummaryParams {
  const today = bangkokDateString(now);
  let from = dayOf(raw.from) ?? `${today.slice(0, 7)}-01`;
  let to = dayOf(raw.to) ?? today;
  if (from > to) [from, to] = [to, from];
  const sort = oneOf(raw.sort, SUMMARY_SORTS) ?? "total";
  return {
    from,
    to,
    group: oneOf(raw.group, SUMMARY_GROUPS) ?? "type",
    sort,
    dir: dirOf(raw.dir, sort === "label" ? "asc" : "desc"),
  };
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Ready-made ranges for the summary, all ending today (or at the end of last month). */
export function summaryPresets(now: Date): { key: "thisMonth" | "lastMonth" | "last3Months" | "thisYear"; from: string; to: string }[] {
  const today = bangkokDateString(now);
  const [year, month] = today.split("-").map(Number);
  return [
    { key: "thisMonth", from: isoDay(new Date(Date.UTC(year, month - 1, 1))), to: today },
    // Day 0 of this month is the last day of the one before; month - 2 is the month before this one.
    { key: "lastMonth", from: isoDay(new Date(Date.UTC(year, month - 2, 1))), to: isoDay(new Date(Date.UTC(year, month - 1, 0))) },
    { key: "last3Months", from: isoDay(new Date(Date.UTC(year, month - 3, 1))), to: today },
    { key: "thisYear", from: `${year}-01-01`, to: today },
  ];
}
