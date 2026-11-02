"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { useT } from "@/components/lang-provider";
import { TypeIcon } from "@/components/type-icon";
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
 * The request types people choose from, as one dropdown grouped by category, each type with its icon and
 * target time. Choosing a type opens its form straight away (the same page the cards used to open).
 *
 * It is a custom listbox because the options of a native <select> cannot show icons. Keyboard: arrows,
 * Home/End, Enter or Space to choose, Escape to close, and typing the first letters of a name jumps to it.
 */
export function RequestCatalog({ groups }: { groups: CatalogGroup[] }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const uid = useId();

  const items = groups.flatMap((group) => group.items);
  const total = items.length;
  // Index of the first item of each group in the flat list, for the keyboard and aria-activedescendant.
  const starts = groups.map((_, index) => groups.slice(0, index).reduce((sum, group) => sum + group.items.length, 0));

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${uid}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, uid]);

  function choose(type: RequestType) {
    setOpen(false);
    startTransition(() => router.push(`/requests/new?type=${encodeURIComponent(type)}`));
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (pending || total === 0) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (open) setActive((index) => Math.min(total - 1, index + 1));
        else setOpen(true);
        return;
      case "ArrowUp":
        event.preventDefault();
        if (open) setActive((index) => Math.max(0, index - 1));
        else setOpen(true);
        return;
      case "Home":
      case "End":
        if (!open) return;
        event.preventDefault();
        setActive(event.key === "Home" ? 0 : total - 1);
        return;
      case "Enter":
      case " ":
        event.preventDefault();
        if (open) choose(items[active].type);
        else setOpen(true);
        return;
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        return;
      case "Tab":
        setOpen(false);
        return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // Type-ahead: letters typed in quick succession are matched against the start of each name.
      const now = Date.now();
      const text = now - typed.current.at > 700 ? event.key : typed.current.text + event.key;
      typed.current = { text, at: now };
      const needle = text.toLowerCase();
      const found = items.findIndex((item) => item.label.toLowerCase().startsWith(needle));
      if (found >= 0) {
        setOpen(true);
        setActive(found);
      }
    }
  }

  return (
    <section className={`${cardClass} p-4 sm:p-6`}>
      <label id={`${uid}-label`} htmlFor={`${uid}-trigger`} className={labelClass}>
        {t("ประเภทบริการ", "ປະເພດບໍລິການ", "Type of service")}{" "}
        <span className="font-normal text-slate-400 tabular-nums">· {t(`${total} ประเภท`, `${total} ປະເພດ`, `${total} types`)}</span>
      </label>

      <div ref={root} className="relative max-w-2xl">
        <button
          id={`${uid}-trigger`}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${uid}-list`}
          aria-labelledby={`${uid}-label`}
          aria-describedby={`${uid}-help`}
          aria-activedescendant={open ? `${uid}-opt-${active}` : undefined}
          disabled={pending}
          onClick={() => setOpen((value) => !value)}
          onKeyDown={onKeyDown}
          className={`${inputClass} flex items-center justify-between gap-3 py-3! text-left sm:text-base!`}
        >
          <span className="truncate text-slate-500">
            {pending
              ? t("กำลังเปิดแบบฟอร์ม...", "ກຳລັງເປີດແບບຟອມ...", "Opening the form...")
              : t("— เลือกประเภทบริการ —", "— ເລືອກປະເພດບໍລິການ —", "— Choose a type of service —")}
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>

        {open && (
          <div
            id={`${uid}-list`}
            role="listbox"
            aria-labelledby={`${uid}-label`}
            className="absolute z-30 mt-1.5 max-h-[min(32rem,calc(100dvh-14rem))] w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lift"
          >
            {groups.map((group, groupIndex) => (
              <div key={group.key} role="group" aria-labelledby={`${uid}-group-${group.key}`}>
                <p
                  id={`${uid}-group-${group.key}`}
                  className="px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase"
                >
                  {group.label}
                </p>
                {group.items.map((item, itemIndex) => {
                  const index = starts[groupIndex] + itemIndex;
                  return (
                    <div
                      key={item.type}
                      id={`${uid}-opt-${index}`}
                      role="option"
                      aria-selected={index === active}
                      title={item.description}
                      // Keep the focus on the button, so the keyboard keeps working after a mouse click.
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => choose(item.type)}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] ${
                        index === active ? "bg-emerald-50 text-emerald-900" : "text-slate-800"
                      }`}
                    >
                      <TypeIcon type={item.type} size="xs" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-violet-700 ring-1 ring-violet-200 ring-inset">
                        <Clock className="h-3 w-3" aria-hidden />≤ {item.fulfillment}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <p id={`${uid}-help`} className={helpTextClass} role="status" aria-live="polite">
        {t(
          "เลือกแล้วระบบจะเปิดแบบฟอร์มของประเภทนั้นให้ทันที ตัวเลข ≤ คือเวลาส่งมอบเป้าหมาย (นับเวลาทำการ)",
          "ເລືອກແລ້ວລະບົບຈະເປີດແບບຟອມຂອງປະເພດນັ້ນໃຫ້ທັນທີ ຕົວເລກ ≤ ແມ່ນເວລາສົ່ງມອບເປົ້າໝາຍ (ນັບເວລາເຮັດວຽກ)",
          "Once you choose, the form for that type opens right away. The ≤ figure is the target fulfillment time (business hours).",
        )}
      </p>
    </section>
  );
}
