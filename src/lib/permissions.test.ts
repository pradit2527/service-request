import { describe, expect, it } from "vitest";
import {
  allowedStatusChanges,
  canCancelRequest,
  canComment,
  canDecideAsManager,
  canPostInternalNote,
  canViewRequest,
  isManager,
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
