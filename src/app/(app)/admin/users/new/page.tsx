import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserForm } from "@/components/user-form";
import { requireSystemManager } from "@/lib/dal";
import { getT } from "@/lib/i18n-server";
import { isAdmin } from "@/lib/permissions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("เพิ่มผู้ใช้", "ເພີ່ມຜູ້ໃຊ້", "Add user") };
}

export default async function NewUserPage() {
  const actor = await requireSystemManager();
  const t = await getT();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-indigo-600">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("กลับไปรายชื่อผู้ใช้", "ກັບໄປລາຍຊື່ຜູ້ໃຊ້", "Back to users")}
      </Link>
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">{t("เพิ่มผู้ใช้", "ເພີ່ມຜູ້ໃຊ້", "Add user")}</h2>
      <UserForm mode="create" canGrantAdmin={isAdmin(actor)} />
    </div>
  );
}
