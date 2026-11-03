import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/badges";
import { ChangePasswordForm } from "@/components/change-password-form";
import { ProfileForm } from "@/components/profile-form";
import { requireSignedInUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { ROLE_LABEL } from "@/lib/labels";
import { cardClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("ข้อมูลส่วนตัว", "ຂໍ້ມູນສ່ວນຕົວ", "Profile") };
}

export default async function ProfilePage() {
  // Not requireUser(): this is where someone with a temporary password comes to replace it.
  const user = await requireSignedInUser();
  const t = await getT();
  const hasPassword = (await db.user.count({ where: { id: user.id, passwordHash: { not: null } } })) > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t("ข้อมูลส่วนตัว", "ຂໍ້ມູນສ່ວນຕົວ", "Profile")}</h1>

      {user.mustChangePassword && (
        <p role="alert" className="flex gap-2.5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200 ring-inset">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t(
            "คุณกำลังใช้รหัสผ่านชั่วคราว กรุณาตั้งรหัสผ่านของตัวเองด้านล่างก่อนใช้งานส่วนอื่น",
            "ທ່ານກຳລັງໃຊ້ລະຫັດຜ່ານຊົ່ວຄາວ ກະລຸນາຕັ້ງລະຫັດຜ່ານຂອງຕົນເອງດ້ານລຸ່ມກ່ອນໃຊ້ງານສ່ວນອື່ນ",
            "You are using a temporary password. Please choose your own below before using anything else.",
          )}
        </p>
      )}

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

        <div className="min-w-0 space-y-5">
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

          <section className={`${cardClass} p-6`}>
            <h2 className="text-base font-semibold text-slate-900">{t("รหัสผ่าน", "ລະຫັດຜ່ານ", "Password")}</h2>
            <p className="mt-1 mb-5 text-sm text-slate-500">
              {hasPassword
                ? t(
                    "ใช้เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน เปลี่ยนแล้วอุปกรณ์อื่นที่เข้าอยู่จะถูกออกจากระบบ",
                    "ໃຊ້ເຂົ້າສູ່ລະບົບດ້ວຍອີເມວ ແລະ ລະຫັດຜ່ານ ປ່ຽນແລ້ວອຸປະກອນອື່ນທີ່ເຂົ້າຢູ່ຈະຖືກອອກຈາກລະບົບ",
                    "Used to sign in with your email and password. Changing it signs you out on your other devices.",
                  )
                : t(
                    "คุณยังไม่มีรหัสผ่าน (เข้าด้วย Google อยู่) ตั้งรหัสผ่านเพื่อเข้าด้วยอีเมลได้ด้วย",
                    "ທ່ານຍັງບໍ່ມີລະຫັດຜ່ານ (ເຂົ້າດ້ວຍ Google ຢູ່) ຕັ້ງລະຫັດຜ່ານເພື່ອເຂົ້າດ້ວຍອີເມວໄດ້ນຳ",
                    "You don't have a password yet (you sign in with Google). Set one to also sign in with your email.",
                  )}
            </p>
            <ChangePasswordForm hasPassword={hasPassword} />
          </section>
        </div>
      </div>
    </div>
  );
}
