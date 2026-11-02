"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveArticle } from "@/app/actions/kb";
import { useT } from "@/components/lang-provider";
import { KB_CATEGORIES } from "@/lib/kb";
import { submitWithoutReset } from "@/lib/submit-without-reset";
import { btnPrimary, btnSecondary, cardClass, errorTextClass, helpTextClass, inputClass, inputErrorClass, labelClass } from "@/lib/ui";

type Initial = { id: string; title: string; category: string; summary: string; body: string; isPublished: boolean };

export function ArticleForm({ initial }: { initial: Initial }) {
  const t = useT();
  const [state, action, pending] = useActionState(saveArticle, undefined);
  const errors = state?.fieldErrors ?? {};
  const [values, setValues] = useState(initial);
  const set = <K extends keyof Initial>(key: K, value: Initial[K]) => setValues((v) => ({ ...v, [key]: value }));
  const cls = (name: string) => `${inputClass} ${errors[name] ? inputErrorClass : ""}`;

  return (
    <form onSubmit={submitWithoutReset(action)} className={`${cardClass} space-y-6 p-5 sm:p-8`} noValidate>
      <input type="hidden" name="id" value={values.id} />

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200 ring-inset">
          {state.error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="title" className={labelClass}>
            {t("หัวข้อ", "ຫົວຂໍ້", "Title")} <span className="text-red-600">*</span>
          </label>
          <input id="title" name="title" maxLength={150} value={values.title} onChange={(e) => set("title", e.target.value)} aria-invalid={Boolean(errors.title)} className={cls("title")} />
          {errors.title && <p className={errorTextClass}>{errors.title}</p>}
        </div>
        <div>
          <label htmlFor="category" className={labelClass}>
            {t("หมวดหมู่", "ໝວດໝູ່", "Category")} <span className="text-red-600">*</span>
          </label>
          <select id="category" name="category" value={values.category} onChange={(e) => set("category", e.target.value)} className={cls("category")}>
            <option value="">{t("— เลือก —", "— ເລືອກ —", "— Select —")}</option>
            {KB_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {t(c.label)}
              </option>
            ))}
          </select>
          {errors.category && <p className={errorTextClass}>{errors.category}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="summary" className={labelClass}>
          {t("สรุปสั้นๆ", "ສະຫຼຸບສັ້ນໆ", "Short summary")} <span className="text-red-600">*</span>
        </label>
        <textarea id="summary" name="summary" rows={2} maxLength={300} value={values.summary} onChange={(e) => set("summary", e.target.value)} aria-invalid={Boolean(errors.summary)} className={cls("summary")} />
        {errors.summary ? <p className={errorTextClass}>{errors.summary}</p> : <p className={helpTextClass}>{t("แสดงในผลการค้นหา", "ສະແດງໃນຜົນການຄົ້ນຫາ", "Shown in search results")}</p>}
      </div>

      <div>
        <label htmlFor="body" className={labelClass}>
          {t("เนื้อหา", "ເນື້ອໃນ", "Content")} <span className="text-red-600">*</span>
        </label>
        <textarea id="body" name="body" rows={20} maxLength={20000} value={values.body} onChange={(e) => set("body", e.target.value)} aria-invalid={Boolean(errors.body)} className={`${cls("body")} font-mono text-[13px] leading-6`} />
        {errors.body ? (
          <p className={errorTextClass}>{errors.body}</p>
        ) : (
          <p className={helpTextClass}>
            {t("รองรับ", "ຮອງຮັບ", "Supports")} <code className="font-mono">{t("## หัวข้อ", "## ຫົວຂໍ້", "## Heading")}</code>,{" "}
            <code className="font-mono">{t("- รายการ", "- ລາຍການ", "- Item")}</code>, <code className="font-mono">{t("1. ขั้นตอน", "1. ຂັ້ນຕອນ", "1. Step")}</code>,{" "}
            <code className="font-mono">{t("**ตัวหนา**", "**ໂຕໜາ**", "**bold**")}</code>, <code className="font-mono">{t("`โค้ด`", "`ໂຄ້ດ`", "`code`")}</code>{" "}
            {t("และบล็อกโค้ดด้วย", "ແລະບລັອກໂຄ້ດດ້ວຍ", "and code blocks with")} <code className="font-mono">```</code>
          </p>
        )}
      </div>

      <label className="flex items-center gap-2.5 text-sm text-slate-700">
        <input type="checkbox" name="isPublished" checked={values.isPublished} onChange={(e) => set("isPublished", e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-indigo-600" />
        {t(
          "เผยแพร่ให้พนักงานทุกคนเห็น (ถ้าไม่เลือก จะเป็นฉบับร่างเห็นเฉพาะทีม IT หัวหน้างาน และผู้ดูแลระบบ)",
          "ເຜີຍແຜ່ໃຫ້ພະນັກງານທຸກຄົນເຫັນ (ຖ້າບໍ່ເລືອກ ຈະເປັນສະບັບຮ່າງ ເຫັນສະເພາະທີມ IT, ຫົວໜ້າ ແລະ ຜູ້ດູແລລະບົບ)",
          "Publish for all employees (if unchecked, it stays a draft visible to the IT team, managers and administrators only)",
        )}
      </label>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Link href={values.id ? `/kb/${values.id}` : "/kb"} className={btnSecondary}>
          {t("ยกเลิก", "ຍົກເລີກ", "Cancel")}
        </Link>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? t("กำลังบันทึก...", "ກຳລັງບັນທຶກ...", "Saving...") : t("บันทึกบทความ", "ບັນທຶກບົດຄວາມ", "Save article")}
        </button>
      </div>
    </form>
  );
}
