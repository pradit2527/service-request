import { CalendarClock } from "lucide-react";
import { revokeDelegation } from "@/app/actions/delegation";
import { getI18n } from "@/lib/i18n-server";
import { formatDate } from "@/lib/labels";
import { todayBangkok } from "@/lib/request-number";
import { cardClass } from "@/lib/ui";
import { ConfirmActionButton } from "./confirm-action-button";
import { DelegationForm } from "./delegation-form";

type Delegation = {
  id: string;
  managerId: string;
  delegateId: string;
  startsAt: Date;
  endsAt: Date;
  manager: { name: string };
  delegate: { name: string };
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Who stands in for a manager while they are away. It lists the periods that are running or still to come, lets the
 * manager (or an administrator) cancel one and set a new one, and tells a manager who is a stand-in for someone else
 * whose place they take and until when.
 */
export async function DelegationCard({
  managerId,
  delegations,
  candidates,
  canEdit,
}: {
  managerId: string;
  delegations: Delegation[];
  candidates: { id: string; name: string; department: string | null }[];
  canEdit: boolean;
}) {
  const { t, lang } = await getI18n();
  const now = new Date();
  // The period ends at the start of the day after its last day, so show the last day itself.
  const lastDay = (d: Delegation) => formatDate(new Date(d.endsAt.getTime() - DAY_MS), lang);

  const own = delegations.filter((d) => d.managerId === managerId);
  const standingIn = delegations.filter((d) => d.delegateId === managerId);

  return (
    <section className={`${cardClass} space-y-4 p-5 sm:p-6`}>
      <div>
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <CalendarClock className="h-4 w-4 text-indigo-500" aria-hidden />
          {t("ผู้แทนอนุมัติช่วงที่ไม่อยู่", "ຜູ້ແທນອະນຸມັດຊ່ວງທີ່ບໍ່ຢູ່", "Stand-in while away")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {t(
            "ถ้าคุณลาหรือไม่อยู่ ให้หัวหน้างานอีกคนอนุมัติแทนในช่วงนั้น คำขอจะไม่ค้างรอคุณ",
            "ຖ້າທ່ານລາ ຫຼື ບໍ່ຢູ່ ໃຫ້ຫົວໜ້າອີກຄົນອະນຸມັດແທນໃນຊ່ວງນັ້ນ ຄຳຂໍຈະບໍ່ຄ້າງລໍຖ້າທ່ານ",
            "If you are on leave or away, let another manager approve in your place for that time, so requests do not wait for you.",
          )}
        </p>
      </div>

      {standingIn.length > 0 && (
        <ul className="space-y-2">
          {standingIn.map((d) => (
            <li key={d.id} className="rounded-xl bg-indigo-50 px-3.5 py-2.5 text-sm text-indigo-900 ring-1 ring-indigo-200 ring-inset">
              {d.startsAt.getTime() <= now.getTime()
                ? t(
                    `คุณพิจารณาแทน ${d.manager.name} อยู่ ตั้งแต่ ${formatDate(d.startsAt, lang)} ถึง ${lastDay(d)}`,
                    `ທ່ານພິຈາລະນາແທນ ${d.manager.name} ຢູ່ ຕັ້ງແຕ່ ${formatDate(d.startsAt, lang)} ຮອດ ${lastDay(d)}`,
                    `You are deciding in place of ${d.manager.name}, from ${formatDate(d.startsAt, lang)} to ${lastDay(d)}`,
                  )
                : t(
                    `คุณจะพิจารณาแทน ${d.manager.name} ตั้งแต่ ${formatDate(d.startsAt, lang)} ถึง ${lastDay(d)}`,
                    `ທ່ານຈະພິຈາລະນາແທນ ${d.manager.name} ຕັ້ງແຕ່ ${formatDate(d.startsAt, lang)} ຮອດ ${lastDay(d)}`,
                    `You will decide in place of ${d.manager.name}, from ${formatDate(d.startsAt, lang)} to ${lastDay(d)}`,
                  )}
            </li>
          ))}
        </ul>
      )}

      {own.length > 0 ? (
        <ul className="space-y-2">
          {own.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm">
              <span className="text-slate-800">
                <span className="font-medium">{d.delegate.name}</span>{" "}
                <span className="text-slate-500">
                  {d.startsAt.getTime() <= now.getTime() ? t("กำลังแทนอยู่ ", "ກຳລັງແທນຢູ່ ", "standing in now, ") : ""}
                  {formatDate(d.startsAt, lang)} – {lastDay(d)}
                </span>
              </span>
              {canEdit && (
                <ConfirmActionButton
                  action={revokeDelegation}
                  fields={{ delegationId: d.id }}
                  label={t("ยกเลิก", "ຍົກເລີກ", "Cancel")}
                  pendingLabel={t("กำลังยกเลิก...", "ກຳລັງຍົກເລີກ...", "Cancelling...")}
                  confirmText={t(`ยกเลิกผู้แทน ${d.delegate.name} ?`, `ຍົກເລີກຜູ້ແທນ ${d.delegate.name} ບໍ?`, `Cancel ${d.delegate.name} as stand-in?`)}
                  compact
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">{t("ยังไม่ได้ตั้งผู้แทน", "ຍັງບໍ່ໄດ້ຕັ້ງຜູ້ແທນ", "No stand-in set")}</p>
      )}

      {canEdit && <DelegationForm managerId={managerId} candidates={candidates} today={todayBangkok()} />}
    </section>
  );
}
