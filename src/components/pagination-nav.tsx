import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getI18n } from "@/lib/i18n-server";
import { pageItems } from "@/lib/pagination";
import { PAGE_SIZE } from "@/lib/queries";
import { btnSecondary } from "@/lib/ui";

/** Previous / next buttons and page numbers, the same as under the request list. Render it only when there are rows. */
export async function PaginationNav({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  const { t } = await getI18n();

  return (
    <nav aria-label={t("หน้า", "ໜ້າ", "Pagination")} className="flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={btnSecondary}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("ก่อนหน้า", "ກ່ອນໜ້າ", "Previous")}
        </Link>
      ) : (
        <span />
      )}
      <div className="flex flex-col items-center gap-1.5">
        {pageCount > 1 && (
          <div className="hidden items-center gap-1 sm:flex">
            {pageItems(page, pageCount).map((item, index) =>
              item === "gap" ? (
                <span key={`gap-${index}`} className="px-1 text-slate-400" aria-hidden>
                  …
                </span>
              ) : (
                <Link
                  key={item}
                  href={hrefFor(item)}
                  aria-current={item === page ? "page" : undefined}
                  aria-label={t(`หน้า ${item}`, `ໜ້າ ${item}`, `Page ${item}`)}
                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium tabular-nums transition ${
                    item === page
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                      : "text-slate-600 ring-1 ring-slate-200 ring-inset hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {item}
                </Link>
              ),
            )}
          </div>
        )}
        <span className="text-xs text-slate-500">
          {t(
            `หน้า ${page} จาก ${pageCount} (${PAGE_SIZE} รายการต่อหน้า)`,
            `ໜ້າ ${page} ຈາກ ${pageCount} (${PAGE_SIZE} ລາຍການຕໍ່ໜ້າ)`,
            `Page ${page} of ${pageCount} (${PAGE_SIZE} items per page)`,
          )}
        </span>
      </div>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={btnSecondary}>
          {t("ถัดไป", "ຖັດໄປ", "Next")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
