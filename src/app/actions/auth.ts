"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { db } from "@/lib/db";
import { devLoginEnabled } from "@/lib/env";
import { getI18n } from "@/lib/i18n-server";
import { lockedMessage } from "@/lib/login-messages";
import { afterFailedLogin, isLocked, lockMinutesLeft } from "@/lib/login-rules";
import { hashPassword, verifyPassword } from "@/lib/password-hash";
import { safeNext } from "@/lib/safe-next";
import { createSession, deleteSession } from "@/lib/session";

export async function logout() {
  await deleteSession();
  redirect("/login");
}

// A hash of a password nobody knows. Checking a password against it takes as long as a real check, so the answer
// is no faster for an email that is not registered (or has no password) than for one that is.
let unknownUserHash: Promise<string> | undefined;
function hashOfNothing(): Promise<string> {
  unknownUserHash ??= hashPassword(randomBytes(16).toString("hex"));
  return unknownUserHash;
}

/** Sign in with an email and a password. Every kind of failure gets the same answer, except a lock after too many. */
export async function passwordLogin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const wrong = { error: t("อีเมลหรือรหัสผ่านไม่ถูกต้อง", "ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ", "Incorrect email or password") };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (email === "" || password === "") return wrong;

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, isActive: true, passwordHash: true, mustChangePassword: true, failedLoginCount: true, lockedUntil: true },
  });

  const now = new Date();
  if (user?.isActive && user.passwordHash && user.lockedUntil && isLocked(user.lockedUntil, now)) {
    return { error: lockedMessage(t, lockMinutesLeft(user.lockedUntil, now)) };
  }

  const canSignIn = Boolean(user?.isActive && user.passwordHash);
  const matches = await verifyPassword(password, canSignIn ? user!.passwordHash : await hashOfNothing());

  if (!user || !canSignIn || !matches) {
    if (user && canSignIn) {
      await db.user.update({ where: { id: user.id }, data: afterFailedLogin(user.failedLoginCount, now) });
    }
    return wrong;
  }

  await db.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: now } });
  await createSession(user.id);
  // Someone with a temporary password goes straight to the page where they replace it.
  redirect(user.mustChangePassword ? "/profile" : safeNext(String(formData.get("next") ?? "")));
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
