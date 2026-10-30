import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { getLang } from "@/lib/i18n-server";
import { formatNumber } from "@/lib/labels";
import type { Tone } from "@/lib/status";
import { TONE_STYLE } from "./badges";

const ACCENT: Record<Tone, string> = {
  slate: "from-slate-300 to-slate-400",
  blue: "from-sky-400 to-blue-500",
  indigo: "from-indigo-400 to-violet-500",
  amber: "from-amber-400 to-orange-400",
  green: "from-emerald-400 to-teal-500",
  red: "from-rose-400 to-red-500",
  violet: "from-violet-400 to-purple-500",
  orange: "from-orange-400 to-amber-500",
};

export async function StatCard({
  label,
  value,
  href,
  icon: Icon,
  tone = "slate",
  hint,
}: {
  label: string;
  value: number;
  href: string;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
}) {
  const lang = await getLang();
  const style = TONE_STYLE[tone];
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`rounded-xl p-2 ${style.soft} ${style.text}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{formatNumber(value, lang)}</p>
      <p className="mt-1 min-h-4 text-xs text-slate-500">{hint}</p>
      <span
        className={`absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-linear-to-r transition-transform duration-300 group-hover:scale-x-100 ${ACCENT[tone]}`}
        aria-hidden
      />
    </Link>
  );
}
