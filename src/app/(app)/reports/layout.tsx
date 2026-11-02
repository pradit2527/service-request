import { AdminTabs } from "@/components/admin-tabs";
import { PageHeader } from "@/components/page-header";
import { requireSystemManager } from "@/lib/dal";
import { getT } from "@/lib/i18n-server";
import { isAdmin } from "@/lib/permissions";

// The guard here keeps other people out of the pages; every report query applies the viewer's limit again itself.
export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSystemManager();
  const t = await getT();

  const tabs = [{ href: "/reports/requests", label: t("คำขอ", "ຄຳຂໍ", "Requests") }];
  if (isAdmin(user)) tabs.push({ href: "/reports/users", label: t("ผู้ใช้", "ຜູ້ໃຊ້", "Users") });
  tabs.push({ href: "/reports/summary", label: t("สถิติสรุป", "ສະຖິຕິສະຫຼຸບ", "Summary") });

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("รายงาน", "ລາຍງານ", "Reports")}
        description={
          isAdmin(user)
            ? t(
                "ดู ค้นหา กรอง และจัดการคำขอ ผู้ใช้ และสถิติสรุปของทั้งระบบ",
                "ເບິ່ງ, ຄົ້ນຫາ, ກອງ ແລະ ຈັດການຄຳຂໍ, ຜູ້ໃຊ້ ແລະ ສະຖິຕິສະຫຼຸບຂອງທັງລະບົບ",
                "View, search, filter and manage the requests, users and summary statistics of the whole system",
              )
            : t(
                "คำขอที่เลือกคุณเป็นผู้อนุมัติ ทั้งที่รออนุมัติและที่ตัดสินแล้ว พร้อมสถิติสรุป",
                "ຄຳຂໍທີ່ເລືອກທ່ານເປັນຜູ້ອະນຸມັດ ທັງທີ່ລໍຖ້າອະນຸມັດ ແລະ ທີ່ຕັດສິນແລ້ວ ພ້ອມສະຖິຕິສະຫຼຸບ",
                "The requests that name you as approver, both waiting and decided, with summary statistics",
              )
        }
      />
      <AdminTabs ariaLabel={t("หมวดรายงาน", "ໝວດລາຍງານ", "Report sections")} items={tabs} />
      {children}
    </div>
  );
}
