"use client";

import { useActionState } from "react";
import { Check, X } from "lucide-react";
import { decideByManager } from "@/app/actions/requests";
import { useT } from "@/components/lang-provider";
import { cardClass, errorTextClass, inputClass, inputErrorClass, labelClass } from "@/lib/ui";

// Shown only to the manager the requester picked, while the request waits for approval.
export function ManagerDecision({ requestId }: { requestId: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(decideByManager, undefined);
  const noteError = state?.fieldErrors?.note;

  return (
    <section className={`${cardClass} border-indigo-200 bg-indigo-50/40 p-4`}>
      <h2 className="font-semibold text-slate-900">{t("รอการอนุมัติของคุณ", "ລໍຖ້າການອະນຸມັດຂອງທ່ານ", "Waiting for your approval")}</h2>
      <p className="mt-1 text-xs text-slate-500">
        {t(
          "เมื่ออนุมัติ คำขอจะเข้าคิวทีม IT ดำเนินการต่อ หากไม่อนุมัติโปรดระบุเหตุผลให้ผู้ขอทราบ",
          "ເມື່ອອະນຸມັດ ຄຳຂໍຈະເຂົ້າຄິວທີມ IT ເພື່ອດຳເນີນການຕໍ່ ຖ້າບໍ່ອະນຸມັດ ກະລຸນາລະບຸເຫດຜົນໃຫ້ຜູ້ຂໍຮູ້",
          "Once approved, the request goes to the IT team's queue. If you reject it, please give the requester a reason.",
        )}
      </p>

      <form action={action} className="mt-4 space-y-3">
        <input type="hidden" name="requestId" value={requestId} />
        <div>
          <label htmlFor="manager-note" className={labelClass}>
            {t("ข้อความถึงผู้ขอ", "ຂໍ້ຄວາມເຖິງຜູ້ຂໍ", "Message to the requester")}
          </label>
          <textarea
            id="manager-note"
            name="note"
            rows={3}
            maxLength={2000}
            placeholder={t("ไม่บังคับ (บังคับเมื่อไม่อนุมัติ)", "ບໍ່ບັງຄັບ (ບັງຄັບເມື່ອບໍ່ອະນຸມັດ)", "Optional (required when rejecting)")}
            aria-invalid={Boolean(noteError)}
            className={`${inputClass} ${noteError ? inputErrorClass : ""}`}
          />
          {noteError && <p className={errorTextClass}>{noteError}</p>}
        </div>
        {state?.error && (
          <p role="alert" className={errorTextClass}>
            {state.error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="submit"
            name="decision"
            value="reject"
            disabled={pending}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-red-600 ring-1 ring-red-200 transition ring-inset hover:bg-red-50 disabled:opacity-60"
          >
            <X className="h-4 w-4" aria-hidden />
            {t("ไม่อนุมัติ", "ບໍ່ອະນຸມັດ", "Reject")}
          </button>
          <button
            type="submit"
            name="decision"
            value="approve"
            disabled={pending}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 px-3 py-2.5 text-sm font-medium text-white shadow-md shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60"
          >
            <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            {pending ? t("กำลังบันทึก...", "ກຳລັງບັນທຶກ...", "Saving...") : t("อนุมัติ", "ອະນຸມັດ", "Approve")}
          </button>
        </div>
      </form>
    </section>
  );
}
