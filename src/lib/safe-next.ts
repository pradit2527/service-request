/**
 * Returns `value` only if it is a same-origin relative path, otherwise "/".
 * Prevents open redirects through the `next` parameter after login.
 */
export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/")) return "/";
  // "//host" and "/\host" are treated as protocol-relative URLs by browsers.
  if (value.startsWith("//") || value.startsWith("/\\")) return "/";
  if (/[\r\n]/.test(value)) return "/";
  return value;
}
