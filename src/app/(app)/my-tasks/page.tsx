import type { Metadata } from "next";
import Link from "next/link";
import { ListChecks } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RequestTable } from "@/components/request-list";
import { requireStaff } from "@/lib/dal";
import { getI18n, getT } from "@/lib/i18n-server";
import { formatNumber } from "@/lib/labels";
import { listMyTasks } from "@/lib/queries";
import { btnSecondary } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("งานของฉัน", "ວຽກຂອງຂ້ອຍ", "My tasks") };
}

// The requests assigned to the signed-in IT person that are still being worked on.
export default async function MyTasksPage() {
  const { t, lang } = await getI18n();
  const user = await requireStaff();
  const tasks = await listMyTasks(user.id);
  const count = formatNumber(tasks.length, lang);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("งานของฉัน", "ວຽກຂອງຂ້ອຍ", "My tasks")}
        description={t(
          `${count} รายการที่มอบหมายให้คุณและยังดำเนินการอยู่`,
          `${count} ລາຍການທີ່ມອບໝາຍໃຫ້ທ່ານ ແລະ ຍັງດຳເນີນການຢູ່`,
          `${count} ${tasks.length === 1 ? "request" : "requests"} assigned to you and still in progress`,
        )}
        actions={
          <Link href="/requests?scope=assigned" className={btnSecondary}>
            <ListChecks className="h-4 w-4" aria-hidden />
            {t("ดูที่มอบหมายให้ฉันทั้งหมด (รวมที่ปิดแล้ว)", "ເບິ່ງທີ່ມອບໝາຍໃຫ້ຂ້ອຍທັງໝົດ (ລວມທີ່ປິດແລ້ວ)", "All assigned to me (including closed)")}
          </Link>
        }
      />

      <RequestTable
        items={tasks}
        showRequester
        emptyText={t("ไม่มีงานที่มอบหมายให้คุณ", "ບໍ່ມີວຽກທີ່ມອບໝາຍໃຫ້ທ່ານ", "No tasks assigned to you")}
      />
    </div>
  );
}
