"use client";

import { useActionState, useState } from "react";
import { addComment } from "@/app/actions/requests";
import { useT } from "@/components/lang-provider";
import type { ActionState } from "@/lib/action-state";
import { submitWithoutReset } from "@/lib/submit-without-reset";
import { btnPrimary, errorTextClass, inputClass, inputErrorClass } from "@/lib/ui";

export function CommentForm({ requestId, canPostInternal }: { requestId: string; canPostInternal: boolean }) {
  const t = useT();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);

  // Clear the box only when the comment was saved, so a failed attempt keeps the text.
  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await addComment(prev, formData);
    if (result?.ok) {
      setBody("");
      setInternal(false);
    }
    return result;
  }, undefined);

  const error = state?.fieldErrors?.body ?? state?.error;

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-2">
      <input type="hidden" name="requestId" value={requestId} />
      <label htmlFor="body" className="sr-only">
        {t("ข้อความ", "ຂໍ້ຄວາມ", "Message")}
      </label>
      <textarea
        id="body"
        name="body"
        rows={3}
        maxLength={5000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("พิมพ์ข้อความถึงทีม IT / ผู้ขอ", "ພິມຂໍ້ຄວາມເຖິງທີມ IT / ຜູ້ຂໍ", "Type a message to the IT team / requester")}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "body-error" : undefined}
        className={`${inputClass} ${error ? inputErrorClass : ""}`}
      />
      {error && (
        <p id="body-error" role="alert" className={errorTextClass}>
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {canPostInternal ? (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="internal"
              checked={internal}
              onChange={(e) => setInternal(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            {t("บันทึกภายใน (ผู้ขอจะไม่เห็น)", "ບັນທຶກພາຍໃນ (ຜູ້ຂໍຈະບໍ່ເຫັນ)", "Internal note (the requester won't see it)")}
          </label>
        ) : (
          <span />
        )}
        <button type="submit" disabled={pending || body.trim() === ""} className={btnPrimary}>
          {pending ? t("กำลังส่ง...", "ກຳລັງສົ່ງ...", "Sending...") : t("ส่งข้อความ", "ສົ່ງຂໍ້ຄວາມ", "Send message")}
        </button>
      </div>
    </form>
  );
}
