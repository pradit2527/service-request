import { describe, expect, it } from "vitest";
import { checkE2eDatabaseUrl } from "./database";

const OWN = ["postgresql://aidc:secret@localhost:5432/service-request_db?schema=public"];
const GOOD = "postgresql://postgres:postgres@localhost:54329/service_request_e2e?schema=public";

describe("checkE2eDatabaseUrl", () => {
  it("accepts a separate database whose name says e2e", () => {
    expect(checkE2eDatabaseUrl(GOOD, OWN)).toBe(GOOD);
  });

  it("refuses to run without a database to wipe", () => {
    expect(() => checkE2eDatabaseUrl(undefined, OWN)).toThrow(/E2E_DATABASE_URL/);
    expect(() => checkE2eDatabaseUrl("", OWN)).toThrow(/E2E_DATABASE_URL/);
  });

  it("refuses a database whose name does not say e2e, such as the app's own", () => {
    expect(() => checkE2eDatabaseUrl(OWN[0], OWN)).toThrow(/e2e/i);
    expect(() => checkE2eDatabaseUrl("postgresql://postgres:postgres@localhost:5432/postgres", OWN)).toThrow(/e2e/i);
  });

  it("refuses the app's own database even when its name says e2e", () => {
    const own = ["postgresql://aidc:secret@db.internal:5432/app_e2e?schema=public"];
    expect(() => checkE2eDatabaseUrl("postgresql://postgres:other@db.internal:5432/app_e2e", own)).toThrow(/own database/i);
  });

  it("accepts the same name on another server", () => {
    const own = ["postgresql://aidc:secret@db.internal:5432/app_e2e"];
    expect(checkE2eDatabaseUrl("postgresql://postgres:postgres@localhost:54329/app_e2e", own)).toContain("54329");
  });

  it("refuses an address that is not a PostgreSQL URL", () => {
    expect(() => checkE2eDatabaseUrl("not a url", OWN)).toThrow(/PostgreSQL/);
    expect(() => checkE2eDatabaseUrl("mysql://root@localhost/app_e2e", OWN)).toThrow(/PostgreSQL/);
  });

  it("never prints the password of a refused address", () => {
    try {
      checkE2eDatabaseUrl("postgresql://aidc:hunter2@localhost:5432/service-request_db", OWN);
    } catch (error) {
      expect(String(error)).not.toContain("hunter2");
    }
  });
});
