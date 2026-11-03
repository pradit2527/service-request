// Data access layer: the single place that turns a session cookie into a trusted user.
// The user is re-read from the database on every request, so deactivation and role changes apply immediately.

import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { SESSION_COOKIE, verifySessionToken } from "./jwt";
import type { Role } from "./labels";
import { sessionPredatesPasswordChange } from "./login-rules";
import { canEditKb, canManageSystem, isStaff } from "./permissions";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: Role;
  department: string | null;
  phone: string | null;
  /** An administrator gave this person a temporary password: they must choose their own before using anything else. */
  mustChangePassword: boolean;
  /** The managers who are away and have named this person to approve in their place right now (see permissions.ts). */
  actingFor: string[];
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) return null;

  const row = await db.user.findUnique({
    where: { id: session.sub, isActive: true },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      department: true,
      phone: true,
      mustChangePassword: true,
      passwordChangedAt: true,
    },
  });
  // Changing a password ends every session opened before it.
  if (!row || sessionPredatesPasswordChange(session.iat, row.passwordChangedAt)) return null;

  // Only a manager can approve, so only a manager can stand in for another. Read on every request like the role is,
  // so a stand-in begins and ends on the dot.
  const now = new Date();
  const standingIn =
    row.role === "MANAGER"
      ? await db.approvalDelegation.findMany({
          where: { delegateId: row.id, revokedAt: null, startsAt: { lte: now }, endsAt: { gt: now }, manager: { isActive: true } },
          select: { managerId: true },
        })
      : [];

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    image: row.image,
    role: row.role,
    department: row.department,
    phone: row.phone,
    mustChangePassword: row.mustChangePassword,
    actingFor: standingIn.map((delegation) => delegation.managerId),
  };
});

/**
 * A signed-in user, even one who still has to choose a password. Only the profile page, where that is done, and the
 * actions on it use this; everything else goes through requireUser().
 */
export async function requireSignedInUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** A signed-in user who owes nothing: someone with a temporary password is sent to the profile page to replace it. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await requireSignedInUser();
  if (user.mustChangePassword) redirect("/profile");
  return user;
}

export async function requireStaff(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!isStaff(user)) redirect("/");
  return user;
}

/** Administrators and managers: the people who use the system management menu. */
export async function requireSystemManager(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!canManageSystem(user)) redirect("/");
  return user;
}

/** Who may write knowledge base articles: IT staff, administrators and managers. */
export async function requireKbEditor(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!canEditKb(user)) redirect("/");
  return user;
}
