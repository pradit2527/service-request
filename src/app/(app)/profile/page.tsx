import type { Metadata } from "next";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/badges";
import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/dal";
import { getT } from "@/lib/i18n-server";
import { ROLE_LABEL } from "@/lib/labels";
import { cardClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("ข้อมูลส่วนตัว", "ຂໍ້ມູນສ່ວນຕົວ", "Profile") };
}

export default async function ProfilePage() {
  const user = await requireUser();
  const t = await getT();

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t("ข้อมูลส่วนตัว", "ຂໍ້ມູນສ່ວນຕົວ", "Profile")}</h1>

      <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <section className={`${cardClass} p-6`}>
          <div className="flex items-center gap-4">
            <Avatar name={user.name} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-slate-900">{user.name}</p>
              <div className="mt-1.5">
                <Badge tone="indigo">{t(ROLE_LABEL[user.role])}</Badge>
              </div>
            </div>
          </div>

          <dl className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm">
            <div>
              <dt className="text-xs text-slate-500">{t("อีเมล", "ອີເມວ", "Email")}</dt>
              <dd className="mt-0.5 break-all text-slate-800">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{t("สิทธิ์", "ສິດ", "Role")}</dt>
              <dd className="mt-0.5 text-slate-800">{t(ROLE_LABEL[user.role])}</dd>
            </div>
          </dl>

          <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
            {t(
              "ชื่อและอีเมลมาจากบัญชี Google Workspace จึงแก้ไขที่นี่ไม่ได้",
              "ຊື່ ແລະ ອີເມວມາຈາກບັນຊີ Google Workspace ຈຶ່ງບໍ່ສາມາດແກ້ໄຂຢູ່ບ່ອນນີ້ໄດ້",
              "Your name and email come from your Google Workspace account, so they can't be edited here.",
            )}
          </p>
        </section>

        <section className={`${cardClass} p-6`}>
          <h2 className="text-base font-semibold text-slate-900">{t("ข้อมูลติดต่อ", "ຂໍ້ມູນຕິດຕໍ່", "Contact details")}</h2>
          <p className="mt-1 mb-5 text-sm text-slate-500">
            {t(
              "แสดงในคำขอที่คุณยื่น เพื่อให้ทีม IT ติดต่อกลับได้",
              "ສະແດງໃນຄຳຂໍທີ່ທ່ານຍື່ນ ເພື່ອໃຫ້ທີມ IT ຕິດຕໍ່ກັບໄດ້",
              "Shown on the requests you submit, so the IT team can reach you",
            )}
          </p>
          <ProfileForm department={user.department ?? ""} phone={user.phone ?? ""} />
        </section>
      </div>
    </div>
  );
}
