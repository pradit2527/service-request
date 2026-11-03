// Writes the active people of this installation to a file, so they can be created on another one (prisma/import-users.ts).
//
//   npm run users:export -- people.json
//
// The file holds names, emails, departments, phones and roles: no passwords, no Google links. It is personal data, so
// keep it out of git and delete it once it has been imported.

import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { databaseLabel } from "../src/lib/admin-bootstrap";
import { buildTransferFile } from "../src/lib/users-transfer";

try {
  process.loadEnvFile(); // tsx does not read .env by itself
} catch {
  // No .env file: rely on variables already in the environment.
}

async function main() {
  const file = process.argv[2];
  if (!file || file.startsWith("--")) throw new Error("Give the file to write: npm run users:export -- people.json");

  console.log(`Database: ${databaseLabel(process.env.DATABASE_URL)}`);
  const db = new PrismaClient();
  try {
    const users = await db.user.findMany({
      where: { isActive: true },
      select: { email: true, name: true, department: true, phone: true, role: true, isActive: true },
    });
    writeFileSync(file, buildTransferFile(users, new Date()), "utf8");

    console.log(`Wrote ${users.length} people to ${file}:`);
    for (const user of users) console.log(`  ${user.role.padEnd(9)} ${user.name} <${user.email}>`);
    console.log("The file has names and emails and no passwords. Keep it out of git and delete it after the import.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
