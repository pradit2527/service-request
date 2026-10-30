"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { requireAdmin, requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import type { Translate } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { ROLES } from "@/lib/labels";

function updateUserSchema(t: Translate) {
  return z.object({
    userId: z.string().min(1),
    role: z.enum(ROLES, { error: t("สิทธิ์ไม่ถูกต้อง", "ສິດບໍ່ຖືກຕ້ອງ", "Invalid role") }),
  });
}

export async function updateUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const admin = await requireAdmin();

  const parsed = updateUserSchema(t).safeParse({
    userId: formData.get("userId") ?? "",
    role: formData.get("role") ?? "",
  });
  if (!parsed.success) return { error: t("ข้อมูลไม่ถูกต้อง", "ຂໍ້ມູນບໍ່ຖືກຕ້ອງ", "Invalid data") };
  const { userId } = parsed.data;

  const target = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return { error: t("ไม่พบผู้ใช้", "ບໍ່ພົບຜູ້ໃຊ້", "User not found") };

  // An admin cannot lock themselves out: their own role and active flag stay as they are
  // (another admin has to change them).
  if (userId === admin.id) {
    return {
      error: t(
        "เปลี่ยนสิทธิ์หรือปิดการใช้งานบัญชีของตัวเองไม่ได้ ให้ผู้ดูแลระบบคนอื่นทำแทน",
        "ປ່ຽນສິດ ຫຼື ປິດການໃຊ້ງານບັນຊີຂອງຕົນເອງບໍ່ໄດ້ ໃຫ້ຜູ້ດູແລລະບົບຄົນອື່ນເຮັດແທນ",
        "You cannot change your own role or deactivate your own account. Ask another admin to do it",
      ),
    };
  }
  await db.user.update({
    where: { id: userId },
    data: { role: parsed.data.role, isActive: formData.get("isActive") === "on" },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

function profileSchema(t: Translate) {
  return z.object({
    department: z
      .string()
      .trim()
      .max(100, { error: t("ชื่อแผนกยาวเกิน 100 ตัวอักษร", "ຊື່ພະແນກຍາວເກີນ 100 ຕົວອັກສອນ", "Department name must be 100 characters or fewer") }),
    phone: z
      .string()
      .trim()
      .max(30, { error: t("เบอร์โทรยาวเกิน 30 ตัวอักษร", "ເບີໂທຍາວເກີນ 30 ຕົວອັກສອນ", "Phone number must be 30 characters or fewer") })
      .refine((v) => v === "" || /^[0-9+\-()\s#.]+$/.test(v), {
        error: t("เบอร์โทรมีอักขระที่ไม่ถูกต้อง", "ເບີໂທມີຕົວອັກສອນທີ່ບໍ່ຖືກຕ້ອງ", "Phone number contains invalid characters"),
      }),
  });
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const user = await requireUser();

  const parsed = profileSchema(t).safeParse({
    department: formData.get("department") ?? "",
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }

  await db.user.update({
    where: { id: user.id },
    data: { department: parsed.data.department || null, phone: parsed.data.phone || null },
  });

  revalidatePath("/profile");
  return { ok: true };
}
