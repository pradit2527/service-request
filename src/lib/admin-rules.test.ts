import { describe, expect, it } from "vitest";
import {
  EDITABLE_REQUEST_FIELDS,
  REQUEST_EDIT_FIELD_LABEL,
  USER_REFERENCE_LABEL,
  changedFields,
  profileNameOnSignIn,
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
};

describe("userDeletionBlockers", () => {
  it("is empty for a user nothing points to", () => {
    expect(userDeletionBlockers(none)).toEqual([]);
  });

  it("lists every kind of history, in a fixed order", () => {
    expect(userDeletionBlockers({ ...none, assigned: 2, comments: 1 })).toEqual(["comments", "assigned"]);
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
