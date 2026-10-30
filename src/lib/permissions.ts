// Role-based access rules. Pure module: no database or framework access, so it is unit-testable.
// Every server action / page must call these; hiding buttons in the UI is not a security control.

import type { Role } from "./labels";
import {
  CANCELLABLE_STATUSES,
  DECISION_STATUSES,
  isClosed,
  staffNextStatuses,
  type RequestStatus,
} from "./status";

export type Viewer = { id: string; role: Role };
export type RequestRef = { requesterId: string; status: RequestStatus; approverId?: string | null };

export function isStaff(viewer: Viewer): boolean {
  return viewer.role === "IT_STAFF" || viewer.role === "ADMIN";
}

export function isAdmin(viewer: Viewer): boolean {
  return viewer.role === "ADMIN";
}

/** Managers are the only people who can approve requests; IT staff and admins cannot. */
export function isManager(viewer: Viewer): boolean {
  return viewer.role === "MANAGER";
}

/** The manager the requester picked to approve this request. */
export function isApproverOf(viewer: Viewer, request: Pick<RequestRef, "approverId">): boolean {
  return !!request.approverId && request.approverId === viewer.id;
}

export function canViewRequest(viewer: Viewer, request: Pick<RequestRef, "requesterId" | "approverId">): boolean {
  return isStaff(viewer) || request.requesterId === viewer.id || isApproverOf(viewer, request);
}

export function canCancelRequest(viewer: Viewer, request: RequestRef): boolean {
  return request.requesterId === viewer.id && CANCELLABLE_STATUSES.includes(request.status);
}

export function canComment(viewer: Viewer, request: RequestRef): boolean {
  if (!canViewRequest(viewer, request)) return false;
  if (isStaff(viewer)) return true;
  return !isClosed(request.status);
}

export function canPostInternalNote(viewer: Viewer): boolean {
  return isStaff(viewer);
}

/**
 * Only a user whose role is MANAGER, and who the requester chose for this request, can approve or
 * reject it, never their own request. The role is read on every request, so changing someone's role
 * also takes effect on requests that are already waiting for them.
 */
export function canDecideAsManager(viewer: Viewer, request: RequestRef): boolean {
  return (
    isManager(viewer) &&
    isApproverOf(viewer, request) &&
    request.status === "PENDING_APPROVAL" &&
    request.requesterId !== viewer.id
  );
}

/**
 * Statuses this viewer may move the request to.
 * Separation of duties: IT staff cannot approve or reject their own request (admins can).
 */
export function allowedStatusChanges(viewer: Viewer, request: RequestRef): RequestStatus[] {
  if (!isStaff(viewer)) return [];
  const own = request.requesterId === viewer.id && !isAdmin(viewer);
  return staffNextStatuses(request.status).filter((to) => !(own && DECISION_STATUSES.includes(to)));
}
