"use client";

import { useActionState } from "react";
import { Check, MessageCircleQuestion, UserCog, X } from "lucide-react";
import { decideByManager } from "@/app/actions/requests";
import { useT } from "@/components/lang-provider";
import { btnSecondary, cardClass, errorTextClass, inputClass, inputErrorClass, labelClass } from "@/lib/ui";

/**
 * Shown to the manager the requester picked, and to the manager standing in for them, while the request waits for
 * approval. `standingInFor` is the name of the manager who is away (when this is a stand-in), and `waitingForRequester`
 * says the approver has already asked the requester for more information and has no answer yet.
 */
export function ManagerDecision({
  requestId,
  standingInFor = null,
  waitingForRequester = false,
}: {
  requestId: string;
  standingInFor?: string | null;
  waitingForRequester?: boolean;
}) {
  const t = useT();
  const [state, action, pending] = useActionState(decideByManager, undefined);
  const noteError = state?.fieldErrors?.note;

  return (
    <section className={`${cardClass} border-indigo-200 bg-indigo-50/40 p-4`}>
      <h2 className="font-semibold text-slate-900">{t("รอการอนุมัติของคุณ", "ລໍຖ້າການອະນຸມັດຂອງທ່ານ", "Waiting for your approval")}</h2>
      {standingInFor && (
        <p className="mt-2 flex gap-2 rounded-lg bg-indigo-100 px-2.5 py-2 text-xs text-indigo-800">
          <UserCog className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {t(
            `คุณพิจารณาแทน ${standingInFor} ซึ่งไม่อยู่ในขณะนี้`,
            `ທ່ານພິຈາລະນາແທນ ${standingInFor} ທີ່ບໍ່ຢູ່ໃນຂະນະນີ້`,
            `You are deciding in place of ${standingInFor}, who is away`,
          )}
        </p>
      )}
      {waitingForRequester && (
        <p className="mt-2 flex gap-2 rounded-lg bg-amber-100 px-2.5 py-2 text-xs text-amber-800">
          <MessageCircleQuestion className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {t(
            "ขอข้อมูลเพิ่มจากผู้ขอแล้ว รอคำตอบ (ยังอนุมัติหรือไม่อนุมัติได้เลย)",
            "ຂໍຂໍ້ມູນເພີ່ມຈາກຜູ້ຂໍແລ້ວ ລໍຖ້າຄຳຕອບ (ຍັງອະນຸມັດ ຫຼື ບໍ່ອະນຸມັດໄດ້ເລີຍ)",
            "You have asked the requester for more information and are waiting for the answer (you can still approve or reject).",
          )}
        </p>
      )}
      <p className="mt-2 text-xs text-slate-500">
        {t(
          "เมื่ออนุมัติ คำขอจะเข้าคิวทีม IT ดำเนินการต่อ หากไม่อนุมัติโปรดระบุเหตุผลให้ผู้ขอทราบ ถ้าข้อมูลยังไม่พอ ขอข้อมูลเพิ่มจากผู้ขอได้",
          "ເມື່ອອະນຸມັດ ຄຳຂໍຈະເຂົ້າຄິວທີມ IT ເພື່ອດຳເນີນການຕໍ່ ຖ້າບໍ່ອະນຸມັດ ກະລຸນາລະບຸເຫດຜົນໃຫ້ຜູ້ຂໍຮູ້ ຖ້າຂໍ້ມູນຍັງບໍ່ພໍ ຂໍຂໍ້ມູນເພີ່ມຈາກຜູ້ຂໍໄດ້",
          "Once approved, the request goes to the IT team's queue. If you reject it, please give the requester a reason. If you need more information, ask the requester for it.",
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
            placeholder={t(
              "ไม่บังคับ (บังคับเมื่อไม่อนุมัติหรือขอข้อมูลเพิ่ม)",
              "ບໍ່ບັງຄັບ (ບັງຄັບເມື່ອບໍ່ອະນຸມັດ ຫຼື ຂໍຂໍ້ມູນເພີ່ມ)",
              "Optional (required when rejecting or asking for more information)",
            )}
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
        <button type="submit" name="decision" value="ask" disabled={pending} className={`${btnSecondary} w-full`}>
          <MessageCircleQuestion className="h-4 w-4" aria-hidden />
          {t("ขอข้อมูลเพิ่มจากผู้ขอ", "ຂໍຂໍ້ມູນເພີ່ມຈາກຜູ້ຂໍ", "Ask the requester for more information")}
        </button>
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
        {state?.ok && (
          <p role="status" className="text-xs font-medium text-emerald-700">
            {t("บันทึกแล้ว", "ບັນທຶກແລ້ວ", "Saved")}
          </p>
        )}
      </form>
    </section>
  );
}
