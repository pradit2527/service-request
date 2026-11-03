import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Hourglass, MessageCircleQuestion, ShieldCheck, UserCog } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/badges";
import { BulkApprove } from "@/components/bulk-approve";
import { DelegationCard } from "@/components/delegation-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/request-list";
import { TypeIcon } from "@/components/type-icon";
import { approvalWait, approverWaitingSince, waitText, type WaitLevel } from "@/lib/approval-aging";
import { requireUser } from "@/lib/dal";
import { getI18n, getT } from "@/lib/i18n-server";
import { formatDate } from "@/lib/labels";
import { isManager } from "@/lib/permissions";
import { listApprovers, listDelegations, listPendingApprovals } from "@/lib/queries";
import { REQUEST_TYPE_DEFS } from "@/lib/request-types";
import { getSlaCalendar } from "@/lib/sla-calendar";
import { btnPrimary, cardClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("รออนุมัติ", "ລໍຖ້າອະນຸມັດ", "Approvals") };
}

const WAIT_TONE: Record<WaitLevel, "slate" | "amber" | "red"> = { fresh: "slate", late: "amber", overdue: "red" };

export default async function ApprovalsPage() {
  const { t, lang } = await getI18n();
  const user = await requireUser();
  // Only managers can decide, so anyone else (for example someone whose role changed) sees nothing to approve.
  const manager = isManager(user);
  const [pending, delegations, candidates] = manager
    ? await Promise.all([listPendingApprovals(user), listDelegations(user.id), listApprovers(user.id)])
    : [[], [], []];
  const now = new Date();
  const cal = getSlaCalendar();

  const cards = (
    <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {pending.map((request) => {
        const since = approverWaitingSince(request);
        const wait = since ? approvalWait(since, now, cal) : null;
        const askedForInfo = request.infoRequestedAt !== null;
        // A request of a manager who is away, which this manager sees because they stand in for them.
        const standingInFor = request.approverId !== user.id ? request.approver?.name : null;

        return (
          <li key={request.id} className={`${cardClass} flex flex-col p-5`}>
            <div className="flex items-start gap-3">
              <TypeIcon type={request.type} />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-slate-500">{request.requestNo}</p>
                <p className="mt-0.5 font-medium text-slate-900">{request.title}</p>
                <p className="text-xs text-slate-500">{t(REQUEST_TYPE_DEFS[request.type].label)}</p>
              </div>
              <input
                type="checkbox"
                name="requestId"
                value={request.id}
                aria-label={t(`เลือก ${request.requestNo}`, `ເລືອກ ${request.requestNo}`, `Select ${request.requestNo}`)}
                className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-emerald-600"
              />
            </div>

            {(wait || askedForInfo || standingInFor) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {wait && (
                  <Badge tone={WAIT_TONE[wait.level]}>
                    <Hourglass className="h-3 w-3" aria-hidden />
                    {waitText(wait, t)}
                  </Badge>
                )}
                {askedForInfo && (
                  <Badge tone="amber">
                    <MessageCircleQuestion className="h-3 w-3" aria-hidden />
                    {t("รอผู้ขอตอบข้อมูลเพิ่ม", "ລໍຖ້າຜູ້ຂໍຕອບຂໍ້ມູນເພີ່ມ", "Waiting for the requester")}
                  </Badge>
                )}
                {standingInFor && (
                  <Badge tone="indigo">
                    <UserCog className="h-3 w-3" aria-hidden />
                    {t(`แทน ${standingInFor}`, `ແທນ ${standingInFor}`, `For ${standingInFor}`)}
                  </Badge>
                )}
              </div>
            )}

            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
              <div>
                <dt className="text-xs text-slate-500">{t("ผู้ขอ", "ຜູ້ຂໍ", "Requester")}</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <Avatar name={request.requester.name} size="xs" />
                  <span className="truncate font-medium text-slate-800">{request.requester.name}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t("ต้องการใช้งานภายใน", "ຕ້ອງການໃຊ້ງານພາຍໃນ", "Needed by")}</dt>
                <dd className="mt-1 font-medium text-slate-800">{request.neededBy ? formatDate(request.neededBy, lang) : "-"}</dd>
              </div>
            </dl>

            {request.requestedForName && (
              <p className="mt-3 text-xs text-slate-500">{t(`ขอให้: ${request.requestedForName}`, `ຂໍໃຫ້: ${request.requestedForName}`, `Requested for: ${request.requestedForName}`)}</p>
            )}

            <Link href={`/requests/${request.id}`} className={`${btnPrimary} mt-5`}>
              <ShieldCheck className="h-4 w-4" aria-hidden />
              {t("ตรวจสอบและพิจารณา", "ກວດສອບ ແລະ ພິຈາລະນາ", "Review and decide")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("รอการอนุมัติของฉัน", "ລໍຖ້າການອະນຸມັດຂອງຂ້ອຍ", "Awaiting my approval")}
        description={t(
          "คำขอที่พนักงานเลือกคุณเป็นผู้อนุมัติ (และของหัวหน้าที่คุณพิจารณาแทน) เรียงจากที่รอนานที่สุด หลังอนุมัติ คำขอจะเข้าคิวทีม IT",
          "ຄຳຂໍທີ່ພະນັກງານເລືອກທ່ານເປັນຜູ້ອະນຸມັດ (ແລະ ຂອງຫົວໜ້າທີ່ທ່ານພິຈາລະນາແທນ) ລຽງຈາກທີ່ລໍຖ້ານານທີ່ສຸດ ຫຼັງຈາກອະນຸມັດ ຄຳຂໍຈະເຂົ້າຄິວທີມ IT",
          "Requests where an employee chose you as the approver (and those of a manager you stand in for), longest-waiting first. Once approved, the request goes to the IT team queue.",
        )}
      />

      {pending.length === 0 ? (
        <EmptyState text={t("ไม่มีคำขอที่รอการอนุมัติจากคุณ", "ບໍ່ມີຄຳຂໍທີ່ລໍຖ້າການອະນຸມັດຈາກທ່ານ", "No requests are awaiting your approval")} />
      ) : (
        <BulkApprove total={pending.length}>{cards}</BulkApprove>
      )}

      {manager && <DelegationCard managerId={user.id} delegations={delegations} candidates={candidates} canEdit />}
    </div>
  );
}
