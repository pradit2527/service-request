import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Plus, Search } from "lucide-react";
import { Badge } from "@/components/badges";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/request-list";
import { requireUser } from "@/lib/dal";
import { l } from "@/lib/i18n";
import { getI18n, getT } from "@/lib/i18n-server";
import { KB_CATEGORIES, isKbCategory, kbCategoryLabel } from "@/lib/kb";
import { formatDate } from "@/lib/labels";
import { canEditKb } from "@/lib/permissions";
import { searchArticles } from "@/lib/queries";
import { btnPrimary, btnSecondary, cardClass, inputClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("ฐานความรู้", "ຖານຄວາມຮູ້", "Knowledge base") };
}

export default async function KnowledgeBasePage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { t, lang } = await getI18n();
  const user = await requireUser();
  const params = await searchParams;
  const q = params.q?.slice(0, 100) ?? "";
  const category = isKbCategory(params.category) ? params.category : undefined;

  const articles = await searchArticles(user, { q, category });

  const chipHref = (value?: string) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (value) query.set("category", value);
    const qs = query.toString();
    return qs ? `/kb?${qs}` : "/kb";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("ฐานความรู้", "ຖານຄວາມຮູ້", "Knowledge base")}
        description={t(
          "คู่มือและวิธีแก้ไขปัญหาเบื้องต้นจากทีม IT ลองค้นหาก่อนยื่นคำขอ อาจได้คำตอบทันที",
          "ຄູ່ມື ແລະ ວິທີແກ້ໄຂບັນຫາເບື້ອງຕົ້ນຈາກທີມ IT ລອງຄົ້ນຫາກ່ອນຍື່ນຄຳຂໍ ອາດໄດ້ຄຳຕອບທັນທີ",
          "Guides and basic troubleshooting from the IT team. Try searching before submitting a request: you may find an answer right away.",
        )}
        actions={
          canEditKb(user) && (
            <Link href="/kb/new" className={btnPrimary}>
              <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              {t("เขียนบทความ", "ຂຽນບົດຄວາມ", "Write article")}
            </Link>
          )
        }
      />

      <form action="/kb" method="get" role="search" className={`${cardClass} flex items-center gap-2 p-2`}>
        {category && <input type="hidden" name="category" value={category} />}
        <label htmlFor="kb-q" className="sr-only">
          {t("ค้นหาบทความ", "ຄົ້ນຫາບົດຄວາມ", "Search articles")}
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            id="kb-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={t("ค้นหาบทความ เช่น Wi-Fi, VPN, รีเซ็ตรหัสผ่าน", "ຄົ້ນຫາບົດຄວາມ ເຊັ່ນ Wi-Fi, VPN, ຣີເຊັດລະຫັດຜ່ານ", "Search articles, e.g. Wi-Fi, VPN, reset password")}
            className={`${inputClass} border-0 pl-10 shadow-none`}
          />
        </div>
        <button type="submit" className={btnPrimary}>
          {t("ค้นหา", "ຄົ້ນຫາ", "Search")}
        </button>
      </form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={t("หมวดหมู่", "ໝວດໝູ່", "Categories")}>
        {[{ value: "", label: l("ทั้งหมด", "ທັງໝົດ", "All") }, ...KB_CATEGORIES].map((c) => {
          const active = (category ?? "") === c.value;
          return (
            <Link
              key={c.value || "all"}
              href={chipHref(c.value || undefined)}
              aria-current={active ? "true" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                active ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "bg-white text-slate-600 ring-1 ring-slate-200 ring-inset hover:bg-slate-50"
              }`}
            >
              {t(c.label)}
            </Link>
          );
        })}
      </div>

      {articles.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            text={q || category ? t("ไม่พบบทความที่ตรงกับเงื่อนไข", "ບໍ່ພົບບົດຄວາມທີ່ກົງກັບເງື່ອນໄຂ", "No articles match your search") : t("ยังไม่มีบทความ", "ຍັງບໍ່ມີບົດຄວາມ", "No articles yet")}
          />
          <div className="text-center">
            <Link href="/requests/new" className={btnSecondary}>
              {t("ยื่นคำขอบริการ", "ຍື່ນຄຳຂໍບໍລິການ", "Submit a service request")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {articles.map((article) => (
            <li key={article.id}>
              <Link
                href={`/kb/${article.id}`}
                className={`${cardClass} group flex h-full gap-4 p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <BookOpen className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-indigo-600">{kbCategoryLabel(article.category, lang)}</span>
                    {!article.isPublished && <Badge tone="amber">{t("ฉบับร่าง", "ສະບັບຮ່າງ", "Draft")}</Badge>}
                  </div>
                  <p className="mt-1 font-medium text-slate-900 transition group-hover:text-indigo-700">{article.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{article.summary}</p>
                  <p className="mt-2 text-xs text-slate-400">{t(`อัปเดต ${formatDate(article.updatedAt, lang)}`, `ອັບເດດ ${formatDate(article.updatedAt, lang)}`, `Updated ${formatDate(article.updatedAt, lang)}`)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
