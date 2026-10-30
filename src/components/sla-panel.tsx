import { Gauge } from "lucide-react";
import { l, type Lang, type Localized, type Translate } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { formatDateTime } from "@/lib/labels";
import {
  BUSINESS_HOURS_TEXT,
  SLA_TIER_DEF,
  evaluateSla,
  formatBusinessDuration,
  type SlaClock,
  type SlaSubject,
} from "@/lib/sla";
import { getSlaCalendar } from "@/lib/sla-calendar";
import { cardClass } from "@/lib/ui";
import { Badge } from "./badges";
import { usageTone } from "./sla-chip";

const BAR: Record<"green" | "amber" | "orange" | "red" | "slate", string> = {
  green: "bg-linear-to-r from-emerald-400 to-teal-500",
  amber: "bg-linear-to-r from-amber-400 to-orange-400",
  orange: "bg-linear-to-r from-orange-400 to-red-400",
  red: "bg-linear-to-r from-rose-500 to-red-600",
  slate: "bg-slate-300",
};

const STATE_TEXT: Record<SlaClock["state"], Localized> = {
  met: l("ทันกำหนด", "ທັນກຳນົດ", "On time"),
  breached: l("เกินกำหนด", "ເກີນກຳນົດ", "Overdue"),
  running: l("กำลังนับเวลา", "ກຳລັງນັບເວລາ", "Running"),
  paused: l("หยุดนับเวลา", "ຢຸດນັບເວລາ", "Paused"),
  not_applicable: l("ไม่นับ SLA", "ບໍ່ນັບ SLA", "No SLA"),
};

function Meter({ title, target, clock, t, lang }: { title: string; target: number; clock: SlaClock; t: Translate; lang: Lang }) {
  const tone =
    clock.state === "breached" ? "red" : clock.state === "paused" ? "slate" : clock.state === "running" ? usageTone(clock.percentUsed) : "green";
  const filled = clock.state === "met" ? 1 : Math.min(clock.percentUsed ?? 0, 1);
  const badgeTone = clock.state === "met" ? "green" : clock.state === "breached" ? "red" : clock.state === "paused" ? "slate" : "blue";

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        {clock.state !== "not_applicable" && <Badge tone={badgeTone}>{t(STATE_TEXT[clock.state])}</Badge>}
      </div>
      <p className="mt-0.5 text-xs text-slate-500">
        {t(`เป้าหมาย ≤ ${formatBusinessDuration(target, lang)}`, `ເປົ້າໝາຍ ≤ ${formatBusinessDuration(target, lang)}`, `Target ≤ ${formatBusinessDuration(target, lang)}`)}
      </p>

      {clock.state === "not_applicable" ? (
        <p className="mt-2 text-xs text-slate-400">
          {t("ไม่นับ SLA สำหรับคำขอนี้", "ບໍ່ນັບ SLA ສຳລັບຄຳຂໍນີ້", "SLA does not apply to this request")}
        </p>
      ) : (
        <>
          <div
            className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label={title}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(filled * 100)}
          >
            <div className={`h-full rounded-full transition-all ${BAR[tone]}`} style={{ width: `${Math.max(filled * 100, 3)}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {clock.state === "met" || clock.state === "breached"
              ? clock.doneAt &&
                t(`เสร็จเมื่อ ${formatDateTime(clock.doneAt, lang)}`, `ສຳເລັດເມື່ອ ${formatDateTime(clock.doneAt, lang)}`, `Completed ${formatDateTime(clock.doneAt, lang)}`)
              : clock.dueAt && t(`ครบกำหนด ${formatDateTime(clock.dueAt, lang)}`, `ຄົບກຳນົດ ${formatDateTime(clock.dueAt, lang)}`, `Due ${formatDateTime(clock.dueAt, lang)}`)}
            {clock.state === "running" &&
              clock.remainingMinutes !== null &&
              t(
                ` · เหลือ ${formatBusinessDuration(clock.remainingMinutes, lang)}`,
                ` · ເຫຼືອ ${formatBusinessDuration(clock.remainingMinutes, lang)}`,
                ` · ${formatBusinessDuration(clock.remainingMinutes, lang)} left`,
              )}
            {clock.state === "breached" &&
              clock.dueAt &&
              t(` · กำหนดคือ ${formatDateTime(clock.dueAt, lang)}`, ` · ກຳນົດແມ່ນ ${formatDateTime(clock.dueAt, lang)}`, ` · was due ${formatDateTime(clock.dueAt, lang)}`)}
          </p>
        </>
      )}
    </div>
  );
}

export async function SlaPanel({ request }: { request: SlaSubject }) {
  const { t, lang } = await getI18n();
  const hours = t(BUSINESS_HOURS_TEXT);
  const { response, fulfillment } = evaluateSla(request, new Date(), getSlaCalendar());
  const def = SLA_TIER_DEF[request.slaTier];

  return (
    <section className={`${cardClass} p-4`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Gauge className="h-4 w-4 text-indigo-500" aria-hidden />
          SLA
        </h2>
        <Badge tone="violet">{def.label}</Badge>
      </div>

      <div className="space-y-5">
        <Meter title={t("เวลาตอบรับ", "ເວລາຕອບຮັບ", "Response time")} target={def.responseMinutes} clock={response} t={t} lang={lang} />
        <Meter title={t("เวลาส่งมอบ", "ເວລາສົ່ງມອບ", "Fulfillment time")} target={def.fulfillmentMinutes} clock={fulfillment} t={t} lang={lang} />
      </div>

      <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">
        {t(
          `นับเฉพาะเวลาทำการ ${hours} และหยุดนับเมื่อรอหัวหน้าอนุมัติ รอข้อมูลจากผู้ขอ หรือรอ Vendor / งบประมาณ`,
          `ນັບສະເພາະເວລາເຮັດວຽກ ${hours} ແລະ ຢຸດນັບເມື່ອລໍຖ້າຫົວໜ້າອະນຸມັດ ລໍຖ້າຂໍ້ມູນຈາກຜູ້ຂໍ ຫຼື ລໍຖ້າ Vendor / ງົບປະມານ`,
          `Only business hours (${hours}) are counted. The clock stops while waiting for manager approval, information from the requester, or a Vendor / budget.`,
        )}
      </p>
    </section>
  );
}
