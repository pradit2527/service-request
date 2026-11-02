"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateRequestByAdmin } from "@/app/actions/admin-requests";
import { useT } from "@/components/lang-provider";
import { PRIORITIES, PRIORITY_LABEL, type Priority } from "@/lib/labels";
import { submitWithoutReset } from "@/lib/submit-without-reset";
import { btnPrimary, btnSecondary, cardClass, errorTextClass, helpTextClass, inputClass, inputErrorClass, labelClass } from "@/lib/ui";

export type EditableRequest = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  /** YYYY-MM-DD */
  neededBy: string;
  requestedForName: string;
  approverId: string;
};

/** Edits the details of a request from system management. The approver can only be changed while it awaits approval. */
export function RequestEditForm({
  request,
  approvers,
  canChangeApprover,
}: {
  request: EditableRequest;
  approvers: { id: string; name: string; department: string | null }[];
  canChangeApprover: boolean;
}) {
  const t = useT();
  const [state, action, pending] = useActionState(updateRequestByAdmin, undefined);
  const errors = state?.fieldErrors ?? {};
  const field = (name: string) => `${inputClass} ${errors[name] ? inputErrorClass : ""}`;

  return (
    <form onSubmit={submitWithoutReset(action)} className={`${cardClass} space-y-5 p-5 sm:p-8`} noValidate>
      <input type="hidden" name="requestId" value={request.id} />

      <div>
        <label htmlFor="title" className={labelClass}>
          {t("หัวข้อ", "ຫົວຂໍ້", "Subject")}
        </label>
        <input id="title" name="title" defaultValue={request.title} maxLength={150} className={field("title")} />
        {errors.title && <p className={errorTextClass}>{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          {t("เหตุผลและความจำเป็น", "ເຫດຜົນ ແລະ ຄວາມຈຳເປັນ", "Reason and justification")}
        </label>
        <textarea id="description" name="description" defaultValue={request.description} rows={6} maxLength={5000} className={field("description")} />
        {errors.description && <p className={errorTextClass}>{errors.description}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="priority" className={labelClass}>
            {t("ความสำคัญ", "ຄວາມສຳຄັນ", "Priority")}
          </label>
          <select id="priority" name="priority" defaultValue={request.priority} className={field("priority")}>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {t(PRIORITY_LABEL[priority])}
              </option>
            ))}
          </select>
          {errors.priority && <p className={errorTextClass}>{errors.priority}</p>}
        </div>

        <div>
          <label htmlFor="neededBy" className={labelClass}>
            {t("ต้องการใช้งานภายใน", "ຕ້ອງການໃຊ້ງານພາຍໃນ", "Needed by")}
          </label>
          <input id="neededBy" name="neededBy" type="date" defaultValue={request.neededBy} className={field("neededBy")} />
          {errors.neededBy && <p className={errorTextClass}>{errors.neededBy}</p>}
        </div>

        <div>
          <label htmlFor="requestedForName" className={labelClass}>
            {t("ผู้ใช้งานจริง (ถ้าขอให้ผู้อื่น)", "ຜູ້ໃຊ້ງານຈິງ (ຖ້າຂໍໃຫ້ຜູ້ອື່ນ)", "Actual user (if requested for someone else)")}
          </label>
          <input id="requestedForName" name="requestedForName" defaultValue={request.requestedForName} maxLength={150} className={field("requestedForName")} />
          {errors.requestedForName && <p className={errorTextClass}>{errors.requestedForName}</p>}
        </div>

        {canChangeApprover && (
          <div>
            <label htmlFor="approverId" className={labelClass}>
              {t("ผู้อนุมัติ (หัวหน้างาน)", "ຜູ້ອະນຸມັດ (ຫົວໜ້າ)", "Approver (manager)")}
            </label>
            <select id="approverId" name="approverId" defaultValue={request.approverId} className={field("approverId")}>
              {approvers.map((approver) => (
                <option key={approver.id} value={approver.id}>
                  {approver.name}
                  {approver.department ? ` (${approver.department})` : ""}
                </option>
              ))}
            </select>
            {errors.approverId && <p className={errorTextClass}>{errors.approverId}</p>}
          </div>
        )}
      </div>

      {!canChangeApprover && (
        <p className={helpTextClass}>
          {t(
            "เปลี่ยนผู้อนุมัติได้เฉพาะคำขอที่ยังรอหัวหน้าอนุมัติ ประเภทคำขอ ข้อมูลเฉพาะประเภท และสถานะแก้ไขจากหน้านี้ไม่ได้",
            "ປ່ຽນຜູ້ອະນຸມັດໄດ້ສະເພາະຄຳຂໍທີ່ຍັງລໍຖ້າຫົວໜ້າອະນຸມັດ ປະເພດຄຳຂໍ, ຂໍ້ມູນສະເພາະປະເພດ ແລະ ສະຖານະແກ້ໄຂຈາກໜ້ານີ້ບໍ່ໄດ້",
            "The approver can only be changed while the request awaits approval. The type, type-specific details and status cannot be changed here.",
          )}
        </p>
      )}

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200 ring-inset">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? t("กำลังบันทึก...", "ກຳລັງບັນທຶກ...", "Saving...") : t("บันทึก", "ບັນທຶກ", "Save")}
        </button>
        <Link href="/admin/requests" className={btnSecondary}>
          {t("ยกเลิก", "ຍົກເລີກ", "Cancel")}
        </Link>
      </div>
    </form>
  );
}
