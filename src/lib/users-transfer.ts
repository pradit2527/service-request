// Moving the list of people from one installation to another (prisma/export-users.ts, prisma/import-users.ts): what goes
// into the file, how a file is read back, and which people an import creates. Pure module, so it is unit-testable.
//
// The file holds only who a person is: email, name, department, phone, role, active or not. Never a password, a Google
// link or a sign-in counter. The people it creates have no password until an administrator or the person sets one.

import { z } from "zod";
import { makeT } from "./i18n";
import { isRole, ROLES, type Role } from "./labels";
import { departmentField, emailField, nameField, phoneField } from "./user-fields";

const t = makeT("en");

const FORMAT = "service-request-users";
const VERSION = 1;

export type TransferUser = {
  email: string;
  name: string;
  department: string | null;
  phone: string | null;
  role: Role;
  isActive: boolean;
};

const userSchema = z.object({
  email: emailField(t),
  name: nameField(t),
  department: departmentField(t).nullish().transform((value) => value || null),
  phone: phoneField(t).nullish().transform((value) => value || null),
  role: z.custom<Role>((value) => isRole(value), { error: `role must be one of ${ROLES.join(", ")}` }),
  isActive: z.boolean({ error: "isActive must be true or false" }),
});

/** The text of a transfer file for these people, sorted by email so two exports of the same people are identical. */
export function buildTransferFile(users: readonly TransferUser[], now: Date): string {
  const people = users
    .map((user) => ({
      email: user.email,
      name: user.name,
      department: user.department,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
    }))
    .sort((a, b) => (a.email < b.email ? -1 : a.email > b.email ? 1 : 0));
  return `${JSON.stringify({ format: FORMAT, version: VERSION, exportedAt: now.toISOString(), users: people }, null, 2)}\n`;
}

export type ParsedTransfer = { ok: true; users: TransferUser[] } | { ok: false; error: string };

/** Reads a transfer file. Stops at the first problem and says whose entry it is. */
export function parseTransferFile(text: string): ParsedTransfer {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "The file is not valid JSON." };
  }

  const wrapper = z.object({ format: z.literal(FORMAT), version: z.literal(VERSION), users: z.array(z.unknown()) }).safeParse(json);
  if (!wrapper.success) {
    return { ok: false, error: `This is not a users file from this app (expected format "${FORMAT}", version ${VERSION}).` };
  }

  const users: TransferUser[] = [];
  const seen = new Set<string>();
  for (const [index, entry] of wrapper.data.users.entries()) {
    const result = userSchema.safeParse(entry);
    if (!result.success) {
      const email = typeof (entry as { email?: unknown } | null)?.email === "string" ? (entry as { email: string }).email : `entry ${index + 1}`;
      const issue = result.error.issues[0];
      const field = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
      return { ok: false, error: `${email}: ${field}${issue.message}` };
    }
    if (seen.has(result.data.email)) return { ok: false, error: `${result.data.email} is listed more than once.` };
    seen.add(result.data.email);
    users.push(result.data);
  }
  return { ok: true, users };
}

/**
 * Who an import creates. A person whose email already has an account is skipped and left exactly as they are, so an
 * import can never demote an administrator, reset a password or reactivate someone who was switched off.
 */
export function planImport(
  users: readonly TransferUser[],
  existingEmails: ReadonlySet<string>,
): { create: TransferUser[]; skip: TransferUser[] } {
  const taken = new Set([...existingEmails].map((email) => email.toLowerCase()));
  const create: TransferUser[] = [];
  const skip: TransferUser[] = [];
  for (const user of users) (taken.has(user.email.toLowerCase()) ? skip : create).push(user);
  return { create, skip };
}
