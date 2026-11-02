import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { deleteUser } from "@/app/actions/admin-users";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { UserForm } from "@/components/user-form";
import { requireSystemManager } from "@/lib/dal";
import { db } from "@/lib/db";
import { adminEmails } from "@/lib/env";
import { getT } from "@/lib/i18n-server";
import { canModifyUser, isAdmin } from "@/lib/permissions";
import { cardClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("แก้ไขผู้ใช้", "ແກ້ໄຂຜູ້ໃຊ້", "Edit user") };
}

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireSystemManager();
  const t = await getT();
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, department: true, phone: true, isActive: true },
  });
  if (!user) notFound();

  // A manager can look at an administrator account but not change it.
  const verdict = canModifyUser(actor, user, { role: user.role, isActive: user.isActive });
  const readOnly = !verdict.ok && verdict.reason === "admin-protected";
  const isSelf = actor.id === user.id;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-indigo-600">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("กลับไปรายชื่อผู้ใช้", "ກັບໄປລາຍຊື່ຜູ້ໃຊ້", "Back to users")}
      </Link>
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">{user.name}</h2>

      <UserForm
        mode="edit"
        initial={{ ...user, department: user.department ?? "", phone: user.phone ?? "" }}
        canGrantAdmin={isAdmin(actor)}
        lockRoleAndStatus={isSelf}
        readOnly={readOnly}
        inAdminEmails={adminEmails().includes(user.email.toLowerCase())}
      />

      {!readOnly && !isSelf && (
        <section className={`${cardClass} space-y-3 p-5 sm:p-6`}>
          <h3 className="font-semibold text-slate-900">{t("ลบผู้ใช้", "ລຶບຜູ້ໃຊ້", "Delete user")}</h3>
          <p className="text-sm text-slate-500">
            {t(
              "ลบถาวรได้เฉพาะผู้ใช้ที่ยังไม่มีประวัติการใช้งานเลย หากมีประวัติแล้ว ให้ปิดการใช้งานบัญชีด้านบนแทน",
              "ລຶບຖາວອນໄດ້ສະເພາະຜູ້ໃຊ້ທີ່ຍັງບໍ່ມີປະຫວັດການໃຊ້ງານເລີຍ ຖ້າມີປະຫວັດແລ້ວ ໃຫ້ປິດການໃຊ້ງານບັນຊີດ້ານເທິງແທນ",
              "A user can be deleted permanently only if they have no history at all. Otherwise deactivate the account above instead.",
            )}
          </p>
          <ConfirmActionButton
            action={deleteUser}
            fields={{ userId: user.id }}
            label={t("ลบผู้ใช้", "ລຶບຜູ້ໃຊ້", "Delete user")}
            pendingLabel={t("กำลังลบ...", "ກຳລັງລຶບ...", "Deleting...")}
            confirmText={t(
              `ยืนยันการลบ ${user.email} อย่างถาวร? ไม่สามารถย้อนกลับได้`,
              `ຢືນຢັນການລຶບ ${user.email} ຖາວອນບໍ? ບໍ່ສາມາດຍ້ອນກັບໄດ້`,
              `Delete ${user.email} permanently? This cannot be undone.`,
            )}
          />
        </section>
      )}
    </div>
  );
}
