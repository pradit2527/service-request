// Validation of the user fields shared by the profile page and system management. Pure module.

import { z } from "zod";
import type { Translate } from "./i18n";

export function emailField(t: Translate) {
  return z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: t("อีเมลไม่ถูกต้อง", "ອີເມວບໍ່ຖືກຕ້ອງ", "Invalid email address") }));
}

export function nameField(t: Translate) {
  return z
    .string()
    .trim()
    .min(1, { error: t("กรุณาระบุชื่อ", "ກະລຸນາລະບຸຊື່", "Please enter a name") })
    .max(100, { error: t("ชื่อยาวเกิน 100 ตัวอักษร", "ຊື່ຍາວເກີນ 100 ຕົວອັກສອນ", "Name must be 100 characters or fewer") });
}

export function departmentField(t: Translate) {
  return z
    .string()
    .trim()
    .max(100, { error: t("ชื่อแผนกยาวเกิน 100 ตัวอักษร", "ຊື່ພະແນກຍາວເກີນ 100 ຕົວອັກສອນ", "Department name must be 100 characters or fewer") });
}

export function phoneField(t: Translate) {
  return z
    .string()
    .trim()
    .max(30, { error: t("เบอร์โทรยาวเกิน 30 ตัวอักษร", "ເບີໂທຍາວເກີນ 30 ຕົວອັກສອນ", "Phone number must be 30 characters or fewer") })
    .refine((v) => v === "" || /^[0-9+\-()\s#.]+$/.test(v), {
      error: t("เบอร์โทรมีอักขระที่ไม่ถูกต้อง", "ເບີໂທມີຕົວອັກສອນທີ່ບໍ່ຖືກຕ້ອງ", "Phone number contains invalid characters"),
    });
}

/** A new password. Not trimmed: spaces are allowed, and what was typed is what is stored (after normalisation when hashing). */
export function passwordField(t: Translate) {
  return z
    .string()
    .min(8, { error: t("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", "ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 8 ຕົວອັກສອນ", "Password must be at least 8 characters") })
    .max(128, { error: t("รหัสผ่านยาวเกิน 128 ตัวอักษร", "ລະຫັດຜ່ານຍາວເກີນ 128 ຕົວອັກສອນ", "Password must be 128 characters or fewer") })
    .refine((value) => value.trim() !== "", {
      error: t("รหัสผ่านต้องไม่ใช่ช่องว่างล้วน", "ລະຫັດຜ່ານຕ້ອງບໍ່ແມ່ນຊ່ອງວ່າງລ້ວນ", "Password cannot be only spaces"),
    });
}
