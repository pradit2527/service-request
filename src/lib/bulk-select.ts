// Picking several rows of a list for one action. Pure module.

/** The most requests one click may act on. */
export const MAX_BULK = 50;

/** The distinct, non-empty ids among the submitted values (text only), at most `max` of them. */
export function selectedIds(values: readonly FormDataEntryValue[], max: number = MAX_BULK): string[] {
  const ids = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const id = value.trim();
    if (id !== "") ids.add(id);
    if (ids.size === max) break;
  }
  return [...ids];
}
