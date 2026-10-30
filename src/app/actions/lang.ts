"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { LANG_COOKIE, isLang } from "@/lib/i18n";

// Public on purpose: the language can be changed before signing in. It only stores a display preference.
export async function setLanguage(value: string): Promise<void> {
  if (!isLang(value)) return;

  (await cookies()).set(LANG_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  revalidatePath("/", "layout");
}
