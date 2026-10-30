import "server-only";
import { db } from "./db";
import { adminEmails, itStaffEmails } from "./env";
import type { GoogleProfile } from "./google";

export type SignInResult = { ok: true; userId: string } | { ok: false; reason: "inactive" | "conflict" };

/**
 * Finds or creates the user for a verified Google profile.
 * - New users are EMPLOYEE, unless their email is listed in ADMIN_EMAILS / IT_STAFF_EMAILS.
 * - ADMIN_EMAILS always keeps ADMIN (promote only; demotion is done in /admin/users after removing the email).
 * - A deactivated user cannot sign in, and an email already bound to a different Google account is refused.
 */
export async function signInGoogleUser(profile: GoogleProfile): Promise<SignInResult> {
  const email = profile.email;
  const isAdminEmail = adminEmails().includes(email);

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    if (!existing.isActive) return { ok: false, reason: "inactive" };
    if (existing.googleSub && existing.googleSub !== profile.sub) return { ok: false, reason: "conflict" };
  }

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
      name: profile.name,
      image: profile.picture,
      lastLoginAt: new Date(),
      ...(isAdminEmail ? { role: "ADMIN" as const } : {}),
    },
    select: { id: true },
  });
  return { ok: true, userId: user.id };
}
