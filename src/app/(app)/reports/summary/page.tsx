import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { ReportToolbar } from "@/components/report-toolbar";
import { TypeIcon } from "@/components/type-icon";
import { requireSystemManager } from "@/lib/dal";
import { INTL_LOCALE, type Lang } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { formatNumber } from "@/lib/labels";
import { SUMMARY_GROUPS, buildReportHref, parseSummaryParams, summaryPresets } from "@/lib/report-params";
import { SUMMARY_ROW_CAP, listSummarySubjects } from "@/lib/report-queries";
import { sortSummaryRows, summarizeRequests, type SummaryRow } from "@/lib/report-summary";
import { REQUEST_TYPE_DEFS, isRequestType } from "@/lib/request-types";
import { inputClass, labelClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("สถิติสรุป", "ສະຖິຕິສະຫຼຸບ", "Summary statistics") };
}

const PATH = "/reports/summary";

function monthName(key: string, lang: Lang): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[lang], { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${key}-01T00:00:00Z`));
}

export default async function SummaryReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireSystemManager();
  const { t, lang } = await getI18n();
  const now = new Date();
  const params = parseSummaryParams(await searchParams, now);

  const result = await listSummarySubjects(user, { from: params.from, to: params.to });
  if (!result) redirect("/");
  const summary = summarizeRequests(result.rows, params.group, now);
  const rows = sortSummaryRows(summary.rows, params.sort, params.dir);

  const sorted = params.sort === "total" && params.dir === "desc" ? {} : { sort: params.sort, dir: params.dir };
  const hrefFor = (overrides: Record<string, string | undefined>) =>
    buildReportHref(PATH, { from: params.from, to: params.to, group: params.group, ...sorted, ...overrides });

  const presetLabel = {
    thisMonth: t("เดือนนี้", "ເດືອນນີ້", "This month"),
    lastMonth: t("เดือนที่แล้ว", "ເດືອນທີ່ແລ້ວ", "Last month"),
    last3Months: t("3 เดือนล่าสุด", "3 ເດືອນຫຼ້າສຸດ", "Last 3 months"),
    thisYear: t("ปีนี้", "ປີນີ້", "This year"),
  };
  const groupLabel = {
    type: t("ประเภทคำขอ", "ປະເພດຄຳຂໍ", "Request type"),
    month: t("เดือน", "ເດືອນ", "Month"),
    assignee: t("ผู้รับผิดชอบ", "ຜູ້ຮັບຜິດຊອບ", "Assignee"),
  };

  const rate = (value: { met: number; breached: number; rate: number | null }) =>
    value.rate === null ? (
      <span className="text-slate-400">-</span>
    ) : (
      <span title={`${value.met}/${value.met + value.breached}`}>{Math.round(value.rate * 100)}%</span>
    );
  const count = (n: number) => formatNumber(n, lang);

  const label = (row: SummaryRow) => {
    if (row === summary.totals) return t("รวมทั้งหมด", "ລວມທັງໝົດ", "Total");
    if (params.group === "type") {
      return isRequestType(row.key) ? (
        <span className="inline-flex items-center gap-2.5">
          <TypeIcon type={row.key} size="xs" />
          {t(REQUEST_TYPE_DEFS[row.key].label)}
        </span>
      ) : (
        row.key
      );
    }
    if (params.group === "month") return monthName(row.key, lang);
    return row.key || t("ยังไม่มีผู้รับผิดชอบ", "ຍັງບໍ່ມີຜູ້ຮັບຜິດຊອບ", "Unassigned");
  };

  const columns: Column<SummaryRow>[] = [
    // The label may wrap onto two lines, so the numbers beside it keep their room.
    { key: "label", header: groupLabel[params.group], sortKey: "label", card: "title", className: "min-w-[7rem] whitespace-normal!", render: label },
    { key: "total", header: t("ทั้งหมด", "ທັງໝົດ", "Total"), sortKey: "total", align: "right", render: (row) => count(row.total) },
    { key: "open", header: t("ยังเปิดอยู่", "ຍັງເປີດຢູ່", "Open"), sortKey: "open", align: "right", render: (row) => count(row.open) },
    { key: "completed", header: t("เสร็จสิ้น", "ສຳເລັດ", "Completed"), sortKey: "completed", align: "right", render: (row) => count(row.completed) },
    { key: "rejected", header: t("ไม่อนุมัติ", "ບໍ່ອະນຸມັດ", "Rejected"), sortKey: "rejected", align: "right", render: (row) => count(row.rejected) },
    { key: "cancelled", header: t("ยกเลิก", "ຍົກເລີກ", "Cancelled"), sortKey: "cancelled", align: "right", showFrom: "wider", render: (row) => count(row.cancelled) },
    { key: "pendingApproval", header: t("รออนุมัติ", "ລໍຖ້າອະນຸມັດ", "Pending approval"), sortKey: "pendingApproval", align: "right", showFrom: "wider", render: (row) => count(row.pendingApproval) },
    { key: "responseRate", header: t("ผ่าน SLA ตอบรับ", "ຜ່ານ SLA ຕອບຮັບ", "Response SLA met"), sortKey: "responseRate", align: "right", showFrom: "wide", render: (row) => rate(row.response) },
    { key: "fulfillmentRate", header: t("ผ่าน SLA ส่งมอบ", "ຜ່ານ SLA ສົ່ງມອບ", "Fulfillment SLA met"), sortKey: "fulfillmentRate", align: "right", showFrom: "wide", render: (row) => rate(row.fulfillment) },
    {
      key: "avgApprovalHours",
      header: t("เวลาอนุมัติเฉลี่ย", "ເວລາອະນຸມັດສະເລ່ຍ", "Avg. time to approve"),
      sortKey: "avgApprovalHours",
      align: "right",
      showFrom: "wide",
      render: (row) => (row.avgApprovalHours === null ? <span className="text-slate-400">-</span> : `${row.avgApprovalHours} ${t("ชม.", "ຊມ.", "h")}`),
    },
  ];

  const presets = summaryPresets(now);

  return (
    <div className="space-y-3">
      <ReportToolbar
        total={result.rows.length}
        submitLabel={t("แสดงผล", "ສະແດງຜົນ", "Show")}
        preserve={{ sort: sorted.sort, dir: sorted.dir }}
        hasFilters={false}
        filtersOpen
        clearHref={PATH}
        actions={
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("ช่วงเวลาที่ใช้บ่อย", "ໄລຍະເວລາທີ່ໃຊ້ເລື້ອຍ", "Common ranges")}>
            {presets.map((preset) => {
              const active = preset.from === params.from && preset.to === params.to;
              return (
                <Link
                  key={preset.key}
                  href={hrefFor({ from: preset.from, to: preset.to })}
                  aria-current={active ? "true" : undefined}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium ring-1 ring-inset transition ${
                    active ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {presetLabel[preset.key]}
                </Link>
              );
            })}
          </div>
        }
      >
        <div className="min-w-0">
          <label htmlFor="f-from" className={labelClass}>
            {t("ยื่นตั้งแต่", "ຍື່ນຕັ້ງແຕ່", "Filed from")}
          </label>
          <input id="f-from" name="from" type="date" defaultValue={params.from} className={inputClass} />
        </div>
        <div className="min-w-0">
          <label htmlFor="f-to" className={labelClass}>
            {t("ถึงวันที่", "ເຖິງວັນທີ", "To")}
          </label>
          <input id="f-to" name="to" type="date" defaultValue={params.to} className={inputClass} />
        </div>
        <div className="min-w-0">
          <label htmlFor="f-group" className={labelClass}>
            {t("จัดกลุ่มตาม", "ຈັດກຸ່ມຕາມ", "Group by")}
          </label>
          <select id="f-group" name="group" defaultValue={params.group} className={inputClass}>
            {SUMMARY_GROUPS.map((group) => (
              <option key={group} value={group}>
                {groupLabel[group]}
              </option>
            ))}
          </select>
        </div>
      </ReportToolbar>

      {result.capped && (
        <p className="flex gap-2.5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200 ring-inset" role="status">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t(
            `ช่วงเวลานี้มีคำขอมากกว่า ${formatNumber(SUMMARY_ROW_CAP, lang)} รายการ สถิติด้านล่างนับเฉพาะ ${formatNumber(SUMMARY_ROW_CAP, lang)} รายการแรก กรุณาเลือกช่วงวันที่ให้สั้นลง`,
            `ໄລຍະເວລານີ້ມີຄຳຂໍຫຼາຍກວ່າ ${formatNumber(SUMMARY_ROW_CAP, lang)} ລາຍການ ສະຖິຕິຂ້າງລຸ່ມນັບສະເພາະ ${formatNumber(SUMMARY_ROW_CAP, lang)} ລາຍການທຳອິດ ກະລຸນາເລືອກຊ່ວງວັນທີໃຫ້ສັ້ນລົງ`,
            `There are more than ${formatNumber(SUMMARY_ROW_CAP, lang)} requests in this range. The statistics below count only the first ${formatNumber(SUMMARY_ROW_CAP, lang)}. Please choose a shorter range.`,
          )}
        </p>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.key || "(none)"}
        sort={{ key: params.sort, dir: params.dir }}
        hrefForSort={(sortKey, dir) => hrefFor({ sort: sortKey, dir })}
        footer={rows.length > 0 ? summary.totals : undefined}
        emptyText={t("ไม่มีคำขอในช่วงวันที่นี้", "ບໍ່ມີຄຳຂໍໃນຊ່ວງວັນທີນີ້", "There are no requests in this range")}
      />
    </div>
  );
}
