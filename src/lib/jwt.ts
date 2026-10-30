// Signed tokens (HS256) shared by the proxy and server code. No `server-only` here: proxy.ts imports it.

import { SignJWT, jwtVerify } from "jose";
import { sessionSecret } from "./env";

export const SESSION_COOKIE = "sr_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const OAUTH_COOKIE = "sr_oauth";
export const OAUTH_MAX_AGE_SECONDS = 60 * 10; // 10 minutes

export type SessionPayload = { sub: string };
export type OAuthPayload = { state: string; verifier: string; nonce: string; next: string };

async function sign(payload: Record<string, unknown>, maxAgeSeconds: number): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(sessionSecret());
}

async function verify(token: string | undefined): Promise<Record<string, unknown> | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

export function signSession(userId: string): Promise<string> {
  return sign({ sub: userId }, SESSION_MAX_AGE_SECONDS);
}

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  const payload = await verify(token);
  return payload && typeof payload.sub === "string" ? { sub: payload.sub } : null;
}

export function signOAuthState(payload: OAuthPayload): Promise<string> {
  return sign(payload, OAUTH_MAX_AGE_SECONDS);
}

export async function verifyOAuthState(token: string | undefined): Promise<OAuthPayload | null> {
  const p = await verify(token);
  if (
    p &&
    typeof p.state === "string" &&
    typeof p.verifier === "string" &&
    typeof p.nonce === "string" &&
    typeof p.next === "string"
  ) {
    return { state: p.state, verifier: p.verifier, nonce: p.nonce, next: p.next };
  }
  return null;
}
