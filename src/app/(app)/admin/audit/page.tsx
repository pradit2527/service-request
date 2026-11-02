import type { Metadata } from "next";
import { Badge } from "@/components/badges";
import { PaginationNav } from "@/components/pagination-nav";
import { AUDIT_ACTION_LABEL, AUDIT_ACTIONS, type AuditAction } from "@/lib/audit";
import { requireSystemManager } from "@/lib/dal";
import { getI18n } from "@/lib/i18n-server";
import { formatDateTime, formatNumber } from "@/lib/labels";
import { listAuditLogs } from "@/lib/queries";
import { cardClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("บันทึกการเปลี่ยนแปลง", "ບັນທຶກການປ່ຽນແປງ", "Change log") };
}

function isAuditAction(value: string): value is AuditAction {
  return (AUDIT_ACTIONS as readonly string[]).includes(value);
}

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireSystemManager();
  const { t, lang } = await getI18n();
  const params = await searchParams;

  const { items, total, page, pageCount } = await listAuditLogs(Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));
  const hrefFor = (target: number) => (target > 1 ? `/admin/audit?page=${target}` : "/admin/audit");
  const totalText = formatNumber(total, lang);

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        {t(
          `บันทึกการเพิ่ม แก้ไข และลบผู้ใช้กับบทความฐานความรู้ (${totalText} รายการ) ส่วนการแก้ไขคำขอดูได้ที่ความเคลื่อนไหวในหน้าคำขอนั้น`,
          `ບັນທຶກການເພີ່ມ, ແກ້ໄຂ ແລະ ລຶບຜູ້ໃຊ້ກັບບົດຄວາມຖານຄວາມຮູ້ (${totalText} ລາຍການ) ສ່ວນການແກ້ໄຂຄຳຂໍເບິ່ງໄດ້ທີ່ຄວາມເຄື່ອນໄຫວໃນໜ້າຄຳຂໍນັ້ນ`,
          `Records of users and knowledge base articles being added, edited and deleted (${totalText} entries). Changes to a request are in the activity on that request's page.`,
        )}
      </p>

      {items.length === 0 ? (
        <p className={`${cardClass} p-8 text-center text-sm text-slate-500`}>{t("ยังไม่มีบันทึก", "ຍັງບໍ່ມີບັນທຶກ", "No entries yet")}</p>
      ) : (
        <ul className={`${cardClass} divide-y divide-slate-100 overflow-hidden`}>
          {items.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5">
              <div className="min-w-0 flex-1 basis-64">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={entry.action.endsWith("DELETED") ? "red" : entry.action.endsWith("CREATED") ? "green" : "blue"}>
                    {isAuditAction(entry.action) ? t(AUDIT_ACTION_LABEL[entry.action]) : entry.action}
                  </Badge>
                  <span className="text-sm font-medium text-slate-800">{entry.actor.name}</span>
                </div>
                <p className="mt-1 text-sm break-words text-slate-600">{entry.summary}</p>
              </div>
              <p className="text-xs text-slate-400">{formatDateTime(entry.createdAt, lang)}</p>
            </li>
          ))}
        </ul>
      )}

      {total > 0 && <PaginationNav page={page} pageCount={pageCount} hrefFor={hrefFor} />}
    </div>
  );
}
