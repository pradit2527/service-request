import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { SortDir } from "@/lib/report-params";
import { cardClass } from "@/lib/ui";
import { EmptyState } from "./request-list";

export type Column<T> = {
  key: string;
  header: string;
  /** Makes the header a link that sorts by this column. */
  sortKey?: string;
  className?: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
  /** On a small screen (cards): "title" goes first, "meta" becomes a label and value, "hidden" is left out. */
  card?: "title" | "meta" | "hidden";
  /** In the table, show this column only from this screen width up, so the table fits without sideways scrolling. */
  showFrom?: "xl" | "2xl";
};

// Written out in full so Tailwind sees the class names.
const SHOW_FROM = { xl: "hidden xl:table-cell", "2xl": "hidden 2xl:table-cell" } as const;

/**
 * A table whose search, filters, sort and page all live in the address, so the server does the work.
 * From `lg` up it is a real table (sticky header, striped rows); below that every row becomes a card.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  sort,
  hrefForSort,
  actions,
  actionsHeader,
  emptyText,
  footer,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  sort?: { key: string; dir: SortDir };
  hrefForSort?: (sortKey: string, dir: SortDir) => string;
  actions?: (row: T) => React.ReactNode;
  actionsHeader?: string;
  emptyText: string;
  /** A last row (for example the totals) shown under the others, in the table and as a card. */
  footer?: T;
}) {
  if (rows.length === 0) return <EmptyState text={emptyText} />;

  const titles = columns.filter((column) => column.card === "title");
  const metas = columns.filter((column) => (column.card ?? "meta") === "meta");

  return (
    <>
      <div className={`${cardClass} hidden overflow-x-auto lg:block`}>
        <table className="w-full min-w-max text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/95 text-xs font-semibold tracking-wide text-slate-500 uppercase backdrop-blur">
            <tr className="border-b border-slate-200">
              {columns.map((column) => {
                const active = sort?.key === column.sortKey;
                const nextDir: SortDir = active && sort?.dir === "asc" ? "desc" : "asc";
                const Icon = active ? (sort?.dir === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={active ? (sort?.dir === "asc" ? "ascending" : "descending") : undefined}
                    className={`px-3 py-3 whitespace-nowrap ${column.align === "right" ? "text-right" : ""} ${column.showFrom ? SHOW_FROM[column.showFrom] : ""}`}
                  >
                    {column.sortKey && hrefForSort ? (
                      <Link
                        href={hrefForSort(column.sortKey, nextDir)}
                        className={`inline-flex items-center gap-1 transition hover:text-indigo-600 ${active ? "text-indigo-700" : ""}`}
                      >
                        {column.header}
                        <Icon className={`h-3.5 w-3.5 ${active ? "" : "text-slate-300"}`} aria-hidden />
                      </Link>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
              {actions && (
                <th scope="col" className="px-3 py-3 text-right whitespace-nowrap">
                  {actionsHeader}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="odd:bg-white even:bg-slate-50/50 transition-colors hover:bg-indigo-50/40">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-3 py-3 align-middle ${column.align === "right" ? "text-right" : ""} ${column.showFrom ? SHOW_FROM[column.showFrom] : ""} ${column.className ?? ""}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
                {actions && (
                  <td className="px-3 py-3 align-middle">
                    <div className="flex flex-wrap items-start justify-end gap-2">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          {footer !== undefined && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-100/70 font-semibold text-slate-900">
                {columns.map((column) => (
                  <td key={column.key} className={`px-3 py-3 ${column.align === "right" ? "text-right" : ""} ${column.showFrom ? SHOW_FROM[column.showFrom] : ""}`}>
                    {column.render(footer)}
                  </td>
                ))}
                {actions && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <ul className="space-y-3 lg:hidden">
        {[...rows, ...(footer !== undefined ? [footer] : [])].map((row, index) => (
          <li key={index < rows.length ? rowKey(row) : "footer"} className={`${cardClass} space-y-3 p-4 ${index >= rows.length ? "bg-slate-50" : ""}`}>
            {titles.map((column) => (
              <div key={column.key} className="min-w-0">
                {column.render(row)}
              </div>
            ))}
            {metas.length > 0 && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-3 text-sm">
                {metas.map((column) => (
                  <div key={column.key} className="min-w-0">
                    <dt className="text-xs text-slate-500">{column.header}</dt>
                    <dd className="mt-0.5 break-words text-slate-800">{column.render(row)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {actions && index < rows.length && <div className="flex flex-wrap items-start gap-2 border-t border-slate-100 pt-3">{actions(row)}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}
