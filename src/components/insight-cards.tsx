import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { getI18n } from "@/lib/i18n-server";
import { INTL_LOCALE, type Lang } from "@/lib/i18n";
import { formatNumber } from "@/lib/labels";
import { trendSummary, type DayCount } from "@/lib/insights";
import type { StaffInsights } from "@/lib/queries";
import { REQUEST_TYPE_DEFS } from "@/lib/request-types";
import { cardClass } from "@/lib/ui";
import { Avatar } from "./avatar";
import { TypeIcon } from "./type-icon";

// Charts for the IT team's home page. Plain CSS bars, no chart library: each one reads at a glance and has a
// text alternative for screen readers.

const PERIOD = 14;
// Height of the tallest bar, in px; the number above a bar sits on top of it.
const PLOT_PX = 96;

function dayLabel(date: string, lang: Lang) {
  return new Intl.DateTimeFormat(INTL_LOCALE[lang], { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

function monthLabel(date: string, lang: Lang) {
  return new Intl.DateTimeFormat(INTL_LOCALE[lang], { month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

function CardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
      <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

/** Requests filed per day over the last two weeks: the total and how it compares, then one bar per day. */
export async function TrendCard({ daily }: { daily: DayCount[] }) {
  const { t, lang } = await getI18n();
  const summary = trendSummary(daily, PERIOD);
  const shown = daily.slice(-PERIOD);
  const max = Math.max(1, ...shown.map((day) => day.count));
  const n = (value: number) => formatNumber(value, lang);

  const compare =
    summary.previousTotal === 0 && summary.total === 0
      ? null
      : summary.change > 0
        ? { Icon: ArrowUpRight, text: t(`เพิ่มขึ้น ${n(summary.change)} จาก ${PERIOD} วันก่อนหน้า`, `ເພີ່ມຂຶ້ນ ${n(summary.change)} ຈາກ ${PERIOD} ມື້ກ່ອນ`, `Up ${n(summary.change)} from the previous ${PERIOD} days`) }
        : summary.change < 0
          ? { Icon: ArrowDownRight, text: t(`ลดลง ${n(-summary.change)} จาก ${PERIOD} วันก่อนหน้า`, `ຫຼຸດລົງ ${n(-summary.change)} ຈາກ ${PERIOD} ມື້ກ່ອນ`, `Down ${n(-summary.change)} from the previous ${PERIOD} days`) }
          : { Icon: Minus, text: t(`เท่ากับ ${PERIOD} วันก่อนหน้า`, `ເທົ່າກັບ ${PERIOD} ມື້ກ່ອນ`, `Same as the previous ${PERIOD} days`) };

  const summaryText = t(
    `ยื่น ${n(summary.total)} รายการใน ${PERIOD} วันที่ผ่านมา`,
    `ຍື່ນ ${n(summary.total)} ລາຍການໃນ ${PERIOD} ມື້ທີ່ຜ່ານມາ`,
    `${n(summary.total)} requests filed in the last ${PERIOD} days`,
  );

  return (
    <section className={`${cardClass} p-5`}>
      <CardHeader
        title={t("คำขอที่ยื่นต่อวัน", "ຄຳຂໍທີ່ຍື່ນຕໍ່ມື້", "Requests filed per day")}
        subtitle={t(`${PERIOD} วันล่าสุด`, `${PERIOD} ມື້ຫຼ້າສຸດ`, `Last ${PERIOD} days`)}
      />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl leading-none font-semibold tracking-tight text-slate-900 tabular-nums">{n(summary.total)}</span>
          <span className="text-sm text-slate-500">{t("รายการ", "ລາຍການ", "requests")}</span>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>{t(`เฉลี่ย ${n(summary.averagePerDay)} ต่อวัน`, `ສະເລ່ຍ ${n(summary.averagePerDay)} ຕໍ່ມື້`, `${n(summary.averagePerDay)} per day on average`)}</p>
          {compare && (
            <p className="mt-0.5 inline-flex items-center gap-1 font-medium text-slate-700">
              <compare.Icon className="h-3.5 w-3.5 text-indigo-500" aria-hidden />
              {compare.text}
            </p>
          )}
        </div>
      </div>

      <div role="img" aria-label={summaryText} className="mt-5">
        <div className="relative h-[120px]">
          <div className="absolute inset-x-0 border-t border-dashed border-slate-200/70" style={{ bottom: PLOT_PX }} aria-hidden />
          <div className="absolute inset-x-0 border-t border-dashed border-slate-200/70" style={{ bottom: PLOT_PX / 2 }} aria-hidden />
          <div className="relative flex h-full items-end gap-1 border-b border-slate-300">
            {shown.map((day, index) => {
              const isToday = index === shown.length - 1;
              const height = day.count === 0 ? 3 : Math.max(6, Math.round((day.count / max) * PLOT_PX));
              return (
                <div
                  key={day.date}
                  className="group flex h-full flex-1 flex-col items-center justify-end gap-1"
                  title={`${dayLabel(day.date, lang)} · ${n(day.count)}`}
                >
                  <span
                    className={`text-[11px] leading-none font-semibold tabular-nums ${
                      day.count === 0 ? "text-slate-300" : isToday ? "text-indigo-600" : "text-slate-700"
                    }`}
                  >
                    {n(day.count)}
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-colors ${
                      day.count === 0 ? "bg-slate-100" : isToday ? "bg-indigo-600" : "bg-indigo-300 group-hover:bg-indigo-400"
                    }`}
                    style={{ height }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-1.5 flex gap-1" aria-hidden>
          {shown.map((day, index) => {
            const isToday = index === shown.length - 1;
            const dayOfMonth = Number(day.date.slice(8));
            const note = isToday ? t("วันนี้", "ມື້ນີ້", "Today") : index === 0 || dayOfMonth === 1 ? monthLabel(day.date, lang) : null;
            return (
              <div key={day.date} className="flex flex-1 flex-col items-center">
                <span className={`text-[11px] tabular-nums ${isToday ? "font-semibold text-indigo-600" : "text-slate-500"}`}>{dayOfMonth}</span>
                <span className="h-3 text-[9px] leading-3 whitespace-nowrap text-slate-400">{note}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <span>{t("ตัวเลขบนแท่ง = จำนวนคำขอที่ยื่นในวันนั้น", "ຕົວເລກເທິງແທ່ງ = ຈຳນວນຄຳຂໍທີ່ຍື່ນໃນມື້ນັ້ນ", "Number on a bar = requests filed that day")}</span>
          {summary.peak && (
            <span className="font-medium text-slate-700">
              {t("วันที่ยื่นมากที่สุด", "ມື້ທີ່ຍື່ນຫຼາຍທີ່ສຸດ", "Busiest day")}: {dayLabel(summary.peak.date, lang)} · {n(summary.peak.count)} {t("รายการ", "ລາຍການ", "requests")}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

type Row = { key: string; label: React.ReactNode; value: number; warn?: boolean };

// A list of horizontal bars: the label, the figure, and a bar as long as the biggest one.
function BarList({ rows, empty }: { rows: Row[]; empty: string }) {
  if (rows.length === 0) return <p className="mt-4 text-sm text-slate-500">{empty}</p>;
  const max = Math.max(...rows.map((row) => row.value));
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <ul className="mt-4 space-y-3.5">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2 text-slate-700">{row.label}</span>
            <span className="shrink-0 font-semibold text-slate-900 tabular-nums">
              {row.value}
              <span className="ml-1.5 text-xs font-normal text-slate-400">{Math.round((row.value / total) * 100)}%</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${row.warn ? "bg-amber-400" : "bg-indigo-500"}`} style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** This month's requests by type: the six most common, each as a bar with its share. */
export async function TypeBreakdownCard({ byType }: { byType: StaffInsights["byType"] }) {
  const { t } = await getI18n();
  const rows: Row[] = byType.slice(0, 6).map(({ type, count }) => ({
    key: type,
    value: count,
    label: (
      <>
        <TypeIcon type={type} size="xs" />
        <span className="truncate">{t(REQUEST_TYPE_DEFS[type].label)}</span>
      </>
    ),
  }));

  return (
    <section className={`${cardClass} p-5`}>
      <CardHeader title={t("คำขอตามประเภท", "ຄຳຂໍຕາມປະເພດ", "Requests by type")} subtitle={t("เดือนนี้", "ເດືອນນີ້", "This month")} />
      <BarList rows={rows} empty={t("ยังไม่มีข้อมูล", "ຍັງບໍ່ມີຂໍ້ມູນ", "No data yet")} />
    </section>
  );
}

/** Open requests by assignee, so an overloaded person (or a pile nobody has taken) stands out. */
export async function WorkloadCard({ workload }: { workload: StaffInsights["workload"] }) {
  const { t } = await getI18n();
  const unassigned = t("ยังไม่มอบหมาย", "ຍັງບໍ່ໄດ້ມອບໝາຍ", "Unassigned");
  const rows: Row[] = workload.map(({ name, count }) => ({
    key: name ?? "(none)",
    value: count,
    warn: name === null,
    label:
      name === null ? (
        <span className="truncate">{unassigned}</span>
      ) : (
        <>
          <Avatar name={name} size="xs" />
          <span className="truncate">{name}</span>
        </>
      ),
  }));

  return (
    <section className={`${cardClass} p-5`}>
      <CardHeader
        title={t("ภาระงานของทีม", "ພາລະວຽກຂອງທີມ", "Team workload")}
        subtitle={t("คำขอที่ยังเปิดอยู่ แยกตามผู้รับผิดชอบ", "ຄຳຂໍທີ່ຍັງເປີດຢູ່ ແຍກຕາມຜູ້ຮັບຜິດຊອບ", "Open requests by assignee")}
      />
      <BarList rows={rows} empty={t("ยังไม่มีข้อมูล", "ຍັງບໍ່ມີຂໍ້ມູນ", "No data yet")} />
    </section>
  );
}
