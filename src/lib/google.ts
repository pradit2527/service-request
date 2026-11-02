// Google Workspace sign-in (OpenID Connect, authorization-code flow with PKCE).
// The ID token signature, issuer, audience and nonce are all verified against Google's published keys.

import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { appUrl, googleCredentials } from "./env";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";

export type GoogleProfile = {
  sub: string;
  email: string;
  name: string;
  picture: string | null;
  /** The Google Workspace domain of the account (`hd`); null for a personal Gmail account. */
  hostedDomain: string | null;
};

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function buildAuthorizationUrl(params: { state: string; nonce: string; verifier: string }): string | null {
  const creds = googleCredentials();
  if (!creds) return null;

  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set("client_id", creds.clientId);
  url.searchParams.set("redirect_uri", `${appUrl()}${GOOGLE_CALLBACK_PATH}`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", params.state);
  url.searchParams.set("nonce", params.nonce);
  url.searchParams.set("code_challenge", pkceChallenge(params.verifier));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

/** Exchanges the authorization code and returns the verified user profile. Throws on any failure. */
export async function completeSignIn(params: { code: string; verifier: string; nonce: string }): Promise<GoogleProfile> {
  const creds = googleCredentials();
  if (!creds) throw new Error("Google OAuth is not configured");

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: params.code,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      redirect_uri: `${appUrl()}${GOOGLE_CALLBACK_PATH}`,
      grant_type: "authorization_code",
      code_verifier: params.verifier,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google token exchange failed (${response.status})`);

  const body = (await response.json()) as { id_token?: string };
  if (!body.id_token) throw new Error("Google did not return an ID token");

  const { payload } = await jwtVerify(body.id_token, JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: creds.clientId,
  });

  if (payload.nonce !== params.nonce) throw new Error("ID token nonce mismatch");
  if (payload.email_verified !== true) throw new Error("Email address is not verified");
  if (typeof payload.sub !== "string" || typeof payload.email !== "string") throw new Error("ID token is missing claims");

  // Google Workspace accounts carry the hosted domain (`hd`). Whether it is allowed is decided by the caller (isAllowedAccount),
  // because a registered user may sign in from any domain.
  const hostedDomain = typeof payload.hd === "string" ? payload.hd.toLowerCase() : null;

  const email = payload.email.toLowerCase();
  return {
    sub: payload.sub,
    email,
    name: typeof payload.name === "string" && payload.name ? payload.name : email,
    picture: typeof payload.picture === "string" ? payload.picture : null,
    hostedDomain,
  };
}
