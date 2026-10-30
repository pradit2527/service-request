import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, isLang, makeT, type Lang, type Translate } from "./i18n";

/** The visitor's language from the cookie (Lao when nothing is set). */
export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
}

export async function getI18n(): Promise<{ lang: Lang; t: Translate }> {
  const lang = await getLang();
  return { lang, t: makeT(lang) };
}

export async function getT(): Promise<Translate> {
  return makeT(await getLang());
}
