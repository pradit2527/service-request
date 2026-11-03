import { afterEach, describe, expect, it, vi } from "vitest";
import { cookieSecure, devLoginEnabled, isAllowedAccount } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("devLoginEnabled", () => {
  it("is on while developing when ENABLE_DEV_LOGIN is true, and off otherwise", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENABLE_DEV_LOGIN", "true");
    expect(devLoginEnabled()).toBe(true);
    vi.stubEnv("ENABLE_DEV_LOGIN", "false");
    expect(devLoginEnabled()).toBe(false);
    vi.stubEnv("ENABLE_DEV_LOGIN", "");
    expect(devLoginEnabled()).toBe(false);
  });

  it("stays off in production even when ENABLE_DEV_LOGIN is true, because anyone who can open the site could then sign in as anybody", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_DEV_LOGIN", "true");
    expect(devLoginEnabled()).toBe(false);
  });

  it("can be switched on in production only by a second, deliberate setting", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_DEV_LOGIN", "true");
    vi.stubEnv("ALLOW_DEV_LOGIN_IN_PRODUCTION", "true");
    expect(devLoginEnabled()).toBe(true);
    vi.stubEnv("ALLOW_DEV_LOGIN_IN_PRODUCTION", "yes");
    expect(devLoginEnabled()).toBe(false);
  });

  it("does not turn on from the production setting alone", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_DEV_LOGIN", "false");
    vi.stubEnv("ALLOW_DEV_LOGIN_IN_PRODUCTION", "true");
    expect(devLoginEnabled()).toBe(false);
  });
});

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

describe("cookieSecure", () => {
  it("is on in production and off while developing, so a local http site keeps its cookie", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(cookieSecure()).toBe(true);
    vi.stubEnv("NODE_ENV", "development");
    expect(cookieSecure()).toBe(false);
  });

  it("can be turned off in production for a site served over plain http inside a private network", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("COOKIE_SECURE", "false");
    expect(cookieSecure()).toBe(false);
    vi.stubEnv("COOKIE_SECURE", "  FALSE ");
    expect(cookieSecure()).toBe(false);
  });

  it("can be forced on, and any other value changes nothing", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("COOKIE_SECURE", "true");
    expect(cookieSecure()).toBe(true);
    vi.stubEnv("COOKIE_SECURE", "maybe");
    expect(cookieSecure()).toBe(false);
    vi.stubEnv("NODE_ENV", "production");
    expect(cookieSecure()).toBe(true);
    vi.stubEnv("COOKIE_SECURE", "");
    expect(cookieSecure()).toBe(true);
  });
});
