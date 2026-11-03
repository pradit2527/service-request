"use client";

import { useActionState, useState } from "react";
import { Copy, Dices } from "lucide-react";
import { setTemporaryPassword } from "@/app/actions/admin-users";
import { useT } from "@/components/lang-provider";
import { generateTemporaryPassword } from "@/lib/temp-password";
import { submitWithoutReset } from "@/lib/submit-without-reset";
import { btnPrimary, btnSecondary, errorTextClass, helpTextClass, inputClass, inputErrorClass, labelClass } from "@/lib/ui";

/**
 * For an administrator: gives one user a temporary password. The box shows the password in plain text on purpose, so the
 * administrator can read it out or copy it: after saving it is kept nowhere but as a hash, and is not shown again.
 */
export function TemporaryPasswordForm({ userId }: { userId: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(setTemporaryPassword, undefined);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const error = state?.fieldErrors?.password;

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the password is in the box to copy by hand.
    }
  }

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-3" noValidate>
      <input type="hidden" name="userId" value={userId} />
      {state?.error && (
        <p role="alert" className={errorTextClass}>
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="temporaryPassword" className={labelClass}>
          {t("รหัสผ่านชั่วคราว", "ລະຫັດຜ່ານຊົ່ວຄາວ", "Temporary password")}
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="temporaryPassword"
            name="password"
            type="text"
            autoComplete="off"
            spellCheck={false}
            maxLength={128}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setCopied(false);
            }}
            className={`${inputClass} min-w-0 flex-1 font-mono ${error ? inputErrorClass : ""}`}
          />
          <button type="button" onClick={() => setPassword(generateTemporaryPassword())} className={btnSecondary}>
            <Dices className="h-4 w-4" aria-hidden />
            {t("สุ่มรหัส", "ສຸ່ມລະຫັດ", "Generate")}
          </button>
          <button type="button" onClick={copy} disabled={password === ""} className={btnSecondary}>
            <Copy className="h-4 w-4" aria-hidden />
            {copied ? t("คัดลอกแล้ว", "ຄັດລອກແລ້ວ", "Copied") : t("คัดลอก", "ຄັດລອກ", "Copy")}
          </button>
        </div>
        {error ? <p className={errorTextClass}>{error}</p> : <p className={helpTextClass}>{t("อย่างน้อย 8 ตัวอักษร", "ຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ", "At least 8 characters")}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || password === ""} className={btnPrimary}>
          {pending ? t("กำลังบันทึก...", "ກຳລັງບັນທຶກ...", "Saving...") : t("ตั้งรหัสผ่านชั่วคราว", "ຕັ້ງລະຫັດຜ່ານຊົ່ວຄາວ", "Set temporary password")}
        </button>
        {state?.ok && (
          <span role="status" className="text-sm text-emerald-700">
            {t(
              "บันทึกแล้ว ส่งรหัสนี้ให้ผู้ใช้ รหัสจะไม่แสดงอีก",
              "ບັນທຶກແລ້ວ ສົ່ງລະຫັດນີ້ໃຫ້ຜູ້ໃຊ້ ລະຫັດຈະບໍ່ສະແດງອີກ",
              "Saved. Give this password to the user; it will not be shown again.",
            )}
          </span>
        )}
      </div>
    </form>
  );
}
