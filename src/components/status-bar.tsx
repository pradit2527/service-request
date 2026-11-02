import Link from "next/link";
import { getI18n } from "@/lib/i18n-server";
import { formatNumber } from "@/lib/labels";
import { REQUEST_STATUSES, STATUS_LABEL, STATUS_TONE, type RequestStatus } from "@/lib/status";
import { cardClass } from "@/lib/ui";
import { TONE_STYLE } from "./badges";

// A thin stacked bar showing how requests are spread across statuses, with a clickable legend.
export async function StatusBar({ counts, title }: { counts: Record<RequestStatus, number>; title: string }) {
  const { t, lang } = await getI18n();
  const total = REQUEST_STATUSES.reduce((sum, s) => sum + counts[s], 0);
  const present = REQUEST_STATUSES.filter((s) => counts[s] > 0);

  return (
    <section className={`${cardClass} p-5`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">
          {t("ทั้งหมด", "ທັງໝົດ", "Total")} <span className="text-sm font-semibold text-slate-900 tabular-nums">{formatNumber(total, lang)}</span>
        </p>
      </div>

      {total === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{t("ยังไม่มีข้อมูล", "ຍັງບໍ່ມີຂໍ້ມູນ", "No data yet")}</p>
      ) : (
        <>
          <div className="mt-4 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={title}>
            {present.map((s) => (
              <span
                key={s}
                className={`${TONE_STYLE[STATUS_TONE[s]].dot} first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${(counts[s] / total) * 100}%` }}
                title={`${t(STATUS_LABEL[s])}: ${counts[s]}`}
              />
            ))}
          </div>
          <ul className="mt-3 -mb-1.5">
            {present.map((s) => (
              <li key={s}>
                <Link
                  href={`/requests?status=${s}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-[13px] transition-colors hover:bg-slate-50"
                >
                  <span className="flex min-w-0 items-center gap-2.5 text-slate-600">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_STYLE[STATUS_TONE[s]].dot}`} aria-hidden />
                    <span className="truncate">{t(STATUS_LABEL[s])}</span>
                  </span>
                  <span className="font-medium text-slate-900 tabular-nums">{counts[s]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
