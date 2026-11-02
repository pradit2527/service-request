import { expect, test, type Page } from "@playwright/test";
import { PEOPLE, fileConsultation, openAs } from "./helpers";

// One request followed through the whole workflow: the employee files it, the manager approves it, the IT team
// does the work, and the employee sees it completed. The steps depend on each other, so they run in order.
test.describe.serial("a request from filing to completion", () => {
  const subject = `E2E consultation ${Date.now()}`;
  let requestPath = "";

  const status = (page: Page, text: string) => page.getByText(text, { exact: true }).first();

  test("an employee files a consultation request", async ({ browser }) => {
    const page = await openAs(browser, "employee");
    requestPath = await fileConsultation(page, subject, PEOPLE.manager);

    await expect(page.getByRole("heading", { name: subject })).toBeVisible();
    await expect(status(page, "Awaiting manager approval")).toBeVisible();
    await page.context().close();
  });

  test("the manager approves it and it joins the IT queue", async ({ browser }) => {
    const page = await openAs(browser, "manager");
    await page.goto(requestPath);
    await expect(page.getByText("Waiting for your approval")).toBeVisible();

    await page.getByRole("button", { name: "Approve" }).click();
    await expect(status(page, "Waiting for IT")).toBeVisible();
    await expect(page.getByText("Waiting for your approval")).toHaveCount(0);
    await page.context().close();
  });

  test("the IT team takes it on and completes it", async ({ browser }) => {
    const page = await openAs(browser, "it");
    await page.goto(requestPath);

    await page.selectOption("#to", "IN_PROGRESS");
    await page.getByRole("button", { name: "Save status" }).click();
    await expect(status(page, "In progress")).toBeVisible();

    await page.selectOption("#to", "COMPLETED");
    await page.getByRole("button", { name: "Save status" }).click();
    await expect(status(page, "Completed")).toBeVisible();
    await page.context().close();
  });

  test("the employee sees the request completed in the list", async ({ browser }) => {
    const page = await openAs(browser, "employee");
    await page.goto("/requests");
    // The list is a table on a wide screen (and a list of cards on a narrow one, hidden here).
    const row = page.getByRole("row", { name: new RegExp(subject) });
    await expect(row).toBeVisible();
    await expect(row).toContainText("Completed");
    await page.context().close();
  });

  test("a request is refused when the required details are missing", async ({ browser }) => {
    const page = await openAs(browser, "employee");
    await page.goto("/requests/new");
    await page.getByRole("combobox", { name: /Type of service/ }).click();
    await page.getByRole("option", { name: /Request a consultation/ }).click();
    await page.getByRole("button", { name: "Submit request" }).click();
    await expect(page).toHaveURL(/\/requests\/new/);
    await expect(page.getByText(/please/i).first()).toBeVisible();
    await page.context().close();
  });
});
