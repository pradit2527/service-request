import "server-only";
import { db } from "./db";
import { profileNameOnSignIn, signInAccess, type SignInAccess } from "./admin-rules";
import { adminEmails, itStaffEmails } from "./env";
import type { GoogleProfile } from "./google";

export type SignInResult = { ok: true; userId: string } | { ok: false; reason: Exclude<SignInAccess, "ok"> };

/**
 * Finds or creates the user for a verified Google profile.
 * - New users are EMPLOYEE, unless their email is listed in ADMIN_EMAILS / IT_STAFF_EMAILS.
 * - ADMIN_EMAILS always keeps ADMIN (promote only; demotion is done in /admin/users after removing the email).
 * - A registered user signs in from any email domain; an unregistered one is created only when `domainAllowed` (see isAllowedAccount).
 * - A deactivated user cannot sign in, and an email already bound to a different Google account is refused.
 * - The Google name is stored the first time only (also for a user an administrator registered in advance);
 *   after that the display name belongs to the administrators. The picture follows Google at every sign-in.
 */
export async function signInGoogleUser(profile: GoogleProfile, options: { domainAllowed: boolean }): Promise<SignInResult> {
  const email = profile.email;
  const isAdminEmail = adminEmails().includes(email);

  const existing = await db.user.findUnique({ where: { email } });
  const access = signInAccess({ domainAllowed: options.domainAllowed, existing, sub: profile.sub });
  if (access !== "ok") return { ok: false, reason: access };

  const initialRole = isAdminEmail ? "ADMIN" : itStaffEmails().includes(email) ? "IT_STAFF" : "EMPLOYEE";

  const user = await db.user.upsert({
    where: { email },
    create: {
      email,
      googleSub: profile.sub,
      name: profile.name,
      image: profile.picture,
      role: initialRole,
      lastLoginAt: new Date(),
    },
    update: {
      googleSub: profile.sub,
      name: profileNameOnSignIn(existing, profile.name),
      image: profile.picture,
      lastLoginAt: new Date(),
      ...(isAdminEmail ? { role: "ADMIN" as const } : {}),
    },
    select: { id: true },
  });
  return { ok: true, userId: user.id };
}
