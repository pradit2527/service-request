import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("home page", () => {
  test("the IT team sees the key figures and the statistics charts", async ({ page }) => {
    await signIn(page, "admin");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome");

    for (const label of ["Awaiting manager approval", "Waiting for IT", "In progress", "Over SLA", "Unassigned"]) {
      await expect(page.getByRole("link", { name: new RegExp(label) }).first()).toBeVisible();
    }

    await expect(page.getByRole("heading", { name: "Requests filed per day" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Requests by type" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Team workload" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "SLA performance this month" })).toBeVisible();

    // The daily chart: 14 columns, a value axis, and a legend for the two stacked colours.
    const chart = page.getByRole("img", { name: /requests filed in the last 14 days/ });
    await expect(chart.locator(".group")).toHaveCount(14);
    await expect(chart.getByText("Closed", { exact: true })).toBeVisible();
    await expect(chart.getByText("Still open", { exact: true })).toBeVisible();
    await expect(chart.getByText("Date filed")).toBeVisible();
  });

  test("the header shows the AIDC TECH wordmark and no shortcut buttons", async ({ page }) => {
    await signIn(page, "admin");
    const header = page.locator("main section").first();
    await expect(header).toContainText("AIDC");
    await expect(header).toContainText("TECH");
    await expect(header.getByRole("link")).toHaveCount(0);
  });

  test("an employee sees the search box and the two service cards", async ({ page }) => {
    await signIn(page, "employee");
    await expect(page.getByRole("search")).toBeVisible();
    await expect(page.getByRole("link", { name: /Submit request/ })).toBeVisible();
    await expect(page.getByText("Coming soon")).toBeVisible();
  });
});
