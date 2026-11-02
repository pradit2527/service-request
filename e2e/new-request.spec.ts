import { expect, test } from "@playwright/test";
import { PEOPLE, signIn } from "./helpers";

// Whoever is signed in is the requester: the new-request form has no choice of "file this request for", and no page
// sends an administrator or manager there to file a request in somebody else's name.
test.describe("who files a request", () => {
  for (const who of ["admin", "manager", "employee"] as const) {
    test(`${who} files as themselves, with no choice of another requester`, async ({ page }) => {
      await signIn(page, who);
      await page.goto("/requests/new?type=CLAUDE_AI");

      await expect(page.locator("section", { hasText: "Requester details" }).first()).toContainText(PEOPLE[who]);
      await expect(page.locator("#requesterId")).toHaveCount(0);
      await expect(page.getByText("File this request for")).toHaveCount(0);
    });
  }

  test("no page offers to file a request for someone else", async ({ page }) => {
    await signIn(page, "admin");

    await page.goto("/admin/requests");
    await expect(page.getByText(/\d+ requests? found/)).toBeVisible();
    await expect(page.getByRole("link", { name: "File a request for someone" })).toHaveCount(0);

    await page.goto("/reports/requests");
    await expect(page.getByText(/\d+ records? found/)).toBeVisible();
    await expect(page.getByRole("link", { name: /Add a request/ })).toHaveCount(0);
  });
});
