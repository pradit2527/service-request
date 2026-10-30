"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { requireStaff } from "@/lib/dal";
import { db } from "@/lib/db";
import type { Translate } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { isKbCategory } from "@/lib/kb";

function articleSchema(t: Translate) {
  return z.object({
    id: z.string(),
    title: z
      .string()
      .trim()
      .min(3, { error: t("หัวข้อต้องมีอย่างน้อย 3 ตัวอักษร", "ຫົວຂໍ້ຕ້ອງມີຢ່າງໜ້ອຍ 3 ຕົວອັກສອນ", "Title must be at least 3 characters") })
      .max(150, { error: t("หัวข้อยาวเกิน 150 ตัวอักษร", "ຫົວຂໍ້ຍາວເກີນ 150 ຕົວອັກສອນ", "Title must be 150 characters or fewer") }),
    category: z.string().refine(isKbCategory, { error: t("กรุณาเลือกหมวดหมู่", "ກະລຸນາເລືອກໝວດໝູ່", "Please select a category") }),
    summary: z
      .string()
      .trim()
      .min(10, { error: t("สรุปต้องมีอย่างน้อย 10 ตัวอักษร", "ບົດສະຫຼຸບຕ້ອງມີຢ່າງໜ້ອຍ 10 ຕົວອັກສອນ", "Summary must be at least 10 characters") })
      .max(300, { error: t("สรุปยาวเกิน 300 ตัวอักษร", "ບົດສະຫຼຸບຍາວເກີນ 300 ຕົວອັກສອນ", "Summary must be 300 characters or fewer") }),
    body: z
      .string()
      .trim()
      .min(20, { error: t("เนื้อหาต้องมีอย่างน้อย 20 ตัวอักษร", "ເນື້ອຫາຕ້ອງມີຢ່າງໜ້ອຍ 20 ຕົວອັກສອນ", "Content must be at least 20 characters") })
      .max(20000, { error: t("เนื้อหายาวเกิน 20,000 ตัวอักษร", "ເນື້ອຫາຍາວເກີນ 20,000 ຕົວອັກສອນ", "Content must be 20,000 characters or fewer") }),
  });
}

/** Creates or updates an article (IT staff only). An empty `id` creates a new one. */
export async function saveArticle(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const user = await requireStaff();

  const parsed = articleSchema(t).safeParse({
    id: formData.get("id") ?? "",
    title: formData.get("title") ?? "",
    category: formData.get("category") ?? "",
    summary: formData.get("summary") ?? "",
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return {
      error: t("กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง", "ກະລຸນາກວດສອບຂໍ້ມູນທີ່ກອກອີກຄັ້ງ", "Please check the information you entered"),
      fieldErrors,
    };
  }
  const { id, ...fields } = parsed.data;
  const isPublished = formData.get("isPublished") === "on";

  let articleId = id;
  if (id) {
    const existing = await db.kbArticle.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return { error: t("ไม่พบบทความ", "ບໍ່ພົບບົດຄວາມ", "Article not found") };
    await db.kbArticle.update({ where: { id }, data: { ...fields, isPublished } });
  } else {
    const created = await db.kbArticle.create({ data: { ...fields, isPublished, authorId: user.id }, select: { id: true } });
    articleId = created.id;
  }

  revalidatePath("/kb");
  redirect(`/kb/${articleId}`);
}
