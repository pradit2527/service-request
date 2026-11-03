import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { e2eDatabaseUrl } from "./database";

function run(command: string, args: string[], env: NodeJS.ProcessEnv) {
  execFileSync(command, args, { env, stdio: "inherit", shell: process.platform === "win32" });
}

// A fresh database for every run: create it if it is missing, empty it, apply the migrations and add the demo data.
// Everything here happens only after e2eDatabaseUrl() has checked that the address is a throwaway database.
// It runs as the first half of the web server command (see playwright.config.ts), because Playwright starts that
// server before any global setup and the login page needs the database to exist.
async function main() {
  // The playwright config has already run the full check; here DATABASE_URL is this very address, so only .env counts.
  const url = e2eDatabaseUrl({ includeEnvironment: false });
  const env = { ...process.env, DATABASE_URL: url, DIRECT_URL: url };

  run("npx", ["tsx", "prisma/create-db.ts"], env);

  const db = new PrismaClient({ datasourceUrl: url });
  try {
    await db.$executeRawUnsafe("DROP SCHEMA IF EXISTS public CASCADE");
    await db.$executeRawUnsafe("CREATE SCHEMA public");
  } finally {
    await db.$disconnect();
  }

  run("npx", ["prisma", "migrate", "deploy"], env);
  run("npx", ["prisma", "db", "seed"], env);

  // The demo data has a single approving manager, so every seeded request names the same person. The e2e database
  // gets a second one so a test can check that a manager's report stops at their own approvals.
  const extra = new PrismaClient({ datasourceUrl: url });
  try {
    await extra.user.create({
      data: { email: "e2e.manager2@example.test", name: "E2E Second Manager", role: "MANAGER", department: "Testing", phone: "081-000-0099" },
    });
  } finally {
    await extra.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
