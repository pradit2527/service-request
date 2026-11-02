import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getLang } from "@/lib/i18n-server";
import { formatNumber } from "@/lib/labels";

export type StatItem = {
  label: string;
  value: number;
  href: string;
  /** Colours the figure while it is above zero: red for a problem, amber for something waiting for someone. */
  alert?: "danger" | "warning";
  hint?: string;
};

const ALERT = {
  danger: { text: "text-red-600", dot: "bg-red-500" },
  warning: { text: "text-amber-600", dot: "bg-amber-500" },
} as const;

/**
 * The key figures in one card, told apart by hairlines instead of a card each. Only a figure that needs attention
 * gets a colour. The number of columns follows the room the strip has (container queries), not the screen.
 */
export async function StatStrip({ items }: { items: StatItem[] }) {
  const lang = await getLang();

  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-200/70 shadow-card @min-[560px]:grid-cols-3 @min-[1000px]:grid-cols-6">
        {items.map((item) => {
          const alert = item.alert && item.value > 0 ? ALERT[item.alert] : null;
          return (
            <Link key={item.label} href={item.href} className="group relative block bg-white px-4 py-4 transition-colors hover:bg-slate-50 sm:px-5 sm:py-5">
              <p className="flex items-center gap-1.5 text-[13px] text-slate-500">
                {alert && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${alert.dot}`} aria-hidden />}
                <span className="truncate">{item.label}</span>
              </p>
              <p className={`mt-2.5 text-[32px] leading-none font-semibold tracking-tight tabular-nums ${alert ? alert.text : "text-slate-900"}`}>
                {formatNumber(item.value, lang)}
              </p>
              <p className="mt-2 min-h-4 truncate text-xs text-slate-400">{item.hint}</p>
              <ArrowUpRight className="absolute top-4 right-4 h-3.5 w-3.5 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
