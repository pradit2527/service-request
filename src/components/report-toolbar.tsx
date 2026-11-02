import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { formatNumber } from "@/lib/labels";
import { getI18n } from "@/lib/i18n-server";
import { btnPrimary, btnSecondary, cardClass, inputClass } from "@/lib/ui";

/**
 * Above a report table, one compact bar: the search box, the buttons, the "Filters" toggle, then how many records
 * were found and the buttons on the right (for example "add"). The filters (children) are folded away under the
 * toggle so the table starts high on the page; unfolded, they take a row of their own. The toggle shows how many
 * filters are in use. A report whose main controls are filters shows them at once, without the toggle.
 * It is a plain GET form, so the choices end up in the address.
 * `preserve` carries values that are not form fields (the sort) through a new search.
 */
export async function ReportToolbar({
  total,
  q,
  searchPlaceholder,
  submitLabel,
  preserve,
  hasFilters,
  filterCount = 0,
  filtersOpen = false,
  clearHref,
  actions,
  children,
}: {
  total: number;
  q?: string;
  /** Leave out for a report that has no search box. */
  searchPlaceholder?: string;
  /** The text of the submit button; "Search" when left out. */
  submitLabel?: string;
  preserve?: Record<string, string | undefined>;
  hasFilters: boolean;
  /** How many filters are set, shown next to "Filters". */
  filterCount?: number;
  /** Show the filters always, without the toggle (for a report whose main controls are filters). */
  filtersOpen?: boolean;
  clearHref: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { t, lang } = await getI18n();
  const totalText = formatNumber(total, lang);

  return (
    <form method="get" className={`${cardClass} p-2.5`}>
      {Object.entries(preserve ?? {}).map(([name, value]) => (value ? <input key={name} type="hidden" name={name} value={value} /> : null))}
      <div className="flex flex-wrap items-center gap-2">
        {searchPlaceholder !== undefined && (
          <div className="relative min-w-0 flex-1 basis-56">
            <label htmlFor="report-q" className="sr-only">
              {t("ค้นหา", "ຄົ້ນຫາ", "Search")}
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input id="report-q" name="q" type="search" defaultValue={q} placeholder={searchPlaceholder} className={`${inputClass} py-2! pl-10`} />
          </div>
        )}
        <button type="submit" className={`${btnPrimary} py-2!`}>
          {submitLabel ?? t("ค้นหา", "ຄົ້ນຫາ", "Search")}
        </button>
        {hasFilters && (
          <Link href={clearHref} className={`${btnSecondary} py-2!`}>
            {t("ล้างตัวกรอง", "ລ້າງຕົວກອງ", "Clear filters")}
          </Link>
        )}
        {children && filtersOpen && (
          // The main controls of the report: always shown, on a row of their own under the bar.
          <div className="order-last grid basis-full gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
        )}
        {children && !filtersOpen && (
          // Unfolded, it moves to the end of the bar and takes the whole row for the filters.
          <details className="group open:order-last open:basis-full">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-indigo-600 transition hover:text-indigo-800 [&::-webkit-details-marker]:hidden">
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              {t("ตัวกรอง", "ຕົວກອງ", "Filters")}
              {filterCount > 0 && (
                <span className="rounded-full bg-indigo-600 px-1.5 text-[11px] leading-5 font-semibold text-white tabular-nums">{filterCount}</span>
              )}
            </summary>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
          </details>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-sm whitespace-nowrap text-slate-500">
            {t(`พบ ${totalText} รายการ`, `ພົບ ${totalText} ລາຍການ`, `${totalText} ${total === 1 ? "record" : "records"} found`)}
          </p>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
    </form>
  );
}
