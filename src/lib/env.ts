// Environment access. Values are read lazily (inside functions) so `next build` works without secrets.

function csv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function allowedEmailDomains(): string[] {
  return csv(process.env.ALLOWED_EMAIL_DOMAINS);
}

export function adminEmails(): string[] {
  return csv(process.env.ADMIN_EMAILS);
}

export function itStaffEmails(): string[] {
  return csv(process.env.IT_STAFF_EMAILS);
}

export function devLoginEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_LOGIN === "true";
}

export function googleCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function sessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to a random string of at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

/** True when `email` belongs to one of the allowed company domains. */
export function isAllowedEmail(email: string): boolean {
  const domain = email.toLowerCase().split("@")[1];
  return !!domain && allowedEmailDomains().includes(domain);
}

/**
 * Whether an administrator may register `email` ahead of the person's first sign-in. It follows the sign-in
 * rule (company domains only); without a domain list it is open only while developing with dev login.
 */
export function registrationEmailAllowed(email: string): boolean {
  if (allowedEmailDomains().length === 0) return devLoginEnabled();
  return isAllowedEmail(email);
}
