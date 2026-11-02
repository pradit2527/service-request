import { describe, expect, it, vi } from "vitest";
import { AUDIT_ACTIONS, AUDIT_ACTION_LABEL, writeAudit } from "./audit";
import { LANGS } from "./i18n";

function fakeClient() {
  return { auditLog: { create: vi.fn().mockResolvedValue({}) } };
}

describe("writeAudit", () => {
  it("stores who did what to which record", async () => {
    const client = fakeClient();
    await writeAudit(client as never, "u1", { action: "USER_CREATED", entity: "USER", entityId: "e1", summary: "a@b.test (EMPLOYEE)" });
    expect(client.auditLog.create).toHaveBeenCalledWith({
      data: { actorId: "u1", action: "USER_CREATED", entity: "USER", entityId: "e1", summary: "a@b.test (EMPLOYEE)" },
    });
  });

  it("cuts a long summary to 300 characters", async () => {
    const client = fakeClient();
    await writeAudit(client as never, "u1", { action: "KB_DELETED", entity: "KB_ARTICLE", entityId: "k1", summary: "x".repeat(500) });
    const { data } = client.auditLog.create.mock.calls[0][0];
    expect(data.summary).toHaveLength(300);
  });
});

describe("audit actions", () => {
  it("have a label in every language", () => {
    for (const action of AUDIT_ACTIONS) {
      for (const lang of LANGS) expect(AUDIT_ACTION_LABEL[action][lang].trim()).not.toBe("");
    }
  });
});
