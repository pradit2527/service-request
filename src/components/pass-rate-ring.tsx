import { getT } from "@/lib/i18n-server";
import { SLA_PASS_TARGET, type PassRate } from "@/lib/sla";

// Thin circular gauge for a monthly SLA pass rate, coloured by whether it reaches the target.
export async function PassRateRing({ title, data }: { title: string; data: PassRate }) {
  const t = await getT();
  const size = 92;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const rate = data.rate;
  const reached = rate !== null && rate >= SLA_PASS_TARGET;
  const color = rate === null ? "text-slate-300" : reached ? "text-emerald-500" : rate >= 0.75 ? "text-amber-500" : "text-red-500";

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={`${title} ${rate === null ? t("ยังไม่มีข้อมูล", "ຍັງບໍ່ມີຂໍ້ມູນ", "No data yet") : `${Math.round(rate * 100)}%`}`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-slate-100" />
          {rate !== null && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${circumference * rate} ${circumference}`}
              className={`stroke-current transition-all duration-700 ${color}`}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tracking-tight text-slate-900 tabular-nums">{rate === null ? "—" : `${Math.round(rate * 100)}%`}</span>
        </div>
      </div>
      <p className="mt-2.5 text-[13px] font-medium text-slate-900">{title}</p>
      <p className="text-xs text-slate-500">
        {t(`ทัน ${data.met} · เกิน ${data.breached}`, `ທັນ ${data.met} · ເກີນ ${data.breached}`, `Met ${data.met} · Breached ${data.breached}`)}
      </p>
    </div>
  );
}
