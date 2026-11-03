import {
  ArrowRightLeft,
  FilePlus2,
  Gauge,
  MessageCircleQuestion,
  Pencil,
  ShieldCheck,
  Trash2,
  Undo2,
  UserCheck,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import type { Translate } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { EDITABLE_REQUEST_FIELDS, REQUEST_EDIT_FIELD_LABEL } from "@/lib/admin-rules";
import { ROLE_LABEL, formatDateTime } from "@/lib/labels";
import type { RequestDetail } from "@/lib/queries";
import { STATUS_LABEL, isValidStatus } from "@/lib/status";
import { Avatar } from "./avatar";
import { Badge } from "./badges";

type Event = RequestDetail["events"][number];

type Entry =
  | { kind: "comment"; at: Date; id: string; comment: RequestDetail["comments"][number] }
  | { kind: "event"; at: Date; id: string; event: Event };

function statusText(value: string | null, t: Translate): string {
  if (!value) return "-";
  return isValidStatus(value) ? t(STATUS_LABEL[value]) : value;
}

function isEditableField(key: string): key is (typeof EDITABLE_REQUEST_FIELDS)[number] {
  return (EDITABLE_REQUEST_FIELDS as readonly string[]).includes(key);
}

function describeEvent(event: Event, t: Translate): { text: string; icon: LucideIcon; tone: string } {
  switch (event.action) {
    case "CREATED":
      return {
        // `fromValue` holds the requester's name when a manager or administrator created it for them.
        text: event.fromValue
          ? t(`สร้างคำขอแทน ${event.fromValue}`, `ສ້າງຄຳຂໍແທນ ${event.fromValue}`, `created the request on behalf of ${event.fromValue}`)
          : t("สร้างคำขอ", "ສ້າງຄຳຂໍ", "created the request"),
        icon: FilePlus2,
        tone: "bg-indigo-100 text-indigo-600",
      };
    case "STATUS_CHANGED":
      if (event.fromValue === "PENDING_APPROVAL" && event.toValue === "SUBMITTED") {
        return {
          text: t(
            "อนุมัติคำขอ (หัวหน้างาน) ส่งต่อให้ทีม IT",
            "ອະນຸມັດຄຳຂໍ (ຫົວໜ້າ) ສົ່ງຕໍ່ໃຫ້ທີມ IT",
            "approved the request (manager) and forwarded it to the IT team",
          ),
          icon: ShieldCheck,
          tone: "bg-emerald-100 text-emerald-600",
        };
      }
      return {
        text: t(
          `เปลี่ยนสถานะ ${statusText(event.fromValue, t)} → ${statusText(event.toValue, t)}`,
          `ປ່ຽນສະຖານະ ${statusText(event.fromValue, t)} → ${statusText(event.toValue, t)}`,
          `changed the status ${statusText(event.fromValue, t)} → ${statusText(event.toValue, t)}`,
        ),
        icon: ArrowRightLeft,
        tone: "bg-sky-100 text-sky-600",
      };
    case "ASSIGNED":
      return {
        text: event.toValue
          ? t(`มอบหมายให้ ${event.toValue}`, `ມອບໝາຍໃຫ້ ${event.toValue}`, `assigned to ${event.toValue}`)
          : t(
              `ยกเลิกการมอบหมาย (เดิม ${event.fromValue ?? "-"})`,
              `ຍົກເລີກການມອບໝາຍ (ເດີມ ${event.fromValue ?? "-"})`,
              `removed the assignment (previously ${event.fromValue ?? "-"})`,
            ),
        icon: UserCheck,
        tone: "bg-violet-100 text-violet-600",
      };
    case "SLA_CHANGED":
      return {
        text: t(
          `เปลี่ยนระดับ SLA ${event.fromValue ?? "-"} → ${event.toValue ?? "-"}`,
          `ປ່ຽນລະດັບ SLA ${event.fromValue ?? "-"} → ${event.toValue ?? "-"}`,
          `changed the SLA level ${event.fromValue ?? "-"} → ${event.toValue ?? "-"}`,
        ),
        icon: Gauge,
        tone: "bg-amber-100 text-amber-600",
      };
    case "APPROVER_CHANGED":
      return {
        text: t(
          `เปลี่ยนผู้อนุมัติ ${event.fromValue ?? "-"} → ${event.toValue ?? "-"}`,
          `ປ່ຽນຜູ້ອະນຸມັດ ${event.fromValue ?? "-"} → ${event.toValue ?? "-"}`,
          `changed the approver ${event.fromValue ?? "-"} → ${event.toValue ?? "-"}`,
        ),
        icon: UserCog,
        tone: "bg-slate-200 text-slate-600",
      };
    case "EDITED": {
      const fields = (event.toValue ?? "")
        .split(",")
        .filter(Boolean)
        .map((key) => (isEditableField(key) ? t(REQUEST_EDIT_FIELD_LABEL[key]) : key))
        .join(", ");
      return {
        text: t(`แก้ไขข้อมูลคำขอ (${fields})`, `ແກ້ໄຂຂໍ້ມູນຄຳຂໍ (${fields})`, `edited the request (${fields})`),
        icon: Pencil,
        tone: "bg-slate-200 text-slate-600",
      };
    }
    case "DELETED":
      return { text: t("ลบคำขอ", "ລຶບຄຳຂໍ", "deleted the request"), icon: Trash2, tone: "bg-red-100 text-red-600" };
    case "RESTORED":
      return { text: t("กู้คืนคำขอ", "ກູ້ຄືນຄຳຂໍ", "restored the request"), icon: Undo2, tone: "bg-emerald-100 text-emerald-600" };
    case "INFO_REQUESTED":
      return {
        text: t(
          "ขอข้อมูลเพิ่มเติมจากผู้ขอ (ยังรอการอนุมัติอยู่)",
          "ຂໍຂໍ້ມູນເພີ່ມເຕີມຈາກຜູ້ຂໍ (ຍັງລໍຖ້າການອະນຸມັດຢູ່)",
          "asked the requester for more information (still waiting for approval)",
        ),
        icon: MessageCircleQuestion,
        tone: "bg-amber-100 text-amber-600",
      };
    case "DECIDED_FOR":
      return {
        text: t(
          `พิจารณาแทน ${event.toValue ?? "-"} (ผู้แทนอนุมัติ)`,
          `ພິຈາລະນາແທນ ${event.toValue ?? "-"} (ຜູ້ແທນອະນຸມັດ)`,
          `decided on behalf of ${event.toValue ?? "-"} (stand-in approver)`,
        ),
        icon: UserCog,
        tone: "bg-indigo-100 text-indigo-600",
      };
  }
}

export async function RequestTimeline({ request }: { request: RequestDetail }) {
  const { t, lang } = await getI18n();
  const entries: Entry[] = [
    ...request.comments.map((comment): Entry => ({ kind: "comment", at: comment.createdAt, id: comment.id, comment })),
    ...request.events.map((event): Entry => ({ kind: "event", at: event.createdAt, id: event.id, event })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  return (
    <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-4 before:w-px before:bg-slate-200">
      {entries.map((entry) => {
        if (entry.kind === "event") {
          const { text, icon: Icon, tone } = describeEvent(entry.event, t);
          return (
            <li key={entry.id} className="relative flex items-center gap-3 text-sm text-slate-500">
              <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-slate-50 ${tone}`} aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
              <p>
                <span className="font-medium text-slate-800">{entry.event.actor.name}</span> {text}
                <span className="ml-2 text-xs text-slate-400">{formatDateTime(entry.at, lang)}</span>
              </p>
            </li>
          );
        }

        const { comment } = entry;
        return (
          <li key={entry.id} className="relative flex items-start gap-3">
            <span className="relative z-10 rounded-full ring-4 ring-slate-50">
              <Avatar name={comment.author.name} size="sm" />
            </span>
            <div
              className={`min-w-0 flex-1 rounded-2xl rounded-tl-md border px-4 py-3 ${
                comment.isInternal ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white shadow-card"
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="font-medium text-slate-900">{comment.author.name}</span>
                {comment.author.role !== "EMPLOYEE" && <Badge tone="blue">{t(ROLE_LABEL[comment.author.role])}</Badge>}
                {comment.isInternal && <Badge tone="amber">{t("บันทึกภายใน · เห็นเฉพาะทีม IT", "ບັນທຶກພາຍໃນ · ເຫັນສະເພາະທີມ IT", "Internal note · visible to the IT team only")}</Badge>}
                <span className="text-xs text-slate-400">{formatDateTime(entry.at, lang)}</span>
              </div>
              <p className="mt-1.5 text-sm break-words whitespace-pre-wrap text-slate-800">{comment.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
