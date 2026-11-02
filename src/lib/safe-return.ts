// Where a form may send the person after saving. Pure module.

const MAX_LENGTH = 2000;
// "/reports" and "/admin" themselves, or anything below them (a path segment or a query string).
const ALLOWED = /^\/(?:reports|admin)(?:[/?].*)?$/;

/**
 * Returns `value` only if it is a path inside the reports or the system management pages, otherwise
 * `fallback`. Used for the hidden "returnTo" field of the edit forms, so it cannot become an open redirect.
 */
export function safeReturn(value: string | null | undefined, fallback: string): string {
  if (!value || value.length > MAX_LENGTH) return fallback;
  if (!ALLOWED.test(value)) return fallback;
  // "//host" and "/\host" are treated as protocol-relative URLs by browsers; ".." climbs out of the area.
  if (value.startsWith("//") || value.includes("\\") || value.includes("..")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  return value;
}
