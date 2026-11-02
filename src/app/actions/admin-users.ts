"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { firstIssuePerField, type ActionState } from "@/lib/action-state";
import { USER_REFERENCE_LABEL, changedFields, userDeletionBlockers, type UserReferenceCounts } from "@/lib/admin-rules";
import { writeAudit } from "@/lib/audit";
import { requireSystemManager } from "@/lib/dal";
import { db } from "@/lib/db";
import { registrationEmailAllowed } from "@/lib/env";
import type { Translate } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { ROLES } from "@/lib/labels";
import { canCreateUser, canModifyUser, type ModifyUserResult } from "@/lib/permissions";
import { safeReturn } from "@/lib/safe-return";
import { departmentField, emailField, nameField, phoneField } from "@/lib/user-fields";

function checkInputMessage(t: Translate) {
  return t("กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง", "ກະລຸນາກວດສອບຂໍ້ມູນທີ່ກອກອີກຄັ້ງ", "Please check the information you entered");
}

function emailTakenMessage(t: Translate) {
  return t("อีเมลนี้มีอยู่ในระบบแล้ว", "ອີເມວນີ້ມີຢູ່ໃນລະບົບແລ້ວ", "This email is already registered");
}

function userNotFoundMessage(t: Translate) {
  return t("ไม่พบผู้ใช้", "ບໍ່ພົບຜູ້ໃຊ້", "User not found");
}

function refusalMessage(reason: Extract<ModifyUserResult, { ok: false }>["reason"], t: Translate): string {
  switch (reason) {
    case "not-allowed":
      return t("คุณไม่มีสิทธิ์จัดการผู้ใช้", "ທ່ານບໍ່ມີສິດຈັດການຜູ້ໃຊ້", "You are not allowed to manage users");
    case "admin-protected":
      return t(
        "หัวหน้างานแก้ไขบัญชีผู้ดูแลระบบไม่ได้ ให้ผู้ดูแลระบบทำแทน",
        "ຫົວໜ້າແກ້ໄຂບັນຊີຜູ້ດູແລລະບົບບໍ່ໄດ້ ໃຫ້ຜູ້ດູແລລະບົບເຮັດແທນ",
        "A manager cannot change an administrator account. Ask an administrator",
      );
    case "admin-grant":
      return t(
        "ตั้งสิทธิ์ผู้ดูแลระบบได้เฉพาะผู้ดูแลระบบ",
        "ຕັ້ງສິດຜູ້ດູແລລະບົບໄດ້ສະເພາະຜູ້ດູແລລະບົບ",
        "Only an administrator can grant administrator access",
      );
    case "self":
      return t(
        "เปลี่ยนสิทธิ์ ปิดการใช้งาน หรือลบบัญชีของตัวเองไม่ได้ ให้ผู้ดูแลระบบคนอื่นทำแทน",
        "ປ່ຽນສິດ, ປິດການໃຊ້ງານ ຫຼື ລຶບບັນຊີຂອງຕົນເອງບໍ່ໄດ້ ໃຫ້ຜູ້ດູແລລະບົບຄົນອື່ນເຮັດແທນ",
        "You cannot change your own role or status, or delete your own account. Ask another administrator",
      );
  }
}

/** Where to go after saving: the report pop-up the form was opened from, or the user list of system management. */
function returnTarget(formData: FormData): string {
  const returnTo = formData.get("returnTo");
  return safeReturn(typeof returnTo === "string" ? returnTo : null, "/admin/users");
}

function userSchema(t: Translate) {
  return z.object({
    name: nameField(t),
    role: z.enum(ROLES, { error: t("สิทธิ์ไม่ถูกต้อง", "ສິດບໍ່ຖືກຕ້ອງ", "Invalid role") }),
    department: departmentField(t),
    phone: phoneField(t),
  });
}

function rawUserFields(formData: FormData) {
  return {
    name: formData.get("name") ?? "",
    role: formData.get("role") ?? "",
    department: formData.get("department") ?? "",
    phone: formData.get("phone") ?? "",
  };
}

/** Registers a user ahead of their first Google sign-in, which then links the account by email. */
export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const actor = await requireSystemManager();

  const parsed = userSchema(t)
    .extend({ email: emailField(t) })
    .safeParse({ ...rawUserFields(formData), email: formData.get("email") ?? "" });
  if (!parsed.success) return { error: checkInputMessage(t), fieldErrors: firstIssuePerField(parsed.error) };
  const { email, name, role, department, phone } = parsed.data;

  const fieldErrors: Record<string, string> = {};
  if (!registrationEmailAllowed(email)) {
    fieldErrors.email = t(
      "ใช้ได้เฉพาะอีเมลของบริษัทที่อนุญาตให้เข้าสู่ระบบ",
      "ໃຊ້ໄດ້ສະເພາະອີເມວຂອງບໍລິສັດທີ່ອະນຸຍາດໃຫ້ເຂົ້າສູ່ລະບົບ",
      "Only company email addresses that may sign in can be registered",
    );
  }
  if (!canCreateUser(actor, role)) fieldErrors.role = refusalMessage("admin-grant", t);
  if (Object.keys(fieldErrors).length > 0) return { error: checkInputMessage(t), fieldErrors };

  const taken = { error: checkInputMessage(t), fieldErrors: { email: emailTakenMessage(t) } };
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) return taken;

  try {
    await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { email, name, role, department: department || null, phone: phone || null },
        select: { id: true },
      });
      await writeAudit(tx, actor.id, { action: "USER_CREATED", entity: "USER", entityId: created.id, summary: `${email} (${role})` });
    });
  } catch (error) {
    // Two people registering the same address at the same moment.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return taken;
    throw error;
  }

  revalidatePath("/admin/users");
  revalidatePath("/reports", "layout");
  redirect(returnTarget(formData));
}

export async function updateUserAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const actor = await requireSystemManager();

  const parsed = userSchema(t)
    .extend({ userId: z.string().min(1) })
    .safeParse({ ...rawUserFields(formData), userId: formData.get("userId") ?? "" });
  if (!parsed.success) return { error: checkInputMessage(t), fieldErrors: firstIssuePerField(parsed.error) };
  const { userId, name, role, department, phone } = parsed.data;
  const isActive = formData.get("isActive") === "on";

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, isActive: true, department: true, phone: true },
  });
  if (!target) return { error: userNotFoundMessage(t) };

  const allowed = canModifyUser(actor, target, { role, isActive });
  if (!allowed.ok) return { error: refusalMessage(allowed.reason, t) };

  const before = { name: target.name, role: target.role, isActive: target.isActive, department: target.department ?? "", phone: target.phone ?? "" };
  const after = { name, role, isActive, department, phone };
  const changed = changedFields(before, after, ["name", "role", "isActive", "department", "phone"] as const);

  if (changed.length > 0) {
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { name, role, isActive, department: department || null, phone: phone || null },
      });
      await writeAudit(tx, actor.id, { action: "USER_UPDATED", entity: "USER", entityId: userId, summary: `${target.email}: ${changed.join(", ")}` });
    });
  }

  revalidatePath("/admin/users");
  revalidatePath("/reports", "layout");
  redirect(returnTarget(formData));
}

export async function deleteUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const actor = await requireSystemManager();
  const userId = String(formData.get("userId") ?? "");

  const target = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      _count: {
        select: {
          requests: true,
          comments: true,
          events: true,
          articles: true,
          assignedRequests: true,
          approvalRequests: true,
          decidedRequests: true,
          deletedRequests: true,
          auditLogs: true,
        },
      },
    },
  });
  if (!target) return { error: userNotFoundMessage(t) };

  const allowed = canModifyUser(actor, target, { delete: true });
  if (!allowed.ok) return { error: refusalMessage(allowed.reason, t) };

  const counts: UserReferenceCounts = {
    requests: target._count.requests,
    comments: target._count.comments,
    events: target._count.events,
    articles: target._count.articles,
    assigned: target._count.assignedRequests,
    approvals: target._count.approvalRequests,
    decided: target._count.decidedRequests,
    deleted: target._count.deletedRequests,
    audits: target._count.auditLogs,
  };
  const blockers = userDeletionBlockers(counts);
  if (blockers.length > 0) {
    const list = blockers.map((key) => `${t(USER_REFERENCE_LABEL[key])} ${counts[key]}`).join(", ");
    return {
      error: t(
        `ผู้ใช้นี้มีประวัติการใช้งาน ให้ปิดการใช้งานแทน (${list})`,
        `ຜູ້ໃຊ້ນີ້ມີປະຫວັດການໃຊ້ງານ ໃຫ້ປິດການໃຊ້ງານແທນ (${list})`,
        `This user has history, so deactivate them instead (${list})`,
      ),
    };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.user.delete({ where: { id: userId } });
      await writeAudit(tx, actor.id, { action: "USER_DELETED", entity: "USER", entityId: userId, summary: `${target.email} (${target.role})` });
    });
  } catch (error) {
    // The user was removed, or got some history, between the check above and the delete.
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2025" || error.code === "P2003")) {
      return {
        error: t(
          "ลบผู้ใช้ไม่สำเร็จ ข้อมูลเปลี่ยนไปแล้ว กรุณารีเฟรชหน้าแล้วลองใหม่",
          "ລຶບຜູ້ໃຊ້ບໍ່ສຳເລັດ ຂໍ້ມູນປ່ຽນໄປແລ້ວ ກະລຸນາໂຫຼດໜ້າໃໝ່ ແລ້ວລອງອີກຄັ້ງ",
          "Could not delete the user because the data changed. Refresh the page and try again",
        ),
      };
    }
    throw error;
  }

  revalidatePath("/admin/users");
  revalidatePath("/reports", "layout");
  redirect(returnTarget(formData));
}
