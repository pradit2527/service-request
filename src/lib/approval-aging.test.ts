import { describe, expect, it } from "vitest";
import { makeT } from "./i18n";
import { LATE_AFTER_DAYS, OVERDUE_AFTER_DAYS, approvalWait, approverWaitingSince, waitText } from "./approval-aging";

const at = (iso: string) => new Date(iso);

describe("approvalWait", () => {
  it("counts whole working days, so a request is not 'late' just because a weekend passed", () => {
    // Friday 17:00 to Monday 09:00 Bangkok time: half an hour on each side of the weekend.
    expect(approvalWait(at("2026-11-06T17:00:00+07:00"), at("2026-11-09T09:00:00+07:00"))).toEqual({ businessDays: 0, level: "fresh" });
  });

  it("is fresh within the first working day", () => {
    expect(approvalWait(at("2026-11-02T09:00:00+07:00"), at("2026-11-02T16:00:00+07:00"))).toEqual({ businessDays: 0, level: "fresh" });
  });

  it("turns late after two working days", () => {
    expect(LATE_AFTER_DAYS).toBe(2);
    expect(approvalWait(at("2026-11-02T09:00:00+07:00"), at("2026-11-03T16:00:00+07:00")).level).toBe("fresh");
    expect(approvalWait(at("2026-11-02T08:30:00+07:00"), at("2026-11-04T08:30:00+07:00"))).toEqual({ businessDays: 2, level: "late" });
  });

  it("turns overdue after five working days", () => {
    expect(OVERDUE_AFTER_DAYS).toBe(5);
    // Monday morning to Thursday evening is four working days; to Friday evening it is five.
    expect(approvalWait(at("2026-11-02T08:30:00+07:00"), at("2026-11-05T17:30:00+07:00")).level).toBe("late");
    expect(approvalWait(at("2026-11-02T08:30:00+07:00"), at("2026-11-09T08:30:00+07:00"))).toEqual({ businessDays: 5, level: "overdue" });
  });

  it("does not count a public holiday", () => {
    const holiday = { utcOffsetMinutes: 420, workdays: [1, 2, 3, 4, 5], windows: [["08:30", "12:00"], ["13:00", "17:30"]] as const, holidays: new Set(["2026-11-03"]) };
    expect(approvalWait(at("2026-11-02T08:30:00+07:00"), at("2026-11-04T08:30:00+07:00"), holiday).businessDays).toBe(1);
  });

  it("never goes below zero if the clock is slightly behind", () => {
    expect(approvalWait(at("2026-11-02T10:00:00+07:00"), at("2026-11-02T09:00:00+07:00")).businessDays).toBe(0);
  });
});

describe("approverWaitingSince", () => {
  const createdAt = at("2026-11-02T09:00:00+07:00");

  it("is the day the request was filed when nobody has asked the requester anything", () => {
    expect(approverWaitingSince({ createdAt, infoRequestedAt: null, infoAnsweredAt: null })).toEqual(createdAt);
  });

  it("is nothing while the approver is waiting for the requester: that wait is not the approver's", () => {
    expect(approverWaitingSince({ createdAt, infoRequestedAt: at("2026-11-03T10:00:00+07:00"), infoAnsweredAt: null })).toBeNull();
  });

  it("starts again from the moment the requester answered", () => {
    const answered = at("2026-11-05T11:00:00+07:00");
    expect(approverWaitingSince({ createdAt, infoRequestedAt: null, infoAnsweredAt: answered })).toEqual(answered);
  });

  it("is nothing again if the approver asked a second time", () => {
    expect(
      approverWaitingSince({ createdAt, infoRequestedAt: at("2026-11-06T09:00:00+07:00"), infoAnsweredAt: at("2026-11-05T11:00:00+07:00") }),
    ).toBeNull();
  });
});

describe("waitText", () => {
  const en = makeT("en");

  it("says how long in working days", () => {
    expect(waitText({ businessDays: 0, level: "fresh" }, en)).toBe("Waiting less than 1 working day");
    expect(waitText({ businessDays: 1, level: "fresh" }, en)).toBe("Waiting 1 working day");
    expect(waitText({ businessDays: 6, level: "overdue" }, en)).toBe("Waiting 6 working days");
  });

  it("is written in all three languages", () => {
    for (const lang of ["lo", "th"] as const) expect(waitText({ businessDays: 3, level: "late" }, makeT(lang))).toContain("3");
  });
});
