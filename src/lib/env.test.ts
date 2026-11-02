import { afterEach, describe, expect, it, vi } from "vitest";
import { registrationEmailAllowed } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("registrationEmailAllowed", () => {
  it("accepts any address while developing without a domain list, when dev login is on", () => {
    vi.stubEnv("ALLOWED_EMAIL_DOMAINS", "");
    vi.stubEnv("ENABLE_DEV_LOGIN", "true");
    expect(registrationEmailAllowed("someone@example.test")).toBe(true);
  });

  it("refuses everything when no domain list is set and dev login is off", () => {
    vi.stubEnv("ALLOWED_EMAIL_DOMAINS", "");
    vi.stubEnv("ENABLE_DEV_LOGIN", "false");
    expect(registrationEmailAllowed("someone@example.test")).toBe(false);
  });

  it("accepts only the company domains when a list is set", () => {
    vi.stubEnv("ALLOWED_EMAIL_DOMAINS", "aidc.test");
    vi.stubEnv("ENABLE_DEV_LOGIN", "true");
    expect(registrationEmailAllowed("a@aidc.test")).toBe(true);
    expect(registrationEmailAllowed("a@other.test")).toBe(false);
  });
});
