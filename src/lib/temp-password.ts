// A random temporary password for an administrator to hand to someone. Runs in the browser and in Node.
// The alphabet leaves out 0 O 1 l I, which are easily mixed up when a password is read out or copied by eye.

export const TEMPORARY_PASSWORD_LENGTH = 12;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function randomBytesFromCrypto(buffer: Uint8Array): Uint8Array {
  return globalThis.crypto.getRandomValues(buffer);
}

export function generateTemporaryPassword(
  length: number = TEMPORARY_PASSWORD_LENGTH,
  fill: (buffer: Uint8Array) => Uint8Array = randomBytesFromCrypto,
): string {
  // A byte is used only when it falls in the largest block of 0-255 that the alphabet divides evenly,
  // so no character is more likely than another.
  const usable = 256 - (256 % ALPHABET.length);
  let out = "";
  while (out.length < length) {
    for (const byte of fill(new Uint8Array(length * 2))) {
      if (byte < usable && out.length < length) out += ALPHABET[byte % ALPHABET.length];
    }
  }
  return out;
}
