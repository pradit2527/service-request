import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password-hash";

describe("hashPassword and verifyPassword", () => {
  it("accepts the password that was hashed and refuses another one", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse battery", stored)).toBe(true);
    expect(await verifyPassword("correct horse batterx", stored)).toBe(false);
    expect(await verifyPassword("", stored)).toBe(false);
  });

  it("never stores the password itself, and salts every hash so the same password gives different ones", async () => {
    const first = await hashPassword("same password 1");
    const second = await hashPassword("same password 1");
    expect(first).not.toContain("same password 1");
    expect(first).not.toBe(second);
    expect(await verifyPassword("same password 1", first)).toBe(true);
    expect(await verifyPassword("same password 1", second)).toBe(true);
  });

  it("writes the algorithm and its settings into the hash, so they can be raised later", async () => {
    const stored = await hashPassword("a password");
    const [algorithm, n, r, p, salt, key] = stored.split("$");
    expect(algorithm).toBe("scrypt");
    expect([Number(n), Number(r), Number(p)].every((value) => Number.isInteger(value) && value > 0)).toBe(true);
    expect(salt.length).toBeGreaterThan(10);
    expect(key.length).toBeGreaterThan(30);
  });

  it("treats text typed in different but equivalent ways as the same password", async () => {
    // Thai sara am (U+0E33) is also typed as nikhahit + sara aa (U+0E4D U+0E32); é is one character or e + an accent.
    const stored = await hashPassword("รหัสทำงาน-café-2026");
    expect(await verifyPassword("รหัสทํางาน-café-2026", stored)).toBe(true);
    expect(await verifyPassword("รหัสทำงาน-cafe-2026", stored)).toBe(false);
  });

  it("refuses, without throwing, anything that is not a hash this module wrote", async () => {
    expect(await verifyPassword("whatever", null)).toBe(false);
    expect(await verifyPassword("whatever", undefined)).toBe(false);
    expect(await verifyPassword("whatever", "")).toBe(false);
    expect(await verifyPassword("whatever", "plain-text-password")).toBe(false);
    expect(await verifyPassword("whatever", "scrypt$1$2$3$AAAA$BBBB")).toBe(false);
    expect(await verifyPassword("whatever", "bcrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$BBBB")).toBe(false);
  });

  it("refuses a hash whose settings would make checking absurdly expensive", async () => {
    const huge = "scrypt$1073741824$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    expect(await verifyPassword("whatever", huge)).toBe(false);
  });
});
