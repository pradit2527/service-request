import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getI18n } from "@/lib/i18n-server";
import type { RequestRow } from "@/lib/queries";
import { REQUEST_TYPE_DEFS } from "@/lib/request-types";
import { Avatar } from "./avatar";
import { EmptyState } from "./request-list";
import { SlaNote } from "./sla-chip";
import { TypeIcon } from "./type-icon";

/**
 * A quiet work queue for the IT team's home page: one hairline row per request, the SLA as plain text that turns
 * colour only when the clock is running short or late, and the assignee as a small avatar.
 */
export async function QueueList({ items, emptyText }: { items: RequestRow[]; emptyText: string }) {
  const { t } = await getI18n();
  if (items.length === 0) return <EmptyState text={emptyText} />;

  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
      {items.map((item) => (
        <li key={item.id}>
          <Link href={`/requests/${item.id}`} className="group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-slate-50 sm:px-5">
            <TypeIcon type={item.type} size="sm" />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 transition-colors group-hover:text-indigo-700">{item.title}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                <span className="font-mono">{item.requestNo}</span> · {t(REQUEST_TYPE_DEFS[item.type].label)} · {item.requester.name}
              </p>
              <div className="mt-0.5 sm:hidden">
                <SlaNote row={item} />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden sm:block">
                <SlaNote row={item} />
              </span>
              {item.assignee ? (
                <span title={item.assignee.name}>
                  <Avatar name={item.assignee.name} size="xs" />
                </span>
              ) : (
                <span
                  className="h-6 w-6 rounded-full border border-dashed border-slate-300"
                  title={t("ยังไม่มอบหมาย", "ຍັງບໍ່ໄດ້ມອບໝາຍ", "Unassigned")}
                  aria-label={t("ยังไม่มอบหมาย", "ຍັງບໍ່ໄດ້ມອບໝາຍ", "Unassigned")}
                />
              )}
              <ChevronRight className="hidden h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500 sm:block" aria-hidden />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
