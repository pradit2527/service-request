import { describe, expect, it } from "vitest";
import {
  allowedStatusChanges,
  canCancelRequest,
  canComment,
  canCreateUser,
  canDecideAsManager,
  canDeleteKb,
  canEditKb,
  canEditRequest,
  canManageSystem,
  commentAvailability,
  canModifyUser,
  canPostInternalNote,
  canSetPassword,
  canViewRequest,
  isManager,
  isStandingIn,
  isStaff,
  type Viewer,
} from "./permissions";

const employee: Viewer = { id: "u-emp", role: "EMPLOYEE" };
const other: Viewer = { id: "u-other", role: "EMPLOYEE" };
const manager: Viewer = { id: "u-mgr", role: "MANAGER" };
const staff: Viewer = { id: "u-it", role: "IT_STAFF" };
const admin: Viewer = { id: "u-admin", role: "ADMIN" };

describe("viewing requests", () => {
  it("lets employees see only their own requests", () => {
    expect(canViewRequest(employee, { requesterId: employee.id })).toBe(true);
    expect(canViewRequest(other, { requesterId: employee.id })).toBe(false);
  });

  it("lets IT staff and admins see every request", () => {
    expect(canViewRequest(staff, { requesterId: employee.id })).toBe(true);
    expect(canViewRequest(admin, { requesterId: employee.id })).toBe(true);
  });

  it("lets the chosen manager see the request they must approve", () => {
    const request = { requesterId: employee.id, approverId: manager.id };
    expect(canViewRequest(manager, request)).toBe(true);
    expect(canViewRequest(other, request)).toBe(false);
  });

  it("identifies staff roles", () => {
    expect(isStaff(employee)).toBe(false);
    expect(isStaff(staff)).toBe(true);
    expect(isStaff(admin)).toBe(true);
  });
});

describe("manager approval", () => {
  const pending = { requesterId: employee.id, approverId: manager.id, status: "PENDING_APPROVAL" as const };

  it("is limited to the chosen manager while the request is pending", () => {
    expect(canDecideAsManager(manager, pending)).toBe(true);
    expect(canDecideAsManager(other, pending)).toBe(false);
    expect(canDecideAsManager(staff, pending)).toBe(false);
    expect(canDecideAsManager(admin, pending)).toBe(false);
  });

  it("is not available once the request moved on", () => {
    expect(canDecideAsManager(manager, { ...pending, status: "SUBMITTED" })).toBe(false);
    expect(canDecideAsManager(manager, { ...pending, status: "CANCELLED" })).toBe(false);
  });

  it("never lets someone approve their own request", () => {
    const self = { requesterId: manager.id, approverId: manager.id, status: "PENDING_APPROVAL" as const };
    expect(canDecideAsManager(manager, self)).toBe(false);
  });

  it("stops when the chosen manager's role changes, even on requests already waiting", () => {
    const demoted: Viewer = { ...manager, role: "EMPLOYEE" };
    expect(canDecideAsManager(demoted, pending)).toBe(false);
    // They can still follow the request they were chosen for.
    expect(canViewRequest(demoted, pending)).toBe(true);
  });

  it("gives approval to the MANAGER role only, even when chosen as the approver", () => {
    const roles: Viewer["role"][] = ["EMPLOYEE", "MANAGER", "IT_STAFF", "ADMIN"];
    for (const role of roles) {
      // Chosen for this request: only a manager may decide.
      expect(canDecideAsManager({ id: manager.id, role }, pending)).toBe(role === "MANAGER");
      // Not chosen for this request: nobody may decide, whatever their role.
      expect(canDecideAsManager({ id: "u-someone-else", role }, pending)).toBe(false);
    }
  });

  it("identifies managers", () => {
    expect(isManager(manager)).toBe(true);
    expect(isManager(employee)).toBe(false);
    expect(isManager(staff)).toBe(false);
    expect(isManager(admin)).toBe(false);
  });

  it("gives IT staff no status changes while the manager has not approved", () => {
    expect(allowedStatusChanges(staff, pending)).toEqual([]);
  });
});

describe("cancelling", () => {
  it("is limited to the requester while the request is still pending", () => {
    expect(canCancelRequest(employee, { requesterId: employee.id, status: "SUBMITTED" })).toBe(true);
    expect(canCancelRequest(employee, { requesterId: employee.id, status: "PENDING_APPROVAL" })).toBe(true);
    expect(canCancelRequest(employee, { requesterId: employee.id, status: "NEED_INFO" })).toBe(true);
    expect(canCancelRequest(employee, { requesterId: employee.id, status: "APPROVED" })).toBe(false);
    expect(canCancelRequest(employee, { requesterId: employee.id, status: "IN_PROGRESS" })).toBe(false);
  });

  it("is not available to other people, including staff", () => {
    expect(canCancelRequest(other, { requesterId: employee.id, status: "SUBMITTED" })).toBe(false);
    expect(canCancelRequest(staff, { requesterId: employee.id, status: "SUBMITTED" })).toBe(false);
  });
});

describe("commenting", () => {
  it("blocks requesters from commenting on closed requests, but not staff", () => {
    const closed = { requesterId: employee.id, status: "COMPLETED" as const };
    expect(canComment(employee, closed)).toBe(false);
    expect(canComment(staff, closed)).toBe(true);
  });

  it("blocks people who cannot view the request", () => {
    expect(canComment(other, { requesterId: employee.id, status: "SUBMITTED" })).toBe(false);
  });

  it("lets the manager comment while the request is open", () => {
    const request = { requesterId: employee.id, approverId: manager.id, status: "PENDING_APPROVAL" as const };
    expect(canComment(manager, request)).toBe(true);
  });

  it("limits internal notes to the IT team", () => {
    expect(canPostInternalNote(employee)).toBe(false);
    expect(canPostInternalNote(staff)).toBe(true);
  });
});

describe("what the message box on a request shows", () => {
  it("is open for the people who can write", () => {
    expect(commentAvailability(employee, { requesterId: employee.id, status: "IN_PROGRESS" })).toBe("open");
    expect(commentAvailability(staff, { requesterId: employee.id, status: "COMPLETED" })).toBe("open");
  });

  it("says closed to the requester of a finished request", () => {
    expect(commentAvailability(employee, { requesterId: employee.id, status: "COMPLETED" })).toBe("closed");
  });

  it("says nothing is wrong when a manager only looks at someone else's open request from system management", () => {
    expect(commentAvailability(manager, { requesterId: employee.id, status: "IN_PROGRESS" })).toBe("not-participant");
    // Even when that request is finished, "closed" would be the wrong thing to tell someone who could never write on it.
    expect(commentAvailability(manager, { requesterId: employee.id, status: "COMPLETED" })).toBe("not-participant");
  });

  it("agrees with canComment", () => {
    const requests = [
      { requesterId: employee.id, status: "IN_PROGRESS" as const },
      { requesterId: employee.id, status: "COMPLETED" as const },
      { requesterId: employee.id, approverId: manager.id, status: "PENDING_APPROVAL" as const },
    ];
    for (const viewer of [employee, other, manager, staff, admin]) {
      for (const request of requests) {
        expect(canComment(viewer, request)).toBe(commentAvailability(viewer, request) === "open");
      }
    }
  });
});

describe("changing status", () => {
  it("gives employees no status changes", () => {
    expect(allowedStatusChanges(employee, { requesterId: employee.id, status: "SUBMITTED" })).toEqual([]);
  });

  it("gives staff the lifecycle transitions for someone else's request", () => {
    const result = allowedStatusChanges(staff, { requesterId: employee.id, status: "SUBMITTED" });
    expect(result).toContain("IN_PROGRESS");
    expect(result).toContain("REJECTED");
  });

  it("stops IT staff refusing their own request, but lets them do the work", () => {
    const result = allowedStatusChanges(staff, { requesterId: staff.id, status: "SUBMITTED" });
    expect(result).not.toContain("REJECTED");
    expect(result).toContain("IN_PROGRESS");
  });

  it("lets an admin refuse their own request", () => {
    const result = allowedStatusChanges(admin, { requesterId: admin.id, status: "SUBMITTED" });
    expect(result).toContain("REJECTED");
  });
});

describe("system management", () => {
  const adminTarget = { id: "a2", role: "ADMIN" as const, isActive: true };
  const empTarget = { id: "e2", role: "EMPLOYEE" as const, isActive: true };

  it("is open to admins and managers only", () => {
    expect([employee, staff, manager, admin].map(canManageSystem)).toEqual([false, false, true, true]);
  });

  it("refuses employees and IT staff any change to a user", () => {
    for (const actor of [employee, staff]) {
      expect(canModifyUser(actor, empTarget, { role: "EMPLOYEE", isActive: true })).toEqual({ ok: false, reason: "not-allowed" });
    }
  });

  it("keeps admin accounts out of a manager's reach", () => {
    expect(canModifyUser(manager, adminTarget, { role: "ADMIN", isActive: true })).toEqual({ ok: false, reason: "admin-protected" });
    expect(canModifyUser(manager, adminTarget, { delete: true })).toEqual({ ok: false, reason: "admin-protected" });
  });

  it("stops a manager making anyone an admin, themselves included", () => {
    expect(canModifyUser(manager, empTarget, { role: "ADMIN", isActive: true })).toEqual({ ok: false, reason: "admin-grant" });
    const self = { id: manager.id, role: "MANAGER" as const, isActive: true };
    expect(canModifyUser(manager, self, { role: "ADMIN", isActive: true })).toEqual({ ok: false, reason: "admin-grant" });
  });

  it("lets a manager edit, disable and delete users who are not admins", () => {
    expect(canModifyUser(manager, empTarget, { role: "IT_STAFF", isActive: false })).toEqual({ ok: true });
    expect(canModifyUser(manager, empTarget, { delete: true })).toEqual({ ok: true });
  });

  it("lets an admin change and remove other admins", () => {
    expect(canModifyUser(admin, adminTarget, { role: "EMPLOYEE", isActive: true })).toEqual({ ok: true });
    expect(canModifyUser(admin, adminTarget, { delete: true })).toEqual({ ok: true });
  });

  it("never lets anyone change their own role or status, or delete themselves", () => {
    const self = { id: admin.id, role: "ADMIN" as const, isActive: true };
    expect(canModifyUser(admin, self, { role: "EMPLOYEE", isActive: true })).toEqual({ ok: false, reason: "self" });
    expect(canModifyUser(admin, self, { role: "ADMIN", isActive: false })).toEqual({ ok: false, reason: "self" });
    expect(canModifyUser(admin, self, { delete: true })).toEqual({ ok: false, reason: "self" });
  });

  it("still lets someone edit their own profile fields", () => {
    const self = { id: admin.id, role: "ADMIN" as const, isActive: true };
    expect(canModifyUser(admin, self, { role: "ADMIN", isActive: true })).toEqual({ ok: true });
  });

  it("protects the last admin: only another admin can touch an admin, and nobody can touch themselves", () => {
    const soleAdmin = { id: admin.id, role: "ADMIN" as const, isActive: true };
    for (const actor of [employee, staff, manager]) {
      expect(canModifyUser(actor, soleAdmin, { role: "EMPLOYEE", isActive: true }).ok).toBe(false);
      expect(canModifyUser(actor, soleAdmin, { role: "ADMIN", isActive: false }).ok).toBe(false);
      expect(canModifyUser(actor, soleAdmin, { delete: true }).ok).toBe(false);
    }
    expect(canModifyUser(admin, soleAdmin, { delete: true })).toEqual({ ok: false, reason: "self" });
  });

  it("lets only an admin create admins", () => {
    expect(canCreateUser(admin, "ADMIN")).toBe(true);
    expect(canCreateUser(admin, "EMPLOYEE")).toBe(true);
    expect(canCreateUser(manager, "MANAGER")).toBe(true);
    expect(canCreateUser(manager, "ADMIN")).toBe(false);
    expect(canCreateUser(staff, "EMPLOYEE")).toBe(false);
    expect(canCreateUser(employee, "EMPLOYEE")).toBe(false);
  });

  it("lets IT staff write knowledge base articles but only managers and admins delete them", () => {
    expect([employee, staff, manager, admin].map(canEditKb)).toEqual([false, true, true, true]);
    expect([employee, staff, manager, admin].map(canDeleteKb)).toEqual([false, false, true, true]);
  });

  it("lets managers and admins edit a request until it is deleted", () => {
    expect(canEditRequest(manager, { deletedAt: null })).toBe(true);
    expect(canEditRequest(admin, { deletedAt: null })).toBe(true);
    expect(canEditRequest(manager, { deletedAt: new Date() })).toBe(false);
    expect(canEditRequest(staff, { deletedAt: null })).toBe(false);
    expect(canEditRequest(employee, { deletedAt: null })).toBe(false);
  });

  it("lets a manager open any request from system management, but not comment on it", () => {
    const someoneElses = { requesterId: "u-x", status: "IN_PROGRESS" as const };
    expect(canViewRequest(manager, someoneElses)).toBe(true);
    expect(canComment(manager, someoneElses)).toBe(false);
    const chosen = { requesterId: "u-x", approverId: manager.id, status: "PENDING_APPROVAL" as const };
    expect(canComment(manager, chosen)).toBe(true);
  });
});

describe("setting another person's temporary password", () => {
  it("is for administrators only: a manager who could do it could take over an administrator's account", () => {
    const target = { id: "e2", role: "EMPLOYEE" as const };
    expect([employee, staff, manager, admin].map((actor) => canSetPassword(actor, target))).toEqual([false, false, false, true]);
    expect(canSetPassword(manager, { id: "a2", role: "ADMIN" as const })).toBe(false);
  });

  it("lets an administrator do it for any other account, administrators included", () => {
    expect(canSetPassword(admin, { id: "a2", role: "ADMIN" as const })).toBe(true);
    expect(canSetPassword(admin, { id: "m2", role: "MANAGER" as const })).toBe(true);
  });

  it("is not how a person changes their own password: that is the profile page", () => {
    expect(canSetPassword(admin, { id: admin.id, role: "ADMIN" as const })).toBe(false);
  });
});

describe("a manager standing in for one who is away", () => {
  const away: Viewer = { id: "u-away", role: "MANAGER" };
  const standIn: Viewer = { id: "u-stand", role: "MANAGER", actingFor: ["u-away"] };
  const waiting = { requesterId: employee.id, approverId: away.id, status: "PENDING_APPROVAL" as const };

  it("can see, comment on and decide the requests of the manager they stand in for", () => {
    expect(canViewRequest(standIn, waiting)).toBe(true);
    expect(canComment(standIn, waiting)).toBe(true);
    expect(canDecideAsManager(standIn, waiting)).toBe(true);
  });

  it("cannot decide for a manager they do not stand in for", () => {
    expect(canDecideAsManager({ ...standIn, actingFor: ["u-someone-else"] }, waiting)).toBe(false);
    expect(canDecideAsManager({ ...standIn, actingFor: [] }, waiting)).toBe(false);
    expect(canDecideAsManager({ id: "u-stand", role: "MANAGER" }, waiting)).toBe(false);
  });

  it("cannot approve a request they filed themselves, even for the manager they stand in for", () => {
    expect(canDecideAsManager(standIn, { ...waiting, requesterId: standIn.id })).toBe(false);
  });

  it("stops being able to decide once their role is no longer manager", () => {
    expect(canDecideAsManager({ ...standIn, role: "EMPLOYEE" }, waiting)).toBe(false);
    expect(canDecideAsManager({ ...standIn, role: "IT_STAFF" }, waiting)).toBe(false);
  });

  it("only decides what is still waiting for approval", () => {
    expect(canDecideAsManager(standIn, { ...waiting, status: "SUBMITTED" })).toBe(false);
  });

  it("is told apart from the approver the requester picked", () => {
    expect(isStandingIn(standIn, waiting)).toBe(true);
    expect(isStandingIn(away, waiting)).toBe(false);
    expect(isStandingIn(standIn, { ...waiting, approverId: standIn.id })).toBe(false);
    expect(isStandingIn(standIn, { ...waiting, approverId: null })).toBe(false);
  });

  it("does not let the manager who is away lose their own right to decide", () => {
    expect(canDecideAsManager(away, waiting)).toBe(true);
  });
});
