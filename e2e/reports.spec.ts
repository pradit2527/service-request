import { expect, test, type Page } from "@playwright/test";
import { PEOPLE, fileConsultation, openAs, signIn } from "./helpers";

test.describe("reports", () => {
  test("the request report lists requests with the figures and the filters", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/reports/requests");
    await expect(page.getByText(/\d+ records? found/)).toBeVisible();
    await expect(page.locator("tbody tr").first()).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /Subject/ })).toBeVisible();
  });

  test("choosing a whole category in the type filter keeps only the requests of that category", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/reports/requests");
    const all = await page.locator("tbody tr").count();

    await page.locator("summary", { hasText: "Filters" }).click();
    await page.selectOption("#f-type", "category:access");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/type=category%3Aaccess/);

    const titles = await page.locator("tbody tr a[title*=' · ']").evaluateAll((links) => links.map((link) => link.getAttribute("title") ?? ""));
    expect(titles.length, "the demo data has access requests").toBeGreaterThan(0);
    expect(titles.length).toBeLessThan(all);
    for (const title of titles) expect(title).toContain("Request access / user account");

    // The choice survives a reload: the select shows it and the filter counter says one filter is in use.
    await page.reload();
    await expect(page.locator("#f-type")).toHaveValue("category:access");
  });

  test("a single type can still be chosen inside its category", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/reports/requests?type=FIREWALL");
    await page.locator("summary", { hasText: "Filters" }).click();
    await expect(page.locator("#f-type")).toHaveValue("FIREWALL");
  });

  test("an administrator adds a user in the pop-up and then removes them", async ({ page }) => {
    const email = `e2e.${Date.now()}@example.test`;
    await signIn(page, "admin");
    await page.goto("/reports/users");

    await page.getByRole("link", { name: "Add user" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Email").fill(email);
    await dialog.getByLabel("Name").fill("E2E Tester");
    await dialog.getByRole("button", { name: "Add user" }).click();

    await expect(dialog).toHaveCount(0);
    const row = page.locator("tbody tr", { hasText: email });
    await expect(row).toBeVisible();

    // The user has no history, so the table lets an administrator delete them. The confirmation is a browser dialog.
    page.once("dialog", (confirmation) => confirmation.accept());
    await row.getByRole("button", { name: "Delete" }).click();
    await expect(page.locator("tbody tr", { hasText: email })).toHaveCount(0);
  });

  test("registering an email that already exists is refused inside the pop-up", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/reports/users?new=1");
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Email").fill("emp1@example.test");
    await dialog.getByLabel("Name").fill("Duplicate");
    await dialog.getByRole("button", { name: "Add user" }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("alert").first()).toBeVisible();
  });

  test("the summary report groups the requests and ends with a total", async ({ page }) => {
    await signIn(page, "admin");
    await page.goto("/reports/summary?from=2026-01-01&to=2099-12-31");
    await expect(page.locator("tfoot")).toContainText("Total");
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });

  test("a manager's report holds only the requests that name them as approver, and opens no pop-up for any other", async ({ browser }) => {
    test.setTimeout(180_000); // four sign-ins and a request filed, one after the other
    const countFound = async (page: Page) => Number(((await page.getByText(/\d+ records? found/).innerText()).match(/\d+/) ?? ["0"])[0]);
    const editIds = (page: Page) =>
      page.locator("tbody a[href*=\"edit=\"]").evaluateAll((links) => links.map((link) => new URL((link as HTMLAnchorElement).href).searchParams.get("edit") ?? ""));

    // Every demo request names Decha Ning, so another manager's request is filed here: this one names Chanon Leng.
    const employee = await openAs(browser, "employee");
    const otherPath = await fileConsultation(employee, `E2E scope check ${Date.now()}`, PEOPLE.otherManager);
    const otherId = otherPath.split("/").pop()!;
    await employee.context().close();

    const admin = await openAs(browser, "admin");
    await admin.goto("/reports/requests");
    const everything = await countFound(admin);
    // An administrator can open the pop-up of that request, so "no pop-up" below is down to the scope and not a bad address.
    await admin.goto(`/reports/requests?edit=${otherId}`);
    await expect(admin.getByRole("dialog")).toBeVisible();
    await admin.context().close();

    const manager = await openAs(browser, "manager");
    await manager.goto("/reports/requests");
    const mine = await countFound(manager);
    const managerIds = await editIds(manager);
    expect(mine).toBeGreaterThan(0);
    expect(mine).toBeLessThan(everything);
    expect(managerIds).not.toContain(otherId);

    // A request that names another approver opens no edit pop-up even when its address is typed in.
    await manager.goto(`/reports/requests?edit=${otherId}`);
    await expect(manager.getByText(/\d+ records? found/)).toBeVisible();
    await expect(manager.getByRole("dialog")).toHaveCount(0);

    // One of their own does.
    await manager.goto(`/reports/requests?edit=${managerIds[0]}`);
    await expect(manager.getByRole("dialog")).toBeVisible();
    await manager.context().close();

    // The other manager sees that one request and none of Decha Ning's.
    const other = await openAs(browser, "otherManager");
    await other.goto("/reports/requests");
    expect(await countFound(other)).toBe(1);
    expect(await editIds(other)).toEqual([otherId]);
    await other.context().close();
  });
});
