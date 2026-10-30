import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/request-list";
import { TypeIcon } from "@/components/type-icon";
import { requireUser } from "@/lib/dal";
import { getI18n, getT } from "@/lib/i18n-server";
import { formatDate } from "@/lib/labels";
import { isManager } from "@/lib/permissions";
import { listPendingApprovals } from "@/lib/queries";
import { REQUEST_TYPE_DEFS } from "@/lib/request-types";
import { btnPrimary, cardClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("รออนุมัติ", "ລໍຖ້າອະນຸມັດ", "Approvals") };
}

export default async function ApprovalsPage() {
  const { t, lang } = await getI18n();
  const user = await requireUser();
  // Only managers can decide, so anyone else (for example someone whose role changed) sees nothing to approve.
  const pending = isManager(user) ? await listPendingApprovals(user.id) : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("รอการอนุมัติของฉัน", "ລໍຖ້າການອະນຸມັດຂອງຂ້ອຍ", "Awaiting my approval")}
        description={t(
          "คำขอที่พนักงานเลือกคุณเป็นผู้อนุมัติ หลังอนุมัติ คำขอจะเข้าคิวทีม IT",
          "ຄຳຂໍທີ່ພະນັກງານເລືອກທ່ານເປັນຜູ້ອະນຸມັດ ຫຼັງຈາກອະນຸມັດ ຄຳຂໍຈະເຂົ້າຄິວທີມ IT",
          "Requests where an employee chose you as the approver. Once approved, the request goes to the IT team queue.",
        )}
      />

      {pending.length === 0 ? (
        <EmptyState text={t("ไม่มีคำขอที่รอการอนุมัติจากคุณ", "ບໍ່ມີຄຳຂໍທີ່ລໍຖ້າການອະນຸມັດຈາກທ່ານ", "No requests are awaiting your approval")} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {pending.map((request) => (
            <li key={request.id} className={`${cardClass} flex flex-col p-5`}>
              <div className="flex items-start gap-3">
                <TypeIcon type={request.type} />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-slate-500">{request.requestNo}</p>
                  <p className="mt-0.5 font-medium text-slate-900">{request.title}</p>
                  <p className="text-xs text-slate-500">{t(REQUEST_TYPE_DEFS[request.type].label)}</p>
                </div>
              </div>

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
          ))}
        </ul>
      )}
    </div>
  );
}
