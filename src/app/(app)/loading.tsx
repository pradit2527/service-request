import { getT } from "@/lib/i18n-server";

// Skeleton shown while a page's data loads.
export default async function Loading() {
  const t = await getT();
  const block = "animate-pulse rounded-2xl bg-slate-200/70";
  return (
    <div className="space-y-6" role="status" aria-busy="true" aria-label={t("กำลังโหลด", "ກຳລັງໂຫຼດ", "Loading")}>
      <div className={`${block} h-44 rounded-3xl`} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-28`} />
        ))}
      </div>
      <div className={`${block} h-64`} />
    </div>
  );
}
