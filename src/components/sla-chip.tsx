import { CircleCheck, CirclePause, Timer, TriangleAlert } from "lucide-react";
import type { Lang, Translate } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { evaluateSla, formatBusinessDuration, type SlaClock, type SlaSubject } from "@/lib/sla";
import { getSlaCalendar } from "@/lib/sla-calendar";
import { Badge } from "./badges";

/** Tone for a running clock: calm until most of the allowed time is used. */
export function usageTone(percentUsed: number | null): "green" | "amber" | "orange" {
  const used = percentUsed ?? 0;
  return used < 0.6 ? "green" : used < 0.85 ? "amber" : "orange";
}

function describe(clock: SlaClock, label: string, t: Translate, lang: Lang) {
  switch (clock.state) {
    case "running": {
      const left = formatBusinessDuration(clock.remainingMinutes ?? 0, lang);
      return { tone: usageTone(clock.percentUsed), icon: Timer, text: t(`${label} เหลือ ${left}`, `${label} ເຫຼືອ ${left}`, `${label} ${left} left`) };
    }
    case "breached": {
      const over = clock.remainingMinutes !== null && clock.remainingMinutes < 0 ? formatBusinessDuration(clock.remainingMinutes, lang) : null;
      return {
        tone: "red" as const,
        icon: TriangleAlert,
        text:
          over !== null
            ? t(`${label} เกิน ${over}`, `${label} ເກີນ ${over}`, `${label} ${over} over`)
            : t(`${label} เกินกำหนด`, `${label} ເກີນກຳນົດ`, `${label} overdue`),
      };
    }
    case "paused":
      return { tone: "slate" as const, icon: CirclePause, text: t("หยุดนับ SLA", "ຢຸດນັບ SLA", "SLA paused") };
    default:
      return null;
  }
}

// One compact SLA indicator for list rows: the response clock until IT responds, then the fulfillment clock.
export async function SlaChip({ row }: { row: SlaSubject }) {
  const { t, lang } = await getI18n();
  const { response, fulfillment } = evaluateSla(row, new Date(), getSlaCalendar());

  if (row.status === "COMPLETED") {
    if (fulfillment.state === "met") {
      return (
        <Badge tone="green">
          <CircleCheck className="h-3 w-3" aria-hidden />
          {t("ทัน SLA", "ທັນ SLA", "SLA met")}
        </Badge>
      );
    }
    if (fulfillment.state === "breached") {
      return (
        <Badge tone="red">
          <TriangleAlert className="h-3 w-3" aria-hidden />
          {t("เกิน SLA", "ເກີນ SLA", "SLA breached")}
        </Badge>
      );
    }
    return null;
  }

  const responseLabel = t("ตอบรับ", "ຕອບຮັບ", "Response");
  const shown =
    describe(response, responseLabel, t, lang) && response.state !== "paused" && !row.firstResponseAt
      ? describe(response, responseLabel, t, lang)
      : describe(fulfillment, t("ส่งมอบ", "ສົ່ງມອບ", "Fulfillment"), t, lang);
  if (!shown) return null;

  const Icon = shown.icon;
  return (
    <Badge tone={shown.tone}>
      <Icon className="h-3 w-3" aria-hidden />
      {shown.text}
    </Badge>
  );
}
