// Creates the people listed in a file made by prisma/export-users.ts. Only adds: a person whose email already has an
// account is left exactly as they are. The new accounts have no password: sign in through the name picker if it is
// switched on, or have an administrator set a temporary password at /admin/users.
//
//   npm run users:import -- people.json            create the missing people
//   npm run users:import -- people.json --dry-run  only show what would be created

import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { databaseLabel } from "../src/lib/admin-bootstrap";
import { parseTransferFile, planImport } from "../src/lib/users-transfer";

try {
  process.loadEnvFile(); // tsx does not read .env by itself
} catch {
  // No .env file: rely on variables already in the environment.
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const unknown = args.find((arg) => arg.startsWith("--") && arg !== "--dry-run");
  if (unknown) throw new Error(`Unknown option ${unknown}. Usage: npm run users:import -- people.json [--dry-run]`);
  const file = args.find((arg) => !arg.startsWith("--"));
  if (!file) throw new Error("Give the file to read: npm run users:import -- people.json [--dry-run]");

  const parsed = parseTransferFile(readFileSync(file, "utf8"));
  if (!parsed.ok) throw new Error(parsed.error);

  console.log(`Database: ${databaseLabel(process.env.DATABASE_URL)}`);
  const db = new PrismaClient();
  try {
    const existing = await db.user.findMany({ select: { email: true } });
    const plan = planImport(parsed.users, new Set(existing.map((user) => user.email)));

    for (const user of plan.skip) console.log(`  exists  ${user.name} <${user.email}> (left as it is)`);
    for (const user of plan.create) console.log(`  create  ${user.role.padEnd(9)} ${user.name} <${user.email}>`);

    if (dryRun) {
      console.log(`Dry run: ${plan.create.length} would be created, ${plan.skip.length} already exist. Nothing was changed.`);
      return;
    }
    if (plan.create.length > 0) await db.user.createMany({ data: plan.create });
    console.log(`Done: ${plan.create.length} created, ${plan.skip.length} already existed.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
