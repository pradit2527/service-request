import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { BASE_URL } from "./constants";

// The demo users from prisma/seed.ts, by the name the development sign-in lists them under.
export const PEOPLE = {
  admin: "ອາທິດ ຜູ້ດູແລລະບົບ",
  it: "ສົມສີ ທີມ IT",
  manager: "Decha Ning",
  // A manager in the e2e database only (see e2e/prepare-database.ts); no seeded request names them as approver.
  otherManager: "Chanon Leng",
  employee: "ວິພາ ພັດທະນາ",
} as const;
export type Person = keyof typeof PEOPLE;

/** The tests read the English texts of the app, so every browser context starts with the English language chosen. */
export async function chooseEnglish(context: BrowserContext) {
  await context.addCookies([{ name: "lang", value: "en", url: BASE_URL }]);
}

/** Signs in through the development sign-in on the login page. */
export async function signIn(page: Page, who: Person) {
  await chooseEnglish(page.context());
  await page.goto("/login");
  const value = await page.locator("#userId option", { hasText: PEOPLE[who] }).first().getAttribute("value");
  expect(value, `the demo user ${who} is listed on the login page`).toBeTruthy();
  await page.selectOption("#userId", value!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/** A page of its own (its own cookies) signed in as somebody else, for a test that follows one request through several people. */
export async function openAs(browser: Browser, who: Person): Promise<Page> {
  const context = await browser.newContext({ baseURL: BASE_URL, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await signIn(page, who);
  return page;
}

/**
 * Files a consultation request as the person the page is signed in as, naming `approver` as the approving manager,
 * and returns the address of the new request (/requests/<id>).
 */
export async function fileConsultation(page: Page, subject: string, approver: string): Promise<string> {
  await page.goto("/requests/new");
  await page.getByRole("combobox", { name: /Type of service/ }).click();
  await page.getByRole("option", { name: /Request a consultation/ }).click();
  await expect(page.locator("#title")).toBeVisible();

  await page.selectOption("#d_topic", "system-usage");
  await page.selectOption("#d_channel", "message");
  await page.fill("#title", subject);
  await page.fill("#description", "E2E test: we need advice on setting up the shared folder for the new team.");
  await page.fill("#neededBy", new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

  const choice = page.locator("select#approverId");
  const value = await choice.locator("option", { hasText: approver }).first().getAttribute("value");
  expect(value, `${approver} is offered as the approving manager`).toBeTruthy();
  await choice.selectOption(value!);

  await page.getByRole("button", { name: "Submit request" }).click();
  await page.waitForURL((url) => /^\/requests\/(?!new)[A-Za-z0-9]+$/.test(url.pathname));
  return new URL(page.url()).pathname;
}

/**
 * What makes the page scroll sideways, which on a phone means something is wider than the screen: an empty list when
 * nothing does, otherwise a description of the first few elements that reach past the right edge.
 */
export function overflowingElements(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth <= width + 1) return [];
    const found: string[] = [];
    for (const element of document.querySelectorAll("body *")) {
      const box = element.getBoundingClientRect();
      if (box.width === 0 || box.right <= width + 1 || getComputedStyle(element).position === "fixed") continue;
      found.push(`<${element.tagName.toLowerCase()} class="${String(element.className).slice(0, 70)}"> reaches ${Math.round(box.right)} px on a ${width} px screen`);
      if (found.length === 6) break;
    }
    return found.length > 0 ? found : ["the page scrolls sideways but no single element reaches past the screen"];
  });
}
