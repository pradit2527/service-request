import { describe, expect, it } from "vitest";
import { databaseLabel, parseAdminArgs } from "./admin-bootstrap";

describe("parseAdminArgs", () => {
  it("reads the email, the name and the option to make the person choose their own password", () => {
    expect(parseAdminArgs(["--email", "Boss@Example.com ", "--name", "The Boss", "--must-change"])).toEqual({
      ok: true,
      email: "boss@example.com",
      name: "The Boss",
      mustChange: true,
    });
  });

  it("needs only an email, and does not ask the person to change a password they just chose", () => {
    expect(parseAdminArgs(["--email", "boss@example.com"])).toEqual({ ok: true, email: "boss@example.com", name: undefined, mustChange: false });
  });

  it("accepts the --option=value form", () => {
    expect(parseAdminArgs(["--email=boss@example.com", "--name=Boss"])).toMatchObject({ ok: true, email: "boss@example.com", name: "Boss" });
  });

  it("asks for an email, and for a real one", () => {
    expect(parseAdminArgs([])).toMatchObject({ ok: false, error: expect.stringContaining("--email") });
    expect(parseAdminArgs(["--email", "not-an-email"])).toMatchObject({ ok: false, error: expect.stringContaining("email") });
    expect(parseAdminArgs(["--email"])).toMatchObject({ ok: false, error: expect.stringContaining("--email") });
  });

  it("refuses a password on the command line, which would stay in the shell history and the process list", () => {
    const result = parseAdminArgs(["--email", "boss@example.com", "--password", "hunter2hunter2"]);
    expect(result).toMatchObject({ ok: false });
    expect(result.ok === false && result.error).toContain("ADMIN_PASSWORD");
    expect(result.ok === false && result.error).not.toContain("hunter2");
    expect(parseAdminArgs(["--email", "boss@example.com", "--password=hunter2hunter2"])).toMatchObject({ ok: false });
  });

  it("refuses an option it does not know, so a typo is not silently ignored", () => {
    expect(parseAdminArgs(["--email", "boss@example.com", "--rol", "ADMIN"])).toMatchObject({ ok: false, error: expect.stringContaining("--rol") });
  });

  it("refuses a name that is empty or too long", () => {
    expect(parseAdminArgs(["--email", "boss@example.com", "--name", " "])).toMatchObject({ ok: false });
    expect(parseAdminArgs(["--email", "boss@example.com", "--name", "x".repeat(101)])).toMatchObject({ ok: false });
  });
});

describe("databaseLabel", () => {
  it("names the database and host so the person sees where the account goes, and never shows the password", () => {
    const label = databaseLabel("postgresql://srm:Sup3r%40Secret@10.0.100.60:5432/service-request_db?schema=public");
    expect(label).toBe('"service-request_db" on 10.0.100.60:5432');
    expect(label).not.toContain("Sup3r");
    expect(label).not.toContain("srm");
  });

  it("says so when there is no usable address", () => {
    expect(databaseLabel(undefined)).toBe("(DATABASE_URL is not set)");
    expect(databaseLabel("not a url")).toBe("(DATABASE_URL is not a valid address)");
  });
});
