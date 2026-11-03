import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/dal";
import { searchTerms } from "@/lib/people-search";
import { searchPeople } from "@/lib/queries";

// The "actual user" field of the request form looks people up here while someone types.
// It answers only a signed-in user, and gives each person's name and department and nothing more.
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // Someone who still has to replace a temporary password may not look anyone up until they have.
  if (user.mustChangePassword) return NextResponse.json({ error: "password change required" }, { status: 403 });

  const terms = searchTerms(request.nextUrl.searchParams.get("q"));
  const people = terms.length === 0 ? [] : await searchPeople(terms, user.id);
  return NextResponse.json({ people }, { headers: { "Cache-Control": "no-store" } });
}
