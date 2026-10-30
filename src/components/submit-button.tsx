"use client";

import { useFormStatus } from "react-dom";
import { useT } from "@/components/lang-provider";
import { btnPrimary } from "@/lib/ui";

// For forms whose action is a plain server action (not useActionState): reads the pending state from the form.
export function SubmitButton({
  children,
  pendingText,
  className = btnPrimary,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (pendingText ?? t("กำลังบันทึก...", "ກຳລັງບັນທຶກ...", "Saving...")) : children}
    </button>
  );
}
