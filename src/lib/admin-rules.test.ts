import { describe, expect, it } from "vitest";
import {
  EDITABLE_REQUEST_FIELDS,
  REQUEST_EDIT_FIELD_LABEL,
  USER_REFERENCE_LABEL,
  approverFormValue,
  changedFields,
  profileNameOnSignIn,
  signInAccess,
  userDeletionBlockers,
  type UserReferenceCounts,
} from "./admin-rules";
import { LANGS } from "./i18n";

const none: UserReferenceCounts = {
  requests: 0,
  comments: 0,
  events: 0,
  articles: 0,
  assigned: 0,
  approvals: 0,
  decided: 0,
  deleted: 0,
  audits: 0,
};

describe("userDeletionBlockers", () => {
  it("is empty for a user nothing points to", () => {
    expect(userDeletionBlockers(none)).toEqual([]);
  });

  it("lists every kind of history, in a fixed order", () => {
    expect(userDeletionBlockers({ ...none, assigned: 2, comments: 1 })).toEqual(["comments", "assigned"]);
  });

  it("counts a user who appears in the change log, because the log keeps pointing at who made each change", () => {
    expect(userDeletionBlockers({ ...none, audits: 3 })).toEqual(["audits"]);
  });

  it("counts a user who is only an assignee, approver or decider, because those links would be cleared", () => {
    expect(userDeletionBlockers({ ...none, assigned: 1 })).toEqual(["assigned"]);
    expect(userDeletionBlockers({ ...none, approvals: 1 })).toEqual(["approvals"]);
    expect(userDeletionBlockers({ ...none, decided: 1 })).toEqual(["decided"]);
  });
});

describe("changedFields", () => {
  it("returns only the keys whose value differs", () => {
    const before = { title: "a", priority: "LOW" };
    const after = { title: "a", priority: "HIGH" };
    expect(changedFields(before, after, ["title", "priority"])).toEqual(["priority"]);
  });

  it("returns nothing when nothing changed", () => {
    const same = { title: "a", priority: "LOW" };
    expect(changedFields(same, { ...same }, ["title", "priority"])).toEqual([]);
  });

  it("keeps the order of the keys it was given", () => {
    expect(changedFields({ a: 1, b: 1 }, { a: 2, b: 2 }, ["b", "a"])).toEqual(["b", "a"]);
  });
});

describe("approverFormValue", () => {
  const choices = [{ id: "m1" }, { id: "m2" }];

  it("preselects the current approver while they can still be chosen", () => {
    expect(approverFormValue("m2", choices)).toBe("m2");
  });

  it("falls back to 'keep the current approver' (empty) when the current approver can no longer be chosen, so saving other fields never reassigns the request", () => {
    expect(approverFormValue("m9", choices)).toBe("");
  });

  it("is empty when there is no current approver", () => {
    expect(approverFormValue("", choices)).toBe("");
  });
});

describe("profileNameOnSignIn", () => {
  it("uses the Google name for a brand-new user", () => {
    expect(profileNameOnSignIn(null, "Google Name")).toBe("Google Name");
  });

  it("uses the Google name the first time a pre-registered user signs in", () => {
    expect(profileNameOnSignIn({ googleSub: null }, "Google Name")).toBe("Google Name");
  });

  it("leaves the name to the administrators once the account is linked to Google", () => {
    expect(profileNameOnSignIn({ googleSub: "sub-1" }, "Google Name")).toBeUndefined();
  });
});

describe("labels", () => {
  it("are written in every language", () => {
    const all = [...Object.values(USER_REFERENCE_LABEL), ...Object.values(REQUEST_EDIT_FIELD_LABEL)];
    expect(Object.keys(REQUEST_EDIT_FIELD_LABEL)).toEqual([...EDITABLE_REQUEST_FIELDS]);
    for (const label of all) {
      for (const lang of LANGS) expect(label[lang].trim()).not.toBe("");
    }
  });
});

describe("signInAccess", () => {
  const registered = { isActive: true, googleSub: null };

  it("lets a registered user in from any email domain, such as Gmail", () => {
    expect(signInAccess({ domainAllowed: false, existing: registered, sub: "g1" })).toBe("ok");
  });

  it("creates an unregistered user only when the email is in a company domain", () => {
    expect(signInAccess({ domainAllowed: true, existing: null, sub: "g1" })).toBe("ok");
    expect(signInAccess({ domainAllowed: false, existing: null, sub: "g1" })).toBe("domain");
  });

  it("refuses a deactivated user, even from a company domain", () => {
    expect(signInAccess({ domainAllowed: true, existing: { isActive: false, googleSub: "g1" }, sub: "g1" })).toBe("inactive");
    expect(signInAccess({ domainAllowed: false, existing: { isActive: false, googleSub: null }, sub: "g1" })).toBe("inactive");
  });

  it("refuses an email that is already linked to a different Google account", () => {
    expect(signInAccess({ domainAllowed: false, existing: { isActive: true, googleSub: "g1" }, sub: "g2" })).toBe("conflict");
    expect(signInAccess({ domainAllowed: false, existing: { isActive: true, googleSub: "g1" }, sub: "g1" })).toBe("ok");
  });
});
