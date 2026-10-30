"use client";

import { useActionState } from "react";
import { cancelRequest } from "@/app/actions/requests";
import { useT } from "@/components/lang-provider";
import { btnDanger, errorTextClass } from "@/lib/ui";

export function CancelButton({ requestId }: { requestId: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(cancelRequest, undefined);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !window.confirm(
            t(
              "ยืนยันการยกเลิกคำขอนี้? การยกเลิกไม่สามารถย้อนกลับได้",
              "ຢືນຢັນການຍົກເລີກຄຳຂໍນີ້ບໍ? ການຍົກເລີກບໍ່ສາມາດຍ້ອນກັບໄດ້",
              "Cancel this request? This cannot be undone.",
            ),
          )
        )
          e.preventDefault();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="requestId" value={requestId} />
      <button type="submit" disabled={pending} className={`${btnDanger} w-full`}>
        {pending ? t("กำลังยกเลิก...", "ກຳລັງຍົກເລີກ...", "Cancelling...") : t("ยกเลิกคำขอ", "ຍົກເລີກຄຳຂໍ", "Cancel request")}
      </button>
      {state?.error && (
        <p role="alert" className={errorTextClass}>
          {state.error}
        </p>
      )}
    </form>
  );
}
