import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteRequest, restoreRequest } from "@/app/actions/admin-requests";
import { Avatar } from "@/components/avatar";
import { Badge, PriorityBadge, StatusBadge } from "@/components/badges";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { DataTable, type Column } from "@/components/data-table";
import { Modal } from "@/components/modal";
import { PaginationNav } from "@/components/pagination-nav";
import { ReportToolbar } from "@/components/report-toolbar";
import { RequestEditForm } from "@/components/request-edit-form";
import { SlaChip } from "@/components/sla-chip";
import { TypeIcon } from "@/components/type-icon";
import { requireSystemManager } from "@/lib/dal";
import { getI18n } from "@/lib/i18n-server";
import { PRIORITIES, PRIORITY_LABEL, formatDate } from "@/lib/labels";
import { isAdmin } from "@/lib/permissions";
import { listApprovers, listAssignableStaff } from "@/lib/queries";
import { CATEGORY_PREFIX, buildReportHref, parseRequestReportParams, requestReportQuery, typeFilterValue } from "@/lib/report-params";
import { getRequestReportRecord, listRequestReport, type RequestReportRow } from "@/lib/report-queries";
import { REQUEST_CATEGORIES, REQUEST_TYPE_DEFS } from "@/lib/request-types";
import { CURRENT_STATUSES, STATUS_LABEL } from "@/lib/status";
import { btnSecondary, btnTiny, inputClass, labelClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("รายงานคำขอ", "ລາຍງານຄຳຂໍ", "Request report") };
}

const PATH = "/reports/requests";

export default async function RequestReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireSystemManager();
  const { t, lang } = await getI18n();
  const params = parseRequestReportParams(await searchParams, user);

  const report = await listRequestReport(user, params);
  if (!report) redirect("/");
  const admin = isAdmin(user);
  const [staff, approvers] = await Promise.all([listAssignableStaff(), admin ? listApprovers("") : []]);

  // The edit pop-up opens while "edit" is in the address, but only for a request inside this viewer's report.
  const editing = params.edit ? await getRequestReportRecord(user, params.edit) : null;
  const editApprovers = editing && editing.status === "PENDING_APPROVAL" ? await listApprovers(editing.requesterId) : [];

  const hasFilters = Boolean(
    params.q || params.status || params.type || params.category || params.priority || params.from || params.to || params.slaBreached || params.assignee || params.approver || params.result || params.deleted,
  );

  const filterCount = [params.status, params.type || params.category, params.priority, params.from, params.to, params.slaBreached, params.assignee, params.approver, params.result, params.deleted].filter(Boolean).length;

  // Every link keeps the search, the filters and the sort, and changes only what it must.
  const current = requestReportQuery(params);
  const hrefFor = (overrides: Record<string, string | number | undefined>) => buildReportHref(PATH, { ...current, ...overrides });
  // This same report without the pop-up: where closing, cancelling and saving lead back to.
  const closeHref = hrefFor({});

  const outcomeBadge = (row: RequestReportRow) => {
    if (row.outcome.result === "approved") {
      return <Badge tone="green">{t("อนุมัติ", "ອະນຸມັດ", "Approved")}</Badge>;
    }
    if (row.outcome.result === "rejected") return <Badge tone="red">{t("ไม่อนุมัติ", "ບໍ່ອະນຸມັດ", "Rejected")}</Badge>;
    if (row.outcome.result === "pending") return <Badge tone="indigo">{t("รออนุมัติ", "ລໍຖ້າອະນຸມັດ", "Pending")}</Badge>;
    return <span className="text-slate-400">-</span>;
  };

  const person = (name: string | undefined) =>
    name ? (
      <span className="inline-flex max-w-[8rem] items-center gap-2">
        <Avatar name={name} size="xs" />
        <span className="truncate">{name}</span>
      </span>
    ) : (
      <span className="text-slate-400">-</span>
    );
  // For a narrow column: just the avatar (the name is in its tooltip).
  const avatarOnly = (name: string | undefined) => (name ? <Avatar name={name} size="xs" /> : <span className="text-slate-400">-</span>);

  const columns: Column<RequestReportRow>[] = [
    {
      key: "requestNo",
      header: t("เลขที่", "ເລກທີ່", "No."),
      sortKey: "requestNo",
      card: "title",
      render: (row) => <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap text-slate-600">{row.requestNo}</span>,
    },
    {
      key: "title",
      header: t("หัวข้อ", "ຫົວຂໍ້", "Subject"),
      sortKey: "title",
      card: "title",
      // Takes the room the other columns leave (max-w-0 lets it shrink to nothing), and the subject is cut short.
      className: "w-full max-w-0",
      render: (row) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <TypeIcon type={row.type} size="xs" />
          {/* One line: the type is in the tooltip, so every row stays the same short height. */}
          <Link
            href={`/requests/${row.id}`}
            title={`${row.title} · ${t(REQUEST_TYPE_DEFS[row.type].label)}`}
            className="block min-w-0 truncate font-medium text-slate-900 hover:text-indigo-700"
          >
            {row.title}
          </Link>
          {row.deletedAt && <Badge tone="red">{t("ถูกลบ", "ຖືກລຶບ", "Deleted")}</Badge>}
        </div>
      ),
    },
    { key: "requester", header: t("ผู้ขอ", "ຜູ້ຂໍ", "Requester"), showFrom: "wide", render: (row) => person(row.requester.name) },
    ...(admin ? [{ key: "approver", header: t("ผู้อนุมัติ", "ຜູ້ອະນຸມັດ", "Approver"), showFrom: "widest" as const, render: (row: RequestReportRow) => avatarOnly(row.approver?.name) }] : []),
    { key: "assignee", header: t("ผู้รับผิดชอบ", "ຜູ້ຮັບຜິດຊອບ", "Assignee"), showFrom: "widest", render: (row) => avatarOnly(row.assignee?.name) },
    { key: "status", header: t("สถานะ", "ສະຖານະ", "Status"), sortKey: "status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "priority", header: t("ความสำคัญ", "ຄວາມສຳຄັນ", "Priority"), sortKey: "priority", showFrom: "wider", render: (row) => <PriorityBadge priority={row.priority} /> },
    { key: "sla", header: "SLA", card: "hidden", showFrom: "widest", render: (row) => <SlaChip row={row} /> },
    { key: "createdAt", header: t("วันที่ยื่น", "ວັນທີຍື່ນ", "Filed"), sortKey: "createdAt", showFrom: "wider", render: (row) => formatDate(row.createdAt, lang) },
    {
      key: "neededBy",
      header: t("ต้องการใช้ภายใน", "ຕ້ອງການໃຊ້ພາຍໃນ", "Needed by"),
      sortKey: "neededBy",
      showFrom: "widest",
      render: (row) => (row.neededBy ? formatDate(row.neededBy, lang) : <span className="text-slate-400">-</span>),
    },
    {
      key: "outcome",
      header: t("ผลตัดสิน", "ຜົນຕັດສິນ", "Decision"),
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {outcomeBadge(row)}
          {row.outcome.at && <span className="hidden text-xs text-slate-500 @min-[1450px]:inline">{formatDate(row.outcome.at, lang)}</span>}
        </div>
      ),
    },
  ];

  const field = "min-w-0";

  return (
    <div className="space-y-3">
      <ReportToolbar
        total={report.total}
        q={params.q}
        searchPlaceholder={t("ค้นหาเลขที่ หัวข้อ หรือชื่อผู้ขอ", "ຄົ້ນຫາເລກທີ່, ຫົວຂໍ້ ຫຼື ຊື່ຜູ້ຂໍ", "Search by number, subject or requester name")}
        preserve={{ sort: current.sort, dir: current.dir }}
        hasFilters={hasFilters}
        filterCount={filterCount}
        clearHref={PATH}
      >
        <div className={field}>
          <label htmlFor="f-status" className={labelClass}>
            {t("สถานะ", "ສະຖານະ", "Status")}
          </label>
          <select id="f-status" name="status" defaultValue={params.status ?? ""} className={inputClass}>
            <option value="">{t("ทุกสถานะ", "ທຸກສະຖານະ", "All statuses")}</option>
            <option value="OPEN">{t("ที่ยังไม่ปิด", "ທີ່ຍັງບໍ່ປິດ", "Not closed")}</option>
            {CURRENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(STATUS_LABEL[status])}
              </option>
            ))}
          </select>
        </div>
        <div className={field}>
          <label htmlFor="f-type" className={labelClass}>
            {t("ประเภท", "ປະເພດ", "Type")}
          </label>
          <select id="f-type" name="type" defaultValue={typeFilterValue(params) ?? ""} className={inputClass}>
            <option value="">{t("ทุกประเภท", "ທຸກປະເພດ", "All types")}</option>
            {REQUEST_CATEGORIES.map((category) => (
              <optgroup key={category.key} label={t(category.label)}>
                {/* A heading cannot be picked in a select, so the first entry of each group stands for the whole heading. */}
                <option value={`${CATEGORY_PREFIX}${category.key}`}>
                  {t("ทุกรายการในหมวดนี้", "ທຸກລາຍການໃນໝວດນີ້", "Everything in this category")}
                </option>
                {category.types.map((type) => (
                  <option key={type} value={type}>
                    {t(REQUEST_TYPE_DEFS[type].label)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className={field}>
          <label htmlFor="f-priority" className={labelClass}>
            {t("ความสำคัญ", "ຄວາມສຳຄັນ", "Priority")}
          </label>
          <select id="f-priority" name="priority" defaultValue={params.priority ?? ""} className={inputClass}>
            <option value="">{t("ทุกระดับ", "ທຸກລະດັບ", "All levels")}</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {t(PRIORITY_LABEL[priority])}
              </option>
            ))}
          </select>
        </div>
        <div className={field}>
          <label htmlFor="f-result" className={labelClass}>
            {t("ผลตัดสิน", "ຜົນຕັດສິນ", "Decision")}
          </label>
          <select id="f-result" name="result" defaultValue={params.result ?? ""} className={inputClass}>
            <option value="">{t("ทั้งหมด", "ທັງໝົດ", "All")}</option>
            <option value="pending">{t("รออนุมัติ", "ລໍຖ້າອະນຸມັດ", "Pending")}</option>
            <option value="approved">{t("อนุมัติแล้ว", "ອະນຸມັດແລ້ວ", "Approved")}</option>
            <option value="rejected">{t("ไม่อนุมัติ", "ບໍ່ອະນຸມັດ", "Rejected")}</option>
          </select>
        </div>
        <div className={field}>
          <label htmlFor="f-assignee" className={labelClass}>
            {t("ผู้รับผิดชอบ", "ຜູ້ຮັບຜິດຊອບ", "Assignee")}
          </label>
          <select id="f-assignee" name="assignee" defaultValue={params.assignee ?? ""} className={inputClass}>
            <option value="">{t("ทุกคน", "ທຸກຄົນ", "Everyone")}</option>
            <option value="unassigned">{t("ยังไม่มีผู้รับผิดชอบ", "ຍັງບໍ່ມີຜູ້ຮັບຜິດຊອບ", "Unassigned")}</option>
            {staff.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>
        {admin && (
          <div className={field}>
            <label htmlFor="f-approver" className={labelClass}>
              {t("ผู้อนุมัติ", "ຜູ້ອະນຸມັດ", "Approver")}
            </label>
            <select id="f-approver" name="approver" defaultValue={params.approver ?? ""} className={inputClass}>
              <option value="">{t("ทุกคน", "ທຸກຄົນ", "Everyone")}</option>
              {approvers.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className={field}>
          <label htmlFor="f-from" className={labelClass}>
            {t("ยื่นตั้งแต่", "ຍື່ນຕັ້ງແຕ່", "Filed from")}
          </label>
          <input id="f-from" name="from" type="date" defaultValue={params.from ?? ""} className={inputClass} />
        </div>
        <div className={field}>
          <label htmlFor="f-to" className={labelClass}>
            {t("ถึงวันที่", "ເຖິງວັນທີ", "To")}
          </label>
          <input id="f-to" name="to" type="date" defaultValue={params.to ?? ""} className={inputClass} />
        </div>
        <div className={field}>
          <label htmlFor="f-deleted" className={labelClass}>
            {t("คำขอที่ลบแล้ว", "ຄຳຂໍທີ່ລຶບແລ້ວ", "Deleted requests")}
          </label>
          <select id="f-deleted" name="deleted" defaultValue={params.deleted ?? ""} className={inputClass}>
            <option value="">{t("ซ่อน", "ເຊື່ອງ", "Hide")}</option>
            <option value="include">{t("รวมที่ลบแล้ว", "ລວມທີ່ລຶບແລ້ວ", "Include deleted")}</option>
            <option value="only">{t("เฉพาะที่ลบแล้ว", "ສະເພາະທີ່ລຶບແລ້ວ", "Deleted only")}</option>
          </select>
        </div>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-slate-700">
          <input type="checkbox" name="sla" value="breached" defaultChecked={params.slaBreached} className="h-4 w-4 rounded border-slate-300 accent-indigo-600" />
          {t("เฉพาะที่เกิน SLA", "ສະເພາະທີ່ເກີນ SLA", "SLA breached only")}
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
            <Link href={`/requests/${row.id}`} className={`${btnSecondary} ${btnTiny}`}>
              {t("เปิด", "ເປີດ", "Open")}
            </Link>
            {row.deletedAt ? (
              <ConfirmActionButton
                action={restoreRequest}
                fields={{ requestId: row.id }}
                label={t("กู้คืน", "ກູ້ຄືນ", "Restore")}
                pendingLabel={t("กำลังกู้คืน...", "ກຳລັງກູ້ຄືນ...", "Restoring...")}
                variant="secondary"
                compact
              />
            ) : (
              <>
                <Link href={hrefFor({ edit: row.id })} scroll={false} className={`${btnSecondary} ${btnTiny}`}>
                  {t("แก้ไข", "ແກ້ໄຂ", "Edit")}
                </Link>
                <ConfirmActionButton
                  action={deleteRequest}
                  fields={{ requestId: row.id }}
                  label={t("ลบ", "ລຶບ", "Delete")}
                  pendingLabel={t("กำลังลบ...", "ກຳລັງລຶບ...", "Deleting...")}
                  compact
                  confirmText={t(
                    `ลบคำขอ ${row.requestNo}? คำขอจะถูกซ่อนจากทุกคน และกู้คืนได้ในหน้านี้`,
                    `ລຶບຄຳຂໍ ${row.requestNo}ບໍ? ຄຳຂໍຈະຖືກເຊື່ອງຈາກທຸກຄົນ ແລະ ກູ້ຄືນໄດ້ໃນໜ້ານີ້`,
                    `Delete request ${row.requestNo}? It is hidden from everyone and can be restored from this page.`,
                  )}
                />
              </>
            )}
          </>
        )}
        emptyText={hasFilters ? t("ไม่พบคำขอที่ตรงกับเงื่อนไข", "ບໍ່ພົບຄຳຂໍທີ່ກົງກັບເງື່ອນໄຂ", "No requests match your filters") : t("ยังไม่มีคำขอ", "ຍັງບໍ່ມີຄຳຂໍ", "No requests yet")}
      />

      {report.total > 0 && <PaginationNav page={report.page} pageCount={report.pageCount} hrefFor={(page) => hrefFor({ page })} />}

      {editing && (
        <Modal title={t(`แก้ไขคำขอ ${editing.requestNo}`, `ແກ້ໄຂຄຳຂໍ ${editing.requestNo}`, `Edit request ${editing.requestNo}`)} closeHref={closeHref}>
          <RequestEditForm
            request={editing.request}
            approvers={editApprovers}
            canChangeApprover={editing.status === "PENDING_APPROVAL"}
            returnTo={closeHref}
            cancelHref={closeHref}
          />
        </Modal>
      )}
    </div>
  );
}
