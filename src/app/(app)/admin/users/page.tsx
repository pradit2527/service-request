import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/badges";
import { PaginationNav } from "@/components/pagination-nav";
import { requireSystemManager } from "@/lib/dal";
import { getI18n } from "@/lib/i18n-server";
import { ROLES, ROLE_DESCRIPTION, ROLE_LABEL, formatDateTime, formatNumber, isRole, type Role } from "@/lib/labels";
import { listUsersForAdmin, type UserListFilters } from "@/lib/queries";
import type { Tone } from "@/lib/status";
import { btnPrimary, btnSecondary, cardClass, inputClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("จัดการผู้ใช้", "ຈັດການຜູ້ໃຊ້", "Users") };
}

const ROLE_TONE: Record<Role, Tone> = { EMPLOYEE: "slate", MANAGER: "indigo", IT_STAFF: "blue", ADMIN: "violet" };

type SearchParams = Promise<{ q?: string; role?: string; status?: string; page?: string }>;

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireSystemManager();
  const { t, lang } = await getI18n();
  const params = await searchParams;

  const filters: UserListFilters = {
    q: params.q?.slice(0, 100),
    role: isRole(params.role) ? params.role : undefined,
    status: params.status === "active" || params.status === "inactive" ? params.status : undefined,
    page: Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
  };
  const { items, total, page, pageCount } = await listUsersForAdmin(filters);
  const hasFilters = Boolean(filters.q || filters.role || filters.status);

  const hrefFor = (target: number) => {
    const query = new URLSearchParams();
    if (filters.q) query.set("q", filters.q);
    if (filters.role) query.set("role", filters.role);
    if (filters.status) query.set("status", filters.status);
    if (target > 1) query.set("page", String(target));
    const qs = query.toString();
    return qs ? `/admin/users?${qs}` : "/admin/users";
  };
  const totalText = formatNumber(total, lang);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{t(`พบ ${totalText} คน`, `ພົບ ${totalText} ຄົນ`, `${totalText} ${total === 1 ? "user" : "users"} found`)}</p>
        <Link href="/admin/users/new" className={btnPrimary}>
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          {t("เพิ่มผู้ใช้", "ເພີ່ມຜູ້ໃຊ້", "Add user")}
        </Link>
      </div>

      <form method="get" className={`${cardClass} grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6`}>
        <div className="relative sm:col-span-3 lg:col-span-3">
          <label htmlFor="q" className="sr-only">
            {t("ค้นหา", "ຄົ້ນຫາ", "Search")}
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder={t("ค้นหาชื่อหรืออีเมล", "ຄົ້ນຫາຊື່ ຫຼື ອີເມວ", "Search by name or email")}
            className={`${inputClass} pl-10`}
          />
        </div>
        <div>
          <label htmlFor="role" className="sr-only">
            {t("สิทธิ์", "ສິດ", "Role")}
          </label>
          <select id="role" name="role" defaultValue={filters.role ?? ""} className={inputClass}>
            <option value="">{t("ทุกสิทธิ์", "ທຸກສິດ", "All roles")}</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {t(ROLE_LABEL[role])}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="sr-only">
            {t("สถานะ", "ສະຖານະ", "Status")}
          </label>
          <select id="status" name="status" defaultValue={filters.status ?? ""} className={inputClass}>
            <option value="">{t("ทุกสถานะ", "ທຸກສະຖານະ", "All statuses")}</option>
            <option value="active">{t("ใช้งานอยู่", "ໃຊ້ງານຢູ່", "Active")}</option>
            <option value="inactive">{t("ปิดการใช้งาน", "ປິດການໃຊ້ງານ", "Deactivated")}</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={btnPrimary}>
            {t("ค้นหา", "ຄົ້ນຫາ", "Search")}
          </button>
          {hasFilters && (
            <Link href="/admin/users" className={btnSecondary}>
              {t("ล้าง", "ລ້າງ", "Clear")}
            </Link>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <p className={`${cardClass} p-8 text-center text-sm text-slate-500`}>
          {hasFilters ? t("ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข", "ບໍ່ພົບຜູ້ໃຊ້ທີ່ກົງກັບເງື່ອນໄຂ", "No users match your filters") : t("ยังไม่มีผู้ใช้", "ຍັງບໍ່ມີຜູ້ໃຊ້", "No users yet")}
        </p>
      ) : (
        <ul className={`${cardClass} divide-y divide-slate-100 overflow-hidden`}>
          {items.map((user) => {
            const lastLogin = user.lastLoginAt ? formatDateTime(user.lastLoginAt, lang) : t("ยังไม่เคย", "ຍັງບໍ່ເຄີຍ", "never");
            return (
            <li key={user.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 sm:px-5">
              <div className="flex min-w-0 flex-1 basis-64 items-center gap-3">
                <Avatar name={user.name} size="md" />
                <div className="min-w-0 leading-tight">
                  <p className="truncate font-medium text-slate-900">
                    {user.name}
                    {user.id === actor.id && <span className="ml-2 text-xs font-normal text-slate-500">{t("(คุณ)", "(ທ່ານ)", "(you)")}</span>}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {user.email}
                    {user.department ? ` · ${user.department}` : ""}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t(`เข้าสู่ระบบล่าสุด ${lastLogin}`, `ເຂົ້າສູ່ລະບົບຫຼ້າສຸດ ${lastLogin}`, `Last sign-in: ${lastLogin}`)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={ROLE_TONE[user.role]}>{t(ROLE_LABEL[user.role])}</Badge>
                {!user.isActive && <Badge tone="amber">{t("ปิดการใช้งาน", "ປິດການໃຊ້ງານ", "Deactivated")}</Badge>}
                <Link href={`/admin/users/${user.id}`} className={btnSecondary}>
                  {t("แก้ไข", "ແກ້ໄຂ", "Edit")}
                </Link>
              </div>
            </li>
            );
          })}
        </ul>
      )}

      {total > 0 && <PaginationNav page={page} pageCount={pageCount} hrefFor={hrefFor} />}

      <details className={`${cardClass} p-4 sm:p-5`}>
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">{t("แต่ละสิทธิ์ทำอะไรได้", "ແຕ່ລະສິດເຮັດຫຍັງໄດ້", "What each role can do")}</summary>
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
      </details>
    </div>
  );
}
