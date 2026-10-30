// Display labels for enums and date formatting. Pure module: safe to import from client and server code.

import { INTL_LOCALE, l, type Lang, type Localized } from "./i18n";

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABEL: Record<Priority, Localized> = {
  LOW: l("ต่ำ", "ຕ່ຳ", "Low"),
  MEDIUM: l("ปานกลาง", "ປານກາງ", "Medium"),
  HIGH: l("สูง", "ສູງ", "High"),
  URGENT: l("เร่งด่วน", "ດ່ວນ", "Urgent"),
};

export const ROLES = ["EMPLOYEE", "MANAGER", "IT_STAFF", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, Localized> = {
  EMPLOYEE: l("พนักงาน", "ພະນັກງານ", "Employee"),
  MANAGER: l("หัวหน้างาน · ผู้อนุมัติ", "ຫົວໜ້າ · ຜູ້ອະນຸມັດ", "Manager · Approver"),
  IT_STAFF: l("ทีม IT", "ທີມ IT", "IT team"),
  ADMIN: l("ผู้ดูแลระบบ", "ຜູ້ດູແລລະບົບ", "Administrator"),
};

// What each role can do, shown to admins on the user management page.
export const ROLE_DESCRIPTION: Record<Role, Localized> = {
  EMPLOYEE: l(
    "ยื่นคำขอและติดตามคำขอของตนเอง ยกเลิกคำขอของตนเอง",
    "ຍື່ນຄຳຂໍ ແລະ ຕິດຕາມຄຳຂໍຂອງຕົນເອງ ຍົກເລີກຄຳຂໍຂອງຕົນເອງ",
    "Submit and track their own requests, and cancel them",
  ),
  MANAGER: l(
    "ทำได้เหมือนพนักงาน และเป็นคนเดียวที่อนุมัติหรือไม่อนุมัติคำขอที่ผู้ขอเลือกตนเป็นผู้อนุมัติ",
    "ເຮັດໄດ້ຄືພະນັກງານ ແລະ ເປັນຄົນດຽວທີ່ອະນຸມັດ ຫຼື ບໍ່ອະນຸມັດຄຳຂໍທີ່ຜູ້ຂໍເລືອກຕົນເປັນຜູ້ອະນຸມັດ",
    "Everything an employee can do, and the only role that can approve or reject requests where the requester chose them as approver",
  ),
  IT_STAFF: l(
    "ดูคำขอทั้งหมด เปลี่ยนสถานะ มอบหมาย ปรับระดับ SLA และเขียนบทความฐานความรู้ อนุมัติแทนหัวหน้าไม่ได้",
    "ເບິ່ງຄຳຂໍທັງໝົດ ປ່ຽນສະຖານະ ມອບໝາຍ ປັບລະດັບ SLA ແລະ ຂຽນບົດຄວາມຖານຄວາມຮູ້ ອະນຸມັດແທນຫົວໜ້າບໍ່ໄດ້",
    "See all requests, change status, assign, adjust the SLA tier and write knowledge base articles; cannot approve on a manager's behalf",
  ),
  ADMIN: l(
    "ทำได้เหมือนทีม IT และจัดการผู้ใช้กับสิทธิ์ อนุมัติแทนหัวหน้าไม่ได้",
    "ເຮັດໄດ້ຄືທີມ IT ແລະ ຈັດການຜູ້ໃຊ້ກັບສິດ ອະນຸມັດແທນຫົວໜ້າບໍ່ໄດ້",
    "Everything IT staff can do, plus manage users and roles; cannot approve on a manager's behalf",
  ),
};

export function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && (PRIORITIES as readonly string[]).includes(value);
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

// Laos and Thailand share the same time zone, so one zone serves every language.
const TIME_ZONE = "Asia/Bangkok";

type Style = "date" | "dateTime" | "long";

const OPTIONS: Record<Style, Intl.DateTimeFormatOptions> = {
  date: { year: "numeric", month: "short", day: "numeric", timeZone: TIME_ZONE },
  dateTime: { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE },
  long: { dateStyle: "full", timeZone: TIME_ZONE },
};

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(lang: Lang, style: Style): Intl.DateTimeFormat {
  const key = `${lang}:${style}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(INTL_LOCALE[lang], OPTIONS[style]);
    formatters.set(key, f);
  }
  return f;
}

/** "30 Oct 2026" style date in the given language (Thai uses the Buddhist year, Lao and English the Gregorian one). */
export function formatDate(value: Date | string, lang: Lang): string {
  return formatter(lang, "date").format(new Date(value));
}

export function formatDateTime(value: Date | string, lang: Lang): string {
  return formatter(lang, "dateTime").format(new Date(value));
}

/** Full weekday and date, e.g. for a greeting. */
export function formatDateLong(lang: Lang, value: Date | string = new Date()): string {
  return formatter(lang, "long").format(new Date(value));
}

/** Number with the language's grouping, e.g. 1,234 (counts are mostly small, so this rarely changes anything). */
export function formatNumber(value: number, lang: Lang): string {
  return value.toLocaleString(INTL_LOCALE[lang]);
}
