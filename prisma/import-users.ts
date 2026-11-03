// Creates the people listed in a file made by prisma/export-users.ts. Only adds: a person whose email already has an
// account is left exactly as they are. The new accounts have no password: sign in through the name picker if it is
// switched on, or have an administrator set a temporary password at /admin/users.
//
// A file edited by hand may give a new person a "temporaryPassword" (at least 8 characters). Only its hash is stored,
// and the person must choose their own password at the first sign-in. It is never applied to an account that already
// exists, and it is never printed. Delete such a file once it has been imported.
//
//   npm run users:import -- people.json            create the missing people
//   npm run users:import -- people.json --dry-run  only show what would be created

import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { databaseLabel } from "../src/lib/admin-bootstrap";
import { hashPassword } from "../src/lib/password-hash";
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

    for (const user of plan.skip) {
      const ignored = user.temporaryPassword ? ", the password in the file was not used" : "";
      console.log(`  exists  ${user.name} <${user.email}> (left as it is${ignored})`);
    }
    for (const user of plan.create) {
      console.log(`  create  ${user.role.padEnd(9)} ${user.name} <${user.email}>${user.temporaryPassword ? " (temporary password, must change it at first sign-in)" : ""}`);
    }

    if (dryRun) {
      console.log(`Dry run: ${plan.create.length} would be created, ${plan.skip.length} already exist. Nothing was changed.`);
      return;
    }
    if (plan.create.length > 0) {
      const now = new Date();
      const data = await Promise.all(
        plan.create.map(async ({ temporaryPassword, ...person }) =>
          temporaryPassword
            ? { ...person, passwordHash: await hashPassword(temporaryPassword), mustChangePassword: true, passwordChangedAt: now }
            : person,
        ),
      );
      await db.user.createMany({ data });
    }
    console.log(`Done: ${plan.create.length} created, ${plan.skip.length} already existed.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
