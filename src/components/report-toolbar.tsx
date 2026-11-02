import Link from "next/link";
import { Search } from "lucide-react";
import { formatNumber } from "@/lib/labels";
import { getI18n } from "@/lib/i18n-server";
import { btnPrimary, btnSecondary, cardClass, inputClass } from "@/lib/ui";

/**
 * Above a report table: how many records were found, the search box, the filters (children) and the buttons
 * on the right (for example "add"). It is a plain GET form, so the choices end up in the address.
 * `preserve` carries values that are not form fields (the sort) through a new search.
 */
export async function ReportToolbar({
  total,
  q,
  searchPlaceholder,
  submitLabel,
  preserve,
  hasFilters,
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
  clearHref: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { t, lang } = await getI18n();
  const totalText = formatNumber(total, lang);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{t(`พบ ${totalText} รายการ`, `ພົບ ${totalText} ລາຍການ`, `${totalText} ${total === 1 ? "record" : "records"} found`)}</p>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      <form method="get" className={`${cardClass} space-y-3 p-4`}>
        {Object.entries(preserve ?? {}).map(([name, value]) => (value ? <input key={name} type="hidden" name={name} value={value} /> : null))}
        {searchPlaceholder !== undefined && (
          <div className="relative">
            <label htmlFor="report-q" className="sr-only">
              {t("ค้นหา", "ຄົ້ນຫາ", "Search")}
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input id="report-q" name="q" type="search" defaultValue={q} placeholder={searchPlaceholder} className={`${inputClass} pl-10`} />
          </div>
        )}
        {children && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={btnPrimary}>
            {submitLabel ?? t("ค้นหา", "ຄົ້ນຫາ", "Search")}
          </button>
          {hasFilters && (
            <Link href={clearHref} className={btnSecondary}>
              {t("ล้างตัวกรอง", "ລ້າງຕົວກອງ", "Clear filters")}
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
