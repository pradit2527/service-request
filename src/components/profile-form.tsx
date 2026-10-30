"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/users";
import { useT } from "@/components/lang-provider";
import { btnPrimary, errorTextClass, inputClass, inputErrorClass, labelClass } from "@/lib/ui";

export function ProfileForm({ department, phone }: { department: string; phone: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="department" className={labelClass}>
          {t("แผนก", "ພະແນກ", "Department")}
        </label>
        <input
          id="department"
          name="department"
          defaultValue={department}
          maxLength={100}
          className={`${inputClass} ${errors.department ? inputErrorClass : ""}`}
        />
        {errors.department && <p className={errorTextClass}>{errors.department}</p>}
      </div>
      <div>
        <label htmlFor="phone" className={labelClass}>
          {t("เบอร์โทรติดต่อ", "ເບີໂທຕິດຕໍ່", "Contact phone")}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={phone}
          maxLength={30}
          className={`${inputClass} ${errors.phone ? inputErrorClass : ""}`}
        />
        {errors.phone && <p className={errorTextClass}>{errors.phone}</p>}
      </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? t("กำลังบันทึก...", "ກຳລັງບັນທຶກ...", "Saving...") : t("บันทึก", "ບັນທຶກ", "Save")}
        </button>
        {state?.ok && <span className="text-sm text-emerald-700">{t("บันทึกแล้ว", "ບັນທຶກແລ້ວ", "Saved")}</span>}
      </div>
    </form>
  );
}
