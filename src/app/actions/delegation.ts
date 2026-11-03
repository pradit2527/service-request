"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { writeAudit } from "@/lib/audit";
import { requireUser, type CurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { DELEGATION_PROBLEM_LABEL, delegationProblem, delegationWindowFromDates, type DelegationProblem } from "@/lib/delegation-rules";
import { getI18n } from "@/lib/i18n-server";
import { isAdmin, isManager } from "@/lib/permissions";

// A manager who is away names another manager to approve in their place. The manager sets it for themselves; an
// administrator can set or cancel it for any manager (for example when the manager is ill and cannot do it).

function mayManage(actor: CurrentUser, managerId: string): boolean {
  return isAdmin(actor) || (isManager(actor) && actor.id === managerId);
}

const FIELD_OF: Record<DelegationProblem, "delegateId" | "to" | "form"> = {
  "no-delegate": "delegateId",
  self: "delegateId",
  "not-manager": "delegateId",
  inactive: "delegateId",
  "bad-dates": "to",
  "in-the-past": "to",
  "too-long": "to",
  overlap: "form",
};

export async function setDelegation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const actor = await requireUser();

  const managerId = String(formData.get("managerId") ?? "");
  const delegateId = String(formData.get("delegateId") ?? "");
  const from = String(formData.get("from") ?? "");
  const to = String(formData.get("to") ?? "");

  const manager = await db.user.findUnique({ where: { id: managerId }, select: { id: true, email: true, role: true, isActive: true } });
  if (!manager || manager.role !== "MANAGER" || !manager.isActive || !mayManage(actor, manager.id)) {
    return { error: t("คุณไม่มีสิทธิ์ตั้งผู้แทนให้ผู้ใช้นี้", "ທ່ານບໍ່ມີສິດຕັ້ງຜູ້ແທນໃຫ້ຜູ້ໃຊ້ນີ້", "You are not allowed to set a stand-in for this user") };
  }

  const window = delegationWindowFromDates(from, to);
  const now = new Date();
  const delegate = delegateId ? await db.user.findUnique({ where: { id: delegateId }, select: { id: true, email: true, role: true, isActive: true } }) : null;
  const existing = await db.approvalDelegation.findMany({
    where: { managerId: manager.id, revokedAt: null, endsAt: { gt: now } },
    select: { startsAt: true, endsAt: true, revokedAt: true },
  });

  const problem = window
    ? delegationProblem({ managerId: manager.id, delegate, startsAt: window.startsAt, endsAt: window.endsAt, now, existing })
    : "bad-dates";
  if (problem || !window || !delegate) {
    const message = t(DELEGATION_PROBLEM_LABEL[problem ?? "no-delegate"]);
    const field = FIELD_OF[problem ?? "no-delegate"];
    return field === "form" ? { error: message } : { fieldErrors: { [field]: message } };
  }

  await db.$transaction(async (tx) => {
    const created = await tx.approvalDelegation.create({
      data: { managerId: manager.id, delegateId: delegate.id, startsAt: window.startsAt, endsAt: window.endsAt },
      select: { id: true },
    });
    await writeAudit(tx, actor.id, {
      action: "DELEGATION_SET",
      entity: "USER",
      entityId: manager.id,
      summary: `${manager.email} → ${delegate.email} (${from} – ${to}) #${created.id}`,
    });
  });

  revalidatePath("/approvals");
  revalidatePath(`/admin/users/${manager.id}`);
  return { ok: true };
}

export async function revokeDelegation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const actor = await requireUser();

  const delegation = await db.approvalDelegation.findUnique({
    where: { id: String(formData.get("delegationId") ?? "") },
    select: { id: true, managerId: true, revokedAt: true, manager: { select: { email: true } }, delegate: { select: { email: true } } },
  });
  if (!delegation || delegation.revokedAt !== null || !mayManage(actor, delegation.managerId)) {
    return { error: t("ไม่พบผู้แทนนี้ หรือคุณไม่มีสิทธิ์ยกเลิก", "ບໍ່ພົບຜູ້ແທນນີ້ ຫຼື ທ່ານບໍ່ມີສິດຍົກເລີກ", "Stand-in not found, or you may not cancel it") };
  }

  await db.$transaction(async (tx) => {
    await tx.approvalDelegation.update({ where: { id: delegation.id }, data: { revokedAt: new Date() } });
    await writeAudit(tx, actor.id, {
      action: "DELEGATION_REVOKED",
      entity: "USER",
      entityId: delegation.managerId,
      summary: `${delegation.manager.email} → ${delegation.delegate.email} #${delegation.id}`,
    });
  });

  revalidatePath("/approvals");
  revalidatePath(`/admin/users/${delegation.managerId}`);
  return { ok: true };
}
