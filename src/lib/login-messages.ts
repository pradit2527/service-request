import type { Translate } from "./i18n";

/** What someone sees while their account is locked after too many wrong passwords. */
export function lockedMessage(t: Translate, minutes: number): string {
  return t(
    `ใส่รหัสผ่านผิดหลายครั้ง กรุณารอ ${minutes} นาทีแล้วลองใหม่`,
    `ໃສ່ລະຫັດຜ່ານຜິດຫຼາຍຄັ້ງ ກະລຸນາລໍຖ້າ ${minutes} ນາທີ ແລ້ວລອງໃໝ່`,
    `Too many wrong passwords. Please wait ${minutes} ${minutes === 1 ? "minute" : "minutes"} and try again`,
  );
}
