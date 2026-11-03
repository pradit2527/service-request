import { describe, expect, it } from "vitest";
import { makeT } from "./i18n";
import { TEMPORARY_PASSWORD_LENGTH, generateTemporaryPassword } from "./temp-password";
import { passwordField } from "./user-fields";

const t = makeT("en");

describe("generateTemporaryPassword", () => {
  it("makes a password that is long enough for the rules", () => {
    const password = generateTemporaryPassword();
    expect(password).toHaveLength(TEMPORARY_PASSWORD_LENGTH);
    expect(passwordField(t).safeParse(password).success).toBe(true);
  });

  it("uses only letters and digits that cannot be mistaken for each other when read out", () => {
    for (let i = 0; i < 50; i++) expect(generateTemporaryPassword()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789]+$/);
  });

  it("gives a different password every time", () => {
    const seen = new Set(Array.from({ length: 50 }, () => generateTemporaryPassword()));
    expect(seen.size).toBe(50);
  });

  it("reaches every character of the alphabet and none outside it, whatever the random bytes are", () => {
    // Bytes that fall in the uneven tail of 0-255 are thrown away, not wrapped around, so no character is favoured.
    const bytes = Array.from({ length: 256 }, (_, i) => i);
    let next = 0;
    const counting = (buffer: Uint8Array) => {
      for (let i = 0; i < buffer.length; i++) buffer[i] = bytes[next++ % bytes.length];
      return buffer;
    };
    const all = Array.from({ length: 40 }, () => generateTemporaryPassword(TEMPORARY_PASSWORD_LENGTH, counting)).join("");
    expect(new Set(all).size).toBe(57);
  });
});
