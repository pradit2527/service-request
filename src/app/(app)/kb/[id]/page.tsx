import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Pencil } from "lucide-react";
import { Badge } from "@/components/badges";
import { KbBody } from "@/components/kb-body";
import { requireUser } from "@/lib/dal";
import { getI18n, getT } from "@/lib/i18n-server";
import { kbCategoryLabel } from "@/lib/kb";
import { formatDate } from "@/lib/labels";
import { canEditKb } from "@/lib/permissions";
import { getArticle, searchArticles } from "@/lib/queries";
import { btnPrimary, btnSecondary, cardClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("บทความ", "ບົດຄວາມ", "Article") };
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { t, lang } = await getI18n();
  const user = await requireUser();
  const { id } = await params;
  const article = await getArticle(user, id);
  if (!article) notFound();

  // Other articles from the same category, for the side column.
  const related = (await searchArticles(user, { category: article.category })).filter((a) => a.id !== article.id).slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link href="/kb" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("ฐานความรู้", "ຖານຄວາມຮູ້", "Knowledge base")}
        </Link>
        {canEditKb(user) && (
          <Link href={`/kb/${article.id}/edit`} className={btnSecondary}>
            <Pencil className="h-4 w-4" aria-hidden />
            {t("แก้ไข", "ແກ້ໄຂ", "Edit")}
          </Link>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
        <article className={`${cardClass} min-w-0 overflow-hidden`}>
          <div className="h-1.5 bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500" aria-hidden />
          <div className="p-6 sm:p-8 xl:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="indigo">{kbCategoryLabel(article.category, lang)}</Badge>
              {!article.isPublished && <Badge tone="amber">{t("ฉบับร่าง · เห็นเฉพาะทีม IT หัวหน้างาน และผู้ดูแลระบบ", "ສະບັບຮ່າງ · ເຫັນສະເພາະທີມ IT, ຫົວໜ້າ ແລະ ຜູ້ດູແລລະບົບ", "Draft · visible to the IT team, managers and administrators only")}</Badge>}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{article.title}</h1>
            <p className="mt-2 text-slate-500 xl:text-lg">{article.summary}</p>
            <p className="mt-3 text-xs text-slate-400">
              {t(
                `โดย ${article.author.name} · อัปเดต ${formatDate(article.updatedAt, lang)}`,
                `ໂດຍ ${article.author.name} · ອັບເດດ ${formatDate(article.updatedAt, lang)}`,
                `By ${article.author.name} · Updated ${formatDate(article.updatedAt, lang)}`,
              )}
            </p>

            <hr className="my-6 border-slate-100" />
            <KbBody body={article.body} />
          </div>
        </article>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-6">
          <section className="rounded-2xl bg-linear-to-br from-emerald-50 to-teal-50 p-5 ring-1 ring-emerald-200 ring-inset">
            <p className="font-semibold text-slate-900">{t("ยังไม่ได้คำตอบที่ต้องการ?", "ຍັງບໍ່ໄດ້ຄຳຕອບທີ່ຕ້ອງການບໍ?", "Didn't find the answer you need?")}</p>
            <p className="mt-1 text-sm text-slate-600">
              {t("ยื่นคำขอบริการให้ทีม IT ดำเนินการให้ได้เลย", "ຍື່ນຄຳຂໍບໍລິການໃຫ້ທີມ IT ດຳເນີນການໃຫ້ໄດ້ເລີຍ", "Submit a service request and the IT team will take care of it.")}
            </p>
            <Link href="/requests/new" className={`${btnPrimary} mt-4 w-full`}>
              {t("ยื่นคำขอบริการ", "ຍື່ນຄຳຂໍບໍລິການ", "Submit a service request")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </section>

          {related.length > 0 && (
            <section className={`${cardClass} p-5`}>
              <h2 className="text-sm font-semibold text-slate-900">{t("บทความที่เกี่ยวข้อง", "ບົດຄວາມທີ່ກ່ຽວຂ້ອງ", "Related articles")}</h2>
              <ul className="mt-3 space-y-1">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/kb/${item.id}`}
                      className="group flex items-start gap-2.5 rounded-xl p-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-indigo-700"
                    >
                      <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" aria-hidden />
                      <span className="min-w-0 leading-snug">{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
