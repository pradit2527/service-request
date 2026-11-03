// Password hashing with scrypt, which Node ships with, so no extra package is needed.
// A hash is written "scrypt$N$r$p$salt$key" (salt and key in base64url): the settings travel with every hash, so they
// can be raised later and old hashes still check. No database or framework import: unit-testable.

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

type Settings = { N: number; r: number; p: number };

// 32 MiB of memory and about a tenth of a second per check on a normal server.
const SETTINGS: Settings = { N: 32768, r: 8, p: 1 };
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const MAX_MEMORY = 128 * 1024 * 1024;

// What a stored hash may ask for. Anything outside is refused rather than computed, so a damaged row cannot hang a login.
const MIN_N = 2 ** 10;
const MAX_N = 2 ** 17;
const MAX_R = 16;
const MAX_P = 4;
const MIN_SALT_BYTES = 8;
const MIN_KEY_BYTES = 16;

function derive(password: string, salt: Buffer, settings: Settings, keyLength: number): Promise<Buffer> {
  // NFKC, so the same text typed in different but equivalent ways (Thai sara am, accented letters) is one password.
  const normalized = password.normalize("NFKC");
  return new Promise((resolve, reject) => {
    scrypt(normalized, salt, keyLength, { ...settings, maxmem: MAX_MEMORY }, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await derive(password, salt, SETTINGS, KEY_LENGTH);
  return ["scrypt", SETTINGS.N, SETTINGS.r, SETTINGS.p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

function parse(stored: string | null | undefined): { settings: Settings; salt: Buffer; key: Buffer } | null {
  if (!stored) return null;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return null;

  const [N, r, p] = parts.slice(1, 4).map((value) => (/^\d{1,9}$/.test(value) ? Number(value) : NaN));
  const isPowerOfTwo = Number.isInteger(N) && (N & (N - 1)) === 0;
  if (!isPowerOfTwo || N < MIN_N || N > MAX_N) return null;
  if (!Number.isInteger(r) || r < 1 || r > MAX_R) return null;
  if (!Number.isInteger(p) || p < 1 || p > MAX_P) return null;

  const salt = Buffer.from(parts[4], "base64url");
  const key = Buffer.from(parts[5], "base64url");
  if (salt.length < MIN_SALT_BYTES || key.length < MIN_KEY_BYTES) return null;
  return { settings: { N, r, p }, salt, key };
}

/** True when `password` is the one that produced `stored`. Anything that is not a hash from this module gives false. */
export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  const parsed = parse(stored);
  if (!parsed) return false;
  const key = await derive(password, parsed.salt, parsed.settings, parsed.key.length);
  return timingSafeEqual(key, parsed.key);
}
