"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useT } from "@/components/lang-provider";
import type { RequestType } from "@/lib/request-types";
import { cardClass, helpTextClass, inputClass, labelClass } from "@/lib/ui";

export type CatalogItem = {
  type: RequestType;
  label: string;
  description: string;
  fulfillment: string;
};

export type CatalogGroup = {
  key: string;
  label: string;
  items: CatalogItem[];
};

/**
 * The request types people choose from, as one dropdown grouped by category. Choosing a type opens its
 * form straight away (the same page the cards used to open).
 */
export function RequestCatalog({ groups }: { groups: CatalogGroup[] }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  function choose(type: string) {
    if (!type) return;
    startTransition(() => router.push(`/requests/new?type=${encodeURIComponent(type)}`));
  }

  return (
    <section className={`${cardClass} p-4 sm:p-6`}>
      <label htmlFor="request-type" className={labelClass}>
        {t("ประเภทบริการ", "ປະເພດບໍລິການ", "Type of service")}{" "}
        <span className="font-normal text-slate-400 tabular-nums">
          · {t(`${total} ประเภท`, `${total} ປະເພດ`, `${total} types`)}
        </span>
      </label>
      <select
        id="request-type"
        defaultValue=""
        disabled={pending}
        onChange={(event) => choose(event.target.value)}
        aria-describedby="request-type-help"
        className={`${inputClass} max-w-2xl py-3! sm:text-base!`}
      >
        <option value="" disabled>
          {t("— เลือกประเภทบริการ —", "— ເລືອກປະເພດບໍລິການ —", "— Choose a type of service —")}
        </option>
        {groups.map((group) => (
          <optgroup key={group.key} label={group.label}>
            {group.items.map((item) => (
              <option key={item.type} value={item.type} title={item.description}>
                {item.label} · ≤ {item.fulfillment}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <p id="request-type-help" className={helpTextClass} role="status" aria-live="polite">
        {pending
          ? t("กำลังเปิดแบบฟอร์ม...", "ກຳລັງເປີດແບບຟອມ...", "Opening the form...")
          : t(
              "เลือกแล้วระบบจะเปิดแบบฟอร์มของประเภทนั้นให้ทันที ตัวเลข ≤ คือเวลาส่งมอบเป้าหมาย (นับเวลาทำการ)",
              "ເລືອກແລ້ວລະບົບຈະເປີດແບບຟອມຂອງປະເພດນັ້ນໃຫ້ທັນທີ ຕົວເລກ ≤ ແມ່ນເວລາສົ່ງມອບເປົ້າໝາຍ (ນັບເວລາເຮັດວຽກ)",
              "Once you choose, the form for that type opens right away. The ≤ figure is the target fulfillment time (business hours).",
            )}
      </p>
    </section>
  );
}
