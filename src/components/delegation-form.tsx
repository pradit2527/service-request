"use client";

import { useActionState } from "react";
import { setDelegation } from "@/app/actions/delegation";
import { useT } from "@/components/lang-provider";
import { btnPrimary, errorTextClass, helpTextClass, inputClass, inputErrorClass, labelClass } from "@/lib/ui";

/** Names a manager to approve in place of `managerId` between two days (both included). `today` is the earliest first day. */
export function DelegationForm({
  managerId,
  candidates,
  today,
}: {
  managerId: string;
  candidates: { id: string; name: string; department: string | null }[];
  today: string;
}) {
  const t = useT();
  const [state, action, pending] = useActionState(setDelegation, undefined);
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="managerId" value={managerId} />
      {state?.error && (
        <p role="alert" className={errorTextClass}>
          {state.error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor={`delegate-${managerId}`} className={labelClass}>
            {t("ผู้แทนอนุมัติ", "ຜູ້ແທນອະນຸມັດ", "Stand-in approver")}
          </label>
          <select
            id={`delegate-${managerId}`}
            name="delegateId"
            defaultValue=""
            aria-invalid={Boolean(errors.delegateId)}
            className={`${inputClass} ${errors.delegateId ? inputErrorClass : ""}`}
          >
            <option value="">{t("— เลือกหัวหน้างาน —", "— ເລືອກຫົວໜ້າ —", "— Choose a manager —")}</option>
            {candidates.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
                {person.department ? ` (${person.department})` : ""}
              </option>
            ))}
          </select>
          {errors.delegateId && <p className={errorTextClass}>{errors.delegateId}</p>}
        </div>
        <div>
          <label htmlFor={`from-${managerId}`} className={labelClass}>
            {t("ไม่อยู่ตั้งแต่วันที่", "ບໍ່ຢູ່ຕັ້ງແຕ່ວັນທີ", "Away from")}
          </label>
          <input id={`from-${managerId}`} name="from" type="date" min={today} defaultValue={today} className={inputClass} />
        </div>
        <div>
          <label htmlFor={`to-${managerId}`} className={labelClass}>
            {t("ถึงวันที่ (รวมวันนี้)", "ຮອດວັນທີ (ລວມວັນນັ້ນ)", "Until (including this day)")}
          </label>
          <input
            id={`to-${managerId}`}
            name="to"
            type="date"
            min={today}
            defaultValue={today}
            aria-invalid={Boolean(errors.to)}
            className={`${inputClass} ${errors.to ? inputErrorClass : ""}`}
          />
          {errors.to && <p className={errorTextClass}>{errors.to}</p>}
        </div>
      </div>
      <p className={helpTextClass}>
        {t(
          "ในช่วงนี้ผู้แทนจะเห็นและพิจารณาคำขอที่ส่งถึงคุณได้ คุณเองก็ยังพิจารณาได้ตามปกติ และยกเลิกก่อนกำหนดได้ทุกเมื่อ",
          "ໃນໄລຍະນີ້ຜູ້ແທນຈະເຫັນ ແລະ ພິຈາລະນາຄຳຂໍທີ່ສົ່ງຫາທ່ານໄດ້ ທ່ານເອງກໍຍັງພິຈາລະນາໄດ້ຕາມປົກກະຕິ ແລະ ຍົກເລີກກ່ອນກຳນົດໄດ້ທຸກເມື່ອ",
          "During this time the stand-in can see and decide the requests sent to you. You can still decide them yourself, and cancel early at any time.",
        )}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || candidates.length === 0} className={btnPrimary}>
          {pending ? t("กำลังบันทึก...", "ກຳລັງບັນທຶກ...", "Saving...") : t("ตั้งผู้แทน", "ຕັ້ງຜູ້ແທນ", "Set stand-in")}
        </button>
        {candidates.length === 0 && (
          <span className="text-sm text-slate-500">
            {t("ยังไม่มีหัวหน้างานคนอื่นที่เป็นผู้แทนได้", "ຍັງບໍ່ມີຫົວໜ້າຄົນອື່ນທີ່ເປັນຜູ້ແທນໄດ້", "There is no other manager who can stand in yet")}
          </span>
        )}
        {state?.ok && (
          <span role="status" className="text-sm text-emerald-700">
            {t("ตั้งผู้แทนแล้ว", "ຕັ້ງຜູ້ແທນແລ້ວ", "Stand-in set")}
          </span>
        )}
      </div>
    </form>
  );
}
