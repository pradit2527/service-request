"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AppWindow,
  Cable,
  Clock,
  Cloud,
  Database,
  GraduationCap,
  KeyRound,
  Laptop,
  LifeBuoy,
  Rocket,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/components/lang-provider";
import { TypeIcon } from "@/components/type-icon";
import type { RequestAudience, RequestType } from "@/lib/request-types";
import { cardClass, inputClass } from "@/lib/ui";

export type CatalogItem = {
  type: RequestType;
  label: string;
  description: string;
  fulfillment: string;
};

export type CatalogGroup = {
  key: string;
  label: string;
  description: string;
  audience: readonly RequestAudience[];
  items: CatalogItem[];
};

type Filter = "all" | RequestAudience;

// badges.tsx also holds server-only components, so the client uses its own pill with the same look.
const PILL = {
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
};

// One icon and colour per category, shown on the category's heading.
const GROUP_STYLE: Record<string, { icon: LucideIcon; chip: string }> = {
  access: { icon: KeyRound, chip: "from-violet-400 to-purple-600 shadow-violet-500/30" },
  data: { icon: Database, chip: "from-teal-400 to-cyan-600 shadow-teal-500/30" },
  deploy: { icon: Rocket, chip: "from-orange-400 to-rose-500 shadow-orange-500/30" },
  training: { icon: GraduationCap, chip: "from-yellow-400 to-amber-600 shadow-amber-500/30" },
  cloud: { icon: Cloud, chip: "from-sky-400 to-blue-600 shadow-blue-500/30" },
  software: { icon: AppWindow, chip: "from-pink-400 to-rose-500 shadow-rose-500/30" },
  hardware: { icon: Laptop, chip: "from-indigo-400 to-blue-600 shadow-indigo-500/30" },
  workplace: { icon: Cable, chip: "from-cyan-400 to-sky-600 shadow-cyan-500/30" },
  other: { icon: LifeBuoy, chip: "from-slate-400 to-slate-600 shadow-slate-500/25" },
};


/**
 * The list of request types people choose from: grouped by category, with a filter for who the
 * request is for (customers / system users or the internal team) and a search box.
 * Everything is filtered in the browser, so it reacts as the person types.
 */
export function RequestCatalog({
  groups,
  audienceLabels,
  initialAudience,
}: {
  groups: CatalogGroup[];
  audienceLabels: Record<RequestAudience, string>;
  initialAudience: Filter;
}) {
  const t = useT();
  const [audience, setAudience] = useState<Filter>(initialAudience);
  const [query, setQuery] = useState("");

  const inAudience = (group: CatalogGroup, filter: Filter) => filter === "all" || group.audience.includes(filter);
  const count = (filter: Filter) => groups.filter((group) => inAudience(group, filter)).reduce((sum, group) => sum + group.items.length, 0);

  const needle = query.trim().toLowerCase();
  const visible = groups
    .filter((group) => inAudience(group, audience))
    .map((group) => ({
      ...group,
      items: needle
        ? group.items.filter((item) => `${item.label} ${item.description} ${group.label}`.toLowerCase().includes(needle))
        : group.items,
    }))
    .filter((group) => group.items.length > 0);
  const shown = visible.reduce((sum, group) => sum + group.items.length, 0);

  function chooseAudience(next: Filter) {
    setAudience(next);
    // Keep the choice in the address so going back from a form returns to the same tab.
    try {
      const url = new URL(window.location.href);
      if (next === "all") url.searchParams.delete("audience");
      else url.searchParams.set("audience", next);
      window.history.replaceState(null, "", url);
    } catch {
      // The address is only a convenience.
    }
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: t("ทั้งหมด", "ທັງໝົດ", "All") },
    { key: "client", label: audienceLabels.client },
    { key: "internal", label: audienceLabels.internal },
  ];

  return (
    <div className="space-y-3.5">
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
        <div role="group" aria-label={t("กรองตามกลุ่มผู้ใช้", "ກອງຕາມກຸ່ມຜູ້ໃຊ້", "Filter by audience")} className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = audience === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={active}
                onClick={() => chooseAudience(tab.key)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium ring-1 ring-inset transition max-xl:py-2 ${
                  active
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-emerald-600"
                    : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 text-xs tabular-nums ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
                >
                  {count(tab.key)}
                </span>
              </button>
            );
          })}
        </div>


        <div className="relative sm:w-72">
          <label htmlFor="catalog-search" className="sr-only">
            {t("ค้นหาประเภทคำขอ", "ຄົ້ນຫາປະເພດຄຳຂໍ", "Search request types")}
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            id="catalog-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(
              "ค้นหา เช่น Firewall, Backup, สิทธิ์",
              "ຄົ້ນຫາ ເຊັ່ນ Firewall, Backup, ສິດ",
              "Search, e.g. firewall, backup, access",
            )}
            className={`${inputClass} py-2! pl-10 xl:py-1.5! xl:text-[13px]!`}
          />
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {t(`พบ ${shown} ประเภท`, `ພົບ ${shown} ປະເພດ`, `${shown} ${shown === 1 ? "type" : "types"} found`)}
      </p>

      {visible.length === 0 ? (
        <p className={`${cardClass} px-4 py-10 text-center text-sm text-slate-500`}>
          {t(
            "ไม่พบประเภทคำขอที่ตรงกับคำค้น ลองใช้คำอื่น หรือเลือกประเภท “อื่นๆ”",
            "ບໍ່ພົບປະເພດຄຳຂໍທີ່ກົງກັບຄຳຄົ້ນຫາ ລອງໃຊ້ຄຳອື່ນ ຫຼື ເລືອກປະເພດ “ອື່ນໆ”",
            "No request types match your search. Try another word, or choose “Other”.",
          )}
        </p>
      ) : (
        <div className="divide-y divide-slate-200/70">
          {visible.map((group) => {
            const { icon: GroupIcon, chip } = GROUP_STYLE[group.key] ?? GROUP_STYLE.other;
            const total = group.items.length;
            return (
              // Category heading on the left, its request types on the right; stacked on small screens.
              <section
                key={group.key}
                aria-labelledby={`group-${group.key}`}
                className="grid gap-2 py-1.5 first:pt-0 last:pb-0 xl:grid-cols-[12.5rem_minmax(0,1fr)] xl:gap-5"
              >
                <header className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white shadow-sm ${chip}`}
                    aria-hidden
                  >
                    <GroupIcon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <h2 id={`group-${group.key}`} className="text-[13px] leading-snug font-semibold text-slate-900">
                      {group.label}{" "}
                      <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                        · {t(`${total} ประเภท`, `${total} ປະເພດ`, `${total} ${total === 1 ? "type" : "types"}`)}
                      </span>
                    </h2>
                    <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-slate-500" title={group.description}>
                      {group.description}
                    </p>
                  </div>
                </header>

                {/* Every category uses the same column width, so the cards line up from one category to the next. */}
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-2.5">
                  {group.items.map((item) => (
                    <li key={item.type}>
                      <Link
                        href={`/requests/new?type=${item.type}`}
                        title={item.description}
                        className={`${cardClass} group relative flex h-full flex-col overflow-hidden p-2 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lift`}
                      >
                        <span
                          className="absolute inset-y-0 left-0 w-1 bg-linear-to-b from-emerald-400 to-teal-500 opacity-0 transition-opacity group-hover:opacity-100"
                          aria-hidden
                        />
                        <div className="flex items-start gap-2">
                          <TypeIcon type={item.type} size="sm" />
                          <h3 className="line-clamp-2 min-w-0 flex-1 pt-px text-[13px] leading-tight font-semibold text-slate-900">{item.label}</h3>
                        </div>
                        {/* On wide screens the short description is in the tooltip; on phones and tablets there is no hover, so it is shown. */}
                        <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-slate-500 xl:sr-only">{item.description}</p>
                        <div className="mt-auto flex items-center gap-1.5 pt-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap ring-1 ring-inset ${PILL.violet}`}
                            aria-label={t(`ส่งมอบ ≤ ${item.fulfillment}`, `ສົ່ງມອບ ≤ ${item.fulfillment}`, `Fulfillment ≤ ${item.fulfillment}`)}
                          >
                            <Clock className="h-3 w-3" aria-hidden />≤ {item.fulfillment}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
