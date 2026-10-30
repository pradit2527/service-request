import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getT } from "@/lib/i18n-server";

export async function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  const t = await getT();
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {href && (
        <Link href={href} className="group inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
          {linkLabel ?? t("ดูทั้งหมด", "ເບິ່ງທັງໝົດ", "View all")}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}
