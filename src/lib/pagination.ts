// Which page numbers to show in a pager. Pure module.

export type PageItem = number | "gap";

/**
 * Which page to show and how many rows to skip. A requested page outside `1..pageCount` (for example
 * after the last row of the last page was deleted) falls back to the nearest page that exists.
 */
export function paginate(total: number, requested: number, pageSize: number): { page: number; pageCount: number; skip: number } {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const wanted = Number.isFinite(requested) ? Math.trunc(requested) : 1;
  const page = Math.min(Math.max(1, wanted), pageCount);
  return { page, pageCount, skip: (page - 1) * pageSize };
}

/**
 * The first page, the last page and the pages around the current one, with "gap" where pages are
 * skipped. A gap that would hide only one page shows that page instead, so "…" always means two or more.
 */
export function pageItems(current: number, pageCount: number, around = 1): PageItem[] {
  const wanted = new Set<number>([1, pageCount]);
  for (let page = current - around; page <= current + around; page++) {
    if (page >= 1 && page <= pageCount) wanted.add(page);
  }

  const pages = [...wanted].sort((a, b) => a - b);
  const items: PageItem[] = [];
  pages.forEach((page, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined) {
      if (page - previous === 2) items.push(previous + 1);
      else if (page - previous > 2) items.push("gap");
    }
    items.push(page);
  });
  return items;
}
