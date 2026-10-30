// Three-language support: Lao (main language), Thai and English. Pure module: safe for server and client code.
//
// Usage (always Thai, then Lao, then English):
//   t("ข้อความไทย", "ຂໍ້ຄວາມລາວ", "English text")   returns the text for the current language
//   t(STATUS_LABEL[status])                            Localized values (built with l()) can be passed too
//   l("ข้อความไทย", "ຂໍ້ຄວາມລາວ", "English text")    builds a Localized value for module-level data
//
// Where `t` comes from:
//   server components / actions / generateMetadata:  const t = await getT()    (@/lib/i18n-server)
//   client components:                               const t = useT()          (@/components/lang-provider)

export const LANGS = ["lo", "th", "en"] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = "lo";
export const LANG_COOKIE = "lang";

/** Name of each language written in that language, for the language switch. */
export const LANG_LABEL: Record<Lang, string> = { lo: "ລາວ", th: "ไทย", en: "ENG" };

/** Locale used for dates and numbers. */
export const INTL_LOCALE: Record<Lang, string> = { lo: "lo-LA", th: "th-TH", en: "en-GB" };

export type Localized = { lo: string; th: string; en: string };

export function isLang(value: unknown): value is Lang {
  return value === "lo" || value === "th" || value === "en";
}

/** Builds a Localized value. Thai, Lao, English: the same order as t(). */
export function l(th: string, lo: string, en: string): Localized {
  return { th, lo, en };
}

export type Translate = {
  (th: string, lo: string, en: string): string;
  (value: Localized): string;
};

export function makeT(lang: Lang): Translate {
  return ((a: string | Localized, lo?: string, en?: string) => {
    if (typeof a !== "string") return a[lang];
    if (lang === "lo") return lo ?? a;
    if (lang === "en") return en ?? a;
    return a;
  }) as Translate;
}
