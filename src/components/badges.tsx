import { Flame } from "lucide-react";
import { getT } from "@/lib/i18n-server";
import { PRIORITY_LABEL, type Priority } from "@/lib/labels";
import { STATUS_LABEL, STATUS_TONE, type RequestStatus, type Tone } from "@/lib/status";

export const TONE_STYLE: Record<Tone, { pill: string; dot: string; soft: string; text: string }> = {
  slate: { pill: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400", soft: "bg-slate-100", text: "text-slate-600" },
  blue: { pill: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500", soft: "bg-sky-50", text: "text-sky-600" },
  indigo: { pill: "bg-indigo-50 text-indigo-700 ring-indigo-200", dot: "bg-indigo-500", soft: "bg-indigo-50", text: "text-indigo-600" },
  amber: { pill: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500", soft: "bg-amber-50", text: "text-amber-600" },
  green: { pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", soft: "bg-emerald-50", text: "text-emerald-600" },
  red: { pill: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500", soft: "bg-red-50", text: "text-red-600" },
  violet: { pill: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500", soft: "bg-violet-50", text: "text-violet-600" },
  orange: { pill: "bg-orange-50 text-orange-700 ring-orange-200", dot: "bg-orange-500", soft: "bg-orange-50", text: "text-orange-600" },
};

const PRIORITY_TONE: Record<Priority, Tone> = {
  LOW: "slate",
  MEDIUM: "blue",
  HIGH: "orange",
  URGENT: "red",
};

export function Badge({ tone, dot = false, children }: { tone: Tone; dot?: boolean; children: React.ReactNode }) {
  const style = TONE_STYLE[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.pill}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />}
      {children}
    </span>
  );
}

export async function StatusBadge({ status }: { status: RequestStatus }) {
  const t = await getT();
  return (
    <Badge tone={STATUS_TONE[status]} dot>
      {t(STATUS_LABEL[status])}
    </Badge>
  );
}

export async function PriorityBadge({ priority }: { priority: Priority }) {
  const t = await getT();
  return (
    <Badge tone={PRIORITY_TONE[priority]}>
      {priority === "URGENT" && <Flame className="-ml-0.5 h-3 w-3" aria-hidden />}
      {t(PRIORITY_LABEL[priority])}
    </Badge>
  );
}
