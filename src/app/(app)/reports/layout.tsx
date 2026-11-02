import { AdminTabs } from "@/components/admin-tabs";
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

  // The title and the tabs share one row, so the table starts high on the page.
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div className="min-w-0 pb-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t("รายงาน", "ລາຍງານ", "Reports")}</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {isAdmin(user)
              ? t(
                  "ดู ค้นหา กรอง และจัดการคำขอ ผู้ใช้ และสถิติสรุปของทั้งระบบ",
                  "ເບິ່ງ, ຄົ້ນຫາ, ກອງ ແລະ ຈັດການຄຳຂໍ, ຜູ້ໃຊ້ ແລະ ສະຖິຕິສະຫຼຸບຂອງທັງລະບົບ",
                  "View, search, filter and manage the requests, users and summary statistics of the whole system",
                )
              : t(
                  "คำขอที่เลือกคุณเป็นผู้อนุมัติ ทั้งที่รออนุมัติและที่ตัดสินแล้ว พร้อมสถิติสรุป",
                  "ຄຳຂໍທີ່ເລືອກທ່ານເປັນຜູ້ອະນຸມັດ ທັງທີ່ລໍຖ້າອະນຸມັດ ແລະ ທີ່ຕັດສິນແລ້ວ ພ້ອມສະຖິຕິສະຫຼຸບ",
                  "The requests that name you as approver, both waiting and decided, with summary statistics",
                )}
          </p>
        </div>
        <div className="min-w-0 max-w-full">
          <AdminTabs ariaLabel={t("หมวดรายงาน", "ໝວດລາຍງານ", "Report sections")} items={tabs} />
        </div>
      </div>
      {children}
    </div>
  );
}
