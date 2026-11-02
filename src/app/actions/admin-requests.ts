"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { firstIssuePerField, type ActionState } from "@/lib/action-state";
import { EDITABLE_REQUEST_FIELDS, changedFields } from "@/lib/admin-rules";
import { requireSystemManager } from "@/lib/dal";
import { db } from "@/lib/db";
import type { Translate } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { PRIORITIES } from "@/lib/labels";
import { canEditRequest } from "@/lib/permissions";

function notFoundMessage(t: Translate) {
  return t("ไม่พบคำขอ", "ບໍ່ພົບຄຳຂໍ", "Request not found");
}

function revalidateRequest(requestId: string) {
  revalidatePath("/admin/requests");
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/requests");
  revalidatePath("/approvals");
  revalidatePath("/");
}

function editSchema(t: Translate) {
  return z.object({
    requestId: z.string().min(1),
    title: z
      .string()
      .trim()
      .min(3, { error: t("หัวข้อต้องมีอย่างน้อย 3 ตัวอักษร", "ຫົວຂໍ້ຕ້ອງມີຢ່າງໜ້ອຍ 3 ຕົວອັກສອນ", "Subject must be at least 3 characters") })
      .max(150, { error: t("หัวข้อยาวเกิน 150 ตัวอักษร", "ຫົວຂໍ້ຍາວເກີນ 150 ຕົວອັກສອນ", "Subject must be 150 characters or fewer") }),
    description: z
      .string()
      .trim()
      .min(10, { error: t("เหตุผลต้องมีอย่างน้อย 10 ตัวอักษร", "ເຫດຜົນຕ້ອງມີຢ່າງໜ້ອຍ 10 ຕົວອັກສອນ", "Reason must be at least 10 characters") })
      .max(5000, { error: t("เหตุผลยาวเกิน 5,000 ตัวอักษร", "ເຫດຜົນຍາວເກີນ 5,000 ຕົວອັກສອນ", "Reason must be 5,000 characters or fewer") }),
    priority: z.enum(PRIORITIES, { error: t("ความสำคัญไม่ถูกต้อง", "ຄວາມສຳຄັນບໍ່ຖືກຕ້ອງ", "Invalid priority") }),
    neededBy: z
      .string()
      .trim()
      .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), {
        error: t("วันที่ไม่ถูกต้อง", "ວັນທີບໍ່ຖືກຕ້ອງ", "Invalid date"),
      }),
    requestedForName: z
      .string()
      .trim()
      .max(150, { error: t("ชื่อยาวเกิน 150 ตัวอักษร", "ຊື່ຍາວເກີນ 150 ຕົວອັກສອນ", "Name must be 150 characters or fewer") }),
    approverId: z.string().trim(),
  });
}

/**
 * Edits the details of a request. The type, the type-specific details, the status and the SLA are not changed
 * here (they follow the workflow on the request page). The approver can change only while it awaits approval.
 */
export async function updateRequestByAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const actor = await requireSystemManager();

  const parsed = editSchema(t).safeParse({
    requestId: formData.get("requestId") ?? "",
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    priority: formData.get("priority") ?? "",
    neededBy: formData.get("neededBy") ?? "",
    requestedForName: formData.get("requestedForName") ?? "",
    approverId: formData.get("approverId") ?? "",
  });
  if (!parsed.success) {
    return {
      error: t("กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง", "ກະລຸນາກວດສອບຂໍ້ມູນທີ່ກອກອີກຄັ້ງ", "Please check the information you entered"),
      fieldErrors: firstIssuePerField(parsed.error),
    };
  }
  const { requestId, title, description, priority, neededBy, requestedForName, approverId } = parsed.data;

  const request = await db.serviceRequest.findFirst({
    where: { id: requestId, deletedAt: null },
    select: {
      id: true,
      status: true,
      requesterId: true,
      title: true,
      description: true,
      priority: true,
      neededBy: true,
      requestedForName: true,
      approverId: true,
      deletedAt: true,
      approver: { select: { name: true } },
    },
  });
  if (!request || !canEditRequest(actor, request)) return { error: notFoundMessage(t) };

  let newApprover: { id: string; name: string } | null = null;
  if (request.status === "PENDING_APPROVAL" && approverId && approverId !== request.approverId) {
    newApprover = await db.user.findFirst({
      where: { id: approverId, isActive: true, role: "MANAGER", NOT: { id: request.requesterId } },
      select: { id: true, name: true },
    });
    if (!newApprover) {
      return {
        error: t("กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง", "ກະລຸນາກວດສອບຂໍ້ມູນທີ່ກອກອີກຄັ້ງ", "Please check the information you entered"),
        fieldErrors: { approverId: t("กรุณาเลือกหัวหน้างานผู้อนุมัติ", "ກະລຸນາເລືອກຫົວໜ້າງານຜູ້ອະນຸມັດ", "Please select an approving manager") },
      };
    }
  }

  const before = {
    title: request.title,
    description: request.description,
    priority: request.priority,
    neededBy: request.neededBy ? request.neededBy.toISOString().slice(0, 10) : "",
    requestedForName: request.requestedForName ?? "",
  };
  const after = { title, description, priority, neededBy, requestedForName };
  const changed = changedFields(before, after, EDITABLE_REQUEST_FIELDS);

  if (changed.length > 0 || newApprover) {
    await db.$transaction(async (tx) => {
      await tx.serviceRequest.update({
        where: { id: requestId },
        data: {
          title,
          description,
          priority,
          neededBy: new Date(`${neededBy}T00:00:00Z`),
          requestedForName: requestedForName || null,
          ...(newApprover ? { approverId: newApprover.id } : {}),
        },
      });
      if (changed.length > 0) {
        await tx.requestEvent.create({ data: { requestId, actorId: actor.id, action: "EDITED", toValue: changed.join(",") } });
      }
      if (newApprover) {
        await tx.requestEvent.create({
          data: { requestId, actorId: actor.id, action: "APPROVER_CHANGED", fromValue: request.approver?.name ?? null, toValue: newApprover.name },
        });
      }
    });
  }

  revalidateRequest(requestId);
  redirect("/admin/requests");
}

/** Soft delete: the request is hidden everywhere except system management, where it can be restored. */
export async function deleteRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const actor = await requireSystemManager();
  const requestId = String(formData.get("requestId") ?? "");

  const outcome = await db.$transaction(async (tx) => {
    const updated = await tx.serviceRequest.updateMany({
      where: { id: requestId, deletedAt: null },
      data: { deletedAt: new Date(), deletedById: actor.id },
    });
    if (updated.count === 1) {
      await tx.requestEvent.create({ data: { requestId, actorId: actor.id, action: "DELETED" } });
      return "deleted" as const;
    }
    // Nothing changed: it is either already deleted (pressed twice) or does not exist.
    return (await tx.serviceRequest.count({ where: { id: requestId } })) > 0 ? ("already" as const) : ("missing" as const);
  });

  if (outcome === "missing") return { error: notFoundMessage(t) };
  revalidateRequest(requestId);
  return { ok: true };
}

export async function restoreRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const actor = await requireSystemManager();
  const requestId = String(formData.get("requestId") ?? "");

  const outcome = await db.$transaction(async (tx) => {
    const updated = await tx.serviceRequest.updateMany({
      where: { id: requestId, deletedAt: { not: null } },
      data: { deletedAt: null, deletedById: null },
    });
    if (updated.count === 1) {
      await tx.requestEvent.create({ data: { requestId, actorId: actor.id, action: "RESTORED" } });
      return "restored" as const;
    }
    return (await tx.serviceRequest.count({ where: { id: requestId } })) > 0 ? ("already" as const) : ("missing" as const);
  });

  if (outcome === "missing") return { error: notFoundMessage(t) };
  revalidateRequest(requestId);
  return { ok: true };
}
