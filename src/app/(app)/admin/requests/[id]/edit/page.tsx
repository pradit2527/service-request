import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/badges";
import { RequestEditForm } from "@/components/request-edit-form";
import { requireSystemManager } from "@/lib/dal";
import { getI18n } from "@/lib/i18n-server";
import { canEditRequest } from "@/lib/permissions";
import { getRequestDetail, listApprovers } from "@/lib/queries";
import { REQUEST_TYPE_DEFS } from "@/lib/request-types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("แก้ไขคำขอ", "ແກ້ໄຂຄຳຂໍ", "Edit request") };
}

export default async function EditRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireSystemManager();
  const { t } = await getI18n();
  const { id } = await params;

  const request = await getRequestDetail(actor, id);
  if (!request || !canEditRequest(actor, request)) notFound();

  const canChangeApprover = request.status === "PENDING_APPROVAL";
  const approvers = canChangeApprover ? await listApprovers(request.requesterId) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/admin/requests" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-indigo-600">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("กลับไปรายการคำขอ", "ກັບໄປລາຍການຄຳຂໍ", "Back to requests")}
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">{request.requestNo}</span>
        <StatusBadge status={request.status} />
        <span className="text-sm text-slate-500">
          {t(REQUEST_TYPE_DEFS[request.type].label)} · {request.requester.name}
        </span>
      </div>

      <RequestEditForm
        request={{
          id: request.id,
          title: request.title,
          description: request.description,
          priority: request.priority,
          neededBy: request.neededBy ? request.neededBy.toISOString().slice(0, 10) : "",
          requestedForName: request.requestedForName ?? "",
          approverId: request.approverId ?? "",
        }}
        approvers={approvers}
        canChangeApprover={canChangeApprover}
      />
    </div>
  );
}
