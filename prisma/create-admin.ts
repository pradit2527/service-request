// Creates an administrator, or resets the password of an existing account and makes it an administrator. This is how
// the first person gets into a new installation: signing in with a password needs an account that already has one.
//
//   npm run admin:create -- --email boss@example.com --name "The Boss"
//
// The password is typed when asked (it is not shown), or read from ADMIN_PASSWORD for this one command when there is
// no terminal. It is never accepted as an option. Only a hash is stored. No change-log entry is written, because there
// is no signed-in person to attribute it to.

import { PrismaClient } from "@prisma/client";
import { databaseLabel, parseAdminArgs } from "../src/lib/admin-bootstrap";
import { makeT } from "../src/lib/i18n";
import { hashPassword } from "../src/lib/password-hash";
import { passwordField } from "../src/lib/user-fields";

try {
  process.loadEnvFile(); // tsx does not read .env by itself
} catch {
  // No .env file: rely on variables already in the environment.
}

/** Reads a line from the terminal without showing it. Ctrl+C cancels. */
function readHidden(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    process.stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let typed = "";
    const finish = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      process.stdout.write("\n");
    };
    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === "\r" || character === "\n") {
          finish();
          resolve(typed);
          return;
        }
        if (character === "\u0003") {
          finish();
          reject(new Error("Cancelled."));
          return;
        }
        typed = character === "\u007f" || character === "\b" ? typed.slice(0, -1) : typed + character;
      }
    };
    stdin.on("data", onData);
  });
}

async function askForPassword(): Promise<string> {
  const fromEnvironment = process.env.ADMIN_PASSWORD;
  if (fromEnvironment) return fromEnvironment;
  if (!process.stdin.isTTY) {
    throw new Error("There is no terminal to ask for the password. Set ADMIN_PASSWORD for this one command instead.");
  }
  const first = await readHidden("Password (at least 8 characters): ");
  const second = await readHidden("Type it again: ");
  if (first !== second) throw new Error("The two passwords are not the same. Nothing was changed.");
  return first;
}

async function main() {
  const args = parseAdminArgs(process.argv.slice(2));
  if (!args.ok) throw new Error(args.error);

  const password = passwordField(makeT("en")).safeParse(await askForPassword());
  if (!password.success) throw new Error(password.error.issues[0].message);

  console.log(`Database: ${databaseLabel(process.env.DATABASE_URL)}`);

  const db = new PrismaClient();
  try {
    const existing = await db.user.findUnique({ where: { email: args.email }, select: { id: true } });
    if (!existing && !args.name) throw new Error(`There is no account for ${args.email} yet, so --name "<full name>" is required.`);

    const data = {
      passwordHash: await hashPassword(password.data),
      role: "ADMIN" as const,
      isActive: true,
      // The person typed this password themselves, so they are not made to change it, unless asked.
      mustChangePassword: args.mustChange,
      // Any session opened before now ends.
      passwordChangedAt: new Date(),
      failedLoginCount: 0,
      lockedUntil: null,
    };
    // Not upsert: its create half insists on a name even when the account exists and will only be updated.
    if (existing) {
      await db.user.update({ where: { id: existing.id }, data: { ...(args.name ? { name: args.name } : {}), ...data } });
    } else {
      await db.user.create({ data: { email: args.email, name: args.name!, ...data } });
    }

    console.log(`${existing ? "Updated" : "Created"} the administrator ${args.email}. Sign in on the login page with this email and the password you typed.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
