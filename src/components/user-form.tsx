"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createUser, updateUserAdmin } from "@/app/actions/admin-users";
import { useT } from "@/components/lang-provider";
import { ROLES, ROLE_LABEL, type Role } from "@/lib/labels";
import { submitWithoutReset } from "@/lib/submit-without-reset";
import { btnPrimary, btnSecondary, cardClass, errorTextClass, helpTextClass, inputClass, inputErrorClass, labelClass } from "@/lib/ui";

export type UserFormInitial = {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string;
  phone: string;
  isActive: boolean;
};

/**
 * Adds a user (`create`) or edits one (`edit`).
 * - `canGrantAdmin`: whether the administrator role is offered (only administrators can hand it out).
 * - `lockRoleAndStatus`: editing yourself, so role and active status are shown but cannot be changed.
 * - `readOnly`: a manager looking at an administrator account.
 * - `inAdminEmails`: the address is in ADMIN_EMAILS, which makes it an administrator again at every sign-in.
 */
export function UserForm({
  mode,
  initial,
  canGrantAdmin,
  lockRoleAndStatus = false,
  readOnly = false,
  inAdminEmails = false,
}: {
  mode: "create" | "edit";
  initial?: UserFormInitial;
  canGrantAdmin: boolean;
  lockRoleAndStatus?: boolean;
  readOnly?: boolean;
  inAdminEmails?: boolean;
}) {
  const t = useT();
  const [state, action, pending] = useActionState(mode === "create" ? createUser : updateUserAdmin, undefined);
  const errors = state?.fieldErrors ?? {};
  const roleLocked = readOnly || lockRoleAndStatus;
  const roles = ROLES.filter((role) => role !== "ADMIN" || canGrantAdmin || initial?.role === "ADMIN");
  const checkbox = "h-4 w-4 rounded border-slate-300 accent-indigo-600 disabled:opacity-50";

  return (
    <form onSubmit={submitWithoutReset(action)} className={`${cardClass} space-y-6 p-5 sm:p-8`} noValidate>
      {initial && <input type="hidden" name="userId" value={initial.id} />}
      {/* Disabled controls are not submitted, so a hidden copy keeps the values the server validates. */}
      {lockRoleAndStatus && initial && (
        <>
          <input type="hidden" name="role" value={initial.role} />
          {initial.isActive && <input type="hidden" name="isActive" value="on" />}
        </>
      )}

      {readOnly && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200 ring-inset">
          {t(
            "หัวหน้างานแก้ไขบัญชีผู้ดูแลระบบไม่ได้ ให้ผู้ดูแลระบบทำแทน",
            "ຫົວໜ້າແກ້ໄຂບັນຊີຜູ້ດູແລລະບົບບໍ່ໄດ້ ໃຫ້ຜູ້ດູແລລະບົບເຮັດແທນ",
            "A manager cannot change an administrator account. Ask an administrator.",
          )}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={labelClass}>
            {t("อีเมล", "ອີເມວ", "Email")}
          </label>
          {mode === "create" ? (
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="off"
              required
              className={`${inputClass} ${errors.email ? inputErrorClass : ""}`}
            />
          ) : (
            <input id="email" value={initial?.email ?? ""} disabled className={inputClass} readOnly />
          )}
          {errors.email ? (
            <p className={errorTextClass}>{errors.email}</p>
          ) : (
            mode === "create" && (
              <p className={helpTextClass}>
                {t(
                  "ผู้ใช้จะผูกกับบัญชี Google อัตโนมัติเมื่อเข้าสู่ระบบครั้งแรกด้วยอีเมลนี้",
                  "ຜູ້ໃຊ້ຈະຜູກກັບບັນຊີ Google ອັດຕະໂນມັດເມື່ອເຂົ້າສູ່ລະບົບຄັ້ງທຳອິດດ້ວຍອີເມວນີ້",
                  "The user is linked to their Google account automatically the first time they sign in with this email.",
                )}
              </p>
            )
          )}
        </div>

        <div>
          <label htmlFor="name" className={labelClass}>
            {t("ชื่อ", "ຊື່", "Name")}
          </label>
          <input
            id="name"
            name="name"
            defaultValue={initial?.name}
            maxLength={100}
            required
            disabled={readOnly}
            className={`${inputClass} ${errors.name ? inputErrorClass : ""}`}
          />
          {errors.name && <p className={errorTextClass}>{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="role" className={labelClass}>
            {t("สิทธิ์", "ສິດ", "Role")}
          </label>
          <select
            id="role"
            name={roleLocked ? undefined : "role"}
            defaultValue={initial?.role ?? "EMPLOYEE"}
            disabled={roleLocked}
            className={`${inputClass} ${errors.role ? inputErrorClass : ""}`}
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {t(ROLE_LABEL[role])}
              </option>
            ))}
          </select>
          {errors.role && <p className={errorTextClass}>{errors.role}</p>}
          {lockRoleAndStatus && (
            <p className={helpTextClass}>
              {t(
                "เปลี่ยนสิทธิ์หรือปิดการใช้งานบัญชีของตัวเองไม่ได้ ให้ผู้ดูแลระบบคนอื่นทำแทน",
                "ປ່ຽນສິດ ຫຼື ປິດການໃຊ້ງານບັນຊີຂອງຕົນເອງບໍ່ໄດ້ ໃຫ້ຜູ້ດູແລລະບົບຄົນອື່ນເຮັດແທນ",
                "You cannot change your own role or deactivate your own account. Ask another administrator.",
              )}
            </p>
          )}
          {inAdminEmails && (
            <p className={helpTextClass}>
              {t(
                "อีเมลนี้อยู่ใน ADMIN_EMAILS จึงถูกตั้งเป็นผู้ดูแลระบบทุกครั้งที่เข้าสู่ระบบ หากต้องการลดสิทธิ์ ให้เอาอีเมลออกจาก ADMIN_EMAILS ก่อน",
                "ອີເມວນີ້ຢູ່ໃນ ADMIN_EMAILS ຈຶ່ງຖືກຕັ້ງເປັນຜູ້ດູແລລະບົບທຸກຄັ້ງທີ່ເຂົ້າສູ່ລະບົບ ຖ້າຕ້ອງການຫຼຸດສິດ ໃຫ້ເອົາອີເມວອອກຈາກ ADMIN_EMAILS ກ່ອນ",
                "This email is listed in ADMIN_EMAILS, so it becomes an administrator again at every sign-in. To lower the role, remove the email from ADMIN_EMAILS first.",
              )}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="department" className={labelClass}>
            {t("แผนก", "ພະແນກ", "Department")}
          </label>
          <input
            id="department"
            name="department"
            defaultValue={initial?.department}
            maxLength={100}
            disabled={readOnly}
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
            defaultValue={initial?.phone}
            maxLength={30}
            disabled={readOnly}
            className={`${inputClass} ${errors.phone ? inputErrorClass : ""}`}
          />
          {errors.phone && <p className={errorTextClass}>{errors.phone}</p>}
        </div>

        {mode === "edit" && (
          <div className="flex items-end pb-2.5">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name={roleLocked ? undefined : "isActive"}
                defaultChecked={initial?.isActive}
                disabled={roleLocked}
                className={checkbox}
              />
              {t("ใช้งานอยู่", "ໃຊ້ງານຢູ່", "Active")}
            </label>
          </div>
        )}
      </div>

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200 ring-inset">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {!readOnly && (
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending
              ? t("กำลังบันทึก...", "ກຳລັງບັນທຶກ...", "Saving...")
              : mode === "create"
                ? t("เพิ่มผู้ใช้", "ເພີ່ມຜູ້ໃຊ້", "Add user")
                : t("บันทึก", "ບັນທຶກ", "Save")}
          </button>
        )}
        <Link href="/admin/users" className={btnSecondary}>
          {readOnly ? t("กลับ", "ກັບຄືນ", "Back") : t("ยกเลิก", "ຍົກເລີກ", "Cancel")}
        </Link>
      </div>
    </form>
  );
}
