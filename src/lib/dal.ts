// Data access layer: the single place that turns a session cookie into a trusted user.
// The user is re-read from the database on every request, so deactivation and role changes apply immediately.

import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { SESSION_COOKIE, verifySessionToken } from "./jwt";
import type { Role } from "./labels";
import { isAdmin, isStaff } from "./permissions";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: Role;
  department: string | null;
  phone: string | null;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) return null;

  return db.user.findUnique({
    where: { id: session.sub, isActive: true },
    select: { id: true, email: true, name: true, image: true, role: true, department: true, phone: true },
  });
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireStaff(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!isStaff(user)) redirect("/");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/");
  return user;
}
