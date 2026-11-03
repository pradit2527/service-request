import { describe, expect, it } from "vitest";
import { LOCK_MINUTES, MAX_FAILED_LOGINS, afterFailedLogin, isLocked, lockMinutesLeft, sessionPredatesPasswordChange } from "./login-rules";

const now = new Date("2026-11-07T10:00:00.000Z");
const minutes = (n: number) => new Date(now.getTime() + n * 60_000);

describe("afterFailedLogin", () => {
  it("counts a wrong password and leaves the account open until the limit is reached", () => {
    expect(afterFailedLogin(0, now)).toEqual({ failedLoginCount: 1, lockedUntil: null });
    expect(afterFailedLogin(MAX_FAILED_LOGINS - 2, now)).toEqual({ failedLoginCount: MAX_FAILED_LOGINS - 1, lockedUntil: null });
  });

  it("locks the account for a while on the last allowed mistake and starts counting afresh", () => {
    expect(afterFailedLogin(MAX_FAILED_LOGINS - 1, now)).toEqual({ failedLoginCount: 0, lockedUntil: minutes(LOCK_MINUTES) });
  });

  it("allows five mistakes for ten minutes", () => {
    expect(MAX_FAILED_LOGINS).toBe(5);
    expect(LOCK_MINUTES).toBe(10);
  });
});

describe("isLocked and lockMinutesLeft", () => {
  it("is locked until the moment the lock ends", () => {
    expect(isLocked(minutes(3), now)).toBe(true);
    expect(isLocked(minutes(0), now)).toBe(false);
    expect(isLocked(minutes(-1), now)).toBe(false);
    expect(isLocked(null, now)).toBe(false);
  });

  it("tells the person how long to wait, rounded up to whole minutes and never less than one", () => {
    expect(lockMinutesLeft(minutes(10), now)).toBe(10);
    expect(lockMinutesLeft(new Date(now.getTime() + 90_000), now)).toBe(2);
    expect(lockMinutesLeft(new Date(now.getTime() + 1_000), now)).toBe(1);
  });
});

describe("sessionPredatesPasswordChange", () => {
  const changedAt = new Date("2026-11-07T10:00:30.500Z");
  const seconds = (date: Date) => Math.floor(date.getTime() / 1000);

  it("ends a session that was opened before the password changed", () => {
    expect(sessionPredatesPasswordChange(seconds(changedAt) - 60, changedAt)).toBe(true);
    expect(sessionPredatesPasswordChange(seconds(changedAt) - 1, changedAt)).toBe(true);
  });

  it("keeps the session that was opened at the moment of the change (the person who changed it stays signed in)", () => {
    expect(sessionPredatesPasswordChange(seconds(changedAt), changedAt)).toBe(false);
    expect(sessionPredatesPasswordChange(seconds(changedAt) + 5, changedAt)).toBe(false);
  });

  it("keeps every session of someone whose password never changed", () => {
    expect(sessionPredatesPasswordChange(1, null)).toBe(false);
  });

  it("ends a session that carries no issue time once a password has been set", () => {
    expect(sessionPredatesPasswordChange(undefined, changedAt)).toBe(true);
    expect(sessionPredatesPasswordChange(undefined, null)).toBe(false);
  });
});
