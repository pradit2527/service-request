"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { requiresManagerApproval } from "@/lib/approval";
import { requireStaff, requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import type { Translate } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { formatDate, type Role } from "@/lib/labels";
import {
  allowedStatusChanges,
  canCancelRequest,
  canComment,
  canDecideAsManager,
  canManageSystem,
  canPostInternalNote,
  canViewRequest,
  isStaff,
} from "@/lib/permissions";
import { counterKey, currentYearBangkok, formatRequestNo, todayBangkok } from "@/lib/request-number";
import { REQUEST_TYPE_DEFS, isRequestType, validateDetails } from "@/lib/request-types";
import {
  SLA_TIERS,
  SLA_TIER_DEF,
  classifyTier,
  dueDates,
  earliestNeededBy,
  slaPatchForStatusChange,
} from "@/lib/sla";
import { getSlaCalendar } from "@/lib/sla-calendar";
import {
  CANCELLABLE_STATUSES,
  CLOSED_STATUSES,
  DECISION_STATUSES,
  NOTE_REQUIRED_STATUSES,
  REQUEST_STATUSES,
} from "@/lib/status";

function notFoundMessage(t: Translate) {
  return t(
    "ไม่พบคำขอ หรือคุณไม่มีสิทธิ์เข้าถึง",
    "ບໍ່ພົບຄຳຂໍ ຫຼື ທ່ານບໍ່ມີສິດເຂົ້າເຖິງ",
    "Request not found, or you do not have access",
  );
}

function staleMessage(t: Translate) {
  return t(
    "สถานะของคำขอถูกเปลี่ยนไปแล้ว กรุณารีเฟรชหน้าแล้วลองใหม่",
    "ສະຖານະຂອງຄຳຂໍຖືກປ່ຽນແລ້ວ ກະລຸນາໂຫຼດໜ້າໃໝ່ ແລ້ວລອງອີກຄັ້ງ",
    "The request status has already changed. Please refresh the page and try again",
  );
}

class StaleRequestError extends Error {}

function firstIssuePerField(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

function revalidateRequest(requestId: string) {
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/requests");
  revalidatePath("/approvals");
  revalidatePath("/");
}

// The SLA fields every status-changing action needs to read.
const slaFields = {
  slaTier: true,
  createdAt: true,
  firstResponseAt: true,
  slaPausedAt: true,
  slaPausedMinutes: true,
} as const;

// ---------------------------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------------------------

function createSchema(t: Translate) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(3, { error: t("หัวข้อต้องมีอย่างน้อย 3 ตัวอักษร", "ຫົວຂໍ້ຕ້ອງມີຢ່າງໜ້ອຍ 3 ຕົວອັກສອນ", "Subject must be at least 3 characters") })
      .max(150, { error: t("หัวข้อยาวเกิน 150 ตัวอักษร", "ຫົວຂໍ້ຍາວເກີນ 150 ຕົວອັກສອນ", "Subject must be 150 characters or fewer") }),
    description: z
      .string()
      .trim()
      .min(10, { error: t("เหตุผลต้องมีอย่างน้อย 10 ตัวอักษร", "ເຫດຜົນຕ້ອງມີຢ່າງໜ້ອຍ 10 ຕົວອັກສອນ", "Reason must be at least 10 characters") })
      .max(5000, { error: t("เหตุผลยาวเกิน 5,000 ตัวอักษร", "ເຫດຜົນຍາວເກີນ 5,000 ຕົວອັກສອນ", "Reason must be 5,000 characters or fewer") }),
    neededBy: z
      .string()
      .trim()
      .min(1, { error: t("กรุณาระบุวันที่ต้องการใช้งาน", "ກະລຸນາລະບຸວັນທີທີ່ຕ້ອງການໃຊ້ງານ", "Please enter the date it is needed by") }),
    forWhom: z.enum(["self", "other"], { error: t("กรุณาเลือกผู้ใช้งาน", "ກະລຸນາເລືອກຜູ້ໃຊ້ງານ", "Please select who will use it") }),
    requestedForName: z
      .string()
      .trim()
      .max(150, { error: t("ชื่อยาวเกิน 150 ตัวอักษร", "ຊື່ຍາວເກີນ 150 ຕົວອັກສອນ", "Name must be 150 characters or fewer") }),
    approverId: z.string().trim(),
  });
}

export async function createRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t, lang } = await getI18n();
  const user = await requireUser();

  // An administrator or manager can file the request on behalf of someone else (the "requesterId" field).
  let requester: { id: string; name: string; role: Role } = { id: user.id, name: user.name, role: user.role };
  const onBehalfId = canManageSystem(user) ? String(formData.get("requesterId") ?? "") : "";
  let requesterMissing = false;
  if (onBehalfId && onBehalfId !== user.id) {
    const found = await db.user.findFirst({ where: { id: onBehalfId, isActive: true }, select: { id: true, name: true, role: true } });
    if (found) requester = found;
    else requesterMissing = true;
  }

  const type = formData.get("type");
  if (!isRequestType(type)) return { error: t("ประเภทคำขอไม่ถูกต้อง", "ປະເພດຄຳຂໍບໍ່ຖືກຕ້ອງ", "Invalid request type") };

  const core = createSchema(t).safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    neededBy: formData.get("neededBy") ?? "",
    forWhom: formData.get("forWhom") ?? "self",
    requestedForName: formData.get("requestedForName") ?? "",
    approverId: formData.get("approverId") ?? "",
  });
  const fieldErrors: Record<string, string> = core.success ? {} : firstIssuePerField(core.error);
  if (requesterMissing) fieldErrors.requesterId = t("ไม่พบผู้ขอที่เลือก", "ບໍ່ພົບຜູ້ຂໍທີ່ເລືອກ", "The selected requester was not found");

  const raw: Record<string, string> = {};
  for (const field of REQUEST_TYPE_DEFS[type].fields) raw[field.name] = String(formData.get(`d_${field.name}`) ?? "");
  const details = validateDetails(type, raw, lang);
  for (const [name, message] of Object.entries(details.errors)) fieldErrors[`d_${name}`] = message;

  const cal = getSlaCalendar();
  const tier = classifyTier(type, details.values);
  const otherApprovers = await db.user.count({ where: { isActive: true, role: "MANAGER", NOT: { id: requester.id } } });
  const needsApproval = requiresManagerApproval(requester, otherApprovers);

  if (core.success) {
    const { neededBy, forWhom, requestedForName, approverId } = core.data;

    if (forWhom === "other" && requestedForName.length < 3) {
      fieldErrors.requestedForName = t(
        "กรุณาระบุชื่อ-นามสกุลและแผนกของผู้ใช้งานจริง",
        "ກະລຸນາລະບຸຊື່-ນາມສະກຸນ ແລະ ພະແນກຂອງຜູ້ໃຊ້ງານຈິງ",
        "Please enter the full name and department of the actual user",
      );
    }

    if (!fieldErrors.neededBy) {
      const valid = /^\d{4}-\d{2}-\d{2}$/.test(neededBy) && !Number.isNaN(new Date(`${neededBy}T00:00:00Z`).getTime());
      const earliest = earliestNeededBy(tier, todayBangkok(), cal);
      if (!valid) {
        fieldErrors.neededBy = t("วันที่ไม่ถูกต้อง", "ວັນທີບໍ່ຖືກຕ້ອງ", "Invalid date");
      } else if (neededBy < earliest) {
        const lead = SLA_TIER_DEF[tier].minLeadBusinessDays;
        const earliestText = formatDate(new Date(`${earliest}T00:00:00+07:00`), lang);
        fieldErrors.neededBy =
          lead === 0
            ? t("วันที่ต้องไม่เป็นวันที่ผ่านมาแล้ว", "ວັນທີຕ້ອງບໍ່ແມ່ນວັນທີທີ່ຜ່ານມາແລ້ວ", "The date cannot be in the past")
            : t(
                `คำขอประเภทนี้ใช้เวลาดำเนินการอย่างน้อย ${lead} วันทำการ กรุณาระบุวันที่ไม่ก่อน ${earliestText}`,
                `ຄຳຂໍປະເພດນີ້ໃຊ້ເວລາດຳເນີນການຢ່າງໜ້ອຍ ${lead} ວັນເຮັດວຽກ ກະລຸນາລະບຸວັນທີບໍ່ກ່ອນ ${earliestText}`,
                `This type of request takes at least ${lead} business ${lead === 1 ? "day" : "days"}. Please choose a date no earlier than ${earliestText}`,
              );
      }
    }

    if (needsApproval) {
      const approver = approverId
        ? await db.user.findFirst({
            where: { id: approverId, isActive: true, role: "MANAGER", NOT: { id: requester.id } },
            select: { id: true },
          })
        : null;
      if (!approver) {
        fieldErrors.approverId = t("กรุณาเลือกหัวหน้างานผู้อนุมัติ", "ກະລຸນາເລືອກຫົວໜ້າງານຜູ້ອະນຸມັດ", "Please select an approving manager");
      }
    }
  }

  if (!core.success || Object.keys(fieldErrors).length > 0) {
    return {
      error: t("กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง", "ກະລຸນາກວດສອບຂໍ້ມູນທີ່ກອກອີກຄັ້ງ", "Please check the information you entered"),
      fieldErrors,
    };
  }

  const { title, description, neededBy, forWhom, requestedForName, approverId } = core.data;
  const now = new Date();
  const year = currentYearBangkok();
  const due = dueDates(tier, now, 0, cal);
  const status = needsApproval ? "PENDING_APPROVAL" : "SUBMITTED";

  const created = await db.$transaction(async (tx) => {
    const counter = await tx.counter.upsert({
      where: { key: counterKey(year) },
      create: { key: counterKey(year), value: 1 },
      update: { value: { increment: 1 } },
    });
    return tx.serviceRequest.create({
      data: {
        requestNo: formatRequestNo(year, counter.value),
        type,
        title,
        description,
        status,
        details: details.values,
        neededBy: new Date(`${neededBy}T00:00:00Z`),
        requestedForName: forWhom === "other" ? requestedForName : null,
        requesterId: requester.id,
        approverId: needsApproval ? approverId : null,
        createdAt: now,
        slaTier: tier,
        responseDueAt: due.responseDueAt,
        fulfillmentDueAt: due.fulfillmentDueAt,
        // The clock only starts once the manager has approved.
        slaPausedAt: needsApproval ? now : null,
        // "fromValue" holds the requester's name when someone filed the request for them.
        events: {
          create: {
            actorId: user.id,
            action: "CREATED",
            fromValue: requester.id === user.id ? null : requester.name,
            toValue: status,
            createdAt: now,
          },
        },
      },
      select: { id: true },
    });
  });

  revalidateRequest(created.id);
  redirect(`/requests/${created.id}?created=1`);
}

// ---------------------------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------------------------

function commentSchema(t: Translate) {
  return z.object({
    requestId: z.string().min(1),
    body: z
      .string()
      .trim()
      .min(1, { error: t("กรุณาพิมพ์ข้อความ", "ກະລຸນາພິມຂໍ້ຄວາມ", "Please enter a message") })
      .max(5000, { error: t("ข้อความยาวเกิน 5,000 ตัวอักษร", "ຂໍ້ຄວາມຍາວເກີນ 5,000 ຕົວອັກສອນ", "Message must be 5,000 characters or fewer") }),
  });
}

export async function addComment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const user = await requireUser();

  const parsed = commentSchema(t).safeParse({
    requestId: formData.get("requestId") ?? "",
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) return { fieldErrors: firstIssuePerField(parsed.error) };
  const { requestId, body } = parsed.data;

  const request = await db.serviceRequest.findFirst({
    where: { id: requestId, deletedAt: null },
    select: { id: true, requesterId: true, approverId: true, status: true, ...slaFields },
  });
  if (!request || !canViewRequest(user, request)) return { error: notFoundMessage(t) };
  if (!canComment(user, request)) {
    return {
      error: t(
        "คำขอนี้ปิดแล้ว ไม่สามารถเพิ่มข้อความได้",
        "ຄຳຂໍນີ້ປິດແລ້ວ ບໍ່ສາມາດເພີ່ມຂໍ້ຄວາມໄດ້",
        "This request is closed. Messages can no longer be added",
      ),
    };
  }

  const isInternal = formData.get("internal") === "on" && canPostInternalNote(user);
  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.requestComment.create({ data: { requestId, authorId: user.id, body, isInternal } });

    // A public message from IT is the first response to the requester.
    if (isStaff(user) && !isInternal && !request.firstResponseAt && request.status !== "PENDING_APPROVAL") {
      await tx.serviceRequest.updateMany({ where: { id: requestId, firstResponseAt: null }, data: { firstResponseAt: now } });
    }

    // The requester answering a "need info" request puts it back in the IT team's queue and restarts the SLA clock.
    if (!isInternal && request.requesterId === user.id && request.status === "NEED_INFO") {
      const patch = slaPatchForStatusChange({
        tier: request.slaTier,
        createdAt: request.createdAt,
        pausedAt: request.slaPausedAt,
        pausedMinutes: request.slaPausedMinutes,
        firstResponseAt: request.firstResponseAt,
        to: "IN_PROGRESS",
        now,
        cal: getSlaCalendar(),
      });
      const moved = await tx.serviceRequest.updateMany({
        where: { id: requestId, status: "NEED_INFO" },
        data: { status: "IN_PROGRESS", ...patch },
      });
      if (moved.count === 1) {
        await tx.requestEvent.create({
          data: { requestId, actorId: user.id, action: "STATUS_CHANGED", fromValue: "NEED_INFO", toValue: "IN_PROGRESS" },
        });
      }
    }
  });

  revalidateRequest(requestId);
  return { ok: true };
}

// ---------------------------------------------------------------------------------------------
// Status changes by IT staff
// ---------------------------------------------------------------------------------------------

function statusSchema(t: Translate) {
  return z.object({
    requestId: z.string().min(1),
    to: z.enum(REQUEST_STATUSES, { error: t("สถานะไม่ถูกต้อง", "ສະຖານະບໍ່ຖືກຕ້ອງ", "Invalid status") }),
    note: z
      .string()
      .trim()
      .max(2000, { error: t("ข้อความยาวเกิน 2,000 ตัวอักษร", "ຂໍ້ຄວາມຍາວເກີນ 2,000 ຕົວອັກສອນ", "Message must be 2,000 characters or fewer") }),
  });
}

export async function changeStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const user = await requireStaff();

  const parsed = statusSchema(t).safeParse({
    requestId: formData.get("requestId") ?? "",
    to: formData.get("to") ?? "",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { fieldErrors: firstIssuePerField(parsed.error) };
  const { requestId, to, note } = parsed.data;

  const request = await db.serviceRequest.findFirst({
    where: { id: requestId, deletedAt: null },
    select: { id: true, requesterId: true, status: true, assigneeId: true, ...slaFields },
  });
  if (!request) return { error: notFoundMessage(t) };

  if (!allowedStatusChanges(user, request).includes(to)) {
    return { error: t("ไม่สามารถเปลี่ยนเป็นสถานะนี้ได้", "ບໍ່ສາມາດປ່ຽນເປັນສະຖານະນີ້ໄດ້", "Cannot change to this status") };
  }
  if (NOTE_REQUIRED_STATUSES.includes(to) && !note) {
    return {
      fieldErrors: {
        note: t(
          "กรุณาระบุเหตุผลหรือข้อมูลที่ต้องการให้ผู้ขอทราบ",
          "ກະລຸນາລະບຸເຫດຜົນ ຫຼື ຂໍ້ມູນທີ່ຕ້ອງການໃຫ້ຜູ້ຂໍຊາບ",
          "Please enter the reason or the information the requester needs to know",
        ),
      },
    };
  }

  const now = new Date();
  const autoAssign = request.assigneeId === null;
  const patch = slaPatchForStatusChange({
    tier: request.slaTier,
    createdAt: request.createdAt,
    pausedAt: request.slaPausedAt,
    pausedMinutes: request.slaPausedMinutes,
    firstResponseAt: request.firstResponseAt,
    to,
    now,
    cal: getSlaCalendar(),
  });

  try {
    await db.$transaction(async (tx) => {
      // Guard on the status we read, so two staff acting at once cannot both succeed.
      const updated = await tx.serviceRequest.updateMany({
        where: { id: requestId, status: request.status },
        data: {
          status: to,
          closedAt: CLOSED_STATUSES.includes(to) ? now : null,
          firstResponseAt: request.firstResponseAt ?? now,
          ...patch,
          ...(DECISION_STATUSES.includes(to) ? { decidedById: user.id, decidedAt: now } : {}),
          ...(autoAssign ? { assigneeId: user.id } : {}),
        },
      });
      if (updated.count !== 1) throw new StaleRequestError();

      await tx.requestEvent.create({
        data: { requestId, actorId: user.id, action: "STATUS_CHANGED", fromValue: request.status, toValue: to },
      });
      if (autoAssign) {
        await tx.requestEvent.create({
          data: { requestId, actorId: user.id, action: "ASSIGNED", toValue: user.name },
        });
      }
      if (note) {
        await tx.requestComment.create({ data: { requestId, authorId: user.id, body: note, isInternal: false } });
      }
    });
  } catch (error) {
    if (error instanceof StaleRequestError) return { error: staleMessage(t) };
    throw error;
  }

  revalidateRequest(requestId);
  return { ok: true };
}

// ---------------------------------------------------------------------------------------------
// Assignment, approver and SLA tier (IT staff)
// ---------------------------------------------------------------------------------------------

const assignSchema = z.object({
  requestId: z.string().min(1),
  assigneeId: z.string(),
});

export async function assignRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const user = await requireStaff();

  const parsed = assignSchema.safeParse({
    requestId: formData.get("requestId") ?? "",
    assigneeId: formData.get("assigneeId") ?? "",
  });
  if (!parsed.success) return { error: t("ข้อมูลไม่ถูกต้อง", "ຂໍ້ມູນບໍ່ຖືກຕ້ອງ", "Invalid data") };
  const { requestId, assigneeId } = parsed.data;

  const request = await db.serviceRequest.findFirst({
    where: { id: requestId, deletedAt: null },
    select: { id: true, status: true, firstResponseAt: true, assigneeId: true, assignee: { select: { name: true } } },
  });
  if (!request) return { error: notFoundMessage(t) };

  let assigneeName: string | null = null;
  if (assigneeId) {
    const assignee = await db.user.findFirst({
      where: { id: assigneeId, isActive: true, role: { in: ["IT_STAFF", "ADMIN"] } },
      select: { name: true },
    });
    if (!assignee) {
      return {
        error: t(
          "ผู้รับผิดชอบต้องเป็นทีม IT ที่ยังใช้งานอยู่",
          "ຜູ້ຮັບຜິດຊອບຕ້ອງເປັນທີມ IT ທີ່ຍັງໃຊ້ງານຢູ່",
          "The assignee must be an active IT team member",
        ),
      };
    }
    assigneeName = assignee.name;
  }

  if ((request.assigneeId ?? "") === assigneeId) return { ok: true };

  const responds = assigneeId !== "" && !request.firstResponseAt && request.status !== "PENDING_APPROVAL";
  await db.$transaction([
    db.serviceRequest.update({
      where: { id: requestId },
      data: { assigneeId: assigneeId || null, ...(responds ? { firstResponseAt: new Date() } : {}) },
    }),
    db.requestEvent.create({
      data: {
        requestId,
        actorId: user.id,
        action: "ASSIGNED",
        fromValue: request.assignee?.name ?? null,
        toValue: assigneeName,
      },
    }),
  ]);

  revalidateRequest(requestId);
  return { ok: true };
}

export async function reassignApprover(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const user = await requireStaff();
  const requestId = String(formData.get("requestId") ?? "");
  const approverId = String(formData.get("approverId") ?? "");

  const request = await db.serviceRequest.findFirst({
    where: { id: requestId, deletedAt: null },
    select: { id: true, status: true, requesterId: true, approver: { select: { name: true } } },
  });
  if (!request) return { error: notFoundMessage(t) };
  if (request.status !== "PENDING_APPROVAL") {
    return {
      error: t(
        "เปลี่ยนผู้อนุมัติได้เฉพาะคำขอที่ยังรอหัวหน้าอนุมัติ",
        "ປ່ຽນຜູ້ອະນຸມັດໄດ້ສະເພາະຄຳຂໍທີ່ຍັງລໍຖ້າຫົວໜ້າອະນຸມັດ",
        "The approver can only be changed while the request is awaiting manager approval",
      ),
    };
  }

  const approver = await db.user.findFirst({
    where: { id: approverId, isActive: true, role: "MANAGER", NOT: { id: request.requesterId } },
    select: { name: true },
  });
  if (!approver) {
    return { error: t("กรุณาเลือกหัวหน้างานผู้อนุมัติ", "ກະລຸນາເລືອກຫົວໜ້າງານຜູ້ອະນຸມັດ", "Please select an approving manager") };
  }

  await db.$transaction([
    db.serviceRequest.update({ where: { id: requestId }, data: { approverId } }),
    db.requestEvent.create({
      data: {
        requestId,
        actorId: user.id,
        action: "APPROVER_CHANGED",
        fromValue: request.approver?.name ?? null,
        toValue: approver.name,
      },
    }),
  ]);

  revalidateRequest(requestId);
  return { ok: true };
}

function tierSchema(t: Translate) {
  return z.object({
    requestId: z.string().min(1),
    tier: z.enum(SLA_TIERS, { error: t("ระดับ SLA ไม่ถูกต้อง", "ລະດັບ SLA ບໍ່ຖືກຕ້ອງ", "Invalid SLA tier") }),
  });
}

/** IT staff can re-classify a request, e.g. when a "simple" request turns out to need procurement. */
export async function changeSlaTier(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const user = await requireStaff();

  const parsed = tierSchema(t).safeParse({
    requestId: formData.get("requestId") ?? "",
    tier: formData.get("tier") ?? "",
  });
  if (!parsed.success) return { error: t("ข้อมูลไม่ถูกต้อง", "ຂໍ້ມູນບໍ່ຖືກຕ້ອງ", "Invalid data") };
  const { requestId, tier } = parsed.data;

  const request = await db.serviceRequest.findFirst({
    where: { id: requestId, deletedAt: null },
    select: { id: true, status: true, slaTier: true, createdAt: true, firstResponseAt: true, slaPausedMinutes: true },
  });
  if (!request) return { error: notFoundMessage(t) };
  if (CLOSED_STATUSES.includes(request.status)) {
    return {
      error: t(
        "คำขอนี้ปิดแล้ว ไม่สามารถเปลี่ยนระดับ SLA ได้",
        "ຄຳຂໍນີ້ປິດແລ້ວ ບໍ່ສາມາດປ່ຽນລະດັບ SLA ໄດ້",
        "This request is closed. The SLA tier can no longer be changed",
      ),
    };
  }
  if (request.slaTier === tier) return { ok: true };

  const due = dueDates(tier, request.createdAt, request.slaPausedMinutes, getSlaCalendar());
  await db.$transaction([
    db.serviceRequest.update({
      where: { id: requestId },
      data: {
        slaTier: tier,
        fulfillmentDueAt: due.fulfillmentDueAt,
        // Once IT has responded, the response deadline no longer matters.
        ...(request.firstResponseAt ? {} : { responseDueAt: due.responseDueAt }),
      },
    }),
    db.requestEvent.create({
      data: {
        requestId,
        actorId: user.id,
        action: "SLA_CHANGED",
        fromValue: SLA_TIER_DEF[request.slaTier].label,
        toValue: SLA_TIER_DEF[tier].label,
      },
    }),
  ]);

  revalidateRequest(requestId);
  return { ok: true };
}

// ---------------------------------------------------------------------------------------------
// Manager approval
// ---------------------------------------------------------------------------------------------

function managerSchema(t: Translate) {
  return z.object({
    requestId: z.string().min(1),
    decision: z.enum(["approve", "reject"], { error: t("ข้อมูลไม่ถูกต้อง", "ຂໍ້ມູນບໍ່ຖືກຕ້ອງ", "Invalid data") }),
    note: z
      .string()
      .trim()
      .max(2000, { error: t("ข้อความยาวเกิน 2,000 ตัวอักษร", "ຂໍ້ຄວາມຍາວເກີນ 2,000 ຕົວອັກສອນ", "Message must be 2,000 characters or fewer") }),
  });
}

export async function decideByManager(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const user = await requireUser();

  const parsed = managerSchema(t).safeParse({
    requestId: formData.get("requestId") ?? "",
    decision: formData.get("decision") ?? "",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { error: t("ข้อมูลไม่ถูกต้อง", "ຂໍ້ມູນບໍ່ຖືກຕ້ອງ", "Invalid data"), fieldErrors: firstIssuePerField(parsed.error) };
  }
  const { requestId, decision, note } = parsed.data;

  const request = await db.serviceRequest.findFirst({
    where: { id: requestId, deletedAt: null },
    select: { id: true, requesterId: true, approverId: true, status: true, ...slaFields },
  });
  if (!request || !canViewRequest(user, request)) return { error: notFoundMessage(t) };
  if (!canDecideAsManager(user, request)) {
    return {
      error: t(
        "คุณไม่มีสิทธิ์พิจารณาคำขอนี้ หรือคำขอถูกดำเนินการไปแล้ว",
        "ທ່ານບໍ່ມີສິດພິຈາລະນາຄຳຂໍນີ້ ຫຼື ຄຳຂໍຖືກດຳເນີນການແລ້ວ",
        "You do not have permission to review this request, or it has already been processed",
      ),
    };
  }
  if (decision === "reject" && !note) {
    return {
      fieldErrors: { note: t("กรุณาระบุเหตุผลที่ไม่อนุมัติ", "ກະລຸນາລະບຸເຫດຜົນທີ່ບໍ່ອະນຸມັດ", "Please enter the reason for rejecting") },
    };
  }

  const now = new Date();
  const to = decision === "approve" ? "SUBMITTED" : "REJECTED";
  const patch = slaPatchForStatusChange({
    tier: request.slaTier,
    createdAt: request.createdAt,
    pausedAt: request.slaPausedAt,
    pausedMinutes: request.slaPausedMinutes,
    firstResponseAt: request.firstResponseAt,
    to,
    now,
    cal: getSlaCalendar(),
  });

  const data: Prisma.ServiceRequestUpdateManyMutationInput =
    decision === "approve"
      ? { status: "SUBMITTED", managerApprovedAt: now, ...patch }
      : { status: "REJECTED", closedAt: now, decidedAt: now, ...patch };

  try {
    await db.$transaction(async (tx) => {
      const updated = await tx.serviceRequest.updateMany({
        where: { id: requestId, status: "PENDING_APPROVAL" },
        data: decision === "reject" ? { ...data, decidedById: user.id } : data,
      });
      if (updated.count !== 1) throw new StaleRequestError();

      await tx.requestEvent.create({
        data: { requestId, actorId: user.id, action: "STATUS_CHANGED", fromValue: "PENDING_APPROVAL", toValue: to },
      });
      if (note) await tx.requestComment.create({ data: { requestId, authorId: user.id, body: note, isInternal: false } });
    });
  } catch (error) {
    if (error instanceof StaleRequestError) return { error: staleMessage(t) };
    throw error;
  }

  revalidateRequest(requestId);
  return { ok: true };
}

// ---------------------------------------------------------------------------------------------
// Cancel (requester)
// ---------------------------------------------------------------------------------------------

export async function cancelRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const user = await requireUser();
  const requestId = String(formData.get("requestId") ?? "");

  const request = await db.serviceRequest.findFirst({
    where: { id: requestId, deletedAt: null },
    select: { id: true, requesterId: true, approverId: true, status: true },
  });
  if (!request || !canViewRequest(user, request)) return { error: notFoundMessage(t) };
  if (!canCancelRequest(user, request)) {
    return {
      error: t(
        "ไม่สามารถยกเลิกคำขอนี้ได้ในสถานะปัจจุบัน",
        "ບໍ່ສາມາດຍົກເລີກຄຳຂໍນີ້ໄດ້ໃນສະຖານະປັດຈຸບັນ",
        "This request cannot be cancelled in its current status",
      ),
    };
  }

  try {
    await db.$transaction(async (tx) => {
      const updated = await tx.serviceRequest.updateMany({
        where: { id: requestId, status: { in: [...CANCELLABLE_STATUSES] } },
        data: { status: "CANCELLED", closedAt: new Date(), slaPausedAt: null },
      });
      if (updated.count !== 1) throw new StaleRequestError();
      await tx.requestEvent.create({
        data: { requestId, actorId: user.id, action: "STATUS_CHANGED", fromValue: request.status, toValue: "CANCELLED" },
      });
    });
  } catch (error) {
    if (error instanceof StaleRequestError) return { error: staleMessage(t) };
    throw error;
  }

  revalidateRequest(requestId);
  return { ok: true };
}
