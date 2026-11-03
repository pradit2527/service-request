// What the "create the first administrator" command (prisma/create-admin.ts) needs that has nothing to do with the
// database: reading its options and describing where it is about to write. Pure module, so it is unit-testable.

import { makeT } from "./i18n";
import { emailField, nameField } from "./user-fields";

const t = makeT("en");

export type AdminArgs =
  | { ok: true; email: string; name: string | undefined; mustChange: boolean }
  | { ok: false; error: string };

/**
 * Reads `--email <address>`, `--name <name>` and `--must-change` (also `--option=value`). A password is never taken
 * from the command line, where it would stay in the shell history and be visible in the process list: the command
 * asks for it, or reads ADMIN_PASSWORD from the environment.
 */
export function parseAdminArgs(argv: readonly string[]): AdminArgs {
  let email: string | undefined;
  let name: string | undefined;
  let mustChange = false;

  for (let i = 0; i < argv.length; i++) {
    const equals = argv[i].indexOf("=");
    const flag = equals === -1 ? argv[i] : argv[i].slice(0, equals);
    const inline = equals === -1 ? undefined : argv[i].slice(equals + 1);
    const value = () => inline ?? argv[++i];

    switch (flag) {
      case "--email":
        email = value();
        break;
      case "--name":
        name = value();
        break;
      case "--must-change":
        mustChange = true;
        break;
      case "--password":
        return {
          ok: false,
          error: "A password cannot be given on the command line. Run the command without it and type the password when asked, or set ADMIN_PASSWORD for this one command.",
        };
      default:
        return { ok: false, error: `Unknown option ${flag}. Options: --email <address> [--name <name>] [--must-change]` };
    }
  }

  if (email === undefined || email === "") return { ok: false, error: "--email <address> is required." };
  const parsedEmail = emailField(t).safeParse(email);
  if (!parsedEmail.success) return { ok: false, error: `That does not look like an email address: ${email}` };

  let parsedName: string | undefined;
  if (name !== undefined) {
    const result = nameField(t).safeParse(name);
    if (!result.success) return { ok: false, error: result.error.issues[0].message };
    parsedName = result.data;
  }

  return { ok: true, email: parsedEmail.data, name: parsedName, mustChange };
}

/** Which database an address points at, for showing before anything is written: its name and host, never the password. */
export function databaseLabel(url: string | undefined): string {
  if (!url) return "(DATABASE_URL is not set)";
  try {
    const address = new URL(url);
    return `"${decodeURIComponent(address.pathname.replace(/^\//, ""))}" on ${address.host}`;
  } catch {
    return "(DATABASE_URL is not a valid address)";
  }
}
