"use client";

import { useActionState } from "react";
import { updateUser } from "@/app/actions/users";
import { useT } from "@/components/lang-provider";
import { ROLES, ROLE_LABEL } from "@/lib/labels";
import { btnSecondary, errorTextClass, inputClass } from "@/lib/ui";
import { Avatar } from "./avatar";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  role: (typeof ROLES)[number];
  isActive: boolean;
  lastLoginAt: string | null;
};

export function UserAdminRow({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const t = useT();
  const [state, action, pending] = useActionState(updateUser, undefined);
  const checkbox = "h-4 w-4 rounded border-slate-300 accent-indigo-600 disabled:opacity-50";
  const lastLogin = user.lastLoginAt ?? t("ยังไม่เคย", "ຍັງບໍ່ເຄີຍ", "never");

  return (
    <li className="px-4 py-3.5 sm:px-5">
      <form action={action} className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <input type="hidden" name="userId" value={user.id} />
        {/* Disabled controls are not submitted, so a hidden copy keeps the role for the server's validation. */}
        {isSelf && <input type="hidden" name="role" value={user.role} />}

        <div className="flex min-w-0 flex-1 basis-60 items-center gap-3">
          <Avatar name={user.name} size="md" />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-medium text-slate-900">
              {user.name}
              {isSelf && <span className="ml-2 text-xs font-normal text-slate-500">{t("(คุณ)", "(ທ່ານ)", "(you)")}</span>}
            </p>
            <p className="truncate text-xs text-slate-500">
              {user.email}
              {user.department ? ` · ${user.department}` : ""}
            </p>
            <p className="text-xs text-slate-400">
              {t(`เข้าสู่ระบบล่าสุด ${lastLogin}`, `ເຂົ້າສູ່ລະບົບຫຼ້າສຸດ ${lastLogin}`, `Last sign-in: ${lastLogin}`)}
            </p>
          </div>
        </div>

        <label className="sr-only" htmlFor={`role-${user.id}`}>
          {t(`สิทธิ์ของ ${user.name}`, `ສິດຂອງ ${user.name}`, `Role of ${user.name}`)}
        </label>
        <select id={`role-${user.id}`} name={isSelf ? undefined : "role"} defaultValue={user.role} disabled={isSelf} className={`${inputClass} w-48!`}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {t(ROLE_LABEL[r])}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="isActive" defaultChecked={user.isActive} disabled={isSelf} className={checkbox} />
          {t("ใช้งานอยู่", "ໃຊ້ງານຢູ່", "Active")}
        </label>

        <button type="submit" disabled={pending || isSelf} className={btnSecondary}>
          {pending ? t("กำลังบันทึก...", "ກຳລັງບັນທຶກ...", "Saving...") : t("บันทึก", "ບັນທຶກ", "Save")}
        </button>
      </form>
      {state?.error && (
        <p role="alert" className={errorTextClass}>
          {state.error}
        </p>
      )}
      {state?.ok && <p className="mt-1.5 text-xs font-medium text-emerald-700">{t("บันทึกแล้ว", "ບັນທຶກແລ້ວ", "Saved")}</p>}
    </li>
  );
}
