import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAllowedEmail, appUrl } from "@/lib/env";
import { completeSignIn } from "@/lib/google";
import { OAUTH_COOKIE, SESSION_COOKIE, signSession, verifyOAuthState } from "@/lib/jwt";
import { sessionCookieOptions } from "@/lib/session";
import { signInGoogleUser } from "@/lib/users";

export async function GET(request: NextRequest) {
  const redirectTo = (path: string) => {
    const response = NextResponse.redirect(new URL(path, appUrl()));
    response.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth" });
    return response;
  };
  const fail = (code: string) => redirectTo(`/login?error=${code}`);

  const params = request.nextUrl.searchParams;
  if (params.get("error")) return fail("denied");

  const code = params.get("code");
  const state = params.get("state");
  const saved = await verifyOAuthState(request.cookies.get(OAUTH_COOKIE)?.value);
  if (!code || !state || !saved || saved.state !== state) return fail("state");

  let profile;
  try {
    profile = await completeSignIn({ code, verifier: saved.verifier, nonce: saved.nonce });
  } catch (error) {
    console.error("Google sign-in failed", error);
    return fail("google");
  }

  if (!isAllowedEmail(profile.email)) return fail("domain");

  const result = await signInGoogleUser(profile);
  if (!result.ok) return fail(result.reason);

  const response = redirectTo(saved.next);
  response.cookies.set(SESSION_COOKIE, await signSession(result.userId), sessionCookieOptions());
  return response;
}
