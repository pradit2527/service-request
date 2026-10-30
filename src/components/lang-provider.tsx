"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LANG, makeT, type Lang, type Translate } from "@/lib/i18n";

const LangContext = createContext<Lang>(DEFAULT_LANG);

// Rendered once in the root layout with the language read from the cookie on the server.
export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext value={lang}>{children}</LangContext>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

/** Translate function for client components: const t = useT(); t("ไทย", "ລາວ") */
export function useT(): Translate {
  const lang = useLang();
  return useMemo(() => makeT(lang), [lang]);
}
