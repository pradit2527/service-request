/** The first message for each field of a failed zod parse, keyed by field name. */
export function firstIssuePerField(error: { issues: { path: PropertyKey[]; message: string }[] }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/** Result returned by server actions used with useActionState. */
export type ActionState =
  | {
      ok?: boolean;
      error?: string;
      fieldErrors?: Record<string, string>;
    }
  | undefined;
