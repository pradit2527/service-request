import type { Prisma } from "@prisma/client";

// The "actual user" field of the request form looks people up while someone types.

/** How many people the list under the field shows. */
export const MAX_PEOPLE_RESULTS = 8;

const MAX_TERMS = 4;
const MAX_TERM_LENGTH = 40;

/** What was typed, split into words. Each word has to match the person's name or department. */
export function searchTerms(query: string | null | undefined): string[] {
  return (query ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_TERMS)
    .map((term) => term.slice(0, MAX_TERM_LENGTH));
}

/** The text the field gets when a person is chosen: "name · department". */
export function formatPersonLabel(person: { name: string; department: string | null }): string {
  const department = person.department?.trim();
  return department ? `${person.name} · ${department}` : person.name;
}

/** Active people, other than the one searching, whose name or department contains every word. */
export function peopleWhere(terms: string[], searcherId: string): Prisma.UserWhereInput {
  return {
    isActive: true,
    id: { not: searcherId },
    AND: terms.map((term) => ({
      OR: [{ name: { contains: term, mode: "insensitive" } }, { department: { contains: term, mode: "insensitive" } }],
    })),
  };
}
