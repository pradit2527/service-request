import { describe, expect, it } from "vitest";
import { LANGS } from "./i18n";
import { ROLES, ROLE_DESCRIPTION, ROLE_LABEL, isRole } from "./labels";

describe("roles", () => {
  it("has a manager role next to employee, IT team and admin", () => {
    expect(ROLES).toEqual(["EMPLOYEE", "MANAGER", "IT_STAFF", "ADMIN"]);
    expect(isRole("MANAGER")).toBe(true);
    expect(isRole("APPROVER")).toBe(false);
  });

  it("labels and describes every role in every language", () => {
    for (const role of ROLES) {
      for (const lang of LANGS) {
        expect(ROLE_LABEL[role][lang].trim()).not.toBe("");
        expect(ROLE_DESCRIPTION[role][lang].trim()).not.toBe("");
      }
    }
  });

  it("names the manager role after what it does", () => {
    expect(ROLE_LABEL.MANAGER).toEqual({
      th: "หัวหน้างาน · ผู้อนุมัติ",
      lo: "ຫົວໜ້າ · ຜູ້ອະນຸມັດ",
      en: "Manager · Approver",
    });
  });
});
