import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/jwt";

// Optimistic check only: redirects visitors without a valid session cookie to /login.
// Real authorization happens in the data access layer (src/lib/dal.ts) and in every server action.
export async function proxy(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  const login = new URL("/login", request.url);
  const target = request.nextUrl.pathname + request.nextUrl.search;
  if (target !== "/") login.searchParams.set("next", target);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except the login page, the OAuth endpoints and static assets.
  // public/brand holds the logo, which the login page (and Next's image optimizer, which sends no cookies) must reach.
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico|brand/).*)"],
};
