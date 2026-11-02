"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";
import { btnDanger, btnSecondary, errorTextClass } from "@/lib/ui";

/**
 * A button that runs a server action on one record, e.g. delete or restore, asking first when `confirmText`
 * is given. `fields` become hidden inputs (the record id). A refusal from the action is shown under the button.
 */
export function ConfirmActionButton({
  action,
  fields,
  label,
  pendingLabel,
  confirmText,
  variant = "danger",
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  label: string;
  pendingLabel: string;
  confirmText?: string;
  variant?: "danger" | "secondary";
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (confirmText && !window.confirm(confirmText)) event.preventDefault();
      }}
      className="space-y-2"
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" disabled={pending} className={variant === "danger" ? btnDanger : btnSecondary}>
        {pending ? pendingLabel : label}
      </button>
      {state?.error && (
        <p role="alert" className={errorTextClass}>
          {state.error}
        </p>
      )}
    </form>
  );
}
