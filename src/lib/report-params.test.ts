import { describe, expect, it } from "vitest";
import type { Viewer } from "./permissions";
import {
  bangkokDateString,
  buildReportHref,
  dayRangeBangkok,
  parseRequestReportParams,
  parseSummaryParams,
  parseUserReportParams,
  requestReportQuery,
  requestReportScope,
  summaryPresets,
  typeFilterValue,
  userReportQuery,
} from "./report-params";

const admin: Viewer = { id: "u-admin", role: "ADMIN" };
const manager: Viewer = { id: "u-mgr", role: "MANAGER" };
const employee: Viewer = { id: "u-emp", role: "EMPLOYEE" };
const staff: Viewer = { id: "u-it", role: "IT_STAFF" };

describe("parseRequestReportParams", () => {
  it("starts from the newest request, on page one, with no filter", () => {
    expect(parseRequestReportParams({}, admin)).toEqual({ q: "", slaBreached: false, sort: "createdAt", dir: "desc", page: 1 });
  });

  it("drops every value outside its whitelist instead of failing", () => {
    const parsed = parseRequestReportParams(
      {
        status: "ZZZ",
        type: "NOPE",
        priority: "X",
        sort: "password",
        dir: "sideways",
        page: "-5",
        from: "2026-13-40",
        to: "abc",
        result: "maybe",
        deleted: "all",
        assignee: "a b;drop",
        edit: "x/y",
        sla: "yes",
      },
      admin,
    );
    expect(parsed).toEqual({ q: "", slaBreached: false, sort: "createdAt", dir: "desc", page: 1 });
  });

  it("reads the page as a whole number of at least one", () => {
    expect(parseRequestReportParams({ page: "abc" }, admin).page).toBe(1);
    expect(parseRequestReportParams({ page: "0" }, admin).page).toBe(1);
    expect(parseRequestReportParams({ page: "1e9" }, admin).page).toBe(1);
    expect(parseRequestReportParams({ page: "3" }, admin).page).toBe(3);
  });

  it("trims the search text and cuts it at 100 characters", () => {
    expect(parseRequestReportParams({ q: `  ${"a".repeat(150)}  ` }, admin).q).toBe("a".repeat(100));
    expect(parseRequestReportParams({ q: "  SR-2026  " }, admin).q).toBe("SR-2026");
  });

  it("accepts the open filter and current statuses, but not a status of the old workflow", () => {
    expect(parseRequestReportParams({ status: "OPEN" }, admin).status).toBe("OPEN");
    expect(parseRequestReportParams({ status: "COMPLETED" }, admin).status).toBe("COMPLETED");
    expect(parseRequestReportParams({ status: "APPROVED" }, admin).status).toBeUndefined();
  });

  it("picks the sort direction from the column unless one is given", () => {
    expect(parseRequestReportParams({ sort: "requestNo" }, admin).dir).toBe("asc");
    expect(parseRequestReportParams({ sort: "createdAt" }, admin).dir).toBe("desc");
    expect(parseRequestReportParams({ sort: "title", dir: "desc" }, admin).dir).toBe("desc");
    expect(parseRequestReportParams({ sort: "createdAt", dir: "asc" }, admin).dir).toBe("asc");
  });

  it("lets only an administrator filter by approver", () => {
    expect(parseRequestReportParams({ approver: "u-other" }, admin).approver).toBe("u-other");
    expect(parseRequestReportParams({ approver: "u-other" }, manager).approver).toBeUndefined();
  });

  it("swaps a date range that was given the wrong way round", () => {
    const parsed = parseRequestReportParams({ from: "2026-11-05", to: "2026-11-01" }, admin);
    expect(parsed.from).toBe("2026-11-01");
    expect(parsed.to).toBe("2026-11-05");
  });

  it("reads the filters, the ids and the popup", () => {
    const parsed = parseRequestReportParams(
      {
        type: "FIREWALL",
        priority: "HIGH",
        result: "approved",
        deleted: "only",
        assignee: "unassigned",
        edit: "cmabc-123_X",
        sla: "breached",
      },
      admin,
    );
    expect(parsed).toMatchObject({
      type: "FIREWALL",
      priority: "HIGH",
      result: "approved",
      deleted: "only",
      assignee: "unassigned",
      edit: "cmabc-123_X",
      slaBreached: true,
    });
  });
});

describe("the type filter", () => {
  it("takes a single type", () => {
    expect(parseRequestReportParams({ type: "CLOUD_RESOURCE" }, admin)).toMatchObject({ type: "CLOUD_RESOURCE" });
  });

  it("takes a whole category by its heading", () => {
    const parsed = parseRequestReportParams({ type: "category:cloud" }, admin);
    expect(parsed.category).toBe("cloud");
    expect(parsed.type).toBeUndefined();
  });

  it("drops a category that does not exist, and a type written like one", () => {
    const parsed = parseRequestReportParams({ type: "category:nope" }, admin);
    expect(parsed.category).toBeUndefined();
    expect(parsed.type).toBeUndefined();
    expect(parseRequestReportParams({ type: "category:FIREWALL" }, admin).category).toBeUndefined();
  });

  it("writes the choice back the way the form sends it", () => {
    expect(typeFilterValue(parseRequestReportParams({ type: "category:ai" }, admin))).toBe("category:ai");
    expect(typeFilterValue(parseRequestReportParams({ type: "FIREWALL" }, admin))).toBe("FIREWALL");
    expect(typeFilterValue(parseRequestReportParams({}, admin))).toBeUndefined();
    expect(buildReportHref("/reports/requests", requestReportQuery(parseRequestReportParams({ type: "category:ai" }, admin)))).toBe(
      "/reports/requests?type=category%3Aai",
    );
  });
});

// Next.js hands a key that is repeated in the address (?q=a&q=b) to the page as an array.
describe("a repeated parameter", () => {
  it("is read by its first value in the request report instead of failing", () => {
    const parsed = parseRequestReportParams({ q: ["  a ", "b"], status: ["COMPLETED", "OPEN"], sort: ["title", "status"], page: ["2", "3"] }, admin);
    expect(parsed).toMatchObject({ q: "a", status: "COMPLETED", sort: "title", page: 2 });
  });

  it("is read by its first value in the user and summary reports", () => {
    expect(parseUserReportParams({ q: ["x", "y"], role: ["MANAGER", "ADMIN"], new: ["1", "0"] })).toMatchObject({ q: "x", role: "MANAGER", adding: true });
    expect(parseSummaryParams({ group: ["month", "type"], from: ["2026-01-01", "2026-02-01"] }, new Date("2026-11-15T05:00:00Z"))).toMatchObject({
      group: "month",
      from: "2026-01-01",
    });
  });

  it("is dropped when it is an empty list", () => {
    expect(parseRequestReportParams({ q: [], sort: [] }, admin)).toEqual({ q: "", slaBreached: false, sort: "createdAt", dir: "desc", page: 1 });
  });
});

// The links on the page (Edit, Add, the pop-up's way back) are built from these, so they must not lose the page.
describe("requestReportQuery and userReportQuery", () => {
  it("keep the page, the filters and a changed sort, and leave out the defaults", () => {
    const params = parseRequestReportParams({ q: "vpn", status: "OPEN", page: "3", sort: "title", dir: "desc" }, admin);
    expect(buildReportHref("/reports/requests", requestReportQuery(params))).toBe("/reports/requests?q=vpn&status=OPEN&sort=title&dir=desc&page=3");
    expect(buildReportHref("/reports/requests", requestReportQuery(parseRequestReportParams({}, admin)))).toBe("/reports/requests");
  });

  it("keep the page of the user report", () => {
    const params = parseUserReportParams({ role: "MANAGER", page: "2" });
    expect(buildReportHref("/reports/users", userReportQuery(params))).toBe("/reports/users?role=MANAGER&page=2");
    expect(buildReportHref("/reports/users", userReportQuery(parseUserReportParams({})))).toBe("/reports/users");
  });

  it("do not carry the pop-up itself", () => {
    expect(buildReportHref("/reports/requests", requestReportQuery(parseRequestReportParams({ edit: "abc123" }, admin)))).toBe("/reports/requests");
    expect(buildReportHref("/reports/users", userReportQuery(parseUserReportParams({ new: "1", edit: "abc123" })))).toBe("/reports/users");
  });
});

describe("requestReportScope", () => {
  it("shows an administrator everything and a manager only the requests that name them as approver", () => {
    expect(requestReportScope(admin)).toEqual({ kind: "all" });
    expect(requestReportScope(manager)).toEqual({ kind: "approver", approverId: "u-mgr" });
  });

  it("gives nobody else a report", () => {
    expect(requestReportScope(employee)).toBeNull();
    expect(requestReportScope(staff)).toBeNull();
  });
});

describe("Bangkok dates", () => {
  it("names the day in Bangkok, not in UTC", () => {
    expect(bangkokDateString(new Date("2026-11-01T17:30:00Z"))).toBe("2026-11-02");
    expect(bangkokDateString(new Date("2026-11-01T16:30:00Z"))).toBe("2026-11-01");
  });

  it("turns a range of days into the instants it covers, both end days included", () => {
    const range = dayRangeBangkok("2026-11-02", "2026-11-03");
    expect(range.gte?.toISOString()).toBe("2026-11-01T17:00:00.000Z");
    expect(range.lte?.toISOString()).toBe("2026-11-03T16:59:59.999Z");
    expect(dayRangeBangkok()).toEqual({});
    expect(dayRangeBangkok("2026-11-02").lte).toBeUndefined();
  });
});

describe("buildReportHref", () => {
  it("leaves out empty values and page one", () => {
    expect(buildReportHref("/reports/requests", { q: "a b", page: 1, sort: undefined, status: "OPEN", edit: null, sla: false })).toBe(
      "/reports/requests?q=a+b&status=OPEN",
    );
  });

  it("keeps a later page, and a bare path when nothing is set", () => {
    expect(buildReportHref("/reports/requests", { page: 2 })).toBe("/reports/requests?page=2");
    expect(buildReportHref("/reports/requests", { q: "", page: 1 })).toBe("/reports/requests");
  });

  it("writes a true flag as 1", () => {
    expect(buildReportHref("/reports/users", { new: true })).toBe("/reports/users?new=1");
  });
});

describe("parseUserReportParams", () => {
  it("starts alphabetical, on page one", () => {
    expect(parseUserReportParams({})).toEqual({ q: "", sort: "name", dir: "asc", page: 1, adding: false });
  });

  it("reads the filters and the add popup, and drops what it does not know", () => {
    expect(parseUserReportParams({ new: "1", role: "MANAGER", status: "active", login: "never", sort: "hack" })).toMatchObject({
      adding: true,
      role: "MANAGER",
      status: "active",
      login: "never",
      sort: "name",
      dir: "asc",
      page: 1,
    });
    expect(parseUserReportParams({ role: "BOSS", status: "gone", login: "often" })).toEqual({
      q: "",
      sort: "name",
      dir: "asc",
      page: 1,
      adding: false,
    });
  });
});

describe("parseSummaryParams", () => {
  const now = new Date("2026-11-15T05:00:00Z");

  it("starts with this month, grouped by type, biggest group first", () => {
    expect(parseSummaryParams({}, now)).toEqual({ from: "2026-11-01", to: "2026-11-15", group: "type", sort: "total", dir: "desc" });
  });

  it("falls back for an unknown group, sort or direction", () => {
    const parsed = parseSummaryParams({ group: "x", sort: "x", dir: "x", from: "nope" }, now);
    expect(parsed).toMatchObject({ group: "type", sort: "total", dir: "desc", from: "2026-11-01" });
  });

  it("reads a valid range, group and sort", () => {
    expect(parseSummaryParams({ from: "2026-01-01", to: "2026-03-31", group: "month", sort: "avgApprovalHours", dir: "asc" }, now)).toEqual({
      from: "2026-01-01",
      to: "2026-03-31",
      group: "month",
      sort: "avgApprovalHours",
      dir: "asc",
    });
  });
});

describe("summaryPresets", () => {
  it("covers this month, last month, the last three months and this year", () => {
    expect(summaryPresets(new Date("2026-11-15T05:00:00Z"))).toEqual([
      { key: "thisMonth", from: "2026-11-01", to: "2026-11-15" },
      { key: "lastMonth", from: "2026-10-01", to: "2026-10-31" },
      { key: "last3Months", from: "2026-09-01", to: "2026-11-15" },
      { key: "thisYear", from: "2026-01-01", to: "2026-11-15" },
    ]);
  });

  it("looks back across New Year", () => {
    const presets = summaryPresets(new Date("2027-01-10T05:00:00Z"));
    expect(presets.find((p) => p.key === "lastMonth")).toEqual({ key: "lastMonth", from: "2026-12-01", to: "2026-12-31" });
    expect(presets.find((p) => p.key === "last3Months")?.from).toBe("2026-11-01");
  });
});
