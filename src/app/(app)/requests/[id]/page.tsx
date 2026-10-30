import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Badge, StatusBadge } from "@/components/badges";
import { CancelButton } from "@/components/cancel-button";
import { CommentForm } from "@/components/comment-form";
import { ManagerDecision } from "@/components/manager-decision";
import { ProgressSteps } from "@/components/progress-steps";
import { RequestTimeline } from "@/components/request-timeline";
import { SlaChip } from "@/components/sla-chip";
import { SlaPanel } from "@/components/sla-panel";
import { StaffPanel } from "@/components/staff-panel";
import { TypeIcon } from "@/components/type-icon";
import { requireUser } from "@/lib/dal";
import { getI18n, getT } from "@/lib/i18n-server";
import { formatDate, formatDateTime } from "@/lib/labels";
import {
  allowedStatusChanges,
  canCancelRequest,
  canComment,
  canDecideAsManager,
  canPostInternalNote,
  isStaff,
} from "@/lib/permissions";
import { getRequestDetail, listApprovers, listAssignableStaff } from "@/lib/queries";
import { REQUEST_TYPE_DEFS, describeDetails } from "@/lib/request-types";
import { SLA_TIER_DEF, formatBusinessDuration } from "@/lib/sla";
import { cardClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("รายละเอียดคำขอ", "ລາຍລະອຽດຄຳຂໍ", "Request details") };
}

export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { t, lang } = await getI18n();
  const user = await requireUser();
  const { id } = await params;
  const { created } = await searchParams;

  const request = await getRequestDetail(user, id);
  if (!request) notFound();

  const staff = isStaff(user);
  const detailRows = describeDetails(request.type, request.details, lang);
  const allowedStatuses = allowedStatusChanges(user, request);
  const [assignable, approvers] = staff
    ? await Promise.all([listAssignableStaff(), request.status === "PENDING_APPROVAL" ? listApprovers(request.requesterId) : []])
    : [[], []];
  const def = REQUEST_TYPE_DEFS[request.type];
  const showCreatedBanner = created === "1" && request.requesterId === user.id;
  const approverName = request.approver?.name ?? t("หัวหน้างาน", "ຫົວໜ້າ", "the manager");
  const responseTarget = formatBusinessDuration(SLA_TIER_DEF[request.slaTier].responseMinutes, lang);
  const fulfillmentTarget = formatBusinessDuration(SLA_TIER_DEF[request.slaTier].fulfillmentMinutes, lang);

  return (
    <div className="space-y-5">
      <Link href="/requests" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-indigo-600">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("กลับไปรายการคำขอ", "ກັບໄປລາຍການຄຳຂໍ", "Back to requests")}
      </Link>

      {showCreatedBanner && (
        <div className="flex gap-3 rounded-2xl bg-linear-to-r from-emerald-50 to-teal-50 p-4 ring-1 ring-emerald-200 ring-inset motion-safe:animate-fade-up" role="status">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
            <CircleCheck className="h-5 w-5" aria-hidden />
          </span>
          <div className="text-sm">
            <p className="font-semibold text-emerald-900">
              {t("ส่งคำขอเรียบร้อยแล้ว", "ສົ່ງຄຳຂໍຮຽບຮ້ອຍແລ້ວ", "Request submitted")} · <span className="font-mono">{request.requestNo}</span>
            </p>
            <p className="mt-0.5 text-emerald-800">
              {request.status === "PENDING_APPROVAL"
                ? t(
                    `รอ ${approverName} อนุมัติ หัวหน้าจะเห็นคำขอนี้ในเมนู “รออนุมัติ” เมื่อเข้าระบบ หลังอนุมัติคำขอจะเข้าคิวทีม IT`,
                    `ລໍຖ້າ ${approverName} ອະນຸມັດ ຫົວໜ້າຈະເຫັນຄຳຂໍນີ້ໃນເມນູ “ລໍຖ້າອະນຸມັດ” ເມື່ອເຂົ້າລະບົບ ຫຼັງຈາກອະນຸມັດ ຄຳຂໍຈະເຂົ້າຄິວທີມ IT`,
                    `Waiting for ${approverName} to approve. They will see this request under “Approvals” after signing in. Once approved, the request joins the IT team queue.`,
                  )
                : t(
                    `ทีม IT ได้รับเรื่องแล้ว ตั้งเป้าตอบรับภายใน ${responseTarget} และส่งมอบภายใน ${fulfillmentTarget} (นับเวลาทำการ)`,
                    `ທີມ IT ໄດ້ຮັບເລື່ອງແລ້ວ ຕັ້ງເປົ້າຕອບຮັບພາຍໃນ ${responseTarget} ແລະ ສົ່ງມອບພາຍໃນ ${fulfillmentTarget} (ນັບເວລາເຮັດວຽກ)`,
                    `The IT team has received your request. We aim to respond within ${responseTarget} and fulfill within ${fulfillmentTarget} (business hours).`,
                  )}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <section className={`${cardClass} overflow-hidden`}>
            <div className="h-1.5 bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500" aria-hidden />
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <TypeIcon type={request.type} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">{request.requestNo}</span>
                    <StatusBadge status={request.status} />
                    <SlaChip row={request} />
                  </div>
                  <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{request.title}</h1>
                  <p className="mt-1 text-sm text-slate-500">{t(def.label)}</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 px-3 py-5 sm:px-6">
                <ProgressSteps status={request.status} needsApproval={request.approverId !== null} approved={request.managerApprovedAt !== null} />
              </div>

              <h2 className="mt-6 text-sm font-medium text-slate-500">{t("เหตุผลและความจำเป็น", "ເຫດຜົນ ແລະ ຄວາມຈຳເປັນ", "Reason and justification")}</h2>
              <p className="mt-1 break-words whitespace-pre-wrap text-slate-800">{request.description}</p>

              {detailRows.length > 0 && (
                <>
                  <h2 className="mt-6 text-sm font-medium text-slate-500">{t("ข้อมูลเฉพาะประเภทคำขอ", "ຂໍ້ມູນສະເພາະຕາມປະເພດຄຳຂໍ", "Type-specific details")}</h2>
                  <dl className="mt-3 grid gap-x-6 gap-y-4 rounded-2xl border border-slate-100 p-4 sm:grid-cols-2">
                    {detailRows.map((row) => (
                      <div key={row.label}>
                        <dt className="text-xs text-slate-500">{row.label}</dt>
                        <dd className="mt-0.5 text-sm font-medium break-words text-slate-900">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-semibold text-slate-900">{t("ความเคลื่อนไหว", "ຄວາມເຄື່ອນໄຫວ", "Activity")}</h2>
            <RequestTimeline request={request} />
          </section>

          {canComment(user, request) ? (
            <section className={`${cardClass} p-4`}>
              <h2 className="mb-2 font-semibold text-slate-900">{t("เพิ่มข้อความ", "ເພີ່ມຂໍ້ຄວາມ", "Add a message")}</h2>
              <CommentForm requestId={request.id} canPostInternal={canPostInternalNote(user)} />
            </section>
          ) : (
            <p className="text-sm text-slate-500">{t("คำขอนี้ปิดแล้ว ไม่สามารถเพิ่มข้อความได้", "ຄຳຂໍນີ້ປິດແລ້ວ ບໍ່ສາມາດເພີ່ມຂໍ້ຄວາມໄດ້", "This request is closed. Messages can no longer be added.")}</p>
          )}
        </div>

        <aside className="min-w-0 space-y-4">
          {canDecideAsManager(user, request) && <ManagerDecision requestId={request.id} />}

          <section className={`${cardClass} p-4`}>
            <h2 className="mb-4 font-semibold text-slate-900">{t("ข้อมูลคำขอ", "ຂໍ້ມູນຄຳຂໍ", "Request information")}</h2>
            <dl className="space-y-4 text-sm">
              <Person
                label={t("ผู้ขอ", "ຜູ້ຂໍ", "Requester")}
                name={request.requester.name}
                sub={[request.requester.department, request.requester.phone].filter(Boolean).join(" · ") || request.requester.email}
              />
              {request.requestedForName && <Info label={t("ผู้ใช้งานจริง", "ຜູ້ໃຊ້ງານຈິງ", "Actual user")}>{request.requestedForName}</Info>}
              {request.approver && (
                <Person
                  label={t("ผู้อนุมัติ (หัวหน้างาน)", "ຜູ້ອະນຸມັດ (ຫົວໜ້າ)", "Approver (manager)")}
                  name={request.approver.name}
                  sub={
                    request.managerApprovedAt
                      ? t(
                          `อนุมัติเมื่อ ${formatDateTime(request.managerApprovedAt, lang)}`,
                          `ອະນຸມັດເມື່ອ ${formatDateTime(request.managerApprovedAt, lang)}`,
                          `Approved on ${formatDateTime(request.managerApprovedAt, lang)}`,
                        )
                      : (request.approver.department ?? undefined)
                  }
                  badge={request.status === "PENDING_APPROVAL" ? <Badge tone="indigo">{t("รออนุมัติ", "ລໍຖ້າອະນຸມັດ", "Pending approval")}</Badge> : undefined}
                />
              )}
              {request.assignee ? (
                <Person label={t("ผู้รับผิดชอบ", "ຜູ້ຮັບຜິດຊອບ", "Assignee")} name={request.assignee.name} />
              ) : (
                <Info label={t("ผู้รับผิดชอบ", "ຜູ້ຮັບຜິດຊອບ", "Assignee")}>{t("ยังไม่มี", "ຍັງບໍ່ມີ", "None yet")}</Info>
              )}
              <Info label={t("วันที่ยื่น", "ວັນທີຍື່ນ", "Date submitted")}>{formatDateTime(request.createdAt, lang)}</Info>
              {request.neededBy && <Info label={t("ต้องการใช้งานภายใน", "ຕ້ອງການໃຊ້ງານພາຍໃນ", "Needed by")}>{formatDate(request.neededBy, lang)}</Info>}
              {request.decidedAt && (
                <Info label={t("พิจารณาโดย", "ພິຈາລະນາໂດຍ", "Decided by")}>
                  {request.decidedBy?.name ?? "-"}
                  <span className="block text-xs text-slate-500">{formatDateTime(request.decidedAt, lang)}</span>
                </Info>
              )}
              {request.closedAt && <Info label={t("ปิดเมื่อ", "ປິດເມື່ອ", "Closed on")}>{formatDateTime(request.closedAt, lang)}</Info>}
            </dl>
          </section>

          <SlaPanel request={request} />

          {staff && (
            <StaffPanel
              requestId={request.id}
              status={request.status}
              allowedStatuses={allowedStatuses}
              assigneeId={request.assigneeId}
              staff={assignable}
              currentUserId={user.id}
              slaTier={request.slaTier}
              approverId={request.approverId}
              approvers={approvers}
            />
          )}

          {canCancelRequest(user, request) && (
            <section className={`${cardClass} p-4`}>
              <h2 className="mb-1 font-semibold text-slate-900">{t("ยกเลิกคำขอ", "ຍົກເລີກຄຳຂໍ", "Cancel request")}</h2>
              <p className="mb-3 text-xs text-slate-500">{t("ยกเลิกได้จนกว่าทีม IT จะเริ่มดำเนินการ", "ຍົກເລີກໄດ້ຈົນກວ່າທີມ IT ຈະເລີ່ມດຳເນີນການ", "You can cancel until the IT team starts the work")}</p>
              <CancelButton requestId={request.id} />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-900">{children}</dd>
    </div>
  );
}

function Person({ label, name, sub, badge }: { label: string; name: string; sub?: string; badge?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 flex items-center gap-2.5">
        <Avatar name={name} size="sm" />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate font-medium text-slate-900">{name}</span>
          {sub && <span className="block truncate text-xs text-slate-500">{sub}</span>}
        </span>
        {badge}
      </dd>
    </div>
  );
}
