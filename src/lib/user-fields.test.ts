import { describe, expect, it } from "vitest";
import { makeT } from "./i18n";
import { departmentField, emailField, nameField, phoneField } from "./user-fields";

const t = makeT("en");

describe("emailField", () => {
  it("trims and lower-cases the address, so the same person cannot be registered twice with different spelling", () => {
    expect(emailField(t).parse("  A@AIDC.test ")).toBe("a@aidc.test");
  });

  it("rejects something that is not an email address", () => {
    expect(emailField(t).safeParse("abc").success).toBe(false);
    expect(emailField(t).safeParse("").success).toBe(false);
  });
});

describe("nameField", () => {
  it("needs at least one visible character and at most 100", () => {
    expect(nameField(t).safeParse("   ").success).toBe(false);
    expect(nameField(t).safeParse("Decha Ning").success).toBe(true);
    expect(nameField(t).safeParse("x".repeat(101)).success).toBe(false);
  });
});

describe("departmentField and phoneField", () => {
  it("accept an empty value and limit the length", () => {
    expect(departmentField(t).safeParse("").success).toBe(true);
    expect(departmentField(t).safeParse("x".repeat(101)).success).toBe(false);
    expect(phoneField(t).safeParse("").success).toBe(true);
    expect(phoneField(t).safeParse("x".repeat(31)).success).toBe(false);
  });

  it("accept a normal phone number and refuse letters", () => {
    expect(phoneField(t).safeParse("+856 20 5555-1234").success).toBe(true);
    expect(phoneField(t).safeParse("call me").success).toBe(false);
  });
});
