"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CalendarClock, Gauge, ShieldCheck, TriangleAlert, UserRound, Users } from "lucide-react";
import { createRequest } from "@/app/actions/requests";
import { APPROVAL_REASON, OWN_REQUEST_NOTE } from "@/lib/approval";
import { useLang, useT } from "@/components/lang-provider";
import { visibleFieldNames, type FieldDef, type RequestType } from "@/lib/request-types";
import {
  DEFAULT_CALENDAR,
  SLA_TIER_DEF,
  classifyTier,
  earliestNeededBy,
  formatBusinessDuration,
  formatFulfillmentRange,
} from "@/lib/sla";
import { submitWithoutReset } from "@/lib/submit-without-reset";
import { btnSecondary, cardClass, errorTextClass, helpTextClass, inputClass, inputErrorClass, labelClass } from "@/lib/ui";
import { Avatar } from "./avatar";
import { PersonSearchInput } from "./person-search-input";

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: (a11y: { id: string; name: string; "aria-invalid": boolean; "aria-describedby"?: string; className: string }) => React.ReactNode;
};

function Field({ id, label, required, help, error, children }: FieldProps) {
  const describedBy = error ? `${id}-error` : help ? `${id}-help` : undefined;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {children({
        id,
        name: id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy,
        className: `${inputClass} ${error ? inputErrorClass : ""}`,
      })}
      {error ? (
        <p id={`${id}-error`} className={errorTextClass}>
          {error}
        </p>
      ) : (
        help && (
          <p id={`${id}-help`} className={helpTextClass}>
            {help}
          </p>
        )
      )}
    </div>
  );
}

function SectionTitle({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-teal-500 text-xs font-semibold text-white shadow-sm shadow-emerald-500/30">
        {n}
      </span>
      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

/** `note` is shown after the name: for a manager who is away, who approves in their place. */
type Approver = { id: string; name: string; department: string | null; note?: string };

/**
 * The requester is always the person who is signed in. `approvers` are the managers who can approve for them (never
 * the requester) and `needsApproval` says whether the request has to go to one.
 */
export function RequestForm({
  type,
  fields,
  approvers,
  needsApproval,
  holidays,
  today,
  requester,
}: {
  type: RequestType;
  fields: FieldDef[];
  approvers: Approver[];
  needsApproval: boolean;
  holidays: string[];
  today: string;
  requester: { name: string; department: string | null; phone: string | null };
}) {
  const t = useT();
  const lang = useLang();
  const [state, action, pending] = useActionState(createRequest, undefined);
  const errors = state?.fieldErrors ?? {};

  // Controlled values: they survive a failed submit and drive the conditional fields and live SLA summary.
  const [core, setCore] = useState({
    title: "",
    description: "",
    neededBy: "",
    forWhom: "self" as "self" | "other",
    requestedForName: "",
    // With only one approving manager there is nothing to choose, so he is already selected.
    approverId: approvers.length === 1 ? approvers[0].id : "",
  });
  const [details, setDetails] = useState<Record<string, string>>({});

  const visible = visibleFieldNames(type, details);
  const tier = classifyTier(type, details);
  const sla = SLA_TIER_DEF[tier];
  const calendar = { ...DEFAULT_CALENDAR, holidays: new Set(holidays) };
  const earliest = earliestNeededBy(tier, today, calendar);
  const leadDays = sla.minLeadBusinessDays;

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-5" noValidate>
      <input type="hidden" name="type" value={type} />

      {state?.error && (
        <p role="alert" className="flex gap-2.5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200 ring-inset">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}

      <div className="grid gap-5 2xl:grid-cols-2 2xl:items-start">
        <div className="space-y-5">
          {/* 1. Requester */}
          <section className={`${cardClass} p-5 sm:p-6`}>
            <SectionTitle n={1} title={t("ข้อมูลผู้ยื่นคำขอ", "ຂໍ້ມູນຜູ້ຍື່ນຄຳຂໍ", "Requester details")} />
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5">
              <Avatar name={requester.name} size="md" />
              <div className="min-w-0 leading-tight">
                <p className="truncate font-medium text-slate-900">{requester.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {requester.department ?? t("ยังไม่ระบุแผนก", "ຍັງບໍ່ໄດ້ລະບຸພະແນກ", "Department not set")} ·{" "}
                  {requester.phone ?? t("ยังไม่ระบุเบอร์โทร", "ຍັງບໍ່ໄດ້ລະບຸເບີໂທ", "Phone not set")}
                </p>
              </div>
              {(!requester.department || !requester.phone) && (
                <Link href="/profile" className="ml-auto shrink-0 text-xs font-medium text-indigo-600 hover:underline">
                  {t("เพิ่มข้อมูลติดต่อ", "ເພີ່ມຂໍ້ມູນຕິດຕໍ່", "Add contact details")}
                </Link>
              )}
            </div>

            <fieldset className="mt-4">
              <legend className={labelClass}>{t("ผู้ใช้งานจริง", "ຜູ້ໃຊ້ງານຈິງ", "Actual user")}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    { value: "self", label: t("ขอให้ตนเอง", "ຂໍໃຫ້ຕົນເອງ", "For myself"), hint: requester.name, icon: UserRound },
                    {
                      value: "other",
                      label: t("ขอให้ผู้อื่น", "ຂໍໃຫ້ຜູ້ອື່ນ", "For someone else"),
                      hint: t("เช่น พนักงานใหม่ / เพื่อนร่วมงาน", "ເຊັ່ນ ພະນັກງານໃໝ່ / ເພື່ອນຮ່ວມງານ", "e.g. a new employee / a colleague"),
                      icon: Users,
                    },
                  ] as const
                ).map(({ value, label, hint, icon: Icon }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50 has-checked:border-emerald-500 has-checked:bg-emerald-50/60 has-checked:ring-2 has-checked:ring-emerald-500/20"
                  >
                    <input
                      type="radio"
                      name="forWhom"
                      value={value}
                      checked={core.forWhom === value}
                      onChange={() => setCore((c) => ({ ...c, forWhom: value }))}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <Icon className="h-4 w-4 text-slate-400" aria-hidden />
                    <span className="leading-tight">
                      <span className="block text-sm font-medium text-slate-800">{label}</span>
                      <span className="block truncate text-xs text-slate-500">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
              {core.forWhom === "other" && (
                <div className="mt-3">
                  <Field
                    id="requestedForName"
                    label={t("ชื่อ-นามสกุลและแผนกของผู้ใช้งานจริง", "ຊື່-ນາມສະກຸນ ແລະ ພະແນກຂອງຜູ້ໃຊ້ງານຈິງ", "Full name and department of the actual user")}
                    required
                    help={t(
                      "พิมพ์ชื่อเพื่อค้นหาจากรายชื่อในระบบแล้วเลือกจากรายการ หรือพิมพ์เองหากยังไม่มีในระบบ",
                      "ພິມຊື່ເພື່ອຄົ້ນຫາຈາກລາຍຊື່ໃນລະບົບແລ້ວເລືອກຈາກລາຍການ ຫຼື ພິມເອງຖ້າຍັງບໍ່ມີໃນລະບົບ",
                      "Type a name to search the people in the system and pick one from the list, or type it yourself if they are not in the system yet.",
                    )}
                    error={errors.requestedForName}
                  >
                    {(a11y) => (
                      <PersonSearchInput
                        {...a11y}
                        maxLength={150}
                        placeholder={t("เช่น สมหญิง รักงาน · ฝ่ายการเงิน", "ເຊັ່ນ ສົມຍິງ ຮັກງານ · ພະແນກການເງິນ", "e.g. Somying Rakngan · Finance")}
                        listLabel={t("รายชื่อที่พบ", "ລາຍຊື່ທີ່ພົບ", "Matching people")}
                        value={core.requestedForName}
                        onChange={(value) => setCore((c) => ({ ...c, requestedForName: value }))}
                      />
                    )}
                  </Field>
                </div>
              )}
            </fieldset>
          </section>

          {/* 2. Type-specific fields */}
          {fields.length > 0 && (
            <section className={`${cardClass} border-emerald-100 bg-emerald-50/30 p-5 sm:p-6`}>
              <SectionTitle
                n={2}
                title={t("รายละเอียดของบริการที่ต้องการ", "ລາຍລະອຽດຂອງບໍລິການທີ່ຕ້ອງການ", "Details of the requested service")}
                hint={t("ช่องที่แสดงจะเปลี่ยนตามคำตอบของคุณ", "ຊ່ອງທີ່ສະແດງຈະປ່ຽນຕາມຄຳຕອບຂອງທ່ານ", "The fields shown change based on your answers")}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {fields
                  .filter((field) => visible.has(field.name))
                  .map((field) => {
                    const id = `d_${field.name}`;
                    const value = details[field.name] ?? "";
                    const set = (v: string) => setDetails((prev) => ({ ...prev, [field.name]: v }));
                    return (
                      <Field
                        key={field.name}
                        id={id}
                        label={t(field.label)}
                        required={field.required}
                        help={field.help ? t(field.help) : undefined}
                        error={errors[id]}
                      >
                        {(a11y) =>
                          field.kind === "select" ? (
                            <select {...a11y} value={value} onChange={(e) => set(e.target.value)}>
                              <option value="">{t("— เลือก —", "— ເລືອກ —", "— Select —")}</option>
                              {field.options?.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {t(o.label)}
                                </option>
                              ))}
                            </select>
                          ) : field.kind === "textarea" ? (
                            <textarea {...a11y} rows={3} value={value} onChange={(e) => set(e.target.value)} />
                          ) : (
                            <input
                              {...a11y}
                              type={field.kind === "number" ? "number" : field.kind === "date" ? "date" : "text"}
                              inputMode={field.kind === "number" ? "numeric" : undefined}
                              min={field.kind === "number" ? field.min : undefined}
                              max={field.kind === "number" ? field.max : undefined}
                              placeholder={field.placeholder ? t(field.placeholder) : undefined}
                              value={value}
                              onChange={(e) => set(e.target.value)}
                            />
                          )
                        }
                      </Field>
                    );
                  })}
              </div>
            </section>
          )}

        </div>

        <div className="space-y-5">
          {/* 3. Reason and date */}
          <section className={`${cardClass} p-5 sm:p-6`}>
            <SectionTitle n={fields.length > 0 ? 3 : 2} title={t("เหตุผลและวันที่ต้องการ", "ເຫດຜົນ ແລະ ວັນທີທີ່ຕ້ອງການ", "Reason and date needed")} />
            <div className="space-y-4">
              <Field
                id="title"
                label={t("หัวข้อคำขอ", "ຫົວຂໍ້ຄຳຂໍ", "Request subject")}
                required
                error={errors.title}
                help={t(
                  "สรุปสั้นๆ ว่าต้องการอะไร เช่น ขอโน้ตบุ๊กสำหรับพนักงานใหม่ 2 เครื่อง",
                  "ສະຫຼຸບສັ້ນໆ ວ່າຕ້ອງການຫຍັງ ເຊັ່ນ ຂໍໂນດບຸກສຳລັບພະນັກງານໃໝ່ 2 ເຄື່ອງ",
                  "Briefly say what you need, e.g. 2 laptops for new employees",
                )}
              >
                {(a11y) => (
                  <input
                    {...a11y}
                    type="text"
                    maxLength={150}
                    value={core.title}
                    onChange={(e) => setCore((c) => ({ ...c, title: e.target.value }))}
                  />
                )}
              </Field>

              <Field
                id="description"
                label={t("เหตุผลและความจำเป็นในการขอบริการ", "ເຫດຜົນ ແລະ ຄວາມຈຳເປັນໃນການຂໍບໍລິການ", "Reason and justification for the request")}
                required
                error={errors.description}
              >
                {(a11y) => (
                  <textarea
                    {...a11y}
                    rows={5}
                    maxLength={5000}
                    placeholder={t(
                      "เช่น ต้องใช้เข้าถึงไฟล์งบประมาณเพื่อทำรายงานประจำเดือน หรือ พนักงานใหม่เริ่มงานวันที่ 15 พ.ย.",
                      "ເຊັ່ນ ຕ້ອງໃຊ້ເຂົ້າເຖິງໄຟລ໌ງົບປະມານເພື່ອເຮັດລາຍງານປະຈຳເດືອນ ຫຼື ພະນັກງານໃໝ່ເລີ່ມວຽກວັນທີ 15 ພະຈິກ",
                      "e.g. Access to the budget files is needed for the monthly report, or a new employee starts on 15 Nov",
                    )}
                    value={core.description}
                    onChange={(e) => setCore((c) => ({ ...c, description: e.target.value }))}
                  />
                )}
              </Field>

              <Field
                id="neededBy"
                label={t("วันที่ต้องการใช้งาน", "ວັນທີທີ່ຕ້ອງການໃຊ້ງານ", "Date needed")}
                required
                error={errors.neededBy}
                help={
                  leadDays > 0
                    ? t(
                        `คำขอประเภทนี้ใช้เวลาอย่างน้อย ${leadDays} วันทำการ แนะนำให้ระบุไม่ก่อนวันที่ ${earliest.split("-").reverse().join("/")}`,
                        `ຄຳຂໍປະເພດນີ້ໃຊ້ເວລາຢ່າງໜ້ອຍ ${leadDays} ວັນເຮັດວຽກ ແນະນຳໃຫ້ລະບຸບໍ່ກ່ອນວັນທີ ${earliest.split("-").reverse().join("/")}`,
                        `This type of request takes at least ${leadDays} business ${leadDays === 1 ? "day" : "days"}. We recommend a date no earlier than ${earliest.split("-").reverse().join("/")}`,
                      )
                    : t("ระบุวันที่คาดหวังว่าจะได้ใช้งาน", "ລະບຸວັນທີທີ່ຄາດຫວັງວ່າຈະໄດ້ໃຊ້ງານ", "Enter the date you expect to start using it")
                }
              >
                {(a11y) => (
                  <input
                    {...a11y}
                    type="date"
                    min={earliest}
                    value={core.neededBy}
                    onChange={(e) => setCore((c) => ({ ...c, neededBy: e.target.value }))}
                  />
                )}
              </Field>

              {/* Live SLA summary */}
              <div className="flex gap-3 rounded-2xl bg-linear-to-r from-indigo-50 to-violet-50 p-4 ring-1 ring-indigo-100 ring-inset">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-xs">
                  <Gauge className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <div className="text-sm">
                  <p className="font-medium text-slate-900">
                    {t("ระดับบริการ", "ລະດັບການບໍລິການ", "Service level")}: {sla.label}
                  </p>
                  <p className="mt-0.5 text-slate-600">
                    {t(
                      `ตอบรับภายใน ${formatBusinessDuration(sla.responseMinutes, lang)} · ส่งมอบภายใน ${formatFulfillmentRange(tier, lang)}`,
                      `ຕອບຮັບພາຍໃນ ${formatBusinessDuration(sla.responseMinutes, lang)} · ສົ່ງມອບພາຍໃນ ${formatFulfillmentRange(tier, lang)}`,
                      `Response within ${formatBusinessDuration(sla.responseMinutes, lang)} · Fulfillment within ${formatFulfillmentRange(tier, lang)}`,
                    )}
                    <span className="text-slate-400"> {t("(นับเวลาทำการ)", "(ນັບເວລາເຮັດວຽກ)", "(business hours only)")}</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Approver */}
          {needsApproval && (
            <section className={`${cardClass} p-5 sm:p-6`}>
              <SectionTitle
                n={fields.length > 0 ? 4 : 3}
                title={t("ผู้อนุมัติ (หัวหน้างาน)", "ຜູ້ອະນຸມັດ (ຫົວໜ້າ)", "Approver (manager)")}
                hint={t(APPROVAL_REASON)}
              />
              {approvers.length === 0 ? (
                <p className="flex gap-2.5 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-800 ring-1 ring-amber-200 ring-inset">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {t(
                    "ยังไม่มีผู้อนุมัติในระบบ กรุณาติดต่อผู้ดูแลระบบให้กำหนดหัวหน้างานก่อนส่งคำขอประเภทนี้",
                    "ຍັງບໍ່ມີຜູ້ອະນຸມັດໃນລະບົບ ກະລຸນາຕິດຕໍ່ຜູ້ດູແລລະບົບເພື່ອກຳນົດຫົວໜ້າກ່ອນສົ່ງຄຳຂໍປະເພດນີ້",
                    "There are no approvers in the system yet. Please contact an administrator to assign a manager before submitting this type of request.",
                  )}
                </p>
              ) : (
                <>
                  <Field id="approverId" label={t("เลือกหัวหน้างานผู้อนุมัติ", "ເລືອກຫົວໜ້າຜູ້ອະນຸມັດ", "Select an approving manager")} required error={errors.approverId}>
                    {(a11y) => (
                      <select {...a11y} value={core.approverId} onChange={(e) => setCore((c) => ({ ...c, approverId: e.target.value }))}>
                        <option value="">{t("— เลือกหัวหน้างาน —", "— ເລືອກຫົວໜ້າ —", "— Select a manager —")}</option>
                        {approvers.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                            {a.department ? ` (${a.department})` : ""}
                            {a.note ? ` · ${a.note}` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                  <p className="mt-3 flex gap-2 text-xs text-slate-500">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
                    {t(
                      "หัวหน้างานจะเห็นคำขอในเมนู “รออนุมัติ” เมื่อเข้าระบบ เวลาที่รออนุมัติจะไม่นับรวมใน SLA ของทีม IT",
                      "ຫົວໜ້າຈະເຫັນຄຳຂໍໃນເມນູ “ລໍຖ້າອະນຸມັດ” ເມື່ອເຂົ້າລະບົບ ເວລາທີ່ລໍຖ້າອະນຸມັດຈະບໍ່ນັບລວມໃນ SLA ຂອງທີມ IT",
                      "The manager will see the request under “Approvals” after signing in. Time spent waiting for approval does not count toward the IT team’s SLA.",
                    )}
                  </p>
                </>
              )}
            </section>
          )}

          {!needsApproval && (
            <p className="flex gap-2.5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200 ring-inset">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {t(OWN_REQUEST_NOTE)}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <CalendarClock className="h-4 w-4" aria-hidden />
          {t(
            "ไม่ใช่เหตุขัดข้อง? หากอุปกรณ์หรือระบบเสีย กรุณาแจ้งทีม IT ตามช่องทางแจ้งปัญหาเดิม",
            "ບໍ່ແມ່ນເຫດຂັດຂ້ອງບໍ? ຖ້າອຸປະກອນ ຫຼື ລະບົບເສຍ ກະລຸນາແຈ້ງທີມ IT ຕາມຊ່ອງທາງແຈ້ງບັນຫາເດີມ",
            "Not an incident? If a device or system is broken, please report it to the IT team through the usual problem-reporting channel.",
          )}
        </p>
        <div className="flex gap-3">
          <Link href="/requests/new" className={btnSecondary}>
            {t("เปลี่ยนประเภทคำขอ", "ປ່ຽນປະເພດຄຳຂໍ", "Change request type")}
          </Link>
          <button
            type="submit"
            disabled={pending || (needsApproval && approvers.length === 0)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-white shadow-md shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60 enabled:active:scale-[0.98]"
          >
            {pending ? t("กำลังส่งคำขอ...", "ກຳລັງສົ່ງຄຳຂໍ...", "Submitting...") : t("ส่งคำขอบริการ", "ສົ່ງຄຳຂໍບໍລິການ", "Submit request")}
          </button>
        </div>
      </div>
    </form>
  );
}
