import { describe, expect, it } from "vitest";
import {
  BUSINESS_DAY_MINUTES,
  DEFAULT_CALENDAR,
  SLA_TIERS,
  SLA_TIER_DEF,
  addBusinessDays,
  addBusinessMinutes,
  businessMinutesBetween,
  classifyTier,
  dueDates,
  earliestNeededBy,
  evaluateSla,
  formatBusinessDuration,
  slaPatchForStatusChange,
  startOfMonthBangkok,
  tally,
  type Calendar,
  type SlaSubject,
} from "./sla";

// Bangkok local time. 2026-10-30 is a Friday, so 2026-11-02 is the following Monday.
const at = (local: string) => new Date(`${local}:00+07:00`);
const show = (date: Date) =>
  new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 16).replace("T", " ");

describe("business minutes between", () => {
  it("counts a window inside one working day", () => {
    expect(businessMinutesBetween(at("2026-11-02T09:00"), at("2026-11-02T11:00"))).toBe(120);
  });

  it("skips the lunch break", () => {
    expect(businessMinutesBetween(at("2026-11-02T11:00"), at("2026-11-02T14:00"))).toBe(120);
  });

  it("skips nights and weekends", () => {
    // Fri 16:30 -> 17:30 = 60, Mon 08:30 -> 09:00 = 30
    expect(businessMinutesBetween(at("2026-10-30T16:30"), at("2026-11-02T09:00"))).toBe(90);
  });

  it("counts nothing outside working hours", () => {
    expect(businessMinutesBetween(at("2026-11-02T18:00"), at("2026-11-03T08:00"))).toBe(0);
    expect(businessMinutesBetween(at("2026-10-31T10:00"), at("2026-11-01T16:00"))).toBe(0);
  });

  it("treats a full business day as 8 working hours", () => {
    expect(businessMinutesBetween(at("2026-11-02T08:30"), at("2026-11-03T08:30"))).toBe(BUSINESS_DAY_MINUTES);
  });

  it("returns a negative value when the end is before the start", () => {
    expect(businessMinutesBetween(at("2026-11-02T11:00"), at("2026-11-02T09:00"))).toBe(-120);
  });

  it("skips holidays", () => {
    const cal: Calendar = { ...DEFAULT_CALENDAR, holidays: new Set(["2026-11-03"]) };
    // Mon 16:30 -> 17:30 = 60, Tue is a holiday, Wed 08:30 -> 09:00 = 30
    expect(businessMinutesBetween(at("2026-11-02T16:30"), at("2026-11-04T09:00"), cal)).toBe(90);
  });
});

describe("add business minutes", () => {
  it("moves across the weekend", () => {
    expect(show(addBusinessMinutes(at("2026-10-30T16:30"), 90))).toBe("2026-11-02 09:00");
  });

  it("moves across the lunch break and into the next day", () => {
    // Mon 09:00: 180 min to noon, 270 min until 17:30, 30 more on Tuesday
    expect(show(addBusinessMinutes(at("2026-11-02T09:00"), 480))).toBe("2026-11-03 09:00");
  });

  it("starts counting from the next opening when started outside working hours", () => {
    expect(show(addBusinessMinutes(at("2026-10-31T10:00"), 60))).toBe("2026-11-02 09:30");
  });

  it("returns the start for zero minutes", () => {
    expect(show(addBusinessMinutes(at("2026-11-02T09:00"), 0))).toBe("2026-11-02 09:00");
  });

  it("is the inverse of businessMinutesBetween", () => {
    const start = at("2026-11-02T10:15");
    for (const minutes of [1, 45, 200, 480, 1234, 4800]) {
      const end = addBusinessMinutes(start, minutes);
      expect(Math.round(businessMinutesBetween(start, end))).toBe(minutes);
    }
  });

  it("honours holidays", () => {
    const cal: Calendar = { ...DEFAULT_CALENDAR, holidays: new Set(["2026-11-03"]) };
    expect(show(addBusinessMinutes(at("2026-11-02T17:00"), 60, cal))).toBe("2026-11-04 09:00");
  });
});

describe("add business days", () => {
  it("returns the same date for zero days", () => {
    expect(addBusinessDays("2026-10-30", 0)).toBe("2026-10-30");
  });

  it("skips weekends", () => {
    expect(addBusinessDays("2026-10-30", 1)).toBe("2026-11-02");
    expect(addBusinessDays("2026-10-30", 3)).toBe("2026-11-04");
  });

  it("skips holidays", () => {
    const cal: Calendar = { ...DEFAULT_CALENDAR, holidays: new Set(["2026-11-02"]) };
    expect(addBusinessDays("2026-10-30", 1, cal)).toBe("2026-11-03");
  });

  it("derives the earliest needed-by date from the tier's lead time", () => {
    expect(earliestNeededBy("STANDARD", "2026-10-30")).toBe("2026-10-30");
    expect(earliestNeededBy("HARDWARE", "2026-10-30")).toBe("2026-11-04");
    expect(earliestNeededBy("COMPLEX", "2026-10-30")).toBe("2026-11-06");
  });
});

describe("SLA tiers", () => {
  it("defines sensible targets for every tier", () => {
    for (const tier of SLA_TIERS) {
      const def = SLA_TIER_DEF[tier];
      expect(def.responseMinutes).toBeGreaterThan(0);
      expect(def.fulfillmentMinutes).toBeGreaterThanOrEqual(def.responseMinutes);
    }
  });

  it("gets slower and longer from standard to complex", () => {
    expect(SLA_TIER_DEF.STANDARD.fulfillmentMinutes).toBeLessThan(SLA_TIER_DEF.PROVISIONING.fulfillmentMinutes);
    expect(SLA_TIER_DEF.PROVISIONING.fulfillmentMinutes).toBeLessThan(SLA_TIER_DEF.HARDWARE.fulfillmentMinutes);
    expect(SLA_TIER_DEF.HARDWARE.fulfillmentMinutes).toBeLessThan(SLA_TIER_DEF.COMPLEX.fulfillmentMinutes);
  });

  it("matches the agreed commitments", () => {
    expect(SLA_TIER_DEF.STANDARD).toMatchObject({ responseMinutes: 120, fulfillmentMinutes: 480 });
    expect(SLA_TIER_DEF.PROVISIONING).toMatchObject({ responseMinutes: 240, fulfillmentMinutes: 960 });
    expect(SLA_TIER_DEF.HARDWARE).toMatchObject({ responseMinutes: 480, fulfillmentMinutes: 3360 });
    expect(SLA_TIER_DEF.COMPLEX).toMatchObject({ responseMinutes: 480, fulfillmentMinutes: 4800 });
  });

  it("computes due dates in business time", () => {
    const due = dueDates("STANDARD", at("2026-11-02T09:00"));
    expect(show(due.responseDueAt)).toBe("2026-11-02 11:00");
    expect(show(due.fulfillmentDueAt)).toBe("2026-11-03 09:00");
  });
});

describe("classifyTier", () => {
  it("puts hardware in the procurement tier", () => {
    expect(classifyTier("HARDWARE", { action: "new" })).toBe("HARDWARE");
  });

  it("treats software that must be purchased as procurement", () => {
    expect(classifyTier("SOFTWARE", { licenseType: "need-purchase" })).toBe("HARDWARE");
    expect(classifyTier("SOFTWARE", { licenseType: "licensed", itemType: "program" })).toBe("PROVISIONING");
    expect(classifyTier("SOFTWARE", { licenseType: "free", itemType: "font" })).toBe("STANDARD");
  });

  it("separates quick access changes from provisioning new accounts", () => {
    expect(classifyTier("ACCESS_ACCOUNT", { action: "reset" })).toBe("STANDARD");
    expect(classifyTier("ACCESS_ACCOUNT", { action: "grant", system: "shared-folder" })).toBe("STANDARD");
    expect(classifyTier("ACCESS_ACCOUNT", { action: "grant", system: "erp-crm" })).toBe("PROVISIONING");
    expect(classifyTier("ACCESS_ACCOUNT", { action: "new-account", system: "email" })).toBe("PROVISIONING");
  });

  it("treats moving desks and cloud infrastructure as complex", () => {
    expect(classifyTier("NETWORK_WORKPLACE", { service: "desk-move" })).toBe("COMPLEX");
    expect(classifyTier("NETWORK_WORKPLACE", { service: "lan-cable" })).toBe("PROVISIONING");
    expect(classifyTier("AWS_SERVER", {})).toBe("COMPLEX");
    expect(classifyTier("DATABASE", {})).toBe("COMPLEX");
    expect(classifyTier("CONSULTATION", {})).toBe("STANDARD");
    expect(classifyTier("OTHER", {})).toBe("PROVISIONING");
  });

  it("treats unblocking and removing access as quick, and a role change as provisioning", () => {
    expect(classifyTier("ACCESS_ACCOUNT", { action: "unblock" })).toBe("STANDARD");
    expect(classifyTier("ACCESS_ACCOUNT", { action: "revoke" })).toBe("STANDARD");
    expect(classifyTier("ACCESS_ACCOUNT", { action: "change-role", system: "erp-crm" })).toBe("PROVISIONING");
  });

  it("gives a hotfix the quickest tier and a scheduled deployment planned time", () => {
    expect(classifyTier("DEPLOYMENT", { deployKind: "hotfix" })).toBe("STANDARD");
    expect(classifyTier("DEPLOYMENT", { deployKind: "scheduled" })).toBe("PROVISIONING");
  });

  it("gives a snapshot the quick tier and a restore more time", () => {
    expect(classifyTier("BACKUP_RESTORE", { action: "snapshot" })).toBe("STANDARD");
    expect(classifyTier("BACKUP_RESTORE", { action: "restore" })).toBe("PROVISIONING");
  });

  it("gives creating a cloud resource the longest lead time and deleting one planned time", () => {
    expect(classifyTier("CLOUD_RESOURCE", { action: "create" })).toBe("COMPLEX");
    expect(classifyTier("CLOUD_RESOURCE", { action: "delete" })).toBe("PROVISIONING");
  });

  it("classifies credentials, security reviews, onboarding and offboarding", () => {
    expect(classifyTier("API_CREDENTIAL", {})).toBe("PROVISIONING");
    expect(classifyTier("SECURITY_REVIEW", {})).toBe("COMPLEX");
    // Onboarding hands over a device, so it follows the procurement lead time; removing access must be quick.
    expect(classifyTier("ONBOARDING", {})).toBe("HARDWARE");
    expect(classifyTier("OFFBOARDING", {})).toBe("STANDARD");
  });

  it("gives the AI machines and AI services planned time", () => {
    for (const type of ["SPARK_AI", "GPU_5090", "CLAUDE_AI", "GEMINI_AI", "OTHER_AI"] as const) {
      expect(classifyTier(type, {})).toBe("PROVISIONING");
    }
  });

  it("classifies the other new types", () => {
    expect(classifyTier("DOCUMENT", {})).toBe("STANDARD");
    for (const type of ["DATA_EXTRACT", "DATA_CORRECTION", "BULK_IMPORT", "REPORT_TEMPLATE", "SYSTEM_CONFIG", "FIREWALL", "RESOURCE_UPGRADE"] as const) {
      expect(classifyTier(type, {})).toBe("PROVISIONING");
    }
    // Setting up an environment or planning a training session needs the longest lead time.
    expect(classifyTier("ENVIRONMENT", {})).toBe("COMPLEX");
    expect(classifyTier("TRAINING", {})).toBe("COMPLEX");
  });
});

describe("pausing the clock", () => {
  const createdAt = at("2026-11-02T09:00");
  const base = { tier: "STANDARD" as const, createdAt, pausedAt: null, pausedMinutes: 0, firstResponseAt: null };

  it("starts a pause when entering a pause status", () => {
    const now = at("2026-11-02T10:00");
    expect(slaPatchForStatusChange({ ...base, to: "NEED_INFO", now })).toEqual({ slaPausedAt: now });
  });

  it("changes nothing when moving between two pause statuses", () => {
    const patch = slaPatchForStatusChange({
      ...base,
      pausedAt: at("2026-11-02T10:00"),
      to: "ON_HOLD",
      now: at("2026-11-02T11:00"),
    });
    expect(patch).toEqual({});
  });

  it("changes nothing for ordinary transitions", () => {
    expect(slaPatchForStatusChange({ ...base, to: "IN_REVIEW", now: at("2026-11-02T10:00") })).toEqual({});
  });

  it("pushes the due dates out by the waited business time when resuming", () => {
    // Paused Mon 10:00 -> 15:00: 120 min before lunch + 120 min after = 240 business minutes
    const patch = slaPatchForStatusChange({
      ...base,
      pausedAt: at("2026-11-02T10:00"),
      to: "IN_REVIEW",
      now: at("2026-11-02T15:00"),
    });
    expect(patch.slaPausedAt).toBeNull();
    expect(patch.slaPausedMinutes).toBe(240);
    expect(show(patch.fulfillmentDueAt!)).toBe("2026-11-03 14:00"); // 480 + 240 = 720 business minutes
    expect(show(patch.responseDueAt!)).toBe("2026-11-02 16:00"); // 120 + 240 = 360 business minutes
  });

  it("keeps the response deadline once IT has responded", () => {
    const patch = slaPatchForStatusChange({
      ...base,
      firstResponseAt: at("2026-11-02T09:30"),
      pausedAt: at("2026-11-02T10:00"),
      to: "IN_REVIEW",
      now: at("2026-11-02T15:00"),
    });
    expect(patch).not.toHaveProperty("responseDueAt");
    expect(patch.fulfillmentDueAt).toBeInstanceOf(Date);
  });

  it("accumulates pauses across several waits", () => {
    const patch = slaPatchForStatusChange({
      ...base,
      pausedMinutes: 100,
      pausedAt: at("2026-11-02T10:00"),
      to: "IN_PROGRESS",
      now: at("2026-11-02T11:00"),
    });
    expect(patch.slaPausedMinutes).toBe(160);
  });

  it("ignores time spent waiting outside business hours", () => {
    const patch = slaPatchForStatusChange({
      ...base,
      pausedAt: at("2026-11-02T17:00"),
      to: "IN_REVIEW",
      now: at("2026-11-03T09:00"),
    });
    // 30 min on Monday + 30 min on Tuesday
    expect(patch.slaPausedMinutes).toBe(60);
  });
});

describe("evaluateSla", () => {
  const createdAt = at("2026-11-02T09:00");
  const due = dueDates("STANDARD", createdAt);
  const subject = (over: Partial<SlaSubject> = {}): SlaSubject => ({
    slaTier: "STANDARD",
    status: "IN_REVIEW",
    createdAt,
    firstResponseAt: null,
    responseDueAt: due.responseDueAt,
    fulfillmentDueAt: due.fulfillmentDueAt,
    closedAt: null,
    slaPausedAt: null,
    ...over,
  });

  it("is running with time left", () => {
    const { response, fulfillment } = evaluateSla(subject(), at("2026-11-02T10:00"));
    expect(response.state).toBe("running");
    expect(response.remainingMinutes).toBe(60);
    expect(response.percentUsed).toBeCloseTo(0.5);
    expect(fulfillment.state).toBe("running");
    expect(fulfillment.remainingMinutes).toBe(420);
  });

  it("breaches the response SLA when nobody responds in time", () => {
    const { response } = evaluateSla(subject(), at("2026-11-02T13:30"));
    expect(response.state).toBe("breached");
    expect(response.remainingMinutes).toBeLessThan(0);
  });

  it("is breached once the deadline passed even if no business minute has elapsed since", () => {
    // Fulfillment is due Tue 09:00; checking at Tue 09:00:30 is overdue by wall clock
    const { fulfillment } = evaluateSla(subject(), new Date(at("2026-11-03T09:00").getTime() + 30_000));
    expect(fulfillment.state).toBe("breached");
    // A request due Friday 17:30 is already breached on Saturday
    const friday = dueDates("STANDARD", at("2026-10-30T13:30"));
    const result = evaluateSla(
      subject({ createdAt: at("2026-10-30T13:30"), responseDueAt: friday.responseDueAt, fulfillmentDueAt: friday.fulfillmentDueAt }),
      at("2026-10-31T10:00"),
    );
    expect(result.response.state).toBe("breached");
  });

  it("meets the response SLA when IT responds before the deadline", () => {
    const { response } = evaluateSla(subject({ firstResponseAt: at("2026-11-02T10:30") }), at("2026-11-04T10:00"));
    expect(response.state).toBe("met");
  });

  it("breaches the response SLA when IT responds late", () => {
    const { response } = evaluateSla(subject({ firstResponseAt: at("2026-11-02T14:00") }), at("2026-11-04T10:00"));
    expect(response.state).toBe("breached");
  });

  it("stops the clock while paused", () => {
    const paused = evaluateSla(subject({ status: "NEED_INFO", slaPausedAt: at("2026-11-02T10:00") }), at("2026-11-09T10:00"));
    expect(paused.fulfillment.state).toBe("paused");
    expect(paused.fulfillment.remainingMinutes).toBe(420);
  });

  it("judges a completed request by when it was closed", () => {
    const onTime = evaluateSla(subject({ status: "COMPLETED", closedAt: at("2026-11-03T08:45") }), at("2026-11-10T10:00"));
    expect(onTime.fulfillment.state).toBe("met");
    const late = evaluateSla(subject({ status: "COMPLETED", closedAt: at("2026-11-03T10:00") }), at("2026-11-10T10:00"));
    expect(late.fulfillment.state).toBe("breached");
  });

  it("does not hold rejected or cancelled requests to the fulfillment SLA", () => {
    const rejected = evaluateSla(
      subject({ status: "REJECTED", closedAt: at("2026-11-02T12:00"), firstResponseAt: at("2026-11-02T10:00") }),
      at("2026-11-10T10:00"),
    );
    expect(rejected.fulfillment.state).toBe("not_applicable");
    expect(rejected.response.state).toBe("met");

    const cancelled = evaluateSla(subject({ status: "CANCELLED", closedAt: at("2026-11-02T12:00") }), at("2026-11-10T10:00"));
    expect(cancelled.response.state).toBe("not_applicable");
  });

  it("ignores requests without due dates", () => {
    const { response, fulfillment } = evaluateSla(subject({ responseDueAt: null, fulfillmentDueAt: null }));
    expect(response.state).toBe("not_applicable");
    expect(fulfillment.state).toBe("not_applicable");
  });
});

describe("reporting helpers", () => {
  it("computes a pass rate and ignores clocks that have not been decided", () => {
    expect(tally(["met", "met", "met", "breached", "running", "paused", "not_applicable"])).toEqual({
      met: 3,
      breached: 1,
      rate: 0.75,
    });
  });

  it("has no rate without decided clocks", () => {
    expect(tally(["running", "not_applicable"]).rate).toBeNull();
    expect(tally([]).rate).toBeNull();
  });

  it("finds the start of the month in Bangkok time", () => {
    // 2026-10-31 18:00 UTC is already 1 November in Bangkok
    expect(startOfMonthBangkok(new Date("2026-10-31T18:00:00Z")).toISOString()).toBe("2026-10-31T17:00:00.000Z");
    expect(startOfMonthBangkok(new Date("2026-10-15T05:00:00Z")).toISOString()).toBe("2026-09-30T17:00:00.000Z");
  });

  it("formats business durations in every language", () => {
    expect(formatBusinessDuration(45, "th")).toBe("45 นาที");
    expect(formatBusinessDuration(120, "th")).toBe("2 ชม.ทำการ");
    expect(formatBusinessDuration(150, "th")).toBe("2.5 ชม.ทำการ");
    expect(formatBusinessDuration(480, "th")).toBe("1 วันทำการ");
    expect(formatBusinessDuration(3360, "th")).toBe("7 วันทำการ");
    expect(formatBusinessDuration(-120, "th")).toBe("2 ชม.ทำการ");

    expect(formatBusinessDuration(45, "lo")).toBe("45 ນາທີ");
    expect(formatBusinessDuration(120, "lo")).toBe("2 ຊມ.ເຮັດວຽກ");
    expect(formatBusinessDuration(3360, "lo")).toBe("7 ວັນເຮັດວຽກ");

    expect(formatBusinessDuration(45, "en")).toBe("45 min");
    expect(formatBusinessDuration(120, "en")).toBe("2 business hrs");
    expect(formatBusinessDuration(480, "en")).toBe("1 business day");
    expect(formatBusinessDuration(960, "en")).toBe("2 business days");
  });
});
