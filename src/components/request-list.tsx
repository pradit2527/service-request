import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import { getI18n } from "@/lib/i18n-server";
import { formatDate } from "@/lib/labels";
import type { RequestRow } from "@/lib/queries";
import { REQUEST_TYPE_DEFS } from "@/lib/request-types";
import { cardClass } from "@/lib/ui";
import { Avatar } from "./avatar";
import { StatusBadge } from "./badges";
import { SlaChip } from "./sla-chip";
import { TypeIcon } from "./type-icon";

export function EmptyState({ text }: { text: string }) {
  return (
    <div className={`${cardClass} flex flex-col items-center gap-3 px-4 py-12 text-center`}>
      <span className="rounded-2xl bg-slate-100 p-3 text-slate-400">
        <Inbox className="h-6 w-6" aria-hidden />
      </span>
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

// Card-style rows: used for compact lists and for small screens.
// `showRequester` is for the IT team's views; employees only ever see their own requests.
export async function RequestList({
  items,
  showRequester = false,
  compact = false,
  emptyText,
}: {
  items: RequestRow[];
  showRequester?: boolean;
  /** Narrow columns: hides the assignee column. */
  compact?: boolean;
  emptyText?: string;
}) {
  const { t, lang } = await getI18n();
  if (items.length === 0) return <EmptyState text={emptyText ?? t("ยังไม่มีคำขอ", "ຍັງບໍ່ມີຄຳຂໍ", "No requests yet")} />;

  return (
    <ul className={`${cardClass} divide-y divide-slate-100 overflow-hidden`}>
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/requests/${item.id}`}
            className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-slate-50/80 sm:px-5"
          >
            <TypeIcon type={item.type} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">{item.requestNo}</span>
                <StatusBadge status={item.status} />
                <SlaChip row={item} />
              </div>
              <p className="mt-1.5 truncate font-medium text-slate-900 transition-colors group-hover:text-indigo-700">{item.title}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                <span>{t(REQUEST_TYPE_DEFS[item.type].label)}</span>
                <span aria-hidden>·</span>
                <span>{formatDate(item.createdAt, lang)}</span>
                {showRequester && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{t(`ผู้ขอ ${item.requester.name}`, `ຜູ້ຂໍ ${item.requester.name}`, `Requested by ${item.requester.name}`)}</span>
                  </>
                )}
              </p>
            </div>

            {showRequester && !compact && (
              <div className="hidden shrink-0 items-center gap-2 text-xs text-slate-500 md:flex" title={t("ผู้รับผิดชอบ", "ຜູ້ຮັບຜິດຊອບ", "Assignee")}>
                {item.assignee ? (
                  <>
                    <Avatar name={item.assignee.name} size="sm" />
                    <span className="max-w-28 truncate">{item.assignee.name}</span>
                  </>
                ) : (
                  <span className="rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-slate-400">
                    {t("ยังไม่มอบหมาย", "ຍັງບໍ່ໄດ້ມອບໝາຍ", "Unassigned")}
                  </span>
                )}
              </div>
            )}

            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Table on wide screens, card rows on small ones.
export async function RequestTable({
  items,
  showRequester = false,
  emptyText,
}: {
  items: RequestRow[];
  showRequester?: boolean;
  emptyText?: string;
}) {
  const { t, lang } = await getI18n();
  if (items.length === 0) return <EmptyState text={emptyText ?? t("ยังไม่มีคำขอ", "ຍັງບໍ່ມີຄຳຂໍ", "No requests yet")} />;

  const head = "px-3 py-3 text-left text-xs font-semibold tracking-wide text-slate-500";

  return (
    <>
      <div className="lg:hidden">
        <RequestList items={items} showRequester={showRequester} />
      </div>

      {/* If the columns need more room than the screen has, the table scrolls sideways instead of cutting the last columns off. */}
      <div className={`${cardClass} hidden overflow-x-auto lg:block`}>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80">
            <tr>
              <th scope="col" className={head}>
                {t("คำขอ", "ຄຳຂໍ", "Request")}
              </th>
              {showRequester && (
                <th scope="col" className={head}>
                  {t("ผู้ขอ", "ຜູ້ຂໍ", "Requester")}
                </th>
              )}
              <th scope="col" className={`${head} hidden 2xl:table-cell`}>
                {t("วันที่ยื่น", "ວັນທີຍື່ນ", "Date submitted")}
              </th>
              <th scope="col" className={head}>
                {t("สถานะ", "ສະຖານະ", "Status")}
              </th>
              <th scope="col" className={head}>
                SLA
              </th>
              {showRequester && (
                <th scope="col" className={`${head} hidden 2xl:table-cell`}>
                  {t("ผู้รับผิดชอบ", "ຜູ້ຮັບຜິດຊອບ", "Assignee")}
                </th>
              )}
              <th scope="col" className="w-10" aria-label={t("เปิด", "ເປີດ", "Open")} />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="group transition-colors hover:bg-slate-50/80">
                <td className="max-w-xs px-3 py-3.5 2xl:max-w-md">
                  <div className="flex items-center gap-3">
                    <TypeIcon type={item.type} size="sm" />
                    <div className="min-w-0">
                      <Link href={`/requests/${item.id}`} className="block truncate font-medium text-slate-900 group-hover:text-indigo-700">
                        {item.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">
                        <span className="font-mono">{item.requestNo}</span> · {t(REQUEST_TYPE_DEFS[item.type].label)}
                      </p>
                    </div>
                  </div>
                </td>
                {showRequester && (
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2">
                      <Avatar name={item.requester.name} size="xs" />
                      <span className="max-w-24 truncate 2xl:max-w-32 text-slate-700">{item.requester.name}</span>
                    </div>
                  </td>
                )}
                <td className="hidden px-3 py-3.5 whitespace-nowrap text-slate-600 2xl:table-cell">
                  {formatDate(item.createdAt, lang)}
                  {item.neededBy && (
                    <p className="text-xs text-slate-400">
                      {t(`ต้องการ ${formatDate(item.neededBy, lang)}`, `ຕ້ອງການ ${formatDate(item.neededBy, lang)}`, `Needed by ${formatDate(item.neededBy, lang)}`)}
                    </p>
                  )}
                </td>
                <td className="px-3 py-3.5">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-3 py-3.5">
                  <SlaChip row={item} />
                </td>
                {showRequester && (
                  <td className="hidden px-3 py-3.5 2xl:table-cell">
                    {item.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={item.assignee.name} size="xs" />
                        <span className="max-w-24 truncate 2xl:max-w-28 text-slate-700">{item.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">{t("ยังไม่มอบหมาย", "ຍັງບໍ່ໄດ້ມອບໝາຍ", "Unassigned")}</span>
                    )}
                  </td>
                )}
                <td className="px-2 py-3.5">
                  <Link href={`/requests/${item.id}`} aria-label={t(`เปิด ${item.requestNo}`, `ເປີດ ${item.requestNo}`, `Open ${item.requestNo}`)} className="flex justify-center text-slate-300 group-hover:text-indigo-500">
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
