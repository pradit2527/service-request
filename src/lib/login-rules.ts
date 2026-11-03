// Rules for signing in with a password that need no database access, so they can be unit-tested.

/** Wrong passwords allowed in a row before the account is locked for a while. */
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 10;

/** The counters to store after one more wrong password. The last allowed mistake locks the account and starts the count again. */
export function afterFailedLogin(failedLoginCount: number, now: Date): { failedLoginCount: number; lockedUntil: Date | null } {
  const count = failedLoginCount + 1;
  if (count < MAX_FAILED_LOGINS) return { failedLoginCount: count, lockedUntil: null };
  return { failedLoginCount: 0, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000) };
}

export function isLocked(lockedUntil: Date | null, now: Date): boolean {
  return lockedUntil !== null && lockedUntil.getTime() > now.getTime();
}

/** Whole minutes to wait, rounded up, and at least one. */
export function lockMinutesLeft(lockedUntil: Date, now: Date): number {
  return Math.max(1, Math.ceil((lockedUntil.getTime() - now.getTime()) / 60_000));
}

/**
 * A session opened before the password was last set or changed is no longer valid, so changing a password signs the
 * account out everywhere else. `issuedAt` is the token's "iat" in whole seconds; the session opened by the change
 * itself carries the same second and stays valid.
 */
export function sessionPredatesPasswordChange(issuedAt: number | undefined, passwordChangedAt: Date | null): boolean {
  if (passwordChangedAt === null) return false;
  if (issuedAt === undefined) return true;
  return issuedAt < Math.floor(passwordChangedAt.getTime() / 1000);
}
