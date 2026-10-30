import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { appUrl } from "@/lib/env";
import { buildAuthorizationUrl, randomToken } from "@/lib/google";
import { OAUTH_COOKIE, OAUTH_MAX_AGE_SECONDS, signOAuthState } from "@/lib/jwt";
import { safeNext } from "@/lib/safe-next";

// Starts the Google sign-in: stores state / nonce / PKCE verifier in a short-lived signed cookie.
export async function GET(request: NextRequest) {
  const loginError = (code: string) => NextResponse.redirect(new URL(`/login?error=${code}`, appUrl()));

  try {
    const state = randomToken();
    const nonce = randomToken();
    const verifier = randomToken(48);
    const next = safeNext(request.nextUrl.searchParams.get("next"));

    const authorizationUrl = buildAuthorizationUrl({ state, nonce, verifier });
    if (!authorizationUrl) return loginError("config");

    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(OAUTH_COOKIE, await signOAuthState({ state, verifier, nonce, next }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: OAUTH_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("Failed to start Google sign-in", error);
    return loginError("config");
  }
}
