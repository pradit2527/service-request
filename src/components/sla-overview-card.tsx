import Link from "next/link";
import { CirclePause, Gauge, Hourglass, TriangleAlert } from "lucide-react";
import { getI18n } from "@/lib/i18n-server";
import { formatNumber } from "@/lib/labels";
import { SLA_PASS_TARGET } from "@/lib/sla";
import type { SlaOverview } from "@/lib/queries";
import { cardClass } from "@/lib/ui";
import { PassRateRing } from "./pass-rate-ring";

export async function SlaOverviewCard({ overview }: { overview: SlaOverview }) {
  const { t, lang } = await getI18n();
  const monthRequests = formatNumber(overview.monthRequests, lang);
  const target = Math.round(SLA_PASS_TARGET * 100);
  const items = [
    { icon: TriangleAlert, label: t("เกินกำหนด", "ເກີນກຳນົດ", "Overdue"), value: overview.breachedOpen, tone: "text-red-600 bg-red-50", href: "/requests?sla=breached" },
    { icon: Hourglass, label: t("ใกล้ครบกำหนด", "ໃກ້ຄົບກຳນົດ", "Due soon"), value: overview.atRisk, tone: "text-amber-600 bg-amber-50", href: "/requests?status=OPEN" },
    { icon: CirclePause, label: t("หยุดนับ SLA", "ຢຸດນັບ SLA", "SLA paused"), value: overview.paused, tone: "text-slate-600 bg-slate-100", href: "/requests?status=OPEN" },
  ];

  return (
    <section className={`${cardClass} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <Gauge className="h-4 w-4 text-indigo-500" aria-hidden />
            {t("ประสิทธิภาพ SLA เดือนนี้", "ປະສິດທິພາບ SLA ເດືອນນີ້", "SLA performance this month")}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {t(
              `จากคำขอที่ยื่นเดือนนี้ ${monthRequests} รายการ · เป้าหมาย ≥ ${target}%`,
              `ຈາກຄຳຂໍທີ່ຍື່ນເດືອນນີ້ ${monthRequests} ລາຍການ · ເປົ້າໝາຍ ≥ ${target}%`,
              `From ${monthRequests} ${overview.monthRequests === 1 ? "request" : "requests"} submitted this month · target ≥ ${target}%`,
            )}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <PassRateRing title={t("ตอบรับทันเวลา", "ຕອບຮັບທັນເວລາ", "Responded on time")} data={overview.response} />
        <PassRateRing title={t("ส่งมอบทันเวลา", "ສົ່ງມອບທັນເວລາ", "Delivered on time")} data={overview.fulfillment} />
      </div>

      <ul className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
        {items.map(({ icon: Icon, label, value, tone, href }) => (
          <li key={label}>
            <Link href={href} className="flex flex-col items-center gap-1 rounded-xl p-2 text-center transition hover:bg-slate-50">
              <span className={`rounded-lg p-1.5 ${tone}`}>
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-lg font-semibold text-slate-900 tabular-nums">{value}</span>
              <span className="text-[11px] leading-tight text-slate-500">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
