"use client";

import { useActionState, useState } from "react";
import { assignRequest, changeSlaTier, changeStatus, reassignApprover } from "@/app/actions/requests";
import { useT } from "@/components/lang-provider";
import { l, type Localized } from "@/lib/i18n";
import { SLA_TIERS, SLA_TIER_DEF, type SlaTier } from "@/lib/sla";
import { NOTE_REQUIRED_STATUSES, STATUS_LABEL, type RequestStatus } from "@/lib/status";
import { submitWithoutReset } from "@/lib/submit-without-reset";
import { btnPrimary, btnSecondary, cardClass, errorTextClass, inputClass, inputErrorClass, labelClass } from "@/lib/ui";

type Person = { id: string; name: string };

const NOTE_HINT: Partial<Record<RequestStatus, Localized>> = {
  REJECTED: l("ระบุเหตุผลที่ไม่อนุมัติ", "ລະບຸເຫດຜົນທີ່ບໍ່ອະນຸມັດ", "Enter the reason for rejection"),
  NEED_INFO: l("ระบุข้อมูลที่ต้องการจากผู้ขอ", "ລະບຸຂໍ້ມູນທີ່ຕ້ອງການຈາກຜູ້ຂໍ", "Enter the information needed from the requester"),
  ON_HOLD: l(
    "ระบุสิ่งที่รอ เช่น รอผู้บริหารอนุมัติงบ / รออะไหล่จาก Vendor",
    "ລະບຸສິ່ງທີ່ລໍຖ້າ ເຊັ່ນ ລໍຖ້າຜູ້ບໍລິຫານອະນຸມັດງົບ / ລໍຖ້າອາໄຫຼ່ຈາກ Vendor",
    "State what you are waiting for, e.g. executive budget approval / spare parts from the Vendor",
  ),
};

export function StaffPanel({
  requestId,
  status,
  allowedStatuses,
  assigneeId,
  staff,
  currentUserId,
  slaTier,
  approverId,
  approvers,
}: {
  requestId: string;
  status: RequestStatus;
  allowedStatuses: RequestStatus[];
  assigneeId: string | null;
  staff: Person[];
  currentUserId: string;
  slaTier: SlaTier;
  approverId: string | null;
  approvers: Person[];
}) {
  const t = useT();

  return (
    <section className={`${cardClass} space-y-5 p-4`}>
      <h2 className="font-semibold text-slate-900">{t("สำหรับทีม IT", "ສຳລັບທີມ IT", "For the IT team")}</h2>

      {status === "PENDING_APPROVAL" ? (
        <>
          <p className="rounded-xl bg-indigo-50 px-3 py-2.5 text-xs text-indigo-700">
            {t(
              "รอหัวหน้างานอนุมัติ ทีม IT จะดำเนินการได้หลังจากอนุมัติ",
              "ລໍຖ້າຫົວໜ້າອະນຸມັດ ທີມ IT ຈະດຳເນີນການໄດ້ຫຼັງຈາກອະນຸມັດ",
              "Waiting for manager approval. The IT team can proceed once it is approved.",
            )}
          </p>
          <ApproverForm key={approverId ?? "none"} requestId={requestId} approverId={approverId} approvers={approvers} />
        </>
      ) : (
        <>
          {/* Remount when the available transitions change so the select resets to a valid option. */}
          <StatusForm key={allowedStatuses.join(",")} requestId={requestId} allowed={allowedStatuses} />
          <hr className="border-slate-100" />
          <AssignForm key={assigneeId ?? "none"} requestId={requestId} assigneeId={assigneeId} staff={staff} currentUserId={currentUserId} />
        </>
      )}

      <hr className="border-slate-100" />
      <SlaTierForm key={slaTier} requestId={requestId} slaTier={slaTier} />
    </section>
  );
}

function StatusForm({ requestId, allowed }: { requestId: string; allowed: RequestStatus[] }) {
  const t = useT();
  const [state, action, pending] = useActionState(changeStatus, undefined);
  const [to, setTo] = useState<RequestStatus | "">(allowed[0] ?? "");

  if (allowed.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        {t(
          "คำขอนี้อยู่ในสถานะสุดท้าย ไม่สามารถเปลี่ยนสถานะได้",
          "ຄຳຂໍນີ້ຢູ່ໃນສະຖານະສຸດທ້າຍ ບໍ່ສາມາດປ່ຽນສະຖານະໄດ້",
          "This request is in a final status and its status can no longer be changed.",
        )}
      </p>
    );
  }

  const noteRequired = to !== "" && NOTE_REQUIRED_STATUSES.includes(to);
  const noteError = state?.fieldErrors?.note;

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-3">
      <input type="hidden" name="requestId" value={requestId} />
      <div>
        <label htmlFor="to" className={labelClass}>
          {t("เปลี่ยนสถานะเป็น", "ປ່ຽນສະຖານະເປັນ", "Change status to")}
        </label>
        <select id="to" name="to" value={to} onChange={(e) => setTo(e.target.value as RequestStatus)} className={inputClass}>
          {allowed.map((s) => (
            <option key={s} value={s}>
              {t(STATUS_LABEL[s])}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="note" className={labelClass}>
          {t("ข้อความถึงผู้ขอ", "ຂໍ້ຄວາມເຖິງຜູ້ຂໍ", "Message to requester")}
          {noteRequired && <span className="ml-0.5 text-red-600">*</span>}
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={2000}
          placeholder={
            noteRequired
              ? t(NOTE_HINT[to as RequestStatus] ?? l("ระบุเหตุผล", "ລະບຸເຫດຜົນ", "Enter a reason"))
              : t("ไม่บังคับ", "ບໍ່ບັງຄັບ", "Optional")
          }
          aria-invalid={Boolean(noteError)}
          aria-describedby={noteError ? "note-error" : undefined}
          className={`${inputClass} ${noteError ? inputErrorClass : ""}`}
        />
        {noteError && (
          <p id="note-error" className={errorTextClass}>
            {noteError}
          </p>
        )}
      </div>
      {to === "ON_HOLD" && <p className="text-xs text-amber-700">{t("ระหว่างรอ ระบบจะหยุดนับเวลา SLA", "ໃນລະຫວ່າງລໍຖ້າ ລະບົບຈະຢຸດນັບເວລາ SLA", "While on hold, the system pauses the SLA clock.")}</p>}
      {state?.error && (
        <p role="alert" className={errorTextClass}>
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? t("กำลังบันทึก...", "ກຳລັງບັນທຶກ...", "Saving...") : t("บันทึกสถานะ", "ບັນທຶກສະຖານະ", "Save status")}
      </button>
    </form>
  );
}

function AssignForm({
  requestId,
  assigneeId,
  staff,
  currentUserId,
}: {
  requestId: string;
  assigneeId: string | null;
  staff: Person[];
  currentUserId: string;
}) {
  const t = useT();
  const [state, action, pending] = useActionState(assignRequest, undefined);
  const [value, setValue] = useState(assigneeId ?? "");

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-3">
      <input type="hidden" name="requestId" value={requestId} />
      <div>
        <label htmlFor="assigneeId" className={labelClass}>
          {t("ผู้รับผิดชอบ", "ຜູ້ຮັບຜິດຊອບ", "Assignee")}
        </label>
        <select id="assigneeId" name="assigneeId" value={value} onChange={(e) => setValue(e.target.value)} className={inputClass}>
          <option value="">{t("ยังไม่มอบหมาย", "ຍັງບໍ່ໄດ້ມອບໝາຍ", "Unassigned")}</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.id === currentUserId ? t(" (ฉัน)", " (ຂ້ອຍ)", " (me)") : ""}
            </option>
          ))}
        </select>
      </div>
      {state?.error && (
        <p role="alert" className={errorTextClass}>
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={`${btnSecondary} flex-1 whitespace-nowrap`}>
          {pending ? t("กำลังบันทึก...", "ກຳລັງບັນທຶກ...", "Saving...") : t("บันทึกผู้รับผิดชอบ", "ບັນທຶກຜູ້ຮັບຜິດຊອບ", "Save assignee")}
        </button>
        {value !== currentUserId && (
          <button type="button" onClick={() => setValue(currentUserId)} className={`${btnSecondary} whitespace-nowrap`}>
            {t("รับเรื่องเอง", "ຮັບເລື່ອງເອງ", "Assign to me")}
          </button>
        )}
      </div>
    </form>
  );
}

function ApproverForm({ requestId, approverId, approvers }: { requestId: string; approverId: string | null; approvers: Person[] }) {
  const t = useT();
  const [state, action, pending] = useActionState(reassignApprover, undefined);
  const [value, setValue] = useState(approverId ?? "");

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-3">
      <input type="hidden" name="requestId" value={requestId} />
      <div>
        <label htmlFor="approverId" className={labelClass}>
          {t("ผู้อนุมัติ (หัวหน้างาน)", "ຜູ້ອະນຸມັດ (ຫົວໜ້າ)", "Approver (manager)")}
        </label>
        <select id="approverId" name="approverId" value={value} onChange={(e) => setValue(e.target.value)} className={inputClass}>
          {approvers.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      {state?.error && (
        <p role="alert" className={errorTextClass}>
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending || value === approverId} className={`${btnSecondary} w-full`}>
        {pending ? t("กำลังบันทึก...", "ກຳລັງບັນທຶກ...", "Saving...") : t("เปลี่ยนผู้อนุมัติ", "ປ່ຽນຜູ້ອະນຸມັດ", "Change approver")}
      </button>
    </form>
  );
}

function SlaTierForm({ requestId, slaTier }: { requestId: string; slaTier: SlaTier }) {
  const t = useT();
  const [state, action, pending] = useActionState(changeSlaTier, undefined);
  const [value, setValue] = useState<SlaTier>(slaTier);

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-3">
      <input type="hidden" name="requestId" value={requestId} />
      <div>
        <label htmlFor="tier" className={labelClass}>
          {t("ระดับ SLA", "ລະດັບ SLA", "SLA level")}
        </label>
        <select id="tier" name="tier" value={value} onChange={(e) => setValue(e.target.value as SlaTier)} className={inputClass}>
          {SLA_TIERS.map((tier) => (
            <option key={tier} value={tier}>
              {SLA_TIER_DEF[tier].label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-slate-500">{t(SLA_TIER_DEF[value].description)}</p>
      </div>
      {state?.error && (
        <p role="alert" className={errorTextClass}>
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending || value === slaTier} className={`${btnSecondary} w-full`}>
        {pending ? t("กำลังบันทึก...", "ກຳລັງບັນທຶກ...", "Saving...") : t("บันทึกระดับ SLA", "ບັນທຶກລະດັບ SLA", "Save SLA level")}
      </button>
    </form>
  );
}
