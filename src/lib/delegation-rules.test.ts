import { describe, expect, it } from "vitest";
import { LANGS } from "./i18n";
import {
  DELEGATION_PROBLEM_LABEL,
  MAX_DELEGATION_DAYS,
  delegationProblem,
  delegationWindowFromDates,
  isDelegationActive,
  isDelegationLive,
  type DelegationWindow,
} from "./delegation-rules";

const at = (iso: string) => new Date(iso);
const now = at("2026-11-10T10:00:00+07:00");
const manager = { id: "m1", role: "MANAGER" as const, isActive: true };
const window = (from: string, to: string, revokedAt: Date | null = null): DelegationWindow => ({ startsAt: at(from), endsAt: at(to), revokedAt });

describe("delegationWindowFromDates", () => {
  it("runs from the start of the first day to the end of the last day, Bangkok time", () => {
    expect(delegationWindowFromDates("2026-11-12", "2026-11-14")).toEqual({
      startsAt: at("2026-11-12T00:00:00+07:00"),
      endsAt: at("2026-11-15T00:00:00+07:00"),
    });
  });

  it("allows a single day", () => {
    const w = delegationWindowFromDates("2026-11-12", "2026-11-12");
    expect(w!.endsAt.getTime() - w!.startsAt.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("refuses anything that is not a real date written year-month-day", () => {
    expect(delegationWindowFromDates("", "2026-11-14")).toBeNull();
    expect(delegationWindowFromDates("12/11/2026", "2026-11-14")).toBeNull();
    expect(delegationWindowFromDates("2026-02-30", "2026-03-02")).toBeNull();
    expect(delegationWindowFromDates("2026-11-12", "soon")).toBeNull();
  });
});

describe("isDelegationActive and isDelegationLive", () => {
  const w = window("2026-11-12T00:00:00+07:00", "2026-11-15T00:00:00+07:00");

  it("is active from the first moment until the period ends, and not before or after", () => {
    expect(isDelegationActive(w, at("2026-11-11T23:59:00+07:00"))).toBe(false);
    expect(isDelegationActive(w, at("2026-11-12T00:00:00+07:00"))).toBe(true);
    expect(isDelegationActive(w, at("2026-11-14T23:59:00+07:00"))).toBe(true);
    expect(isDelegationActive(w, at("2026-11-15T00:00:00+07:00"))).toBe(false);
  });

  it("stops at once when it is ended by hand", () => {
    expect(isDelegationActive({ ...w, revokedAt: at("2026-11-13T09:00:00+07:00") }, at("2026-11-13T10:00:00+07:00"))).toBe(false);
  });

  it("is 'live' while it is running or still to come, so the list can show it and a new one cannot overlap it", () => {
    expect(isDelegationLive(w, at("2026-11-01T00:00:00+07:00"))).toBe(true);
    expect(isDelegationLive(w, at("2026-11-13T00:00:00+07:00"))).toBe(true);
    expect(isDelegationLive(w, at("2026-11-15T00:00:00+07:00"))).toBe(false);
    expect(isDelegationLive({ ...w, revokedAt: now }, at("2026-11-01T00:00:00+07:00"))).toBe(false);
  });
});

describe("delegationProblem", () => {
  const start = at("2026-11-12T00:00:00+07:00");
  const end = at("2026-11-15T00:00:00+07:00");
  const ok = { managerId: "m1", delegate: { id: "m2", role: "MANAGER" as const, isActive: true }, startsAt: start, endsAt: end, now, existing: [] as DelegationWindow[] };

  it("accepts another active manager for a period that has not ended", () => {
    expect(delegationProblem(ok)).toBeNull();
    expect(delegationProblem({ ...ok, startsAt: at("2026-11-09T00:00:00+07:00") })).toBeNull(); // already under way
  });

  it("needs a delegate, who is somebody else", () => {
    expect(delegationProblem({ ...ok, delegate: null })).toBe("no-delegate");
    expect(delegationProblem({ ...ok, delegate: manager })).toBe("self");
  });

  it("allows only an active manager, because only managers can approve", () => {
    expect(delegationProblem({ ...ok, delegate: { id: "m2", role: "IT_STAFF", isActive: true } })).toBe("not-manager");
    expect(delegationProblem({ ...ok, delegate: { id: "m2", role: "ADMIN", isActive: true } })).toBe("not-manager");
    expect(delegationProblem({ ...ok, delegate: { id: "m2", role: "EMPLOYEE", isActive: true } })).toBe("not-manager");
    expect(delegationProblem({ ...ok, delegate: { id: "m2", role: "MANAGER", isActive: false } })).toBe("inactive");
  });

  it("refuses a period that ends before it starts, is already over, or is longer than the limit", () => {
    expect(delegationProblem({ ...ok, endsAt: start })).toBe("bad-dates");
    expect(delegationProblem({ ...ok, endsAt: at("2026-11-12T00:00:00+07:00"), startsAt: end })).toBe("bad-dates");
    expect(delegationProblem({ ...ok, startsAt: at("2026-11-01T00:00:00+07:00"), endsAt: at("2026-11-05T00:00:00+07:00") })).toBe("in-the-past");
    const tooLong = new Date(start.getTime() + (MAX_DELEGATION_DAYS + 1) * 24 * 60 * 60 * 1000);
    expect(delegationProblem({ ...ok, endsAt: tooLong })).toBe("too-long");
    expect(MAX_DELEGATION_DAYS).toBe(90);
  });

  it("refuses a period that overlaps one the manager already has, but not one that is over or ended by hand", () => {
    const busy = window("2026-11-14T00:00:00+07:00", "2026-11-20T00:00:00+07:00");
    expect(delegationProblem({ ...ok, existing: [busy] })).toBe("overlap");
    expect(delegationProblem({ ...ok, existing: [window("2026-11-15T00:00:00+07:00", "2026-11-20T00:00:00+07:00")] })).toBeNull(); // starts the moment this one ends
    expect(delegationProblem({ ...ok, existing: [{ ...busy, revokedAt: now }] })).toBeNull();
    expect(delegationProblem({ ...ok, existing: [window("2026-10-01T00:00:00+07:00", "2026-11-01T00:00:00+07:00")] })).toBeNull();
  });
});

describe("DELEGATION_PROBLEM_LABEL", () => {
  it("has a message in every language for every problem", () => {
    for (const label of Object.values(DELEGATION_PROBLEM_LABEL)) for (const lang of LANGS) expect(label[lang].trim()).not.toBe("");
  });
});
