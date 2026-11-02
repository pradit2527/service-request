"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { useT } from "@/components/lang-provider";

/**
 * A pop-up window that is part of the address: the page renders it while `?edit=` (or `?new=1`) is set, and
 * closing it navigates to `closeHref`, the same address without that parameter. It is a native <dialog>, so the
 * browser traps the focus and closes it with Esc. Clicking the dark area around it closes it too.
 */
export function Modal({ title, closeHref, children }: { title: string; closeHref: string; children: React.ReactNode }) {
  const t = useT();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!element.open) element.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      if (element.open) element.close();
    };
  }, []);

  const close = () => router.replace(closeHref, { scroll: false });

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Esc: go through the address instead of letting the dialog close by itself.
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-slate-200 bg-white p-0 shadow-lift backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <h2 id={titleId} className="min-w-0 truncate text-base font-semibold text-slate-900">
          {title}
        </h2>
        <button
          type="button"
          onClick={close}
          aria-label={t("ปิด", "ປິດ", "Close")}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto p-5">{children}</div>
    </dialog>
  );
}
