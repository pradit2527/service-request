import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge, StatusBadge } from "@/components/badges";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { PaginationNav } from "@/components/pagination-nav";
import { deleteRequest, restoreRequest } from "@/app/actions/admin-requests";
import { requireSystemManager } from "@/lib/dal";
import { getI18n } from "@/lib/i18n-server";
import { formatDateTime, formatNumber } from "@/lib/labels";
import { listRequests, type ListFilters } from "@/lib/queries";
import { REQUEST_TYPE_DEFS } from "@/lib/request-types";
import { CURRENT_STATUSES, STATUS_LABEL, isValidStatus } from "@/lib/status";
import { btnPrimary, btnSecondary, cardClass, inputClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("จัดการคำขอ", "ຈັດການຄຳຂໍ", "Manage requests") };
}

type SearchParams = Promise<{ q?: string; status?: string; deleted?: string; page?: string }>;

export default async function AdminRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireSystemManager();
  const { t, lang } = await getI18n();
  const params = await searchParams;

  const filters: ListFilters = {
    console: true,
    q: params.q?.slice(0, 100),
    status: params.status === "OPEN" || params.status === "WAITING" ? params.status : isValidStatus(params.status) ? params.status : undefined,
    deleted: params.deleted === "include" || params.deleted === "only" ? params.deleted : undefined,
    page: Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
  };
  const { items, total, page, pageCount } = await listRequests(actor, filters);
  const hasFilters = Boolean(filters.q || filters.status || filters.deleted);

  const hrefFor = (target: number) => {
    const query = new URLSearchParams();
    if (filters.q) query.set("q", filters.q);
    if (filters.status) query.set("status", filters.status);
    if (filters.deleted) query.set("deleted", filters.deleted);
    if (target > 1) query.set("page", String(target));
    const qs = query.toString();
    return qs ? `/admin/requests?${qs}` : "/admin/requests";
  };
  const totalText = formatNumber(total, lang);

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        {t(`พบ ${totalText} รายการ`, `ພົບ ${totalText} ລາຍການ`, `${totalText} ${total === 1 ? "request" : "requests"} found`)}
      </p>

      <form method="get" className={`${cardClass} grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6`}>
        <div className="relative sm:col-span-3 lg:col-span-3">
          <label htmlFor="q" className="sr-only">
            {t("ค้นหา", "ຄົ້ນຫາ", "Search")}
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder={t("ค้นหาเลขที่ หัวข้อ หรือชื่อผู้ขอ", "ຄົ້ນຫາເລກທີ່, ຫົວຂໍ້ ຫຼື ຊື່ຜູ້ຂໍ", "Search by number, subject or requester name")}
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
            {CURRENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(STATUS_LABEL[status])}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="deleted" className="sr-only">
            {t("คำขอที่ถูกลบ", "ຄຳຂໍທີ່ຖືກລຶບ", "Deleted requests")}
          </label>
          <select id="deleted" name="deleted" defaultValue={filters.deleted ?? ""} className={inputClass}>
            <option value="">{t("ซ่อนที่ลบแล้ว", "ເຊື່ອງທີ່ລຶບແລ້ວ", "Hide deleted")}</option>
            <option value="include">{t("รวมที่ลบแล้ว", "ລວມທີ່ລຶບແລ້ວ", "Include deleted")}</option>
            <option value="only">{t("เฉพาะที่ลบแล้ว", "ສະເພາະທີ່ລຶບແລ້ວ", "Deleted only")}</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={btnPrimary}>
            {t("ค้นหา", "ຄົ້ນຫາ", "Search")}
          </button>
          {hasFilters && (
            <Link href="/admin/requests" className={btnSecondary}>
              {t("ล้าง", "ລ້າງ", "Clear")}
            </Link>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <p className={`${cardClass} p-8 text-center text-sm text-slate-500`}>
          {hasFilters ? t("ไม่พบคำขอที่ตรงกับเงื่อนไข", "ບໍ່ພົບຄຳຂໍທີ່ກົງກັບເງື່ອນໄຂ", "No requests match your filters") : t("ยังไม่มีคำขอ", "ຍັງບໍ່ມີຄຳຂໍ", "No requests yet")}
        </p>
      ) : (
        <ul className={`${cardClass} divide-y divide-slate-100 overflow-hidden`}>
          {items.map((request) => (
            <li key={request.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 sm:px-5">
              <div className="min-w-0 flex-1 basis-64">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">{request.requestNo}</span>
                  <StatusBadge status={request.status} />
                  {request.deletedAt && <Badge tone="red">{t("ถูกลบ", "ຖືກລຶບ", "Deleted")}</Badge>}
                </div>
                <p className="mt-1.5 truncate font-medium text-slate-900">{request.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {t(REQUEST_TYPE_DEFS[request.type].label)} · {request.requester.name} · {formatDateTime(request.createdAt, lang)}
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                <Link href={`/requests/${request.id}`} className={btnSecondary}>
                  {t("เปิด", "ເປີດ", "Open")}
                </Link>
                {request.deletedAt ? (
                  <ConfirmActionButton
                    action={restoreRequest}
                    fields={{ requestId: request.id }}
                    label={t("กู้คืน", "ກູ້ຄືນ", "Restore")}
                    pendingLabel={t("กำลังกู้คืน...", "ກຳລັງກູ້ຄືນ...", "Restoring...")}
                    variant="secondary"
                  />
                ) : (
                  <>
                    <Link href={`/admin/requests/${request.id}/edit`} className={btnSecondary}>
                      {t("แก้ไข", "ແກ້ໄຂ", "Edit")}
                    </Link>
                    <ConfirmActionButton
                      action={deleteRequest}
                      fields={{ requestId: request.id }}
                      label={t("ลบ", "ລຶບ", "Delete")}
                      pendingLabel={t("กำลังลบ...", "ກຳລັງລຶບ...", "Deleting...")}
                      confirmText={t(
                        `ลบคำขอ ${request.requestNo}? คำขอจะถูกซ่อนจากทุกคน และกู้คืนได้ในหน้านี้`,
                        `ລຶບຄຳຂໍ ${request.requestNo}ບໍ? ຄຳຂໍຈະຖືກເຊື່ອງຈາກທຸກຄົນ ແລະ ກູ້ຄືນໄດ້ໃນໜ້ານີ້`,
                        `Delete request ${request.requestNo}? It is hidden from everyone and can be restored from this page.`,
                      )}
                    />
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {total > 0 && <PaginationNav page={page} pageCount={pageCount} hrefFor={hrefFor} />}
    </div>
  );
}
