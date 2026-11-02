// Rules for system management that need no database access, so they can be unit-tested.

import { l, type Localized } from "./i18n";

/** How many records point at a user. A user with any of these cannot be deleted, only deactivated. */
export type UserReferenceCounts = {
  requests: number;
  comments: number;
  events: number;
  articles: number;
  // These relations would only be cleared (SetNull), but that would leave requests without an owner.
  assigned: number;
  approvals: number;
  decided: number;
  deleted: number;
  // The change log keeps pointing at whoever made each change.
  audits: number;
};

const REFERENCE_ORDER: (keyof UserReferenceCounts)[] = [
  "requests",
  "comments",
  "events",
  "articles",
  "assigned",
  "approvals",
  "decided",
  "deleted",
  "audits",
];

export const USER_REFERENCE_LABEL: Record<keyof UserReferenceCounts, Localized> = {
  requests: l("คำขอที่ยื่น", "ຄຳຂໍທີ່ຍື່ນ", "requests submitted"),
  comments: l("ข้อความที่เขียน", "ຂໍ້ຄວາມທີ່ຂຽນ", "messages written"),
  events: l("ประวัติการดำเนินการ", "ປະຫວັດການດຳເນີນການ", "activity entries"),
  articles: l("บทความที่เขียน", "ບົດຄວາມທີ່ຂຽນ", "articles written"),
  assigned: l("คำขอที่เป็นผู้รับผิดชอบ", "ຄຳຂໍທີ່ເປັນຜູ້ຮັບຜິດຊອບ", "requests assigned to them"),
  approvals: l("คำขอที่เป็นผู้อนุมัติ", "ຄຳຂໍທີ່ເປັນຜູ້ອະນຸມັດ", "requests they approve"),
  decided: l("คำขอที่เคยพิจารณา", "ຄຳຂໍທີ່ເຄີຍພິຈາລະນາ", "requests they decided"),
  deleted: l("คำขอที่เคยลบ", "ຄຳຂໍທີ່ເຄີຍລຶບ", "requests they deleted"),
  audits: l("รายการในบันทึกการเปลี่ยนแปลง", "ລາຍການໃນບັນທຶກການປ່ຽນແປງ", "entries in the change log"),
};

/** The kinds of history that stop a user being deleted, in a fixed order. Empty means the user can be deleted. */
export function userDeletionBlockers(counts: UserReferenceCounts): (keyof UserReferenceCounts)[] {
  return REFERENCE_ORDER.filter((key) => counts[key] > 0);
}

/** The request fields a system manager can edit (the approver is changed separately). */
export const EDITABLE_REQUEST_FIELDS = ["title", "description", "priority", "neededBy", "requestedForName"] as const;

export const REQUEST_EDIT_FIELD_LABEL: Record<(typeof EDITABLE_REQUEST_FIELDS)[number], Localized> = {
  title: l("หัวข้อ", "ຫົວຂໍ້", "subject"),
  description: l("เหตุผล", "ເຫດຜົນ", "reason"),
  priority: l("ความสำคัญ", "ຄວາມສຳຄັນ", "priority"),
  neededBy: l("วันที่ต้องการใช้งาน", "ວັນທີທີ່ຕ້ອງການໃຊ້ງານ", "needed-by date"),
  requestedForName: l("ผู้ใช้งานจริง", "ຜູ້ໃຊ້ງານຈິງ", "actual user"),
};

/** The keys whose value differs between `before` and `after`, in the order of `keys`. Values are compared with `!==`. */
export function changedFields<K extends string>(before: Record<K, unknown>, after: Record<K, unknown>, keys: readonly K[]): K[] {
  return keys.filter((key) => before[key] !== after[key]);
}

/**
 * The value the approver dropdown of the request edit form starts on: the current approver while they can
 * still be chosen, otherwise "" ("keep the current approver"). Without the fallback the browser would
 * select the first manager in the list and saving any other field would silently reassign the request.
 */
export function approverFormValue(currentApproverId: string, choices: { id: string }[]): string {
  return choices.some((choice) => choice.id === currentApproverId) ? currentApproverId : "";
}

/**
 * The display name to store when someone signs in with Google, or `undefined` to leave it as it is.
 * The Google name is used the first time only; after that the administrators own the name.
 */
export function profileNameOnSignIn(existing: { googleSub: string | null } | null, googleName: string): string | undefined {
  return existing?.googleSub ? undefined : googleName;
}
