"use client";

import { useT } from "@/components/lang-provider";
import { btnPrimary } from "@/lib/ui";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <h1 className="text-lg font-semibold">{t("เกิดข้อผิดพลาด", "ເກີດຂໍ້ຜິດພາດ", "Something went wrong")}</h1>
      <p className="max-w-sm text-sm text-slate-500">
        {t(
          "ระบบไม่สามารถดำเนินการได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง หากยังไม่หายให้แจ้งทีม IT",
          "ລະບົບບໍ່ສາມາດດຳເນີນການໄດ້ໃນຕອນນີ້ ກະລຸນາລອງໃໝ່ອີກຄັ້ງ ຖ້າຍັງບໍ່ແກ້ໄຂໃຫ້ແຈ້ງທີມ IT",
          "The system cannot complete this action right now. Please try again, and contact the IT team if the problem continues",
        )}
      </p>
      <button type="button" onClick={reset} className={btnPrimary}>
        {t("ลองใหม่", "ລອງໃໝ່", "Try again")}
      </button>
    </main>
  );
}
