import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { deleteUser } from "@/app/actions/admin-users";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/badges";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { DataTable, type Column } from "@/components/data-table";
import { Modal } from "@/components/modal";
import { PaginationNav } from "@/components/pagination-nav";
import { ReportToolbar } from "@/components/report-toolbar";
import { UserForm } from "@/components/user-form";
import { requireSystemManager } from "@/lib/dal";
import { adminEmails } from "@/lib/env";
import { getI18n } from "@/lib/i18n-server";
import { ROLES, ROLE_LABEL, formatDateTime, formatNumber, type Role } from "@/lib/labels";
import { isAdmin } from "@/lib/permissions";
import { buildReportHref, parseUserReportParams } from "@/lib/report-params";
import { getUserReportRecord, listUserReport, type UserReportRow } from "@/lib/report-queries";
import type { Tone } from "@/lib/status";
import { btnPrimary, btnSecondary, btnTiny, inputClass, labelClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("รายงานผู้ใช้", "ລາຍງານຜູ້ໃຊ້", "User report") };
}

const PATH = "/reports/users";
const ROLE_TONE: Record<Role, Tone> = { EMPLOYEE: "slate", MANAGER: "indigo", IT_STAFF: "blue", ADMIN: "violet" };

export default async function UserReportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const actor = await requireSystemManager();
  // The user report is for administrators; a manager's reports are about their own requests.
  if (!isAdmin(actor)) redirect("/reports/requests");
  const { t, lang } = await getI18n();
  const params = parseUserReportParams(await searchParams);

  const report = await listUserReport(params);
  const editing = params.edit ? await getUserReportRecord(params.edit) : null;
  const hasFilters = Boolean(params.q || params.role || params.status || params.login);

  const sorted = params.sort === "name" && params.dir === "asc" ? {} : { sort: params.sort, dir: params.dir };
  const current = { q: params.q, role: params.role, status: params.status, login: params.login, ...sorted };
  const hrefFor = (overrides: Record<string, string | number | undefined>) => buildReportHref(PATH, { ...current, ...overrides });
  // This same report without a pop-up: where closing, cancelling and saving lead back to.
  const closeHref = hrefFor({});

  const never = t("ยังไม่เคย", "ຍັງບໍ່ເຄີຍ", "never");
  const columns: Column<UserReportRow>[] = [
    {
      key: "user",
      header: t("ผู้ใช้", "ຜູ້ໃຊ້", "User"),
      sortKey: "name",
      card: "title",
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-medium text-slate-900">
              {row.name}
              {row.id === actor.id && <span className="ml-2 text-xs font-normal text-slate-500">{t("(คุณ)", "(ທ່ານ)", "(you)")}</span>}
            </p>
            <p className="truncate text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: t("แผนก", "ພະແນກ", "Department"),
      showFrom: "wide",
      render: (row) => row.department ?? <span className="text-slate-400">-</span>,
    },
    {
      key: "role",
      header: t("สิทธิ์", "ສິດ", "Role"),
      sortKey: "role",
      render: (row) => <Badge tone={ROLE_TONE[row.role]}>{t(ROLE_LABEL[row.role])}</Badge>,
    },
    {
      key: "status",
      header: t("สถานะ", "ສະຖານະ", "Status"),
      render: (row) =>
        row.isActive ? <Badge tone="green">{t("ใช้งานอยู่", "ໃຊ້ງານຢູ່", "Active")}</Badge> : <Badge tone="amber">{t("ปิดการใช้งาน", "ປິດການໃຊ້ງານ", "Deactivated")}</Badge>,
    },
    {
      key: "lastLogin",
      header: t("เข้าสู่ระบบล่าสุด", "ເຂົ້າສູ່ລະບົບຫຼ້າສຸດ", "Last sign-in"),
      sortKey: "lastLoginAt",
      showFrom: "wider",
      render: (row) => (row.lastLoginAt ? formatDateTime(row.lastLoginAt, lang) : <span className="text-slate-400">{never}</span>),
    },
    {
      key: "requests",
      header: t("คำขอที่ยื่น", "ຄຳຂໍທີ່ຍື່ນ", "Requests filed"),
      align: "right",
      showFrom: "wider",
      render: (row) => formatNumber(row.requestCount, lang),
    },
    {
      key: "createdAt",
      header: t("วันที่เพิ่ม", "ວັນທີເພີ່ມ", "Added"),
      sortKey: "createdAt",
      showFrom: "widest",
      render: (row) => formatDateTime(row.createdAt, lang),
    },
  ];

  return (
    <div className="space-y-3">
      <ReportToolbar
        total={report.total}
        q={params.q}
        searchPlaceholder={t("ค้นหาชื่อ อีเมล หรือแผนก", "ຄົ້ນຫາຊື່, ອີເມວ ຫຼື ພະແນກ", "Search by name, email or department")}
        preserve={{ sort: sorted.sort, dir: sorted.dir }}
        hasFilters={hasFilters}
        filterCount={[params.role, params.status, params.login].filter(Boolean).length}
        clearHref={PATH}
        actions={
          <Link href={hrefFor({ new: "1" })} scroll={false} className={btnPrimary}>
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            {t("เพิ่มผู้ใช้", "ເພີ່ມຜູ້ໃຊ້", "Add user")}
          </Link>
        }
      >
        <div className="min-w-0">
          <label htmlFor="f-role" className={labelClass}>
            {t("สิทธิ์", "ສິດ", "Role")}
          </label>
          <select id="f-role" name="role" defaultValue={params.role ?? ""} className={inputClass}>
            <option value="">{t("ทุกสิทธิ์", "ທຸກສິດ", "All roles")}</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {t(ROLE_LABEL[role])}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label htmlFor="f-status" className={labelClass}>
            {t("สถานะ", "ສະຖານະ", "Status")}
          </label>
          <select id="f-status" name="status" defaultValue={params.status ?? ""} className={inputClass}>
            <option value="">{t("ทุกสถานะ", "ທຸກສະຖານະ", "All statuses")}</option>
            <option value="active">{t("ใช้งานอยู่", "ໃຊ້ງານຢູ່", "Active")}</option>
            <option value="inactive">{t("ปิดการใช้งาน", "ປິດການໃຊ້ງານ", "Deactivated")}</option>
          </select>
        </div>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-slate-700">
          <input type="checkbox" name="login" value="never" defaultChecked={params.login === "never"} className="h-4 w-4 rounded border-slate-300 accent-indigo-600" />
          {t("ยังไม่เคยเข้าสู่ระบบ", "ຍັງບໍ່ເຄີຍເຂົ້າສູ່ລະບົບ", "Never signed in")}
        </label>
      </ReportToolbar>

      <DataTable
        columns={columns}
        rows={report.items}
        rowKey={(row) => row.id}
        sort={{ key: params.sort, dir: params.dir }}
        hrefForSort={(sortKey, dir) => hrefFor({ sort: sortKey, dir, page: 1 })}
        actionsHeader={t("จัดการ", "ຈັດການ", "Actions")}
        actions={(row) => (
          <>
            <Link href={hrefFor({ edit: row.id })} scroll={false} className={`${btnSecondary} ${btnTiny}`}>
              {t("แก้ไข", "ແກ້ໄຂ", "Edit")}
            </Link>
            {row.id !== actor.id && (
              <ConfirmActionButton
                action={deleteUser}
                fields={{ userId: row.id, returnTo: closeHref }}
                label={t("ลบ", "ລຶບ", "Delete")}
                pendingLabel={t("กำลังลบ...", "ກຳລັງລຶບ...", "Deleting...")}
                compact
                confirmText={t(
                  `ยืนยันการลบ ${row.email} อย่างถาวร? ลบได้เฉพาะผู้ใช้ที่ไม่มีประวัติการใช้งาน`,
                  `ຢືນຢັນການລຶບ ${row.email} ຖາວອນບໍ? ລຶບໄດ້ສະເພາະຜູ້ໃຊ້ທີ່ບໍ່ມີປະຫວັດການໃຊ້ງານ`,
                  `Delete ${row.email} permanently? Only users with no history can be deleted.`,
                )}
              />
            )}
          </>
        )}
        emptyText={hasFilters ? t("ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข", "ບໍ່ພົບຜູ້ໃຊ້ທີ່ກົງກັບເງື່ອນໄຂ", "No users match your filters") : t("ยังไม่มีผู้ใช้", "ຍັງບໍ່ມີຜູ້ໃຊ້", "No users yet")}
      />

      {report.total > 0 && <PaginationNav page={report.page} pageCount={report.pageCount} hrefFor={(page) => hrefFor({ page })} />}

      {editing ? (
        <Modal title={editing.name} closeHref={closeHref}>
          <UserForm
            mode="edit"
            initial={editing}
            canGrantAdmin
            lockRoleAndStatus={editing.id === actor.id}
            inAdminEmails={adminEmails().includes(editing.email.toLowerCase())}
            returnTo={closeHref}
            cancelHref={closeHref}
          />
        </Modal>
      ) : (
        params.adding && (
          <Modal title={t("เพิ่มผู้ใช้", "ເພີ່ມຜູ້ໃຊ້", "Add user")} closeHref={closeHref}>
            <UserForm mode="create" canGrantAdmin returnTo={closeHref} cancelHref={closeHref} />
          </Modal>
        )
      )}
    </div>
  );
}
