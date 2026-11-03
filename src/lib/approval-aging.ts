// How long a request has been waiting for its approver, in working days. Pure module: no database or framework access.

import type { Translate } from "./i18n";
import { BUSINESS_DAY_MINUTES, DEFAULT_CALENDAR, businessMinutesBetween, type Calendar } from "./sla";

/** Working days after which a waiting request is called late, and then overdue. */
export const LATE_AFTER_DAYS = 2;
export const OVERDUE_AFTER_DAYS = 5;

export type WaitLevel = "fresh" | "late" | "overdue";
export type ApprovalWait = { businessDays: number; level: WaitLevel };

/** Whole working days between `since` and `now` (the SLA calendar: weekends and holidays do not count). */
export function approvalWait(since: Date, now: Date, cal: Calendar = DEFAULT_CALENDAR): ApprovalWait {
  const businessDays = Math.max(0, Math.floor(businessMinutesBetween(since, now, cal) / BUSINESS_DAY_MINUTES));
  const level: WaitLevel = businessDays >= OVERDUE_AFTER_DAYS ? "overdue" : businessDays >= LATE_AFTER_DAYS ? "late" : "fresh";
  return { businessDays, level };
}

/**
 * Since when the request has been waiting on its approver, or null while it is waiting on the requester instead (the
 * approver asked for more information and has no answer yet). After an answer the count starts again from it.
 */
export function approverWaitingSince(request: { createdAt: Date; infoRequestedAt: Date | null; infoAnsweredAt: Date | null }): Date | null {
  if (request.infoRequestedAt !== null) return null;
  if (request.infoAnsweredAt !== null && request.infoAnsweredAt.getTime() > request.createdAt.getTime()) return request.infoAnsweredAt;
  return request.createdAt;
}

export function waitText(wait: ApprovalWait, t: Translate): string {
  const n = wait.businessDays;
  if (n === 0) return t("รอมาไม่ถึง 1 วันทำการ", "ລໍຖ້າມາບໍ່ເຖິງ 1 ວັນເຮັດວຽກ", "Waiting less than 1 working day");
  return t(`รอมา ${n} วันทำการ`, `ລໍຖ້າມາ ${n} ວັນເຮັດວຽກ`, `Waiting ${n} working ${n === 1 ? "day" : "days"}`);
}
