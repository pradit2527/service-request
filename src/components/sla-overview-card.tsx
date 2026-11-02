import Link from "next/link";
import { Info } from "lucide-react";
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
    { label: t("เกินกำหนด", "ເກີນກຳນົດ", "Overdue"), value: overview.breachedOpen, dot: "bg-red-500", text: "text-red-600", href: "/requests?sla=breached" },
    { label: t("ใกล้ครบกำหนด", "ໃກ້ຄົບກຳນົດ", "Due soon"), value: overview.atRisk, dot: "bg-amber-500", text: "text-amber-600", href: "/requests?status=OPEN" },
    { label: t("หยุดนับ SLA", "ຢຸດນັບ SLA", "SLA paused"), value: overview.paused, dot: "bg-slate-300", text: "text-slate-900", href: "/requests?status=OPEN" },
  ];

  return (
    <section className={`${cardClass} p-5`}>
      <h2 className="text-[15px] font-semibold text-slate-900">{t("ประสิทธิภาพ SLA เดือนนี้", "ປະສິດທິພາບ SLA ເດືອນນີ້", "SLA performance this month")}</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        {t(
          `จากคำขอที่ยื่นเดือนนี้ ${monthRequests} รายการ · เป้าหมาย ≥ ${target}%`,
          `ຈາກຄຳຂໍທີ່ຍື່ນເດືອນນີ້ ${monthRequests} ລາຍການ · ເປົ້າໝາຍ ≥ ${target}%`,
          `From ${monthRequests} ${overview.monthRequests === 1 ? "request" : "requests"} submitted this month · target ≥ ${target}%`,
        )}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <PassRateRing title={t("ตอบรับทันเวลา", "ຕອບຮັບທັນເວລາ", "Responded on time")} data={overview.response} />
        <PassRateRing title={t("ส่งมอบทันเวลา", "ສົ່ງມອບທັນເວລາ", "Delivered on time")} data={overview.fulfillment} />
      </div>

      <ul className="mt-5 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-4">
        {items.map(({ label, value, dot, text, href }) => (
          <li key={label}>
            <Link href={href} className="block rounded-lg px-2 py-1 text-center transition-colors hover:bg-slate-50">
              <span className={`block text-lg leading-tight font-semibold tabular-nums ${value > 0 ? text : "text-slate-900"}`}>{value}</span>
              <span className="mt-0.5 flex items-center justify-center gap-1.5 text-[11px] leading-tight text-slate-500">
                {value > 0 && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />}
                {label}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <details className="group mt-4 text-xs text-slate-500">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 transition-colors hover:text-slate-900 [&::-webkit-details-marker]:hidden">
          <Info className="h-3.5 w-3.5" aria-hidden />
          {t("วิธีนับ SLA", "ວິທີນັບ SLA", "How SLA is counted")}
        </summary>
        <p className="mt-2 leading-relaxed">
          {t(
            "SLA นับเฉพาะเวลาทำการ และหยุดนับเมื่อรอหัวหน้าอนุมัติ ข้อมูลจากผู้ขอ หรือ Vendor / งบประมาณ",
            "SLA ນັບສະເພາະເວລາເຮັດວຽກ ແລະ ຢຸດນັບເມື່ອລໍຖ້າຫົວໜ້າອະນຸມັດ ຂໍ້ມູນຈາກຜູ້ຂໍ ຫຼື Vendor / ງົບປະມານ",
            "SLA counts business hours only and pauses while waiting for manager approval, information from the requester, or a Vendor / budget",
          )}
        </p>
      </details>
    </section>
  );
}
