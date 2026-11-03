"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { writeAudit } from "@/lib/audit";
import { requireSignedInUser } from "@/lib/dal";
import { db } from "@/lib/db";
import type { Translate } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { lockedMessage } from "@/lib/login-messages";
import { afterFailedLogin, isLocked, lockMinutesLeft } from "@/lib/login-rules";
import { hashPassword, verifyPassword } from "@/lib/password-hash";
import { createSession } from "@/lib/session";
import { departmentField, passwordField, phoneField } from "@/lib/user-fields";

// Role changes and user management live in admin-users.ts; this file is the signed-in user's own profile.
// These actions use requireSignedInUser(), not requireUser(): someone who must still replace a temporary password
// is sent to this page, and has to be able to use it.

function profileSchema(t: Translate) {
  return z.object({ department: departmentField(t), phone: phoneField(t) });
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const user = await requireSignedInUser();

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

/**
 * Sets the signed-in user's own password. Someone who already has one must give it first (a stolen session alone is not
 * enough to take the account over); someone who signs in with Google and has none yet can simply set one.
 * Every other session of the account ends, and the one that made the change stays signed in.
 */
export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const user = await requireSignedInUser();

  const current = String(formData.get("currentPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  const parsed = passwordField(t).safeParse(String(formData.get("newPassword") ?? ""));

  const row = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true, failedLoginCount: true, lockedUntil: true } });
  if (!row) return { error: t("ไม่พบผู้ใช้", "ບໍ່ພົບຜູ້ໃຊ້", "User not found") };

  const now = new Date();
  if (row.passwordHash && row.lockedUntil && isLocked(row.lockedUntil, now)) {
    return { error: lockedMessage(t, lockMinutesLeft(row.lockedUntil, now)) };
  }

  const fieldErrors: Record<string, string> = {};
  if (row.passwordHash && current === "") {
    fieldErrors.currentPassword = t("กรุณาใส่รหัสผ่านปัจจุบัน", "ກະລຸນາໃສ່ລະຫັດຜ່ານປັດຈຸບັນ", "Please enter your current password");
  }
  if (!parsed.success) {
    fieldErrors.newPassword = parsed.error.issues[0].message;
  } else if (parsed.data !== confirm) {
    fieldErrors.confirmPassword = t("รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน", "ລະຫັດຜ່ານໃໝ່ທັງສອງຊ່ອງບໍ່ກົງກັນ", "The two new passwords do not match");
  }
  if (!parsed.success || Object.keys(fieldErrors).length > 0) return { fieldErrors };

  if (row.passwordHash) {
    if (!(await verifyPassword(current, row.passwordHash))) {
      await db.user.update({ where: { id: user.id }, data: afterFailedLogin(row.failedLoginCount, now) });
      return { fieldErrors: { currentPassword: t("รหัสผ่านปัจจุบันไม่ถูกต้อง", "ລະຫັດຜ່ານປັດຈຸບັນບໍ່ຖືກຕ້ອງ", "Your current password is incorrect") } };
    }
    if (current === parsed.data) {
      return {
        fieldErrors: {
          newPassword: t("รหัสผ่านใหม่ต้องไม่เหมือนรหัสเดิม", "ລະຫັດຜ່ານໃໝ່ຕ້ອງບໍ່ຄືລະຫັດເກົ່າ", "The new password must be different from the current one"),
        },
      };
    }
  }

  const passwordHash = await hashPassword(parsed.data);
  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false, passwordChangedAt: now, failedLoginCount: 0, lockedUntil: null },
    });
    await writeAudit(tx, user.id, { action: "PASSWORD_CHANGED", entity: "USER", entityId: user.id, summary: user.email });
  });

  // A fresh session for this browser: the change just ended every older one.
  await createSession(user.id);
  revalidatePath("/profile");
  return { ok: true };
}
