"use client";

import { useActionState } from "react";
import { TriangleAlert } from "lucide-react";
import { changePassword } from "@/app/actions/users";
import { useT } from "@/components/lang-provider";
import { btnPrimary, errorTextClass, helpTextClass, inputClass, inputErrorClass, labelClass } from "@/lib/ui";

/**
 * The signed-in user's own password. `hasPassword` is false for someone who has only signed in with Google so far:
 * they are not asked for a current password, because they have none.
 */
export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const t = useT();
  const [state, action, pending] = useActionState(changePassword, undefined);
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4" noValidate>
      {state?.error && (
        <p role="alert" className="flex gap-2.5 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700 ring-1 ring-red-200 ring-inset">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}

      {hasPassword && (
        <div>
          <label htmlFor="currentPassword" className={labelClass}>
            {t("รหัสผ่านปัจจุบัน", "ລະຫັດຜ່ານປັດຈຸບັນ", "Current password")}
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            className={`${inputClass} ${errors.currentPassword ? inputErrorClass : ""}`}
          />
          {errors.currentPassword && <p className={errorTextClass}>{errors.currentPassword}</p>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="newPassword" className={labelClass}>
            {t("รหัสผ่านใหม่", "ລະຫັດຜ່ານໃໝ່", "New password")}
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            maxLength={128}
            className={`${inputClass} ${errors.newPassword ? inputErrorClass : ""}`}
          />
          {errors.newPassword ? (
            <p className={errorTextClass}>{errors.newPassword}</p>
          ) : (
            <p className={helpTextClass}>{t("อย่างน้อย 8 ตัวอักษร", "ຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ", "At least 8 characters")}</p>
          )}
        </div>
        <div>
          <label htmlFor="confirmPassword" className={labelClass}>
            {t("ยืนยันรหัสผ่านใหม่", "ຢືນຢັນລະຫັດຜ່ານໃໝ່", "Confirm new password")}
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            maxLength={128}
            className={`${inputClass} ${errors.confirmPassword ? inputErrorClass : ""}`}
          />
          {errors.confirmPassword && <p className={errorTextClass}>{errors.confirmPassword}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending
            ? t("กำลังบันทึก...", "ກຳລັງບັນທຶກ...", "Saving...")
            : hasPassword
              ? t("เปลี่ยนรหัสผ่าน", "ປ່ຽນລະຫັດຜ່ານ", "Change password")
              : t("ตั้งรหัสผ่าน", "ຕັ້ງລະຫັດຜ່ານ", "Set password")}
        </button>
        {state?.ok && (
          <span role="status" className="text-sm text-emerald-700">
            {t(
              "บันทึกรหัสผ่านแล้ว อุปกรณ์อื่นถูกออกจากระบบแล้ว",
              "ບັນທຶກລະຫັດຜ່ານແລ້ວ ອຸປະກອນອື່ນຖືກອອກຈາກລະບົບແລ້ວ",
              "Password saved. You have been signed out on your other devices.",
            )}
          </span>
        )}
      </div>
    </form>
  );
}
