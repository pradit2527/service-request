import { afterEach, describe, expect, it, vi } from "vitest";
import { isAllowedAccount } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("isAllowedAccount", () => {
  it("accepts an email in a company domain", () => {
    vi.stubEnv("ALLOWED_EMAIL_DOMAINS", "aidc.test, other.test");
    expect(isAllowedAccount("a@aidc.test", null)).toBe(true);
    expect(isAllowedAccount("A@Other.Test", null)).toBe(true);
  });

  it("refuses an email outside the company domains, such as Gmail", () => {
    vi.stubEnv("ALLOWED_EMAIL_DOMAINS", "aidc.test");
    expect(isAllowedAccount("someone@gmail.com", null)).toBe(false);
  });

  it("refuses everything when no domain is listed", () => {
    vi.stubEnv("ALLOWED_EMAIL_DOMAINS", "");
    expect(isAllowedAccount("a@aidc.test", null)).toBe(false);
  });

  it("accepts an email that ADMIN_EMAILS or IT_STAFF_EMAILS names, from any domain", () => {
    vi.stubEnv("ALLOWED_EMAIL_DOMAINS", "aidc.test");
    vi.stubEnv("ADMIN_EMAILS", "boss@gmail.com");
    vi.stubEnv("IT_STAFF_EMAILS", "tech@gmail.com");
    expect(isAllowedAccount("boss@gmail.com", null)).toBe(true);
    expect(isAllowedAccount("tech@gmail.com", null)).toBe(true);
    expect(isAllowedAccount("other@gmail.com", null)).toBe(false);
  });

  it("also needs the Workspace domain of the account to be allowed", () => {
    vi.stubEnv("ALLOWED_EMAIL_DOMAINS", "aidc.test");
    expect(isAllowedAccount("a@aidc.test", "aidc.test")).toBe(true);
    expect(isAllowedAccount("a@aidc.test", "evil.test")).toBe(false);
  });
});
