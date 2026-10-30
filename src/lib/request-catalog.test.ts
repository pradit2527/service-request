import { describe, expect, it } from "vitest";
import { LANGS } from "./i18n";
import {
  REQUEST_CATEGORIES,
  REQUEST_TYPES,
  REQUEST_TYPE_DEFS,
  categoryOf,
  describeDetails,
  isRequestType,
  validateDetails,
} from "./request-types";

describe("catalog: categories and audiences", () => {
  it("gives every category at least one audience and every type a category", () => {
    for (const category of REQUEST_CATEGORIES) expect(category.audience.length).toBeGreaterThan(0);
    for (const type of REQUEST_TYPES) expect(categoryOf(type).types).toContain(type);
  });

  it("lists customer-facing data and deployment work under the client audience only", () => {
    const audienceOf = (key: string) => REQUEST_CATEGORIES.find((c) => c.key === key)!.audience as readonly string[];
    expect(audienceOf("data")).toEqual(["client"]);
    expect(audienceOf("deploy")).toEqual(["client"]);
    expect(audienceOf("cloud")).toEqual(["internal"]);
    expect(audienceOf("hardware")).toEqual(["internal"]);
    expect(audienceOf("access")).toEqual(["client", "internal"]);
    expect(audienceOf("other")).toEqual(["client", "internal"]);
  });

  it("puts the new types in the categories that match the catalog", () => {
    expect(categoryOf("DATA_EXTRACT").key).toBe("data");
    expect(categoryOf("BULK_IMPORT").key).toBe("data");
    expect(categoryOf("DEPLOYMENT").key).toBe("deploy");
    expect(categoryOf("BACKUP_RESTORE").key).toBe("deploy");
    expect(categoryOf("TRAINING").key).toBe("training");
    expect(categoryOf("CONSULTATION").key).toBe("training");
    expect(categoryOf("FIREWALL").key).toBe("cloud");
    expect(categoryOf("ENVIRONMENT").key).toBe("cloud");
  });
});

describe("new request types", () => {
  const NEW_TYPES = [
    "DATA_EXTRACT",
    "DATA_CORRECTION",
    "BULK_IMPORT",
    "REPORT_TEMPLATE",
    "SYSTEM_CONFIG",
    "DEPLOYMENT",
    "BACKUP_RESTORE",
    "TRAINING",
    "DOCUMENT",
    "ENVIRONMENT",
    "FIREWALL",
    "RESOURCE_UPGRADE",
  ] as const;

  it("are recognised as request types", () => {
    for (const type of NEW_TYPES) expect(isRequestType(type)).toBe(true);
    expect(REQUEST_TYPES).toHaveLength(21);
  });

  it("ask for every required field when the form is empty, in every language", () => {
    for (const type of NEW_TYPES) {
      const required = REQUEST_TYPE_DEFS[type].fields.filter((f) => f.required && !f.showWhen).map((f) => f.name);
      for (const lang of LANGS) {
        expect(Object.keys(validateDetails(type, {}, lang).errors).sort()).toEqual([...required].sort());
      }
    }
  });

  it("accept a complete data extraction and a data correction", () => {
    const extract = { system: "ERP", dataScope: "orders", period: "2026 H1", format: "csv", containsPii: "no", delivery: "secure-link" };
    expect(validateDetails("DATA_EXTRACT", extract, "th")).toEqual({ values: extract, errors: {} });
    const correction = {
      system: "ERP",
      environment: "prod",
      target: "customers C-0123",
      recordCount: "3",
      currentData: "old",
      correctData: "new",
      approvalRef: "DOC-77",
    };
    const result = validateDetails("DATA_CORRECTION", correction, "th");
    expect(result.errors).toEqual({});
    expect(result.values.recordCount).toBe(3);
    expect(validateDetails("DATA_CORRECTION", { ...correction, recordCount: "0" }, "th").errors.recordCount).toBeDefined();
  });

  it("ask for the restore point and target only when restoring", () => {
    const base = { system: "CRM", environment: "staging" };
    expect(validateDetails("BACKUP_RESTORE", { ...base, action: "snapshot" }, "th").errors).toEqual({});
    const restore = validateDetails("BACKUP_RESTORE", { ...base, action: "restore" }, "th");
    expect(Object.keys(restore.errors).sort()).toEqual(["restorePoint", "restoreTarget"]);
    const complete = { ...base, action: "restore", restorePoint: "2026-10-28 14:00", restoreTarget: "original" };
    expect(validateDetails("BACKUP_RESTORE", complete, "th").errors).toEqual({});
  });

  it("drop the restore fields that a snapshot does not use", () => {
    const result = validateDetails("BACKUP_RESTORE", { system: "CRM", environment: "dev", action: "snapshot", restorePoint: "stale" }, "th");
    expect(result.values).not.toHaveProperty("restorePoint");
  });

  it("only offer Staging and Production for a deployment", () => {
    const base = { system: "App", deployKind: "hotfix", version: "v1.2.3", window: "after-hours", tested: "yes", rollbackPlan: "revert" };
    expect(validateDetails("DEPLOYMENT", { ...base, environment: "prod" }, "th").errors).toEqual({});
    expect(validateDetails("DEPLOYMENT", { ...base, environment: "dev" }, "th").errors.environment).toBeDefined();
  });

  it("ask for a port and protocol only when opening a port, and an end date only for temporary rules", () => {
    const base = { direction: "outbound", address: "203.0.113.25", environment: "prod", purpose: "customer API", duration: "permanent" };
    const whitelist = validateDetails("FIREWALL", { ...base, action: "whitelist-ip" }, "th");
    expect(whitelist.errors).toEqual({});
    expect(whitelist.values).not.toHaveProperty("port");

    const openPort = validateDetails("FIREWALL", { ...base, action: "open-port" }, "th");
    expect(Object.keys(openPort.errors).sort()).toEqual(["port", "protocol"]);

    const temporary = validateDetails("FIREWALL", { ...base, action: "whitelist-ip", duration: "temporary" }, "th");
    expect(Object.keys(temporary.errors)).toEqual(["expiresOn"]);
  });

  it("limit training attendees", () => {
    const base = { system: "CRM", audience: "new-users", format: "online" };
    expect(validateDetails("TRAINING", { ...base, attendees: "12" }, "th").errors).toEqual({});
    expect(validateDetails("TRAINING", { ...base, attendees: "0" }, "th").errors.attendees).toBeDefined();
    expect(validateDetails("TRAINING", { ...base, attendees: "501" }, "th").errors.attendees).toBeDefined();
  });

  it("describe the stored details in every language", () => {
    const details = { action: "restore", system: "CRM", environment: "staging", restorePoint: "2026-10-28 14:00", restoreTarget: "new-instance" };
    for (const lang of LANGS) expect(describeDetails("BACKUP_RESTORE", details, lang)).toHaveLength(5);
  });
});

describe("extended options of existing types", () => {
  it("let access requests target development tools and special environments", () => {
    const base = { action: "grant", targetUser: "a@example.com", accessLevel: "write", duration: "permanent" };
    for (const system of ["git", "pm-tool", "server-access", "special-env"]) {
      expect(validateDetails("ACCESS_ACCOUNT", { ...base, system }, "th").errors.systemDetail).toBeDefined();
      expect(validateDetails("ACCESS_ACCOUNT", { ...base, system, systemDetail: "GitHub org" }, "th").errors).toEqual({});
    }
  });

  it("support changing an access level and unblocking an account", () => {
    const change = { system: "email", action: "change-role", targetUser: "a@example.com" };
    expect(validateDetails("ACCESS_ACCOUNT", change, "th").errors.accessLevel).toBeDefined();
    expect(validateDetails("ACCESS_ACCOUNT", { ...change, accessLevel: "approver" }, "th").errors).toEqual({});
    expect(validateDetails("ACCESS_ACCOUNT", { system: "email", action: "unblock", targetUser: "a@example.com" }, "th").errors).toEqual({});
  });

  it("offer test and demo devices for hardware", () => {
    const base = { action: "new", specification: "", quantity: "1", forUser: "a@example.com", deliveryLocation: "A-3" };
    for (const deviceType of ["test-device", "demo-device"]) {
      expect(validateDetails("HARDWARE", { ...base, deviceType }, "th").errors).toEqual({});
    }
  });

  it("do not ask for a device when the software is an AI tool key", () => {
    const base = { itemType: "ai-tool", softwareName: "Claude", licenseType: "need-purchase" };
    expect(validateDetails("SOFTWARE", base, "th").errors).toEqual({});
    expect(validateDetails("SOFTWARE", { ...base, itemType: "program" }, "th").errors.targetMachine).toBeDefined();
  });

  it("cover SSL-only and Cloudflare requests under domains", () => {
    const base = { targetServer: "i-0abc", domainName: "app.example.com" };
    expect(validateDetails("PUBLIC_IP_DOMAIN", { ...base, kind: "ssl-only" }, "th").errors).toEqual({});
    expect(validateDetails("PUBLIC_IP_DOMAIN", { ...base, kind: "ssl-only" }, "th").values).not.toHaveProperty("sslCertificate");
    expect(validateDetails("PUBLIC_IP_DOMAIN", { ...base, kind: "cloudflare" }, "th").errors.sslCertificate).toBeDefined();
    expect(validateDetails("PUBLIC_IP_DOMAIN", { targetServer: "i-0abc", kind: "ssl-only" }, "th").errors.domainName).toBeDefined();
  });

  it("offer API integration as a consultation topic", () => {
    expect(validateDetails("CONSULTATION", { topic: "api-integration", channel: "online" }, "th").errors).toEqual({});
  });
});
