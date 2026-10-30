import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_Thai, Noto_Sans_Lao } from "next/font/google";
import { LangProvider } from "@/components/lang-provider";
import { APP_NAME, APP_TAGLINE, COMPANY_NAME } from "@/lib/brand";
import { getI18n } from "@/lib/i18n-server";
import "./globals.css";

// IBM Plex covers Latin and Thai; Noto Sans Lao covers Lao. The font stack in globals.css lists both,
// so each script is drawn with the font that has its glyphs.
const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-plex-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const notoLao = Noto_Sans_Lao({
  variable: "--font-noto-lao",
  subsets: ["lao", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
    description: t(
      `${APP_TAGLINE.th}สำหรับพนักงาน ${COMPANY_NAME}`,
      `${APP_TAGLINE.lo}ສຳລັບພະນັກງານ ${COMPANY_NAME}`,
      `${APP_TAGLINE.en} for ${COMPANY_NAME} staff`,
    ),
  };
}

export const viewport: Viewport = {
  themeColor: "#020617",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang } = await getI18n();

  return (
    <html lang={lang} className={`${plexThai.variable} ${notoLao.variable} ${plexMono.variable} h-full`}>
      <body className="flex min-h-dvh flex-col bg-slate-50 font-sans text-slate-900 antialiased">
        <LangProvider lang={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
