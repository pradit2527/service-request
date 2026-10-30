import { describe, expect, it } from "vitest";
import { APPROVAL_REASON, OWN_REQUEST_NOTE, requiresManagerApproval } from "./approval";
import { LANGS } from "./i18n";
import type { Viewer } from "./permissions";

const employee: Viewer = { id: "u-emp", role: "EMPLOYEE" };
const manager: Viewer = { id: "u-mgr", role: "MANAGER" };
const staff: Viewer = { id: "u-it", role: "IT_STAFF" };
const admin: Viewer = { id: "u-admin", role: "ADMIN" };

describe("requiresManagerApproval", () => {
  it("sends every employee's, IT staff's and admin's request to a manager first", () => {
    for (const requester of [employee, staff, admin]) {
      expect(requiresManagerApproval(requester, 1)).toBe(true);
      expect(requiresManagerApproval(requester, 3)).toBe(true);
    }
  });

  it("still asks for a manager when there is none yet, so the form can say one must be set up", () => {
    for (const requester of [employee, staff, admin]) {
      expect(requiresManagerApproval(requester, 0)).toBe(true);
    }
  });

  it("sends a manager's request to another manager when there is one", () => {
    expect(requiresManagerApproval(manager, 1)).toBe(true);
  });

  it("lets a manager's request go straight to IT only when nobody else could approve it", () => {
    expect(requiresManagerApproval(manager, 0)).toBe(false);
  });
});

describe("approval texts", () => {
  it("are written in every language", () => {
    for (const lang of LANGS) {
      expect(APPROVAL_REASON[lang].trim()).not.toBe("");
      expect(OWN_REQUEST_NOTE[lang].trim()).not.toBe("");
    }
  });
});
