// Audit log for changes to users and knowledge base articles (request changes are kept in RequestEvent).
// No database import here: callers pass their client (or transaction) in, so this stays unit-testable.

import type { Prisma } from "@prisma/client";
import { l, type Localized } from "./i18n";

export const AUDIT_ACTIONS = [
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DELETED",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET",
  "KB_CREATED",
  "KB_UPDATED",
  "KB_DELETED",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditEntity = "USER" | "KB_ARTICLE";

export const AUDIT_ACTION_LABEL: Record<AuditAction, Localized> = {
  USER_CREATED: l("เพิ่มผู้ใช้", "ເພີ່ມຜູ້ໃຊ້", "User added"),
  USER_UPDATED: l("แก้ไขผู้ใช้", "ແກ້ໄຂຜູ້ໃຊ້", "User edited"),
  USER_DELETED: l("ลบผู้ใช้", "ລຶບຜູ້ໃຊ້", "User deleted"),
  PASSWORD_CHANGED: l("เปลี่ยนรหัสผ่านของตนเอง", "ປ່ຽນລະຫັດຜ່ານຂອງຕົນເອງ", "Password changed by the user"),
  PASSWORD_RESET: l("ตั้งรหัสผ่านชั่วคราวให้ผู้ใช้", "ຕັ້ງລະຫັດຜ່ານຊົ່ວຄາວໃຫ້ຜູ້ໃຊ້", "Temporary password set for the user"),
  KB_CREATED: l("เพิ่มบทความ", "ເພີ່ມບົດຄວາມ", "Article added"),
  KB_UPDATED: l("แก้ไขบทความ", "ແກ້ໄຂບົດຄວາມ", "Article edited"),
  KB_DELETED: l("ลบบทความ", "ລຶບບົດຄວາມ", "Article deleted"),
};

const MAX_SUMMARY = 300;

/** Records one change. `summary` is a snapshot (e.g. the email or title), cut to 300 characters. */
export async function writeAudit(
  client: Pick<Prisma.TransactionClient, "auditLog">,
  actorId: string,
  entry: { action: AuditAction; entity: AuditEntity; entityId: string; summary: string },
): Promise<void> {
  await client.auditLog.create({
    data: { actorId, action: entry.action, entity: entry.entity, entityId: entry.entityId, summary: entry.summary.slice(0, MAX_SUMMARY) },
  });
}
