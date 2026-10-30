import { describe, expect, it } from "vitest";
import { LANGS, type Localized } from "./i18n";
import {
  REQUEST_CATEGORIES,
  REQUEST_TYPES,
  REQUEST_TYPE_DEFS,
  describeDetails,
  isRequestType,
  validateDetails,
  visibleFieldNames,
} from "./request-types";

const THAI = /[฀-๿]/;
const LAO = /[຀-໿]/;
const ASCII_ONLY = /^[\x20-\x7E–]+$/; // Latin text, digits and punctuation (incl. the en dash)

describe("request type definitions", () => {
  it("defines every request type with unique field names", () => {
    for (const type of REQUEST_TYPES) {
      const names = REQUEST_TYPE_DEFS[type].fields.map((f) => f.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("gives every select field at least one option", () => {
    for (const type of REQUEST_TYPES) {
      for (const field of REQUEST_TYPE_DEFS[type].fields) {
        if (field.kind === "select") expect(field.options?.length).toBeGreaterThan(0);
      }
    }
  });

  it("only conditions on fields defined earlier in the same type", () => {
    for (const type of REQUEST_TYPES) {
      const names = REQUEST_TYPE_DEFS[type].fields.map((f) => f.name);
      REQUEST_TYPE_DEFS[type].fields.forEach((field, index) => {
        if (!field.showWhen) return;
        const controller = names.indexOf(field.showWhen.field);
        expect(controller).toBeGreaterThanOrEqual(0);
        expect(controller).toBeLessThan(index);
      });
    }
  });

  it("only conditions on values the controlling field can actually have", () => {
    for (const type of REQUEST_TYPES) {
      for (const field of REQUEST_TYPE_DEFS[type].fields) {
        if (!field.showWhen) continue;
        const controller = REQUEST_TYPE_DEFS[type].fields.find((f) => f.name === field.showWhen!.field)!;
        const values = controller.options?.map((o) => o.value) ?? [];
        for (const wanted of field.showWhen.in) expect(values).toContain(wanted);
      }
    }
  });

  it("lists every type in exactly one category", () => {
    const listed = REQUEST_CATEGORIES.flatMap((c) => c.types);
    expect([...listed].sort()).toEqual([...REQUEST_TYPES].sort());
  });

  it("recognises request types", () => {
    expect(isRequestType("HARDWARE")).toBe(true);
    expect(isRequestType("hardware")).toBe(false);
  });
});

describe("localized text", () => {
  // Every user-visible string of the module: categories, types, fields, options, placeholders and help texts.
  const texts: { where: string; value: Localized }[] = [];
  for (const category of REQUEST_CATEGORIES) {
    texts.push({ where: `category ${category.key} label`, value: category.label });
    texts.push({ where: `category ${category.key} description`, value: category.description });
  }
  for (const type of REQUEST_TYPES) {
    const def = REQUEST_TYPE_DEFS[type];
    texts.push({ where: `${type} label`, value: def.label });
    texts.push({ where: `${type} description`, value: def.description });
    for (const field of def.fields) {
      texts.push({ where: `${type}.${field.name} label`, value: field.label });
      if (field.placeholder) texts.push({ where: `${type}.${field.name} placeholder`, value: field.placeholder });
      if (field.help) texts.push({ where: `${type}.${field.name} help`, value: field.help });
      for (const option of field.options ?? []) {
        texts.push({ where: `${type}.${field.name}.${option.value} option`, value: option.label });
      }
    }
  }

  it("covers every text", () => {
    expect(texts.length).toBeGreaterThan(150);
  });

  it("uses only the right script in each language slot", () => {
    for (const { where, value } of texts) {
      for (const lang of LANGS) expect(value[lang].trim(), `${where} (${lang}) is empty`).not.toBe("");
      // Thai text must not contain Lao letters
      expect(LAO.test(value.th), `${where}: Lao letters in the Thai text`).toBe(false);
      // Lao text must not contain Thai letters
      expect(THAI.test(value.lo), `${where}: Thai letters in the Lao text`).toBe(false);
      // English text has neither
      expect(THAI.test(value.en) || LAO.test(value.en), `${where}: Thai/Lao letters in the English text`).toBe(false);
    }
  });

  it("really translates Thai text into Lao and English", () => {
    for (const { where, value } of texts) {
      if (THAI.test(value.th)) {
        // Thai original: Lao must be Lao script, English must differ from the Thai
        expect(LAO.test(value.lo), `${where}: Lao text is missing Lao letters`).toBe(true);
        expect(value.en, `${where}: English is a copy of the Thai`).not.toBe(value.th);
      } else {
        // Latin original (technical term such as "Server" / "Production"): Lao is either the same Latin text or Lao
        expect(LAO.test(value.lo) || ASCII_ONLY.test(value.lo), `${where}: unexpected Lao text`).toBe(true);
      }
    }
  });
});

describe("visibleFieldNames", () => {
  it("shows only unconditional fields at first", () => {
    const visible = visibleFieldNames("ACCESS_ACCOUNT", {});
    expect(visible.has("system")).toBe(true);
    expect(visible.has("systemDetail")).toBe(false);
    expect(visible.has("expiresOn")).toBe(false);
  });

  it("reveals a field when its controlling answer matches", () => {
    expect(visibleFieldNames("ACCESS_ACCOUNT", { system: "shared-folder" }).has("systemDetail")).toBe(true);
    expect(visibleFieldNames("ACCESS_ACCOUNT", { system: "email" }).has("systemDetail")).toBe(false);
  });

  it("hides a dependent field whose controller is itself hidden", () => {
    // "duration" is only for new-account / grant; a stale "temporary" must not keep expiresOn alive
    const visible = visibleFieldNames("ACCESS_ACCOUNT", { action: "revoke", duration: "temporary" });
    expect(visible.has("duration")).toBe(false);
    expect(visible.has("expiresOn")).toBe(false);
  });

  it("shows the whole chain when every step matches", () => {
    const visible = visibleFieldNames("ACCESS_ACCOUNT", { action: "grant", duration: "temporary" });
    expect(visible.has("duration")).toBe(true);
    expect(visible.has("expiresOn")).toBe(true);
  });
});

describe("validateDetails", () => {
  const validAws = {
    projectName: "Billing API",
    environment: "prod",
    awsRegion: "ap-southeast-1",
    os: "ubuntu-24.04",
    instanceType: "t3.medium",
    storageGb: "50",
    publicAccess: "yes",
  };

  it("accepts a complete AWS request and converts numbers", () => {
    const { values, errors } = validateDetails("AWS_SERVER", validAws, "th");
    expect(errors).toEqual({});
    expect(values.storageGb).toBe(50);
    expect(values.environment).toBe("prod");
  });

  it("reports every missing required field", () => {
    const { errors } = validateDetails("AWS_SERVER", {}, "th");
    expect(Object.keys(errors).sort()).toEqual(
      ["awsRegion", "environment", "instanceType", "os", "projectName", "publicAccess", "storageGb"].sort(),
    );
  });

  it("rejects values outside a select's options", () => {
    expect(validateDetails("AWS_SERVER", { ...validAws, environment: "moon" }, "th").errors.environment).toBeDefined();
  });

  it("enforces numeric bounds and integers", () => {
    expect(validateDetails("AWS_SERVER", { ...validAws, storageGb: "4" }, "th").errors.storageGb).toBeDefined();
    expect(validateDetails("AWS_SERVER", { ...validAws, storageGb: "20.5" }, "th").errors.storageGb).toBeDefined();
    expect(validateDetails("AWS_SERVER", { ...validAws, storageGb: "abc" }, "th").errors.storageGb).toBeDefined();
  });

  it("treats optional fields as optional", () => {
    const { values, errors } = validateDetails("AWS_SERVER", { ...validAws, monthlyBudget: "" }, "th");
    expect(errors).toEqual({});
    expect(values).not.toHaveProperty("monthlyBudget");
  });

  it("requires the domain name only when a domain is requested", () => {
    const base = { targetServer: "i-0abc", sslCertificate: "no" };
    expect(validateDetails("PUBLIC_IP_DOMAIN", { ...base, kind: "public-ip" }, "th").errors).toEqual({});
    expect(validateDetails("PUBLIC_IP_DOMAIN", { ...base, kind: "domain" }, "th").errors.domainName).toBeDefined();
  });

  it("drops values for hidden fields", () => {
    const { values } = validateDetails(
      "PUBLIC_IP_DOMAIN",
      {
        kind: "public-ip",
        domainName: "stale.example.com",
        targetServer: "i-0abc",
        sslCertificate: "no",
      },
      "th",
    );
    expect(values).not.toHaveProperty("domainName");
  });

  it("rejects over-long text", () => {
    const { errors } = validateDetails(
      "SOFTWARE",
      {
        itemType: "program",
        softwareName: "x".repeat(201),
        licenseType: "free",
        targetMachine: "PC-01",
      },
      "th",
    );
    expect(errors.softwareName).toBeDefined();
  });

  it("has no extra fields for the generic type", () => {
    expect(validateDetails("OTHER", { anything: "ignored" }, "th")).toEqual({ values: {}, errors: {} });
  });

  it("gives the same result in every language apart from the messages", () => {
    const bad = { ...validAws, storageGb: "4", environment: "moon" };
    const results = LANGS.map((lang) => validateDetails("AWS_SERVER", bad, lang));
    for (const result of results) {
      expect(Object.keys(result.errors).sort()).toEqual(Object.keys(results[0].errors).sort());
      expect(result.values).toEqual(results[0].values);
    }
  });

  it("writes required-field errors in the chosen language", () => {
    expect(validateDetails("AWS_SERVER", {}, "th").errors.projectName).toBe("กรุณากรอกชื่อโปรเจ็ค / ระบบ");
    expect(validateDetails("AWS_SERVER", {}, "lo").errors.projectName).toBe("ກະລຸນາປ້ອນ ຊື່ໂປຣເຈັກ / ລະບົບ");
    expect(validateDetails("AWS_SERVER", {}, "en").errors.projectName).toBe("Project / system name: please fill in this field");
  });

  it("asks to select (not to fill in) for select fields, in every language", () => {
    expect(validateDetails("AWS_SERVER", {}, "th").errors.environment).toBe("กรุณาเลือกสภาพแวดล้อม");
    expect(validateDetails("AWS_SERVER", {}, "lo").errors.environment).toBe("ກະລຸນາເລືອກ ສະພາບແວດລ້ອມ");
    expect(validateDetails("AWS_SERVER", {}, "en").errors.environment).toBe("Environment: please select an option");
  });

  it("writes numeric errors in the chosen language", () => {
    const range = { ...validAws, storageGb: "4" };
    expect(validateDetails("AWS_SERVER", range, "th").errors.storageGb).toBe("พื้นที่จัดเก็บ (GB)ต้องอยู่ระหว่าง 8 ถึง 16000");
    expect(validateDetails("AWS_SERVER", range, "lo").errors.storageGb).toBe("ພື້ນທີ່ຈັດເກັບ (GB) ຕ້ອງຢູ່ລະຫວ່າງ 8 ຫາ 16000");
    expect(validateDetails("AWS_SERVER", range, "en").errors.storageGb).toBe("Storage (GB) must be between 8 and 16000");

    const fraction = { ...validAws, storageGb: "20.5" };
    expect(validateDetails("AWS_SERVER", fraction, "th").errors.storageGb).toBe("พื้นที่จัดเก็บ (GB)ต้องเป็นจำนวนเต็ม");
    expect(validateDetails("AWS_SERVER", fraction, "lo").errors.storageGb).toBe("ພື້ນທີ່ຈັດເກັບ (GB) ຕ້ອງເປັນຈຳນວນເຕັມ");
    expect(validateDetails("AWS_SERVER", fraction, "en").errors.storageGb).toBe("Storage (GB) must be a whole number");
  });

  it("writes invalid-value and too-long errors in the chosen language", () => {
    const invalid = { ...validAws, environment: "moon" };
    expect(validateDetails("AWS_SERVER", invalid, "th").errors.environment).toBe("สภาพแวดล้อมไม่ถูกต้อง");
    expect(validateDetails("AWS_SERVER", invalid, "lo").errors.environment).toBe("ສະພາບແວດລ້ອມ ບໍ່ຖືກຕ້ອງ");
    expect(validateDetails("AWS_SERVER", invalid, "en").errors.environment).toBe("Environment is invalid");

    const long = { ...validAws, projectName: "x".repeat(201) };
    expect(validateDetails("AWS_SERVER", long, "th").errors.projectName).toBe("ชื่อโปรเจ็ค / ระบบยาวเกิน 200 ตัวอักษร");
    expect(validateDetails("AWS_SERVER", long, "lo").errors.projectName).toBe("ຊື່ໂປຣເຈັກ / ລະບົບ ຍາວເກີນ 200 ຕົວອັກສອນ");
    expect(validateDetails("AWS_SERVER", long, "en").errors.projectName).toBe(
      "Project / system name is too long (maximum 200 characters)",
    );
  });

  it("writes date errors in the chosen language", () => {
    const loan = { action: "loan", deviceType: "laptop", quantity: "1", forUser: "a@example.com", deliveryLocation: "A-3", loanUntil: "31/12/2026" };
    expect(validateDetails("HARDWARE", loan, "th").errors.loanUntil).toBe("คืนภายในวันที่ไม่ถูกต้อง");
    expect(validateDetails("HARDWARE", loan, "lo").errors.loanUntil).toBe("ສົ່ງຄືນພາຍໃນວັນທີ ບໍ່ຖືກຕ້ອງ");
    expect(validateDetails("HARDWARE", loan, "en").errors.loanUntil).toBe("Return by is invalid");
  });

  it("keeps every error message in the script of its language", () => {
    const inputs: [(typeof REQUEST_TYPES)[number], Record<string, string>][] = [
      ["AWS_SERVER", {}],
      ["AWS_SERVER", { ...validAws, storageGb: "4", environment: "moon", projectName: "x".repeat(201), instanceType: "t3" }],
      ["AWS_SERVER", { ...validAws, storageGb: "1.5" }],
      ["HARDWARE", { action: "loan", loanUntil: "bad", quantity: "0" }],
      ["ACCESS_ACCOUNT", { action: "grant", duration: "temporary", expiresOn: "bad" }],
      ["DATABASE", {}],
    ];
    for (const [type, raw] of inputs) {
      for (const lang of LANGS) {
        const messages = Object.values(validateDetails(type, raw, lang).errors);
        expect(messages.length).toBeGreaterThan(0);
        for (const message of messages) {
          if (lang === "th") expect(LAO.test(message), message).toBe(false);
          if (lang === "lo") {
            expect(THAI.test(message), message).toBe(false);
            expect(LAO.test(message), message).toBe(true);
          }
          if (lang === "en") expect(THAI.test(message) || LAO.test(message), message).toBe(false);
        }
      }
    }
  });
});

describe("hardware requests", () => {
  const base = {
    action: "new",
    deviceType: "laptop",
    quantity: "2",
    forUser: "สมชาย ใจดี",
    deliveryLocation: "อาคาร A ชั้น 3",
  };

  it("accepts a new-device request", () => {
    const { values, errors } = validateDetails("HARDWARE", base, "th");
    expect(errors).toEqual({});
    expect(values.quantity).toBe(2);
  });

  it("requires the old asset tag only for upgrades", () => {
    expect(validateDetails("HARDWARE", { ...base, action: "upgrade" }, "th").errors.assetTag).toBeDefined();
    expect(validateDetails("HARDWARE", { ...base, action: "upgrade", assetTag: "NB-0123" }, "th").errors).toEqual({});
    expect(validateDetails("HARDWARE", base, "th").errors.assetTag).toBeUndefined();
  });

  it("requires a return date for loans", () => {
    expect(validateDetails("HARDWARE", { ...base, action: "loan" }, "th").errors.loanUntil).toBeDefined();
    expect(validateDetails("HARDWARE", { ...base, action: "loan", loanUntil: "2026-12-31" }, "th").errors).toEqual({});
  });

  it("limits the quantity", () => {
    expect(validateDetails("HARDWARE", { ...base, quantity: "0" }, "th").errors.quantity).toBeDefined();
    expect(validateDetails("HARDWARE", { ...base, quantity: "101" }, "th").errors.quantity).toBeDefined();
  });
});

describe("access requests", () => {
  const base = { system: "shared-folder", systemDetail: "\\\\fileserver\\Finance", action: "grant", targetUser: "a@example.com", accessLevel: "write", duration: "permanent" };

  it("accepts a permanent folder grant", () => {
    expect(validateDetails("ACCESS_ACCOUNT", base, "th").errors).toEqual({});
  });

  it("needs a system detail for everything except email", () => {
    expect(validateDetails("ACCESS_ACCOUNT", { ...base, systemDetail: "" }, "th").errors.systemDetail).toBeDefined();
    const email = validateDetails("ACCESS_ACCOUNT", { system: "email", action: "new-account", targetUser: "ใหม่ มาก", accessLevel: "read", duration: "permanent" }, "th");
    expect(email.errors).toEqual({});
  });

  it("requires an end date for temporary access and validates its format", () => {
    const temp = { ...base, duration: "temporary" };
    expect(validateDetails("ACCESS_ACCOUNT", temp, "th").errors.expiresOn).toBeDefined();
    expect(validateDetails("ACCESS_ACCOUNT", { ...temp, expiresOn: "31/12/2026" }, "th").errors.expiresOn).toBeDefined();
    expect(validateDetails("ACCESS_ACCOUNT", { ...temp, expiresOn: "2026-12-31" }, "th").errors).toEqual({});
  });

  it("skips level and duration questions for a password reset", () => {
    const { errors, values } = validateDetails(
      "ACCESS_ACCOUNT",
      {
        system: "email",
        action: "reset",
        targetUser: "a@example.com",
      },
      "th",
    );
    expect(errors).toEqual({});
    expect(values).not.toHaveProperty("accessLevel");
  });

  it("asks for a start date only for new accounts", () => {
    const visible = visibleFieldNames("ACCESS_ACCOUNT", { action: "new-account" });
    expect(visible.has("startDate")).toBe(true);
    expect(visibleFieldNames("ACCESS_ACCOUNT", { action: "grant" }).has("startDate")).toBe(false);
  });
});

describe("workplace and consultation requests", () => {
  it("asks for the destination only when moving a desk", () => {
    const move = validateDetails("NETWORK_WORKPLACE", { service: "desk-move", location: "A-3" }, "th");
    expect(move.errors.toLocation).toBeDefined();
    const cable = validateDetails("NETWORK_WORKPLACE", { service: "lan-cable", location: "A-3" }, "th");
    expect(cable.errors).toEqual({});
  });

  it("requires a topic and channel for a consultation", () => {
    expect(Object.keys(validateDetails("CONSULTATION", {}, "th").errors).sort()).toEqual(["channel", "topic"]);
    expect(validateDetails("CONSULTATION", { topic: "security", channel: "online" }, "th").errors).toEqual({});
  });
});

describe("describeDetails", () => {
  it("turns stored codes into labels and skips empty values", () => {
    const rows = describeDetails("DATABASE", { engine: "mongodb", projectName: "CRM", personalData: "yes", admins: "" }, "th");
    expect(rows).toContainEqual({ label: "ชนิด Database", value: "MongoDB" });
    expect(rows).toContainEqual({ label: "ชื่อโปรเจ็ค / ระบบ", value: "CRM" });
    expect(rows.find((r) => r.label === "ผู้ดูแล / ผู้ที่ต้องเข้าถึง")).toBeUndefined();
  });

  it("shows free text from older records that predate a select field", () => {
    const rows = describeDetails("ACCESS_ACCOUNT", { system: "GitHub" }, "th");
    expect(rows).toContainEqual({ label: "ระบบ / บริการ", value: "GitHub" });
  });

  it("tolerates missing or malformed details", () => {
    expect(describeDetails("AWS_SERVER", null, "th")).toEqual([]);
    expect(describeDetails("AWS_SERVER", "oops", "th")).toEqual([]);
  });

  it("writes labels in Lao", () => {
    const rows = describeDetails("DATABASE", { engine: "mongodb", projectName: "CRM", personalData: "yes", admins: "" }, "lo");
    expect(rows).toContainEqual({ label: "ປະເພດ Database", value: "MongoDB" });
    expect(rows).toContainEqual({ label: "ຊື່ໂປຣເຈັກ / ລະບົບ", value: "CRM" });
    expect(rows).toContainEqual({ label: "ມີຂໍ້ມູນສ່ວນບຸກຄົນ (PII) ຫຼື ບໍ່", value: "ມີ" });
  });

  it("writes labels and option values in English", () => {
    const rows = describeDetails("DATABASE", { engine: "mongodb", projectName: "CRM", personalData: "yes", admins: "" }, "en");
    expect(rows).toContainEqual({ label: "Database type", value: "MongoDB" });
    expect(rows).toContainEqual({ label: "Project / system name", value: "CRM" });
    expect(rows).toContainEqual({ label: "Contains personal data (PII)", value: "Yes" });
    expect(rows.find((r) => r.label === "Administrators / people who need access")).toBeUndefined();
  });

  it("translates option labels but leaves free text and numbers alone", () => {
    const details = { system: "email", action: "grant", targetUser: "a@example.com", accessLevel: "write" };
    expect(describeDetails("ACCESS_ACCOUNT", details, "th")).toContainEqual({ label: "ระดับสิทธิ์", value: "อ่านและเขียน" });
    expect(describeDetails("ACCESS_ACCOUNT", details, "lo")).toContainEqual({ label: "ລະດັບສິດ", value: "ອ່ານ ແລະ ຂຽນ" });
    expect(describeDetails("ACCESS_ACCOUNT", details, "en")).toContainEqual({ label: "Access level", value: "Read and write" });
    for (const lang of LANGS) {
      expect(describeDetails("ACCESS_ACCOUNT", details, lang).find((r) => r.value === "a@example.com")).toBeDefined();
    }
    expect(describeDetails("AWS_SERVER", { storageGb: 50 }, "en")).toEqual([{ label: "Storage (GB)", value: "50" }]);
  });

  it("returns the same rows, in the same order, in every language", () => {
    const details = { action: "upgrade", deviceType: "laptop", quantity: 2, forUser: "a@example.com", assetTag: "NB-1" };
    const shapes = LANGS.map((lang) => describeDetails("HARDWARE", details, lang).length);
    expect(new Set(shapes).size).toBe(1);
    expect(shapes[0]).toBe(5);
  });
});
