// When a manager is away, another manager can approve in their place for a period. These are the rules for setting
// that up. Pure module: no database or framework access, so it is unit-testable.

import { l, type Localized } from "./i18n";
import type { Role } from "./labels";

export const MAX_DELEGATION_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;
const BANGKOK = "+07:00";

export type DelegationWindow = { startsAt: Date; endsAt: Date; revokedAt: Date | null };

/** A period written as two calendar days (YYYY-MM-DD, both included), in Bangkok time. Null when either is not a real date. */
export function delegationWindowFromDates(from: string, to: string): { startsAt: Date; endsAt: Date } | null {
  const first = parseDay(from);
  const last = parseDay(to);
  if (!first || !last) return null;
  return { startsAt: first, endsAt: new Date(last.getTime() + DAY_MS) };
}

function parseDay(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00${BANGKOK}`);
  if (Number.isNaN(date.getTime())) return null;
  // new Date("2026-02-30T...") rolls over instead of failing, so check the day survived.
  return date.toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" }) === value ? date : null;
}

/** The stand-in is in charge right now: the period has begun, has not ended, and was not ended by hand. */
export function isDelegationActive(window: DelegationWindow, now: Date): boolean {
  return window.revokedAt === null && window.startsAt.getTime() <= now.getTime() && now.getTime() < window.endsAt.getTime();
}

/** Running or still to come: what the list shows, and what a new period must not overlap. */
export function isDelegationLive(window: DelegationWindow, now: Date): boolean {
  return window.revokedAt === null && now.getTime() < window.endsAt.getTime();
}

export type DelegationProblem = "no-delegate" | "self" | "not-manager" | "inactive" | "bad-dates" | "in-the-past" | "too-long" | "overlap";

export const DELEGATION_PROBLEM_LABEL: Record<DelegationProblem, Localized> = {
  "no-delegate": l("กรุณาเลือกผู้แทน", "ກະລຸນາເລືອກຜູ້ແທນ", "Please choose who will stand in"),
  self: l("เลือกตัวเองเป็นผู้แทนไม่ได้", "ເລືອກຕົນເອງເປັນຜູ້ແທນບໍ່ໄດ້", "You cannot stand in for yourself"),
  "not-manager": l(
    "ผู้แทนต้องเป็นหัวหน้างานผู้อนุมัติ",
    "ຜູ້ແທນຕ້ອງເປັນຫົວໜ້າຜູ້ອະນຸມັດ",
    "The stand-in must be a manager who can approve",
  ),
  inactive: l("ผู้แทนคนนี้ถูกปิดใช้งานแล้ว", "ຜູ້ແທນຄົນນີ້ຖືກປິດການໃຊ້ງານແລ້ວ", "This person's account is deactivated"),
  "bad-dates": l("กรุณาระบุวันที่เริ่มและวันที่สิ้นสุดให้ถูกต้อง", "ກະລຸນາລະບຸວັນທີເລີ່ມ ແລະ ວັນທີສິ້ນສຸດໃຫ້ຖືກຕ້ອງ", "Please enter a valid first and last day"),
  "in-the-past": l("ช่วงเวลานี้สิ้นสุดไปแล้ว", "ໄລຍະເວລານີ້ສິ້ນສຸດໄປແລ້ວ", "This period is already over"),
  "too-long": l(
    `ตั้งผู้แทนได้ครั้งละไม่เกิน ${MAX_DELEGATION_DAYS} วัน`,
    `ຕັ້ງຜູ້ແທນໄດ້ຄັ້ງລະບໍ່ເກີນ ${MAX_DELEGATION_DAYS} ວັນ`,
    `A stand-in can be set for at most ${MAX_DELEGATION_DAYS} days at a time`,
  ),
  overlap: l(
    "ช่วงเวลานี้ซ้อนกับผู้แทนที่ตั้งไว้แล้ว ให้ยกเลิกอันเดิมก่อน",
    "ໄລຍະເວລານີ້ຊ້ອນກັບຜູ້ແທນທີ່ຕັ້ງໄວ້ແລ້ວ ໃຫ້ຍົກເລີກອັນເກົ່າກ່ອນ",
    "This overlaps a stand-in that is already set. Cancel that one first",
  ),
};

/** Why this stand-in cannot be set, or null when it can. */
export function delegationProblem(input: {
  managerId: string;
  delegate: { id: string; role: Role; isActive: boolean } | null;
  startsAt: Date;
  endsAt: Date;
  now: Date;
  existing: readonly DelegationWindow[];
}): DelegationProblem | null {
  const { managerId, delegate, startsAt, endsAt, now, existing } = input;
  if (!delegate) return "no-delegate";
  if (delegate.id === managerId) return "self";
  if (delegate.role !== "MANAGER") return "not-manager";
  if (!delegate.isActive) return "inactive";
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= startsAt.getTime()) return "bad-dates";
  if (endsAt.getTime() <= now.getTime()) return "in-the-past";
  if (endsAt.getTime() - startsAt.getTime() > MAX_DELEGATION_DAYS * DAY_MS) return "too-long";
  const overlaps = existing.some((other) => isDelegationLive(other, now) && startsAt.getTime() < other.endsAt.getTime() && other.startsAt.getTime() < endsAt.getTime());
  return overlaps ? "overlap" : null;
}
