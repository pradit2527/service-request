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

/** System management (users, requests, knowledge base) is open to administrators and managers. */
export function canManageSystem(viewer: Viewer): boolean {
  return viewer.role === "ADMIN" || viewer.role === "MANAGER";
}

export function canViewRequest(viewer: Viewer, request: Pick<RequestRef, "requesterId" | "approverId">): boolean {
  return isStaff(viewer) || canManageSystem(viewer) || request.requesterId === viewer.id || isApproverOf(viewer, request);
}

export function canCancelRequest(viewer: Viewer, request: RequestRef): boolean {
  return request.requesterId === viewer.id && CANCELLABLE_STATUSES.includes(request.status);
}

/**
 * What the message box on a request page should show: the form ("open"), a note that the request is
 * finished ("closed", only for someone who took part in it), or nothing ("not-participant").
 */
export type CommentAvailability = "open" | "closed" | "not-participant";

export function commentAvailability(viewer: Viewer, request: RequestRef): CommentAvailability {
  if (isStaff(viewer)) return "open";
  // Opening a request from system management does not make a manager a participant in it.
  const involved = request.requesterId === viewer.id || isApproverOf(viewer, request);
  if (!involved) return "not-participant";
  return isClosed(request.status) ? "closed" : "open";
}

export function canComment(viewer: Viewer, request: RequestRef): boolean {
  return commentAvailability(viewer, request) === "open";
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

export type UserTarget = { id: string; role: Role; isActive: boolean };
/** The new role and active flag for a user (profile-only edits pass the current ones), or a deletion. */
export type UserEdit = { role: Role; isActive: boolean } | { delete: true };
export type ModifyUserResult =
  | { ok: true }
  | { ok: false; reason: "not-allowed" | "admin-protected" | "admin-grant" | "self" };

/**
 * Whether `actor` may apply `edit` to the `target` user. Managers cannot touch administrator accounts or
 * make anyone an administrator, and nobody can change their own role or status or delete themselves, so
 * the last administrator can never be removed.
 */
export function canModifyUser(actor: Viewer, target: UserTarget, edit: UserEdit): ModifyUserResult {
  if (!canManageSystem(actor)) return { ok: false, reason: "not-allowed" };
  if (!isAdmin(actor)) {
    if (target.role === "ADMIN") return { ok: false, reason: "admin-protected" };
    if ("role" in edit && edit.role === "ADMIN") return { ok: false, reason: "admin-grant" };
  }
  if (actor.id === target.id) {
    const changesSelf = "delete" in edit || edit.role !== target.role || edit.isActive !== target.isActive;
    if (changesSelf) return { ok: false, reason: "self" };
  }
  return { ok: true };
}

export function canCreateUser(actor: Viewer, role: Role): boolean {
  return canManageSystem(actor) && (role !== "ADMIN" || isAdmin(actor));
}

/** IT staff write knowledge base articles; managers and administrators can too, from system management. */
export function canEditKb(viewer: Viewer): boolean {
  return isStaff(viewer) || canManageSystem(viewer);
}

export function canDeleteKb(viewer: Viewer): boolean {
  return canManageSystem(viewer);
}

export function canEditRequest(viewer: Viewer, request: { deletedAt: Date | null }): boolean {
  return canManageSystem(viewer) && request.deletedAt === null;
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
