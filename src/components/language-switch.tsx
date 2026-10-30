"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { setLanguage } from "@/app/actions/lang";
import { LANGS, LANG_LABEL, type Lang } from "@/lib/i18n";
import { useLang, useT } from "./lang-provider";

const STYLE = {
  dark: {
    box: "bg-white/10 ring-1 ring-white/10 text-slate-400",
    active: "bg-white text-slate-900 shadow-sm",
    idle: "text-slate-300 hover:text-white",
  },
  light: {
    box: "bg-slate-100 ring-1 ring-slate-200 text-slate-500",
    active: "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200",
    idle: "text-slate-600 hover:text-slate-900",
  },
} as const;

// Lao / Thai switch. The choice is stored in a cookie and the page is re-rendered in that language.
export function LanguageSwitch({ variant = "dark", className = "" }: { variant?: keyof typeof STYLE; className?: string }) {
  const lang = useLang();
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const style = STYLE[variant];

  const choose = (next: Lang) => {
    if (next === lang) return;
    startTransition(async () => {
      await setLanguage(next);
      router.refresh();
    });
  };

  return (
    <div
      role="group"
      aria-label={t("ภาษา", "ພາສາ", "Language")}
      className={`inline-flex items-center gap-1 rounded-xl p-1 ${style.box} ${pending ? "opacity-70" : ""} ${className}`}
    >
      <Languages className="mr-0.5 ml-1.5 h-4 w-4 shrink-0" aria-hidden />
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={code === lang}
          disabled={pending}
          onClick={() => choose(code)}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition max-xl:px-3 max-xl:py-2 ${code === lang ? style.active : style.idle}`}
        >
          {LANG_LABEL[code]}
        </button>
      ))}
    </div>
  );
}
