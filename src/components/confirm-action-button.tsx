"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";
import { btnDanger, btnSecondary, btnTiny, errorTextClass } from "@/lib/ui";

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
  compact = false,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  label: string;
  pendingLabel: string;
  confirmText?: string;
  variant?: "danger" | "secondary";
  /** A small button, for a table row. */
  compact?: boolean;
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
      <button type="submit" disabled={pending} className={`${variant === "danger" ? btnDanger : btnSecondary} ${compact ? btnTiny : ""}`}>
        {pending ? pendingLabel : label}
      </button>
      {state?.error && (
        // In a table row the cell never wraps, so the message gets a narrow box of its own instead of one long line.
        <p role="alert" className={`${errorTextClass} ${compact ? "w-56 text-left whitespace-normal!" : ""}`}>
          {state.error}
        </p>
      )}
    </form>
  );
}
