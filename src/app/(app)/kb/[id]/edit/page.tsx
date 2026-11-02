import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ArticleForm } from "@/components/article-form";
import { PageHeader } from "@/components/page-header";
import { requireKbEditor } from "@/lib/dal";
import { getT } from "@/lib/i18n-server";
import { getArticle } from "@/lib/queries";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("แก้ไขบทความ", "ແກ້ໄຂບົດຄວາມ", "Edit article") };
}

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const user = await requireKbEditor();
  const { id } = await params;
  const article = await getArticle(user, id);
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link href={`/kb/${article.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-indigo-600">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("กลับไปที่บทความ", "ກັບໄປທີ່ບົດຄວາມ", "Back to article")}
      </Link>
      <PageHeader title={t("แก้ไขบทความ", "ແກ້ໄຂບົດຄວາມ", "Edit article")} />
      <ArticleForm
        initial={{
          id: article.id,
          title: article.title,
          category: article.category,
          summary: article.summary,
          body: article.body,
          isPublished: article.isPublished,
        }}
      />
    </div>
  );
}
