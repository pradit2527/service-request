import { expect, test } from "@playwright/test";
import { overflowingElements, signIn } from "./helpers";

// No page may be wider than the screen: that is what makes a page unusable on a phone or a tablet.
const SCREENS = [
  { name: "phone", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1280, height: 720 },
] as const;

const PAGES = [
  "/",
  "/requests",
  "/requests/new",
  "/my-tasks",
  "/profile",
  "/kb",
  "/admin/users",
  "/admin/requests",
  "/admin/audit",
  "/reports/requests",
  "/reports/users",
  "/reports/summary?from=2026-01-01&to=2099-12-31",
];

for (const screen of SCREENS) {
  test(`no page scrolls sideways on a ${screen.name} (${screen.width} px)`, async ({ page }) => {
    // Twenty pages, each compiled on its first visit by the development server: well over the default minute on a busy machine.
    test.setTimeout(180_000);
    await page.setViewportSize({ width: screen.width, height: screen.height });
    await signIn(page, "admin");
    for (const path of PAGES) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(await overflowingElements(page), `${path} is wider than a ${screen.width} px screen`).toEqual([]);
    }
  });
}

test("on a phone the menu opens as a drawer and the tables become cards", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await signIn(page, "admin");

  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0);

  await page.goto("/reports/requests");
  await expect(page.locator("table")).toBeHidden();
  await expect(page.locator("ul.lg\\:hidden > li").first()).toBeVisible();
});
