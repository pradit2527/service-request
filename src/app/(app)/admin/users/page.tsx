import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { UserAdminRow } from "@/components/user-admin-row";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { getI18n } from "@/lib/i18n-server";
import { ROLES, ROLE_DESCRIPTION, ROLE_LABEL, formatDateTime } from "@/lib/labels";
import { cardClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("จัดการผู้ใช้", "ຈັດການຜູ້ໃຊ້", "Users") };
}

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const { t, lang } = await getI18n();

  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, department: true, role: true, isActive: true, lastLoginAt: true },
    orderBy: [{ role: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("จัดการผู้ใช้", "ຈັດການຜູ້ໃຊ້", "Users")}
        description={t(
          "ผู้ใช้จะถูกสร้างอัตโนมัติเมื่อเข้าสู่ระบบด้วย Google ครั้งแรก (สิทธิ์เริ่มต้น: พนักงาน) ที่นี่ใช้กำหนดสิทธิ์ เช่น ตั้งหัวหน้างานที่อนุมัติคำขอได้ ตั้งทีม IT และปิดการใช้งานบัญชี",
          "ຜູ້ໃຊ້ຈະຖືກສ້າງອັດຕະໂນມັດເມື່ອເຂົ້າສູ່ລະບົບດ້ວຍ Google ເປັນຄັ້ງທຳອິດ (ສິດເລີ່ມຕົ້ນ: ພະນັກງານ) ຢູ່ບ່ອນນີ້ໃຊ້ກຳນົດສິດ ເຊັ່ນ ຕັ້ງຫົວໜ້າງານທີ່ອະນຸມັດຄຳຂໍໄດ້ ຕັ້ງທີມ IT ແລະ ປິດການໃຊ້ງານບັນຊີ",
          "Users are created automatically the first time they sign in with Google (default role: Employee). Use this page to assign roles, such as managers who can approve requests and IT team members, and to deactivate accounts.",
        )}
      />

      <section className={`${cardClass} p-4 sm:p-5`}>
        <h2 className="text-sm font-semibold text-slate-900">{t("แต่ละสิทธิ์ทำอะไรได้", "ແຕ່ລະສິດເຮັດຫຍັງໄດ້", "What each role can do")}</h2>
        <dl className="mt-3 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          {ROLES.map((role) => (
            <div key={role}>
              <dt className="font-medium text-slate-800">{t(ROLE_LABEL[role])}</dt>
              <dd className="mt-0.5 text-xs text-slate-500">{t(ROLE_DESCRIPTION[role])}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          {t(
            "เปลี่ยนสิทธิ์แล้วมีผลทันที รวมถึงคำขอที่ค้างรอหัวหน้าอนุมัติ ถ้าหัวหน้าคนนั้นถูกเปลี่ยนสิทธิ์ ทีม IT ต้องเปลี่ยนผู้อนุมัติของคำขอนั้นในหน้าคำขอ",
            "ປ່ຽນສິດແລ້ວມີຜົນທັນທີ ລວມທັງຄຳຂໍທີ່ຄ້າງລໍຖ້າຫົວໜ້າອະນຸມັດ ຖ້າຫົວໜ້າຄົນນັ້ນຖືກປ່ຽນສິດ ທີມ IT ຕ້ອງປ່ຽນຜູ້ອະນຸມັດຂອງຄຳຂໍນັ້ນໃນໜ້າຄຳຂໍ",
            "A role change takes effect immediately, including on requests already waiting for a manager. If that manager's role is changed, the IT team must move the request to another approver from the request page.",
          )}
        </p>
      </section>
      <ul className={`${cardClass} divide-y divide-slate-100 overflow-hidden`}>
        {users.map((u) => (
          <UserAdminRow
            key={u.id}
            isSelf={u.id === admin.id}
            user={{ ...u, lastLoginAt: u.lastLoginAt ? formatDateTime(u.lastLoginAt, lang) : null }}
          />
        ))}
      </ul>
    </div>
  );
}
