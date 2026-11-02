import { AdminTabs } from "@/components/admin-tabs";
import { PageHeader } from "@/components/page-header";
import { requireSystemManager } from "@/lib/dal";
import { getT } from "@/lib/i18n-server";

// The guard here keeps other people out of the pages; every server action checks the permission again itself.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSystemManager();
  const t = await getT();

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("จัดการระบบ", "ຈັດການລະບົບ", "System management")}
        description={t(
          "เพิ่ม ดู แก้ไข และลบข้อมูลผู้ใช้ คำขอ และบทความฐานความรู้",
          "ເພີ່ມ, ເບິ່ງ, ແກ້ໄຂ ແລະ ລຶບຂໍ້ມູນຜູ້ໃຊ້, ຄຳຂໍ ແລະ ບົດຄວາມຖານຄວາມຮູ້",
          "Add, view, edit and delete users, requests and knowledge base articles",
        )}
      />
      <AdminTabs
        ariaLabel={t("หมวดการจัดการ", "ໝວດການຈັດການ", "Management sections")}
        items={[
          { href: "/admin/users", label: t("ผู้ใช้", "ຜູ້ໃຊ້", "Users") },
          { href: "/admin/requests", label: t("คำขอ", "ຄຳຂໍ", "Requests") },
          { href: "/admin/kb", label: t("ฐานความรู้", "ຖານຄວາມຮູ້", "Knowledge base") },
          { href: "/admin/audit", label: t("บันทึกการเปลี่ยนแปลง", "ບັນທຶກການປ່ຽນແປງ", "Change log") },
        ]}
      />
      {children}
    </div>
  );
}
