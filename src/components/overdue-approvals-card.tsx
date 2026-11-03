import Link from "next/link";
import { Hourglass } from "lucide-react";
import { OVERDUE_AFTER_DAYS } from "@/lib/approval-aging";
import { getI18n } from "@/lib/i18n-server";
import type { listOverdueApprovals } from "@/lib/queries";
import { cardClass } from "@/lib/ui";
import { Badge } from "./badges";

type Overdue = Awaited<ReturnType<typeof listOverdueApprovals>>;

const SHOWN_PER_APPROVER = 4;

/**
 * For an administrator: requests that have waited five working days or more for their approver, grouped by approver, with a
 * way into each one (where the approver can be changed). A request waiting on its requester is not counted here.
 */
export async function OverdueApprovalsCard({ rows }: { rows: Overdue }) {
  const { t } = await getI18n();

  const byApprover = new Map<string, { name: string; isActive: boolean; rows: Overdue }>();
  for (const row of rows) {
    const group = byApprover.get(row.approver.id) ?? { name: row.approver.name, isActive: row.approver.isActive, rows: [] };
    group.rows.push(row);
    byApprover.set(row.approver.id, group);
  }
  const groups = [...byApprover.values()].sort((a, b) => b.rows.length - a.rows.length);

  return (
    <section className={`${cardClass} border-red-200 bg-red-50/40 p-4 sm:p-5`}>
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <Hourglass className="h-4 w-4 text-red-500" aria-hidden />
        {t(
          `คำขอรออนุมัติค้างนาน ${rows.length} รายการ (ตั้งแต่ ${OVERDUE_AFTER_DAYS} วันทำการ)`,
          `ຄຳຂໍລໍຖ້າອະນຸມັດຄ້າງນານ ${rows.length} ລາຍການ (ຕັ້ງແຕ່ ${OVERDUE_AFTER_DAYS} ວັນເຮັດວຽກ)`,
          `${rows.length} ${rows.length === 1 ? "request has" : "requests have"} waited for approval ${OVERDUE_AFTER_DAYS} working days or more`,
        )}
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        {t(
          "เปิดคำขอแล้วแก้ผู้อนุมัติได้ที่ “แก้ไข” (เฉพาะที่ยังรออนุมัติ) หรือให้หัวหน้าตั้งผู้แทนช่วงที่ไม่อยู่",
          "ເປີດຄຳຂໍແລ້ວແກ້ຜູ້ອະນຸມັດໄດ້ທີ່ “ແກ້ໄຂ” (ສະເພາະທີ່ຍັງລໍຖ້າອະນຸມັດ) ຫຼື ໃຫ້ຫົວໜ້າຕັ້ງຜູ້ແທນຊ່ວງທີ່ບໍ່ຢູ່",
          "Open a request and change its approver under “Edit” (only while it is waiting), or ask the manager to set a stand-in.",
        )}
      </p>
      <ul className="mt-3 space-y-3">
        {groups.map((group) => (
          <li key={group.name} className="text-sm">
            <p className="flex flex-wrap items-center gap-2 font-medium text-slate-800">
              {group.name}
              <Badge tone="red">{t(`${group.rows.length} รายการ`, `${group.rows.length} ລາຍການ`, `${group.rows.length}`)}</Badge>
              {!group.isActive && <Badge tone="slate">{t("บัญชีถูกปิดใช้งาน", "ບັນຊີຖືກປິດໃຊ້ງານ", "Account deactivated")}</Badge>}
            </p>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {group.rows.slice(0, SHOWN_PER_APPROVER).map((row) => (
                <li key={row.id} className="flex items-center gap-2">
                  <Link href={`/requests/${row.id}`} className="font-mono text-indigo-600 hover:underline">
                    {row.requestNo}
                  </Link>
                  <span className="text-slate-500">{t(`${row.wait.businessDays} วันทำการ`, `${row.wait.businessDays} ວັນເຮັດວຽກ`, `${row.wait.businessDays} working days`)}</span>
                  <Link href={`/admin/requests/${row.id}/edit`} className="text-slate-500 underline hover:text-indigo-600">
                    {t("แก้ไข", "ແກ້ໄຂ", "Edit")}
                  </Link>
                </li>
              ))}
              {group.rows.length > SHOWN_PER_APPROVER && (
                <li className="text-slate-500">{t(`และอีก ${group.rows.length - SHOWN_PER_APPROVER} รายการ`, `ແລະ ອີກ ${group.rows.length - SHOWN_PER_APPROVER} ລາຍການ`, `and ${group.rows.length - SHOWN_PER_APPROVER} more`)}</li>
              )}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
