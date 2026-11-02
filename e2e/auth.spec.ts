import { expect, test } from "@playwright/test";
import { signIn, chooseEnglish } from "./helpers";

test.describe("sign-in", () => {
  test("the login page offers Google and the development sign-in", async ({ page }) => {
    await chooseEnglish(page.context());
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in", level: 2 })).toBeVisible();
    await expect(page.getByText("Use your Google account (Gmail or company email)")).toBeVisible();
    await expect(page.locator("#userId")).toBeVisible();
  });

  test("a signed-out visitor is sent to the login page", async ({ page }) => {
    await page.goto("/requests");
    await expect(page).toHaveURL(/\/login/);
  });

  const menus = [
    { who: "admin", sees: ["Overview", "All requests", "My tasks", "System management", "Reports"], notSees: ["Approvals"] },
    { who: "it", sees: ["Overview", "All requests", "My tasks"], notSees: ["System management", "Reports"] },
    { who: "manager", sees: ["Overview", "My requests", "Approvals", "System management", "Reports"], notSees: ["My tasks"] },
    { who: "employee", sees: ["Overview", "My requests"], notSees: ["System management", "Reports", "Approvals", "My tasks"] },
  ] as const;

  for (const { who, sees, notSees } of menus) {
    test(`${who} signs in and gets the menu that suits the role`, async ({ page }) => {
      await signIn(page, who);
      await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome");
      const menu = page.getByRole("navigation", { name: "Main menu" });
      for (const name of sees) await expect(menu.getByRole("link", { name })).toBeVisible();
      for (const name of notSees) await expect(menu.getByRole("link", { name })).toHaveCount(0);
    });
  }

  test("signing out ends the session", async ({ page }) => {
    await signIn(page, "employee");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/requests");
    await expect(page).toHaveURL(/\/login/);
  });

  test("an employee cannot open reports or system management", async ({ page }) => {
    await signIn(page, "employee");
    for (const path of ["/reports/requests", "/reports/users", "/reports/summary", "/admin/users", "/admin/requests"]) {
      await page.goto(path);
      await expect(page, `${path} sends an employee home`).toHaveURL(/\/$/);
    }
  });

  test("a manager gets the request and summary reports but not the user report", async ({ page }) => {
    await signIn(page, "manager");
    await page.goto("/reports/users");
    await expect(page).toHaveURL(/\/reports\/requests$/);
    const tabs = page.getByRole("navigation", { name: "Report sections" });
    await expect(tabs.getByRole("link", { name: "Requests" })).toBeVisible();
    await expect(tabs.getByRole("link", { name: "Summary" })).toBeVisible();
    await expect(tabs.getByRole("link", { name: "Users" })).toHaveCount(0);
  });
});

test.describe("language", () => {
  test("the language switch changes the page and is remembered", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "ไทย", exact: true }).click();
    await expect(page.getByRole("heading", { name: "เข้าสู่ระบบ", level: 2 })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "th");

    await page.reload();
    await expect(page.getByRole("heading", { name: "เข้าสู่ระบบ", level: 2 })).toBeVisible();

    await page.getByRole("button", { name: "ENG", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Sign in", level: 2 })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.getByRole("button", { name: "ລາວ", exact: true }).click();
    await expect(page.getByRole("heading", { name: "ເຂົ້າສູ່ລະບົບ", level: 2 })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "lo");
  });
});
