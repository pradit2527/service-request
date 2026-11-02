// Service Request SLA: tiers, business-hours arithmetic and clock evaluation. Pure module.
//
// Two clocks run on every request:
//   - Response:    from submission until the IT team first acts on it.
//   - Fulfillment: from submission until the request is completed.
// Both count business time only, and stop while the request waits on someone else
// (manager approval, requester information, vendor/budget). See PAUSE_STATUSES in status.ts.

import { l, type Lang, type Localized } from "./i18n";
import type { RequestType } from "./request-types";
import { PAUSE_STATUSES, type RequestStatus } from "./status";

export const SLA_TIERS = ["STANDARD", "PROVISIONING", "HARDWARE", "COMPLEX"] as const;
export type SlaTier = (typeof SLA_TIERS)[number];

/** A business day is 8 working hours (08:30–17:30 minus the 12:00–13:00 lunch break). */
export const BUSINESS_DAY_MINUTES = 480;

export type SlaTierDef = {
  /** English tier name, shown as is in every language. */
  label: string;
  description: Localized;
  /** Committed response time, in business minutes. The upper end of the agreed range is used. */
  responseMinutes: number;
  /** Committed fulfillment time, in business minutes. The upper end of the agreed range is used. */
  fulfillmentMinutes: number;
  /** Shortest sensible lead time for "needed by": the lower end of the agreed fulfillment range. */
  minLeadBusinessDays: number;
};

export const SLA_TIER_DEF: Record<SlaTier, SlaTierDef> = {
  STANDARD: {
    label: "Standard / Self-Service",
    description: l(
      "คำขอทั่วไปที่ทำได้ทันที เช่น รีเซ็ตรหัสผ่าน ขอสิทธิ์ Shared Folder",
      "ຄຳຂໍທົ່ວໄປທີ່ເຮັດໄດ້ທັນທີ ເຊັ່ນ ຣີເຊັດລະຫັດຜ່ານ, ຂໍສິດ Shared Folder",
      "Everyday requests that can be done right away, e.g. password reset, Shared Folder access",
    ),
    responseMinutes: 2 * 60,
    fulfillmentMinutes: 8 * 60,
    minLeadBusinessDays: 0,
  },
  PROVISIONING: {
    label: "Standard Provisioning",
    description: l(
      "คำขอระดับปานกลาง เช่น ติดตั้งซอฟต์แวร์ที่มี License สร้างอีเมลพนักงานใหม่",
      "ຄຳຂໍລະດັບກາງ ເຊັ່ນ ຕິດຕັ້ງຊອບແວທີ່ມີ License, ສ້າງອີເມວພະນັກງານໃໝ່",
      "Mid-level requests, e.g. installing licensed software, creating a new hire's email",
    ),
    responseMinutes: 4 * 60,
    fulfillmentMinutes: 2 * BUSINESS_DAY_MINUTES,
    minLeadBusinessDays: 1,
  },
  HARDWARE: {
    label: "Hardware / Procurement",
    description: l(
      "เบิกหรือจัดซื้ออุปกรณ์ใหม่ ขึ้นกับระยะเวลาจัดซื้อจัดจ้าง",
      "ເບີກ ຫຼື ຈັດຊື້ອຸປະກອນໃໝ່ ຂຶ້ນກັບໄລຍະເວລາຈັດຊື້ຈັດຈ້າງ",
      "Issuing or buying new equipment; depends on procurement lead time",
    ),
    responseMinutes: BUSINESS_DAY_MINUTES,
    fulfillmentMinutes: 7 * BUSINESS_DAY_MINUTES,
    minLeadBusinessDays: 3,
  },
  COMPLEX: {
    label: "Complex Request",
    description: l(
      "ปรับเปลี่ยนโครงสร้างหรือย้ายสถานที่ เช่น ย้ายโต๊ะทำงานยกแผนก ติดตั้ง Server",
      "ປັບປ່ຽນໂຄງສ້າງ ຫຼື ຍ້າຍສະຖານທີ່ ເຊັ່ນ ຍ້າຍໂຕະເຮັດວຽກທັງພະແນກ, ຕິດຕັ້ງ Server",
      "Structural changes or relocations, e.g. moving a whole department, installing a server",
    ),
    responseMinutes: BUSINESS_DAY_MINUTES,
    fulfillmentMinutes: 10 * BUSINESS_DAY_MINUTES,
    minLeadBusinessDays: 5,
  },
};

export function isSlaTier(value: unknown): value is SlaTier {
  return typeof value === "string" && (SLA_TIERS as readonly string[]).includes(value);
}

/** Picks the SLA tier for a new request from its type and answers. IT staff can change it afterwards. */
export function classifyTier(type: RequestType, details: Record<string, unknown>): SlaTier {
  switch (type) {
    case "HARDWARE":
      return "HARDWARE";
    case "SOFTWARE":
      if (details.licenseType === "need-purchase") return "HARDWARE";
      return details.itemType === "font" ? "STANDARD" : "PROVISIONING";
    case "ACCESS_ACCOUNT":
      if (details.action === "reset" || details.action === "revoke" || details.action === "unblock") return "STANDARD";
      if (details.action === "grant" && details.system === "shared-folder") return "STANDARD";
      return "PROVISIONING";
    case "CONSULTATION":
    case "DOCUMENT":
      return "STANDARD";
    case "NETWORK_WORKPLACE":
      if (details.service === "desk-move") return "COMPLEX";
      return "PROVISIONING";
    case "AWS_SERVER":
    case "DATABASE":
    case "ENVIRONMENT":
    case "TRAINING":
    case "SECURITY_REVIEW":
      return "COMPLEX";
    case "CLOUD_RESOURCE":
      // Creating a resource needs the longest lead time; deleting one is planned work.
      return details.action === "delete" ? "PROVISIONING" : "COMPLEX";
    case "ONBOARDING":
      // The new hire gets a device, so it follows the procurement lead time.
      return "HARDWARE";
    case "OFFBOARDING":
      // Removing access has to be quick.
      return "STANDARD";
    case "DEPLOYMENT":
      // A hotfix is urgent: it gets the quickest tier, a scheduled deployment is planned work.
      return details.deployKind === "hotfix" ? "STANDARD" : "PROVISIONING";
    case "BACKUP_RESTORE":
      return details.action === "snapshot" ? "STANDARD" : "PROVISIONING";
    case "PUBLIC_IP_DOMAIN":
    case "DATA_EXTRACT":
    case "DATA_CORRECTION":
    case "BULK_IMPORT":
    case "REPORT_TEMPLATE":
    case "SYSTEM_CONFIG":
    case "FIREWALL":
    case "RESOURCE_UPGRADE":
    case "API_CREDENTIAL":
    case "OTHER":
      return "PROVISIONING";
  }
}

// ---------------------------------------------------------------------------------------------
// Business calendar
// ---------------------------------------------------------------------------------------------

export type Calendar = {
  /** Offset of local time from UTC, in minutes (Bangkok = +420, no daylight saving). */
  utcOffsetMinutes: number;
  /** 0 = Sunday … 6 = Saturday. */
  workdays: readonly number[];
  /** Working windows within a day, "HH:MM". */
  windows: readonly (readonly [string, string])[];
  /** Non-working dates, "YYYY-MM-DD". */
  holidays: ReadonlySet<string>;
};

export const DEFAULT_CALENDAR: Calendar = {
  utcOffsetMinutes: 7 * 60,
  workdays: [1, 2, 3, 4, 5],
  windows: [
    ["08:30", "12:00"],
    ["13:00", "17:30"],
  ],
  holidays: new Set<string>(),
};

export const BUSINESS_HOURS_TEXT = l(
  "จันทร์–ศุกร์ 08:30–17:30 (พักเที่ยง 12:00–13:00)",
  "ຈັນ–ສຸກ 08:30–17:30 (ພັກທ່ຽງ 12:00–13:00)",
  "Mon–Fri 08:30–17:30 (lunch 12:00–13:00)",
);

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;
const DAY_MINUTES = 1440;

function hhmm(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function parsedWindows(cal: Calendar): [number, number][] {
  return cal.windows.map(([start, end]) => [hhmm(start), hhmm(end)]);
}

/** Minutes since the epoch in the calendar's local time. */
function toLocal(date: Date, cal: Calendar): number {
  return date.getTime() / MINUTE_MS + cal.utcOffsetMinutes;
}

function fromLocal(localMinutes: number, cal: Calendar): Date {
  return new Date((localMinutes - cal.utcOffsetMinutes) * MINUTE_MS);
}

function dayDate(dayIndex: number): string {
  return new Date(dayIndex * DAY_MS).toISOString().slice(0, 10);
}

function isWorkingDay(dayIndex: number, cal: Calendar): boolean {
  const weekday = (((dayIndex + 4) % 7) + 7) % 7; // 1970-01-01 was a Thursday
  return cal.workdays.includes(weekday) && !cal.holidays.has(dayDate(dayIndex));
}

/** Business minutes between two instants (negative when `to` is before `from`). */
export function businessMinutesBetween(from: Date, to: Date, cal: Calendar = DEFAULT_CALENDAR): number {
  if (to.getTime() < from.getTime()) return -businessMinutesBetween(to, from, cal);

  const start = toLocal(from, cal);
  const end = toLocal(to, cal);
  const windows = parsedWindows(cal);
  let total = 0;

  for (let day = Math.floor(start / DAY_MINUTES); day <= Math.floor(end / DAY_MINUTES); day++) {
    if (!isWorkingDay(day, cal)) continue;
    for (const [open, close] of windows) {
      const lo = Math.max(start, day * DAY_MINUTES + open);
      const hi = Math.min(end, day * DAY_MINUTES + close);
      if (hi > lo) total += hi - lo;
    }
  }
  return total;
}

/** The instant reached after `minutes` of business time starting at `start`. */
export function addBusinessMinutes(start: Date, minutes: number, cal: Calendar = DEFAULT_CALENDAR): Date {
  if (minutes <= 0) return new Date(start);

  const from = toLocal(start, cal);
  const windows = parsedWindows(cal);
  let remaining = minutes;

  for (let day = Math.floor(from / DAY_MINUTES), i = 0; i < 3660; day++, i++) {
    if (!isWorkingDay(day, cal)) continue;
    for (const [open, close] of windows) {
      const begin = Math.max(from, day * DAY_MINUTES + open);
      const finish = day * DAY_MINUTES + close;
      if (begin >= finish) continue;
      if (remaining <= finish - begin) return fromLocal(begin + remaining, cal);
      remaining -= finish - begin;
    }
  }
  throw new Error("The SLA calendar has no working time");
}

/** The date (YYYY-MM-DD) that is `days` working days after `fromDate`. Zero days returns `fromDate`. */
export function addBusinessDays(fromDate: string, days: number, cal: Calendar = DEFAULT_CALENDAR): string {
  let day = Math.floor(Date.parse(`${fromDate}T00:00:00Z`) / DAY_MS);
  let left = days;
  while (left > 0) {
    day++;
    if (isWorkingDay(day, cal)) left--;
  }
  return dayDate(day);
}

/** Earliest sensible "needed by" date for a new request of this tier. */
export function earliestNeededBy(tier: SlaTier, today: string, cal: Calendar = DEFAULT_CALENDAR): string {
  return addBusinessDays(today, SLA_TIER_DEF[tier].minLeadBusinessDays, cal);
}

// ---------------------------------------------------------------------------------------------
// Due dates and pausing
// ---------------------------------------------------------------------------------------------

export function dueDates(
  tier: SlaTier,
  createdAt: Date,
  pausedMinutes = 0,
  cal: Calendar = DEFAULT_CALENDAR,
): { responseDueAt: Date; fulfillmentDueAt: Date } {
  const def = SLA_TIER_DEF[tier];
  return {
    responseDueAt: addBusinessMinutes(createdAt, def.responseMinutes + pausedMinutes, cal),
    fulfillmentDueAt: addBusinessMinutes(createdAt, def.fulfillmentMinutes + pausedMinutes, cal),
  };
}

export type SlaPatch = {
  slaPausedAt?: Date | null;
  slaPausedMinutes?: number;
  responseDueAt?: Date;
  fulfillmentDueAt?: Date;
};

/**
 * Database changes needed when a request moves to status `to`:
 * entering a pause status starts the pause; leaving it adds the waited business time to the due dates.
 */
export function slaPatchForStatusChange(input: {
  tier: SlaTier;
  createdAt: Date;
  pausedAt: Date | null;
  pausedMinutes: number;
  firstResponseAt: Date | null;
  to: RequestStatus;
  now: Date;
  cal?: Calendar;
}): SlaPatch {
  const cal = input.cal ?? DEFAULT_CALENDAR;
  const toPaused = PAUSE_STATUSES.includes(input.to);

  if (toPaused && !input.pausedAt) return { slaPausedAt: input.now };

  if (!toPaused && input.pausedAt) {
    const pausedMinutes = input.pausedMinutes + Math.round(businessMinutesBetween(input.pausedAt, input.now, cal));
    const due = dueDates(input.tier, input.createdAt, pausedMinutes, cal);
    return {
      slaPausedAt: null,
      slaPausedMinutes: pausedMinutes,
      fulfillmentDueAt: due.fulfillmentDueAt,
      // The response deadline only moves while nobody from IT has responded yet.
      ...(input.firstResponseAt ? {} : { responseDueAt: due.responseDueAt }),
    };
  }
  return {};
}

// ---------------------------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------------------------

export type SlaClockState = "met" | "breached" | "running" | "paused" | "not_applicable";

export type SlaClock = {
  state: SlaClockState;
  dueAt: Date | null;
  doneAt: Date | null;
  /** Business minutes left until due (negative once overdue). Null when the clock is not running or paused. */
  remainingMinutes: number | null;
  /** Share of the allowed time already used, 0..1.5. Null when not applicable. */
  percentUsed: number | null;
};

export type SlaSubject = {
  slaTier: SlaTier;
  status: RequestStatus;
  createdAt: Date;
  firstResponseAt: Date | null;
  responseDueAt: Date | null;
  fulfillmentDueAt: Date | null;
  closedAt: Date | null;
  slaPausedAt: Date | null;
};

const NOT_APPLICABLE: SlaClock = { state: "not_applicable", dueAt: null, doneAt: null, remainingMinutes: null, percentUsed: null };

function finished(dueAt: Date, doneAt: Date): SlaClock {
  return {
    state: doneAt.getTime() <= dueAt.getTime() ? "met" : "breached",
    dueAt,
    doneAt,
    remainingMinutes: null,
    percentUsed: null,
  };
}

function ticking(dueAt: Date, targetMinutes: number, pausedAt: Date | null, now: Date, cal: Calendar): SlaClock {
  const remaining = businessMinutesBetween(pausedAt ?? now, dueAt, cal);
  const used = targetMinutes > 0 ? (targetMinutes - remaining) / targetMinutes : 0;
  // Overdue as soon as the deadline instant has passed, even if no business minute has elapsed since
  // (e.g. due Friday 17:30, checked on Saturday).
  const overdue = !pausedAt && now.getTime() > dueAt.getTime();
  return {
    state: pausedAt ? "paused" : overdue ? "breached" : "running",
    dueAt,
    doneAt: null,
    remainingMinutes: remaining,
    percentUsed: Math.min(Math.max(used, 0), 1.5),
  };
}

export function evaluateSla(
  subject: SlaSubject,
  now: Date = new Date(),
  cal: Calendar = DEFAULT_CALENDAR,
): { response: SlaClock; fulfillment: SlaClock } {
  const def = SLA_TIER_DEF[subject.slaTier];
  const closed = subject.closedAt !== null;

  // Requests created before SLA tracking existed have no due dates.
  if (!subject.responseDueAt || !subject.fulfillmentDueAt) return { response: NOT_APPLICABLE, fulfillment: NOT_APPLICABLE };

  const response = subject.firstResponseAt
    ? finished(subject.responseDueAt, subject.firstResponseAt)
    : closed
      ? NOT_APPLICABLE
      : ticking(subject.responseDueAt, def.responseMinutes, subject.slaPausedAt, now, cal);

  let fulfillment: SlaClock;
  if (subject.status === "COMPLETED" && subject.closedAt) {
    fulfillment = finished(subject.fulfillmentDueAt, subject.closedAt);
  } else if (closed) {
    fulfillment = NOT_APPLICABLE;
  } else {
    fulfillment = ticking(subject.fulfillmentDueAt, def.fulfillmentMinutes, subject.slaPausedAt, now, cal);
  }
  return { response, fulfillment };
}

// ---------------------------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------------------------

/** Monthly target for the share of requests that meet their SLA. */
export const SLA_PASS_TARGET = 0.9;

export type PassRate = { met: number; breached: number; rate: number | null };

export function tally(states: readonly SlaClockState[]): PassRate {
  const met = states.filter((s) => s === "met").length;
  const breached = states.filter((s) => s === "breached").length;
  return { met, breached, rate: met + breached > 0 ? met / (met + breached) : null };
}

/** First instant of the month containing `now`, in Bangkok time. */
export function startOfMonthBangkok(now: Date = new Date(), cal: Calendar = DEFAULT_CALENDAR): Date {
  const local = new Date(now.getTime() + cal.utcOffsetMinutes * MINUTE_MS);
  const firstLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1);
  return new Date(firstLocal - cal.utcOffsetMinutes * MINUTE_MS);
}

// ---------------------------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------------------------

function trimmed(n: number): string {
  return String(Math.round(n * 10) / 10);
}

/** "45 min", "2 business hrs", "1 business day", "1.5 business days" in the given language. */
export function formatBusinessDuration(minutes: number, lang: Lang): string {
  const abs = Math.abs(minutes);

  if (abs < 60) {
    const n = Math.max(1, Math.round(abs));
    return `${n} ${l("นาที", "ນາທີ", "min")[lang]}`;
  }
  if (abs < BUSINESS_DAY_MINUTES) {
    return `${trimmed(abs / 60)} ${l("ชม.ทำการ", "ຊມ.ເຮັດວຽກ", "business hrs")[lang]}`;
  }
  const days = abs / BUSINESS_DAY_MINUTES;
  const day = days === 1 ? l("วันทำการ", "ວັນເຮັດວຽກ", "business day") : l("วันทำการ", "ວັນເຮັດວຽກ", "business days");
  return `${trimmed(days)} ${day[lang]}`;
}
