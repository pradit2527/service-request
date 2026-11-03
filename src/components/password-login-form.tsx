"use client";

import { useActionState } from "react";
import { TriangleAlert } from "lucide-react";
import { passwordLogin } from "@/app/actions/auth";
import { useT } from "@/components/lang-provider";
import { submitWithoutReset } from "@/lib/submit-without-reset";
import { btnPrimary, inputClass, labelClass } from "@/lib/ui";

/** Sign in with an email and a password, next to the Google button. `next` is where to go afterwards. */
export function PasswordLoginForm({ next }: { next: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(passwordLogin, undefined);

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-3" noValidate>
      <input type="hidden" name="next" value={next} />
      {state?.error && (
        <p role="alert" className="flex gap-2.5 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700 ring-1 ring-red-200 ring-inset">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="login-email" className={labelClass}>
          {t("อีเมล", "ອີເມວ", "Email")}
        </label>
        <input id="login-email" name="email" type="email" autoComplete="username" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="login-password" className={labelClass}>
          {t("รหัสผ่าน", "ລະຫັດຜ່ານ", "Password")}
        </label>
        <input id="login-password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
      <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? t("กำลังเข้าสู่ระบบ...", "ກຳລັງເຂົ້າສູ່ລະບົບ...", "Signing in...") : t("เข้าสู่ระบบ", "ເຂົ້າສູ່ລະບົບ", "Sign in")}
      </button>
    </form>
  );
}
