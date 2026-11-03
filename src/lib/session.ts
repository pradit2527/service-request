import "server-only";
import { cookies } from "next/headers";
import { cookieSecure } from "./env";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, signSession } from "./jwt";

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function createSession(userId: string): Promise<void> {
  const token = await signSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
