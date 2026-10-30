// Request status lifecycle. Pure module: safe to import from client and server code.

import { l, type Localized } from "./i18n";

export const REQUEST_STATUSES = [
  "PENDING_APPROVAL",
  "SUBMITTED",
  "IN_REVIEW",
  "NEED_INFO",
  "ON_HOLD",
  "APPROVED",
  "REJECTED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const STATUS_LABEL: Record<RequestStatus, Localized> = {
  PENDING_APPROVAL: l("รอหัวหน้าอนุมัติ", "ລໍຫົວໜ້າອະນຸມັດ", "Awaiting manager approval"),
  // The manager approved it (or it needed no approval) and it is waiting in the IT team's queue.
  SUBMITTED: l("รอ IT ดำเนินการ", "ລໍ IT ດຳເນີນການ", "Waiting for IT"),
  // IN_REVIEW and APPROVED are no longer used: the request goes from the manager straight to IT.
  // They stay in the list only so older requests and their history can still be read.
  IN_REVIEW: l("กำลังพิจารณา", "ກຳລັງພິຈາລະນາ", "Under review"),
  NEED_INFO: l("รอข้อมูลเพิ่มเติม", "ລໍຖ້າຂໍ້ມູນເພີ່ມເຕີມ", "Waiting for information"),
  ON_HOLD: l("รอ Vendor / งบประมาณ", "ລໍ Vendor / ງົບປະມານ", "On hold (vendor / budget)"),
  APPROVED: l("อนุมัติแล้ว", "ອະນຸມັດແລ້ວ", "Approved"),
  REJECTED: l("ไม่อนุมัติ", "ບໍ່ອະນຸມັດ", "Rejected"),
  IN_PROGRESS: l("กำลังดำเนินการ", "ກຳລັງດຳເນີນການ", "In progress"),
  COMPLETED: l("เสร็จสิ้น", "ສຳເລັດ", "Completed"),
  CANCELLED: l("ยกเลิก", "ຍົກເລີກ", "Cancelled"),
};

export type Tone = "slate" | "blue" | "indigo" | "amber" | "green" | "red" | "violet" | "orange";

export const STATUS_TONE: Record<RequestStatus, Tone> = {
  PENDING_APPROVAL: "indigo",
  SUBMITTED: "slate",
  IN_REVIEW: "blue",
  NEED_INFO: "amber",
  ON_HOLD: "orange",
  APPROVED: "green",
  REJECTED: "red",
  IN_PROGRESS: "violet",
  COMPLETED: "green",
  CANCELLED: "slate",
};

// While a request waits on someone outside the IT team, the SLA clock is paused.
export const PAUSE_STATUSES: readonly RequestStatus[] = ["PENDING_APPROVAL", "NEED_INFO", "ON_HOLD"];

export function isPaused(status: RequestStatus): boolean {
  return PAUSE_STATUSES.includes(status);
}

// The workflow: the requester submits, the manager approves (PENDING_APPROVAL → SUBMITTED), then the IT team
// does the work (SUBMITTED → IN_PROGRESS → COMPLETED). IT can also ask the requester for information or put
// the work on hold. The manager decides PENDING_APPROVAL, and requesters can only cancel (CANCELLABLE_STATUSES).
// A rejected request is final: the requester submits a new one, so nobody can reopen a request the manager refused.
const STAFF_TRANSITIONS: Record<RequestStatus, readonly RequestStatus[]> = {
  PENDING_APPROVAL: [],
  SUBMITTED: ["IN_PROGRESS", "NEED_INFO", "ON_HOLD", "REJECTED"],
  IN_PROGRESS: ["COMPLETED", "NEED_INFO", "ON_HOLD"],
  NEED_INFO: ["IN_PROGRESS", "REJECTED"],
  ON_HOLD: ["IN_PROGRESS", "REJECTED"],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: [],
  // Statuses of the old workflow: a request still in one of them can be moved on like its closest current one.
  IN_REVIEW: ["IN_PROGRESS", "NEED_INFO", "ON_HOLD", "REJECTED"],
  APPROVED: ["IN_PROGRESS", "ON_HOLD", "COMPLETED"],
};

/** Statuses of the old workflow that new requests never reach. */
export const LEGACY_STATUSES: readonly RequestStatus[] = ["IN_REVIEW", "APPROVED"];

/** The statuses offered in filters: every one except the old-workflow ones. */
export const CURRENT_STATUSES: readonly RequestStatus[] = REQUEST_STATUSES.filter((s) => !LEGACY_STATUSES.includes(s));

// The requester can cancel until the IT team has started the work.
export const CANCELLABLE_STATUSES: readonly RequestStatus[] = ["PENDING_APPROVAL", "SUBMITTED", "NEED_INFO"];

// Moving to these statuses needs a message explaining why.
export const NOTE_REQUIRED_STATUSES: readonly RequestStatus[] = ["REJECTED", "NEED_INFO", "ON_HOLD"];

// Approval decisions, recorded on the request (decidedBy / decidedAt).
export const DECISION_STATUSES: readonly RequestStatus[] = ["APPROVED", "REJECTED"];

// Statuses that end the request (closedAt is set).
export const CLOSED_STATUSES: readonly RequestStatus[] = ["COMPLETED", "REJECTED", "CANCELLED"];

export function isClosed(status: RequestStatus): boolean {
  return CLOSED_STATUSES.includes(status);
}

export function isValidStatus(value: unknown): value is RequestStatus {
  return typeof value === "string" && (REQUEST_STATUSES as readonly string[]).includes(value);
}

export function staffNextStatuses(from: RequestStatus): readonly RequestStatus[] {
  return STAFF_TRANSITIONS[from];
}

// Visual progress shown on the request page, the same four steps as the workflow:
// the requester submits → the manager approves → the IT team does the work → done.
export const PROGRESS_STEPS: readonly Localized[] = [
  l("ยื่นคำขอ", "ຍື່ນຄຳຂໍ", "Submitted"),
  l("หัวหน้าอนุมัติ", "ຫົວໜ້າອະນຸມັດ", "Manager approval"),
  l("IT ดำเนินการ", "IT ດຳເນີນການ", "IT working on it"),
  l("เสร็จสิ้น", "ສຳເລັດ", "Completed"),
];

/** Shown instead of the approval step's name for requests that never needed a manager. */
export const NO_APPROVAL_STEP: Localized = l("ไม่ต้องอนุมัติ", "ບໍ່ຕ້ອງອະນຸມັດ", "No approval needed");

export type Progress = {
  /** Number of steps already finished (0..PROGRESS_STEPS.length). */
  completed: number;
  /** Index of the step the request is stuck on / working on; null once everything is done. */
  current: number | null;
  state: "active" | "warning" | "failed" | "cancelled" | "done";
};

const APPROVAL = 1;
const IT_WORK = 2;

/**
 * Where a request is on the four steps. `approvalPassed` says whether the approval step is already behind it
 * (the manager approved, or the request never needed one); it only matters for a request that was rejected
 * or cancelled, to show which step it stopped at.
 */
export function getProgress(status: RequestStatus, approvalPassed = true): Progress {
  switch (status) {
    case "PENDING_APPROVAL":
      return { completed: APPROVAL, current: APPROVAL, state: "warning" };
    case "NEED_INFO":
    case "ON_HOLD":
      return { completed: IT_WORK, current: IT_WORK, state: "warning" };
    case "COMPLETED":
      return { completed: PROGRESS_STEPS.length, current: null, state: "done" };
    case "REJECTED": {
      const step = approvalPassed ? IT_WORK : APPROVAL;
      return { completed: step, current: step, state: "failed" };
    }
    case "CANCELLED": {
      const step = approvalPassed ? IT_WORK : APPROVAL;
      return { completed: step, current: step, state: "cancelled" };
    }
    default:
      // SUBMITTED (waiting for IT), IN_PROGRESS, and the old IN_REVIEW / APPROVED.
      return { completed: IT_WORK, current: IT_WORK, state: "active" };
  }
}
