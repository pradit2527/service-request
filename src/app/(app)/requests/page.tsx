import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RequestTable } from "@/components/request-list";
import { requireUser } from "@/lib/dal";
import { getI18n, getT } from "@/lib/i18n-server";
import { formatNumber } from "@/lib/labels";
import { pageItems } from "@/lib/pagination";
import { isStaff } from "@/lib/permissions";
import { PAGE_SIZE, listRequests, type ListFilters } from "@/lib/queries";
import { REQUEST_CATEGORIES, REQUEST_TYPE_DEFS, isRequestType } from "@/lib/request-types";
import { CURRENT_STATUSES, STATUS_LABEL, isValidStatus } from "@/lib/status";
import { btnPrimary, btnSecondary, cardClass, inputClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("รายการคำขอ", "ລາຍການຄຳຂໍ", "Requests") };
}

type SearchParams = Promise<{ q?: string; status?: string; type?: string; scope?: string; sla?: string; page?: string }>;

export default async function RequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const { t, lang } = await getI18n();
  const user = await requireUser();
  const staff = isStaff(user);
  const params = await searchParams;

  const filters: ListFilters = {
    q: params.q?.slice(0, 100),
    status: params.status === "OPEN" || params.status === "WAITING" ? params.status : isValidStatus(params.status) ? params.status : undefined,
    type: isRequestType(params.type) ? params.type : undefined,
    scope: staff && (params.scope === "assigned" || params.scope === "unassigned") ? params.scope : undefined,
    sla: staff && params.sla === "breached" ? "breached" : undefined,
    page: Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
  };

  const { items, total, page, pageCount } = await listRequests(user, filters);
  const hasFilters = Boolean(filters.q || filters.status || filters.type || filters.scope || filters.sla);

  const pageHref = (target: number) => {
    const query = new URLSearchParams();
    if (filters.q) query.set("q", filters.q);
    if (filters.status) query.set("status", filters.status);
    if (filters.type) query.set("type", filters.type);
    if (filters.scope) query.set("scope", filters.scope);
    if (filters.sla) query.set("sla", filters.sla);
    if (target > 1) query.set("page", String(target));
    const qs = query.toString();
    return qs ? `/requests?${qs}` : "/requests";
  };

  const totalText = formatNumber(total, lang);

  return (
    <div className="space-y-5">
      <PageHeader
        title={staff ? t("คำขอทั้งหมด", "ຄຳຂໍທັງໝົດ", "All requests") : t("คำขอของฉัน", "ຄຳຂໍຂອງຂ້ອຍ", "My requests")}
        description={`${t(`พบ ${totalText} รายการ`, `ພົບ ${totalText} ລາຍການ`, `${totalText} ${total === 1 ? "request" : "requests"} found`)}${filters.sla ? t(" · เฉพาะที่เกิน SLA", " · ສະເພາະທີ່ເກີນ SLA", " · SLA breached only") : ""}`}
        actions={
          <Link href="/requests/new" className={btnPrimary}>
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            {t("สร้างคำขอใหม่", "ສ້າງຄຳຂໍໃໝ່", "New request")}
          </Link>
        }
      />

      <form method="get" className={`${cardClass} grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6`}>
        <div className="relative sm:col-span-2 lg:col-span-2">
          <label htmlFor="q" className="sr-only">
            {t("ค้นหา", "ຄົ້ນຫາ", "Search")}
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder={
              staff
                ? t("ค้นหาเลขที่ หัวข้อ หรือชื่อผู้ขอ", "ຄົ້ນຫາເລກທີ່, ຫົວຂໍ້ ຫຼື ຊື່ຜູ້ຂໍ", "Search by number, subject or requester name")
                : t("ค้นหาเลขที่คำขอหรือหัวข้อ", "ຄົ້ນຫາເລກທີ່ຄຳຂໍ ຫຼື ຫົວຂໍ້", "Search by request number or subject")
            }
            className={`${inputClass} pl-10`}
          />
        </div>
        <div>
          <label htmlFor="status" className="sr-only">
            {t("สถานะ", "ສະຖານະ", "Status")}
          </label>
          <select id="status" name="status" defaultValue={filters.status ?? ""} className={inputClass}>
            <option value="">{t("ทุกสถานะ", "ທຸກສະຖານະ", "All statuses")}</option>
            <option value="OPEN">{t("ที่ยังไม่ปิด", "ທີ່ຍັງບໍ່ປິດ", "Not closed")}</option>
            <option value="WAITING">{t("รอข้อมูล / Vendor", "ລໍຂໍ້ມູນ / Vendor", "Waiting for info / Vendor")}</option>
            {CURRENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(STATUS_LABEL[s])}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="type" className="sr-only">
            {t("ประเภท", "ປະເພດ", "Type")}
          </label>
          <select id="type" name="type" defaultValue={filters.type ?? ""} className={inputClass}>
            <option value="">{t("ทุกประเภท", "ທຸກປະເພດ", "All types")}</option>
            {REQUEST_CATEGORIES.map((category) => (
              <optgroup key={category.key} label={t(category.label)}>
                {category.types.map((type) => (
                  <option key={type} value={type}>
                    {t(REQUEST_TYPE_DEFS[type].label)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        {staff && (
          <>
            <div>
              <label htmlFor="scope" className="sr-only">
                {t("ผู้รับผิดชอบ", "ຜູ້ຮັບຜິດຊອບ", "Assignee")}
              </label>
              <select id="scope" name="scope" defaultValue={filters.scope ?? ""} className={inputClass}>
                <option value="">{t("ทุกคน", "ທຸກຄົນ", "Everyone")}</option>
                <option value="assigned">{t("มอบหมายให้ฉัน", "ມອບໝາຍໃຫ້ຂ້ອຍ", "Assigned to me")}</option>
                <option value="unassigned">{t("ยังไม่มีผู้รับผิดชอบ", "ຍັງບໍ່ມີຜູ້ຮັບຜິດຊອບ", "Unassigned")}</option>
              </select>
            </div>
            <div>
              <label htmlFor="sla" className="sr-only">
                SLA
              </label>
              <select id="sla" name="sla" defaultValue={filters.sla ?? ""} className={inputClass}>
                <option value="">{t("SLA ทั้งหมด", "SLA ທັງໝົດ", "All SLA")}</option>
                <option value="breached">{t("เกิน SLA", "ເກີນ SLA", "SLA breached")}</option>
              </select>
            </div>
          </>
        )}
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
          <button type="submit" className={btnPrimary}>
            {t("ค้นหา", "ຄົ້ນຫາ", "Search")}
          </button>
          {hasFilters && (
            <Link href="/requests" className={btnSecondary}>
              {t("ล้างตัวกรอง", "ລ້າງຕົວກອງ", "Clear filters")}
            </Link>
          )}
        </div>
      </form>

      <RequestTable
        items={items}
        showRequester={staff}
        emptyText={hasFilters ? t("ไม่พบคำขอที่ตรงกับเงื่อนไข", "ບໍ່ພົບຄຳຂໍທີ່ກົງກັບເງື່ອນໄຂ", "No requests match your filters") : t("ยังไม่มีคำขอ", "ຍັງບໍ່ມີຄຳຂໍ", "No requests yet")}
      />

      {total > 0 && (
        <nav aria-label={t("หน้า", "ໜ້າ", "Pagination")} className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className={btnSecondary}>
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
                      href={pageHref(item)}
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
            <Link href={pageHref(page + 1)} className={btnSecondary}>
              {t("ถัดไป", "ຖັດໄປ", "Next")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
