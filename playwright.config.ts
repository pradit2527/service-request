import { defineConfig } from "@playwright/test";
import { BASE_URL, PORT } from "./e2e/constants";
import { e2eDatabaseUrl } from "./e2e/database";

// End-to-end tests: a real browser (the Chrome that is installed, so there is nothing to download) against the real app,
// running on its own server (port 3100, its own build folder) and a throwaway database that is wiped on every run.
// Set E2E_DATABASE_URL to that database; the run refuses to start with anything that looks like the app's own.
const databaseUrl = e2eDatabaseUrl();

export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts/,
  // The tests share one database and some of them change it, so they run one after another.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `npx tsx e2e/prepare-database.ts && npx next dev -p ${PORT}`,
    url: `${BASE_URL}/login`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: databaseUrl,
      DIRECT_URL: databaseUrl,
      NEXT_DIST_DIR: ".next-e2e",
      ENABLE_DEV_LOGIN: "true",
      ALLOWED_EMAIL_DOMAINS: "example.test",
      APP_URL: BASE_URL,
    },
  },
});
