/** Result returned by server actions used with useActionState. */
export type ActionState =
  | {
      ok?: boolean;
      error?: string;
      fieldErrors?: Record<string, string>;
    }
  | undefined;
