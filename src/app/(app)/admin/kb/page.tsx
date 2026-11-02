import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { deleteArticle, setArticlePublished } from "@/app/actions/kb";
import { Badge } from "@/components/badges";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { PaginationNav } from "@/components/pagination-nav";
import { requireSystemManager } from "@/lib/dal";
import { getI18n } from "@/lib/i18n-server";
import { kbCategoryLabel } from "@/lib/kb";
import { formatDate, formatNumber } from "@/lib/labels";
import { listArticlesForAdmin } from "@/lib/queries";
import { btnPrimary, btnSecondary, cardClass, inputClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("จัดการฐานความรู้", "ຈັດການຖານຄວາມຮູ້", "Manage knowledge base") };
}

type SearchParams = Promise<{ q?: string; page?: string }>;

export default async function AdminKbPage({ searchParams }: { searchParams: SearchParams }) {
  await requireSystemManager();
  const { t, lang } = await getI18n();
  const params = await searchParams;

  const q = params.q?.slice(0, 100);
  const { items, total, page, pageCount } = await listArticlesForAdmin({
    q,
    page: Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
  });

  const hrefFor = (target: number) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (target > 1) query.set("page", String(target));
    const qs = query.toString();
    return qs ? `/admin/kb?${qs}` : "/admin/kb";
  };
  const totalText = formatNumber(total, lang);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {t(`พบ ${totalText} บทความ`, `ພົບ ${totalText} ບົດຄວາມ`, `${totalText} ${total === 1 ? "article" : "articles"} found`)}
        </p>
        <Link href="/kb/new" className={btnPrimary}>
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          {t("เพิ่มบทความ", "ເພີ່ມບົດຄວາມ", "Add article")}
        </Link>
      </div>

      <form method="get" className={`${cardClass} flex flex-wrap gap-3 p-4`}>
        <div className="relative min-w-0 flex-1 basis-64">
          <label htmlFor="q" className="sr-only">
            {t("ค้นหา", "ຄົ້ນຫາ", "Search")}
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={t("ค้นหาหัวข้อหรือสรุป", "ຄົ້ນຫາຫົວຂໍ້ ຫຼື ບົດສະຫຼຸບ", "Search by title or summary")}
            className={`${inputClass} pl-10`}
          />
        </div>
        <button type="submit" className={btnPrimary}>
          {t("ค้นหา", "ຄົ້ນຫາ", "Search")}
        </button>
        {q && (
          <Link href="/admin/kb" className={btnSecondary}>
            {t("ล้าง", "ລ້າງ", "Clear")}
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        <p className={`${cardClass} p-8 text-center text-sm text-slate-500`}>
          {q ? t("ไม่พบบทความที่ตรงกับคำค้น", "ບໍ່ພົບບົດຄວາມທີ່ກົງກັບຄຳຄົ້ນຫາ", "No articles match your search") : t("ยังไม่มีบทความ", "ຍັງບໍ່ມີບົດຄວາມ", "No articles yet")}
        </p>
      ) : (
        <ul className={`${cardClass} divide-y divide-slate-100 overflow-hidden`}>
          {items.map((article) => (
            <li key={article.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 sm:px-5">
              <div className="min-w-0 flex-1 basis-64">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="indigo">{kbCategoryLabel(article.category, lang)}</Badge>
                  {!article.isPublished && <Badge tone="amber">{t("ฉบับร่าง", "ສະບັບຮ່າງ", "Draft")}</Badge>}
                </div>
                <p className="mt-1.5 truncate font-medium text-slate-900">{article.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {t(`อัปเดต ${formatDate(article.updatedAt, lang)}`, `ອັບເດດ ${formatDate(article.updatedAt, lang)}`, `Updated ${formatDate(article.updatedAt, lang)}`)}
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                <Link href={`/kb/${article.id}`} className={btnSecondary}>
                  {t("เปิด", "ເປີດ", "Open")}
                </Link>
                <Link href={`/kb/${article.id}/edit`} className={btnSecondary}>
                  {t("แก้ไข", "ແກ້ໄຂ", "Edit")}
                </Link>
                <ConfirmActionButton
                  action={setArticlePublished}
                  fields={{ articleId: article.id, published: article.isPublished ? "false" : "true" }}
                  label={article.isPublished ? t("ซ่อน", "ເຊື່ອງ", "Hide") : t("เผยแพร่", "ເຜີຍແຜ່", "Publish")}
                  pendingLabel={t("กำลังบันทึก...", "ກຳລັງບັນທຶກ...", "Saving...")}
                  variant="secondary"
                />
                <ConfirmActionButton
                  action={deleteArticle}
                  fields={{ articleId: article.id }}
                  label={t("ลบ", "ລຶບ", "Delete")}
                  pendingLabel={t("กำลังลบ...", "ກຳລັງລຶບ...", "Deleting...")}
                  confirmText={t(
                    `ลบบทความ “${article.title}” อย่างถาวร? ไม่สามารถย้อนกลับได้`,
                    `ລຶບບົດຄວາມ “${article.title}” ຖາວອນບໍ? ບໍ່ສາມາດຍ້ອນກັບໄດ້`,
                    `Delete the article “${article.title}” permanently? This cannot be undone.`,
                  )}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {total > 0 && <PaginationNav page={page} pageCount={pageCount} hrefFor={hrefFor} />}
    </div>
  );
}
