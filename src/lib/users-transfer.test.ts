import { describe, expect, it } from "vitest";
import { buildTransferFile, parseTransferFile, planImport, type TransferUser } from "./users-transfer";

const alex: TransferUser = { email: "alex@aidc.test", name: "Alex", department: "AI", phone: null, role: "IT_STAFF", isActive: true };
const boss: TransferUser = { email: "boss@aidc.test", name: "The Boss", department: null, phone: "02-123 4567", role: "ADMIN", isActive: true };

describe("buildTransferFile and parseTransferFile", () => {
  it("round-trips people, sorted by email", () => {
    const text = buildTransferFile([boss, alex], new Date("2026-11-03T08:00:00Z"));
    expect(parseTransferFile(text)).toEqual({ ok: true, users: [alex, boss] });
  });

  it("carries no secrets: only the fields a person is made of", () => {
    const withSecrets = { ...alex, passwordHash: "scrypt$1$2$3$4$5", googleSub: "123", failedLoginCount: 3, temporaryPassword: "hunter2hunter2" } as TransferUser;
    const text = buildTransferFile([withSecrets], new Date("2026-11-03T08:00:00Z"));
    expect(text).not.toContain("hunter2");
    expect(text).not.toContain("scrypt");
    expect(text).not.toContain("googleSub");
    expect(text).not.toContain("failedLoginCount");
  });

  it("tidies what is typed by hand: trims, lower-cases the email, empty department and phone become none", () => {
    const text = JSON.stringify({
      format: "service-request-users",
      version: 1,
      users: [{ email: " Alex@AIDC.test ", name: " Alex ", department: "  ", phone: "", role: "EMPLOYEE", isActive: false }],
    });
    expect(parseTransferFile(text)).toEqual({
      ok: true,
      users: [{ email: "alex@aidc.test", name: "Alex", department: null, phone: null, role: "EMPLOYEE", isActive: false }],
    });
  });

  it("reads a temporary password that is typed into a file by hand for a new person", () => {
    const text = JSON.stringify({ format: "service-request-users", version: 1, users: [{ ...alex, temporaryPassword: "first-temp-pass" }] });
    expect(parseTransferFile(text)).toEqual({ ok: true, users: [{ ...alex, temporaryPassword: "first-temp-pass" }] });
  });

  it("holds a temporary password to the same rules as any password, and never repeats it in the error", () => {
    const text = JSON.stringify({ format: "service-request-users", version: 1, users: [{ ...alex, temporaryPassword: "abc123" }] });
    const result = parseTransferFile(text);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain("alex@aidc.test");
    expect(!result.ok && result.error).toContain("temporaryPassword");
    expect(!result.ok && result.error).toContain("8 characters");
    expect(!result.ok && result.error).not.toContain("abc123");
  });

  it("refuses text that is not JSON", () => {
    expect(parseTransferFile("not json")).toEqual({ ok: false, error: "The file is not valid JSON." });
  });

  it("refuses a file that is not a users export, or from a newer version", () => {
    expect(parseTransferFile(JSON.stringify({ users: [] }))).toMatchObject({ ok: false });
    expect(parseTransferFile(JSON.stringify({ format: "service-request-users", version: 2, users: [] }))).toMatchObject({ ok: false });
  });

  it("names the person whose entry is wrong", () => {
    const text = JSON.stringify({
      format: "service-request-users",
      version: 1,
      users: [alex, { ...boss, role: "SUPERUSER" }],
    });
    const result = parseTransferFile(text);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain("boss@aidc.test");
    expect(!result.ok && result.error).toContain("role");
  });

  it("refuses a bad email, a missing name and a duplicate email", () => {
    const base = { format: "service-request-users", version: 1 };
    expect(parseTransferFile(JSON.stringify({ ...base, users: [{ ...alex, email: "nope" }] }))).toMatchObject({ ok: false });
    expect(parseTransferFile(JSON.stringify({ ...base, users: [{ ...alex, name: "  " }] }))).toMatchObject({ ok: false });
    const duplicate = parseTransferFile(JSON.stringify({ ...base, users: [alex, { ...boss, email: "ALEX@aidc.test" }] }));
    expect(duplicate.ok).toBe(false);
    expect(!duplicate.ok && duplicate.error).toContain("alex@aidc.test");
  });
});

describe("planImport", () => {
  it("creates the people who have no account yet and leaves existing accounts alone, whatever the file says about them", () => {
    const existing = new Set(["boss@aidc.test"]);
    const demoted = { ...boss, role: "EMPLOYEE" as const };
    expect(planImport([alex, demoted], existing)).toEqual({ create: [alex], skip: [demoted] });
  });

  it("compares emails without regard to case", () => {
    expect(planImport([alex], new Set(["ALEX@aidc.test"]))).toEqual({ create: [], skip: [alex] });
  });
});
