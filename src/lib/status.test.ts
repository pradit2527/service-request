import { describe, expect, it } from "vitest";
import {
  CANCELLABLE_STATUSES,
  CLOSED_STATUSES,
  CURRENT_STATUSES,
  LEGACY_STATUSES,
  NOTE_REQUIRED_STATUSES,
  PAUSE_STATUSES,
  PROGRESS_STEPS,
  REQUEST_STATUSES,
  getProgress,
  isClosed,
  isPaused,
  isValidStatus,
  staffNextStatuses,
} from "./status";

describe("status lifecycle", () => {
  it("lets IT start work on a request that is waiting for it", () => {
    expect(staffNextStatuses("SUBMITTED")).toEqual(["IN_PROGRESS", "NEED_INFO", "ON_HOLD", "REJECTED"]);
  });

  it("leaves the manager decision to the manager, not IT staff", () => {
    expect(staffNextStatuses("PENDING_APPROVAL")).toEqual([]);
  });

  it("has no separate review or approval step for IT: work goes straight to done", () => {
    for (const from of ["SUBMITTED", "IN_PROGRESS", "NEED_INFO", "ON_HOLD"] as const) {
      const next = staffNextStatuses(from);
      expect(next).not.toContain("IN_REVIEW");
      expect(next).not.toContain("APPROVED");
    }
    expect(staffNextStatuses("IN_PROGRESS")).toContain("COMPLETED");
  });

  it("lets work be put on hold and resumed", () => {
    expect(staffNextStatuses("IN_PROGRESS")).toContain("ON_HOLD");
    expect(staffNextStatuses("ON_HOLD")).toEqual(["IN_PROGRESS", "REJECTED"]);
    expect(staffNextStatuses("NEED_INFO")).toEqual(["IN_PROGRESS", "REJECTED"]);
  });

  it("treats completed, rejected and cancelled as final", () => {
    expect(staffNextStatuses("COMPLETED")).toEqual([]);
    expect(staffNextStatuses("CANCELLED")).toEqual([]);
    // Nobody can reopen a request the manager refused: the requester submits a new one.
    expect(staffNextStatuses("REJECTED")).toEqual([]);
  });

  it("never lists a status as its own next status", () => {
    for (const status of REQUEST_STATUSES) {
      expect(staffNextStatuses(status)).not.toContain(status);
    }
  });

  it("never lets IT move a request into the old-workflow statuses", () => {
    for (const status of REQUEST_STATUSES) {
      for (const next of staffNextStatuses(status)) expect(LEGACY_STATUSES).not.toContain(next);
    }
  });

  it("still lets a request left in an old-workflow status be moved on", () => {
    expect(staffNextStatuses("IN_REVIEW")).toContain("IN_PROGRESS");
    expect(staffNextStatuses("APPROVED")).toContain("COMPLETED");
  });

  it("offers every status except the old-workflow ones in filters", () => {
    expect([...CURRENT_STATUSES].sort()).toEqual(
      ["CANCELLED", "COMPLETED", "IN_PROGRESS", "NEED_INFO", "ON_HOLD", "PENDING_APPROVAL", "REJECTED", "SUBMITTED"].sort(),
    );
  });

  it("requires a note when rejecting, asking for info or putting on hold", () => {
    expect([...NOTE_REQUIRED_STATUSES].sort()).toEqual(["NEED_INFO", "ON_HOLD", "REJECTED"]);
  });

  it("marks closed statuses", () => {
    expect([...CLOSED_STATUSES].sort()).toEqual(["CANCELLED", "COMPLETED", "REJECTED"]);
    expect(isClosed("IN_PROGRESS")).toBe(false);
    expect(isClosed("COMPLETED")).toBe(true);
  });

  it("lets a requester cancel only until IT has started the work", () => {
    expect([...CANCELLABLE_STATUSES].sort()).toEqual(["NEED_INFO", "PENDING_APPROVAL", "SUBMITTED"]);
  });

  it("pauses the SLA while waiting on someone outside IT", () => {
    expect([...PAUSE_STATUSES].sort()).toEqual(["NEED_INFO", "ON_HOLD", "PENDING_APPROVAL"]);
    expect(isPaused("ON_HOLD")).toBe(true);
    expect(isPaused("IN_PROGRESS")).toBe(false);
  });

  it("validates status strings", () => {
    expect(isValidStatus("IN_PROGRESS")).toBe(true);
    expect(isValidStatus("approved")).toBe(false);
    expect(isValidStatus(undefined)).toBe(false);
  });
});

describe("progress steps", () => {
  it("are the four steps of the workflow", () => {
    expect(PROGRESS_STEPS.map((step) => step.en)).toEqual(["Submitted", "Manager approval", "IT working on it", "Completed"]);
  });

  it("maps every status to a position inside the steps", () => {
    for (const status of REQUEST_STATUSES) {
      for (const approvalPassed of [true, false]) {
        const p = getProgress(status, approvalPassed);
        expect(p.completed).toBeGreaterThanOrEqual(1);
        expect(p.completed).toBeLessThanOrEqual(PROGRESS_STEPS.length);
        if (p.current !== null) {
          expect(p.current).toBeGreaterThanOrEqual(0);
          expect(p.current).toBeLessThan(PROGRESS_STEPS.length);
        }
      }
    }
  });

  it("shows a request waiting for the manager on the approval step", () => {
    expect(getProgress("PENDING_APPROVAL")).toEqual({ completed: 1, current: 1, state: "warning" });
  });

  it("shows an approved request, waiting or being worked on, on the IT step", () => {
    expect(getProgress("SUBMITTED")).toEqual({ completed: 2, current: 2, state: "active" });
    expect(getProgress("IN_PROGRESS")).toEqual({ completed: 2, current: 2, state: "active" });
  });

  it("keeps a request that is paused for information or a Vendor on the IT step", () => {
    expect(getProgress("NEED_INFO")).toEqual({ completed: 2, current: 2, state: "warning" });
    expect(getProgress("ON_HOLD")).toEqual({ completed: 2, current: 2, state: "warning" });
  });

  it("finishes every step when the work is completed", () => {
    expect(getProgress("COMPLETED")).toEqual({ completed: PROGRESS_STEPS.length, current: null, state: "done" });
  });

  it("shows where a rejected or cancelled request stopped", () => {
    // The manager refused it: it stopped at the approval step.
    expect(getProgress("REJECTED", false)).toEqual({ completed: 1, current: 1, state: "failed" });
    expect(getProgress("CANCELLED", false)).toEqual({ completed: 1, current: 1, state: "cancelled" });
    // IT refused it, or it was cancelled after approval: it stopped at the IT step.
    expect(getProgress("REJECTED", true)).toEqual({ completed: 2, current: 2, state: "failed" });
    expect(getProgress("CANCELLED", true).state).toBe("cancelled");
  });
});
