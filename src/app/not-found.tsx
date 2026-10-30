import Link from "next/link";
import { getT } from "@/lib/i18n-server";
import { btnPrimary } from "@/lib/ui";

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <p className="text-5xl font-semibold text-slate-300">404</p>
      <h1 className="text-lg font-semibold">{t("ไม่พบหน้าที่ต้องการ", "ບໍ່ພົບໜ້າທີ່ຕ້ອງການ", "Page not found")}</h1>
      <p className="max-w-sm text-sm text-slate-500">
        {t(
          "ลิงก์อาจไม่ถูกต้อง หรือคุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
          "ລິ້ງອາດບໍ່ຖືກຕ້ອງ ຫຼື ທ່ານບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນນີ້",
          "The link may be incorrect, or you do not have access to this information",
        )}
      </p>
      <Link href="/" className={btnPrimary}>
        {t("กลับหน้าแรก", "ກັບຄືນໜ້າຫຼັກ", "Back to home")}
      </Link>
    </main>
  );
}
