// Creates the database named in DATABASE_URL if it does not exist yet. Run with: npm run db:create
// Needs a PostgreSQL role that is allowed to create databases (e.g. "postgres").

import { PrismaClient } from "@prisma/client";

try {
  process.loadEnvFile(); // tsx does not read .env by itself
} catch {
  // No .env file: rely on variables already in the environment.
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");

  const target = new URL(url);
  const name = decodeURIComponent(target.pathname.replace(/^\//, ""));
  if (!/^[A-Za-z0-9_-]+$/.test(name)) throw new Error(`Unsupported database name "${name}"`);

  // Connect to the maintenance database "postgres" with the same credentials.
  const maintenance = new URL(url);
  maintenance.pathname = "/postgres";

  const db = new PrismaClient({ datasourceUrl: maintenance.toString() });
  try {
    const rows = await db.$queryRaw<{ present: boolean }[]>`SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ${name}) AS present`;
    if (rows[0]?.present) {
      console.log(`Database "${name}" already exists`);
    } else {
      await db.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
      console.log(`Database "${name}" created`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
