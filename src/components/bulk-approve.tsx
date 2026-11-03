"use client";

import { useActionState, useRef, useState } from "react";
import { Check } from "lucide-react";
import { approveMany } from "@/app/actions/requests";
import { useT } from "@/components/lang-provider";
import { btnPrimary, errorTextClass, inputClass, inputErrorClass } from "@/lib/ui";

/**
 * Wraps the cards of the approvals page in one form. Each card holds a checkbox named "requestId"; this adds the bar
 * with "select all", an optional message to the requesters, and the button that approves the ticked requests.
 */
export function BulkApprove({ children, total }: { children: React.ReactNode; total: number }) {
  const t = useT();
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(approveMany, undefined);
  const [selected, setSelected] = useState(0);
  const noteError = state?.fieldErrors?.note;

  const boxes = () => Array.from(form.current?.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name="requestId"]') ?? []);
  const recount = () => setSelected(boxes().filter((box) => box.checked).length);

  function toggleAll(checked: boolean) {
    for (const box of boxes()) box.checked = checked;
    recount();
  }

  return (
    <form
      ref={form}
      action={(formData) => {
        action(formData);
        // The list is re-rendered without the approved requests; untick what is left and start the count again.
        for (const box of boxes()) box.checked = false;
        setSelected(0);
      }}
      onChange={(event) => {
        if ((event.target as unknown as HTMLInputElement).name === "requestId") recount();
      }}
      className="space-y-4"
    >
      <div className="sticky top-2 z-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-card backdrop-blur sm:p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-emerald-600"
              checked={selected > 0 && selected === total}
              ref={(el) => {
                if (el) el.indeterminate = selected > 0 && selected < total;
              }}
              onChange={(event) => toggleAll(event.target.checked)}
            />
            {t("เลือกทั้งหมด", "ເລືອກທັງໝົດ", "Select all")}
          </label>
          <span className="text-sm text-slate-500" aria-live="polite">
            {t(`เลือกแล้ว ${selected} จาก ${total} รายการ`, `ເລືອກແລ້ວ ${selected} ຈາກ ${total} ລາຍການ`, `${selected} of ${total} selected`)}
          </span>

          <div className="ml-auto flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:flex-none">
            <input
              name="note"
              maxLength={2000}
              aria-label={t("ข้อความถึงผู้ขอ (ไม่บังคับ)", "ຂໍ້ຄວາມເຖິງຜູ້ຂໍ (ບໍ່ບັງຄັບ)", "Message to the requesters (optional)")}
              placeholder={t("ข้อความถึงผู้ขอ (ไม่บังคับ)", "ຂໍ້ຄວາມເຖິງຜູ້ຂໍ (ບໍ່ບັງຄັບ)", "Message to the requesters (optional)")}
              className={`${inputClass} min-w-0 flex-1 sm:w-64 sm:flex-none ${noteError ? inputErrorClass : ""}`}
            />
            <button type="submit" disabled={pending || selected === 0} className={btnPrimary}>
              <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              {pending
                ? t("กำลังอนุมัติ...", "ກຳລັງອະນຸມັດ...", "Approving...")
                : t(`อนุมัติที่เลือก (${selected})`, `ອະນຸມັດທີ່ເລືອກ (${selected})`, `Approve selected (${selected})`)}
            </button>
          </div>
        </div>
        {noteError && <p className={errorTextClass}>{noteError}</p>}
        {state?.error && (
          <p role="alert" className={errorTextClass}>
            {state.error}
          </p>
        )}
        {state?.ok && state.info && (
          <p role="status" className="mt-2 text-sm font-medium text-emerald-700">
            {state.info}
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          {t(
            "อนุมัติหลายรายการได้เฉพาะ “อนุมัติ” ถ้าจะไม่อนุมัติหรือขอข้อมูลเพิ่ม ให้เปิดคำขอนั้นแล้วทำทีละรายการ เพราะต้องระบุเหตุผล",
            "ອະນຸມັດຫຼາຍລາຍການໄດ້ສະເພາະ “ອະນຸມັດ” ຖ້າຈະບໍ່ອະນຸມັດ ຫຼື ຂໍຂໍ້ມູນເພີ່ມ ໃຫ້ເປີດຄຳຂໍນັ້ນແລ້ວເຮັດເທື່ອລະລາຍການ ເພາະຕ້ອງລະບຸເຫດຜົນ",
            "Only “Approve” works on several at once. To reject or ask for more information, open the request and do it one at a time, because it needs a reason.",
          )}
        </p>
      </div>
      {children}
    </form>
  );
}
