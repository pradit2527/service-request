"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { devLoginEnabled } from "@/lib/env";
import { createSession, deleteSession } from "@/lib/session";

export async function logout() {
  await deleteSession();
  redirect("/login");
}

// Local development only: sign in as one of the seeded users without Google.
export async function devLogin(formData: FormData) {
  if (!devLoginEnabled()) redirect("/login");

  const userId = String(formData.get("userId") ?? "");
  const user = await db.user.findUnique({ where: { id: userId, isActive: true }, select: { id: true } });
  if (!user) redirect("/login?error=inactive");

  await createSession(user.id);
  redirect("/");
}
