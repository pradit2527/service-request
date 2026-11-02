import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ArticleForm } from "@/components/article-form";
import { PageHeader } from "@/components/page-header";
import { requireKbEditor } from "@/lib/dal";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("เขียนบทความ", "ຂຽນບົດຄວາມ", "Write article") };
}

export default async function NewArticlePage() {
  const t = await getT();
  await requireKbEditor();

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link href="/kb" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-indigo-600">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("ฐานความรู้", "ຖານຄວາມຮູ້", "Knowledge base")}
      </Link>
      <PageHeader
        title={t("เขียนบทความใหม่", "ຂຽນບົດຄວາມໃໝ່", "Write a new article")}
        description={t(
          "อธิบายวิธีแก้ปัญหาหรือขั้นตอนที่พนักงานทำเองได้ เพื่อลดคำขอที่ซ้ำกัน",
          "ອະທິບາຍວິທີແກ້ບັນຫາ ຫຼື ຂັ້ນຕອນທີ່ພະນັກງານເຮັດເອງໄດ້ ເພື່ອຫຼຸດຜ່ອນຄຳຂໍທີ່ຊ້ຳກັນ",
          "Explain fixes or steps that employees can do on their own, to reduce repeated requests.",
        )}
      />
      <ArticleForm initial={{ id: "", title: "", category: "", summary: "", body: "", isPublished: true }} />
    </div>
  );
}
