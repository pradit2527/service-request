// Approval policy. Pure module.
//
// Every request goes to a manager for approval before it reaches the IT team: the requester submits,
// the manager approves, then IT does the work. The one exception is a manager's own request when there
// is no other manager who could approve it (a manager never approves their own request), so it goes to
// IT directly instead of being stuck.

import { l } from "./i18n";
import { isManager, type Viewer } from "./permissions";

/**
 * Whether a request from `requester` must be approved first.
 * `otherApprovers` is how many active managers there are besides the requester.
 */
export function requiresManagerApproval(requester: Viewer, otherApprovers: number): boolean {
  return !(isManager(requester) && otherApprovers === 0);
}

export const APPROVAL_REASON = l(
  "ทุกคำขอต้องได้รับอนุมัติจากหัวหน้างานก่อนส่งถึงทีม IT",
  "ທຸກຄຳຂໍຕ້ອງໄດ້ຮັບອະນຸມັດຈາກຫົວໜ້າກ່ອນສົ່ງຫາທີມ IT",
  "Every request must be approved by a manager before it goes to the IT team",
);

/** Shown instead of the approver choice when the requester is the only manager. */
export const OWN_REQUEST_NOTE = l(
  "คุณเป็นผู้อนุมัติและยังไม่มีหัวหน้าคนอื่น คำขอนี้จึงส่งถึงทีม IT โดยตรง",
  "ທ່ານເປັນຜູ້ອະນຸມັດ ແລະ ຍັງບໍ່ມີຫົວໜ້າຄົນອື່ນ ຄຳຂໍນີ້ຈຶ່ງສົ່ງຫາທີມ IT ໂດຍກົງ",
  "You are the approver and there is no other manager, so this request goes straight to the IT team",
);
