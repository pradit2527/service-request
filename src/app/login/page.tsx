import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Activity, FlaskConical, ShieldCheck, Server, TriangleAlert } from "lucide-react";
import { devLogin } from "@/app/actions/auth";
import { LanguageSwitch } from "@/components/language-switch";
import { Logo } from "@/components/logo";
import { APP_NAME } from "@/lib/brand";
import { SubmitButton } from "@/components/submit-button";
import { getCurrentUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { devLoginEnabled, googleCredentials } from "@/lib/env";
import { getT } from "@/lib/i18n-server";
import { ROLE_LABEL } from "@/lib/labels";
import { safeNext } from "@/lib/safe-next";
import { btnSecondary, inputClass, labelClass } from "@/lib/ui";

// The last day of the test version, shown on the sign-in page as day/month/year. Change it here to extend the test.
const TEST_VERSION_UNTIL = "06/11/2026";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("เข้าสู่ระบบ", "ເຂົ້າສູ່ລະບົບ", "Sign in") };
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const t = await getT();

  const ERRORS: Record<string, string> = {
    config: t(
      "ระบบยังไม่ได้ตั้งค่าการเข้าสู่ระบบด้วย Google กรุณาติดต่อผู้ดูแลระบบ",
      "ລະບົບຍັງບໍ່ໄດ້ຕັ້ງຄ່າການເຂົ້າສູ່ລະບົບດ້ວຍ Google ກະລຸນາຕິດຕໍ່ຜູ້ດູແລລະບົບ",
      "Google sign-in has not been set up yet. Please contact the administrator.",
    ),
    denied: t("การเข้าสู่ระบบถูกยกเลิก", "ການເຂົ້າສູ່ລະບົບຖືກຍົກເລີກ", "Sign-in was cancelled."),
    state: t(
      "การเข้าสู่ระบบหมดเวลา กรุณาลองใหม่อีกครั้ง",
      "ການເຂົ້າສູ່ລະບົບໝົດເວລາ ກະລຸນາລອງໃໝ່ອີກຄັ້ງ",
      "Your sign-in timed out. Please try again.",
    ),
    google: t(
      "เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      "ເຂົ້າສູ່ລະບົບດ້ວຍ Google ບໍ່ສຳເລັດ ກະລຸນາລອງໃໝ່ອີກຄັ້ງ",
      "Google sign-in failed. Please try again.",
    ),
    domain: t(
      "อีเมลนี้ยังไม่ได้ลงทะเบียน กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มอีเมลของคุณ แล้วลองเข้าสู่ระบบอีกครั้ง",
      "ອີເມວນີ້ຍັງບໍ່ໄດ້ລົງທະບຽນ ກະລຸນາຕິດຕໍ່ຜູ້ດູແລລະບົບເພື່ອເພີ່ມອີເມວຂອງທ່ານ ແລ້ວລອງເຂົ້າສູ່ລະບົບອີກຄັ້ງ",
      "This email is not registered yet. Ask the administrator to add it, then try again.",
    ),
    inactive: t(
      "บัญชีนี้ถูกปิดการใช้งาน กรุณาติดต่อทีม IT",
      "ບັນຊີນີ້ຖືກປິດການໃຊ້ງານ ກະລຸນາຕິດຕໍ່ທີມ IT",
      "This account has been deactivated. Please contact the IT team.",
    ),
    conflict: t(
      "อีเมลนี้ผูกกับบัญชี Google อื่นอยู่แล้ว กรุณาติดต่อทีม IT",
      "ອີເມວນີ້ຖືກຜູກກັບບັນຊີ Google ອື່ນແລ້ວ ກະລຸນາຕິດຕໍ່ທີມ IT",
      "This email is already linked to another Google account. Please contact the IT team.",
    ),
  };

  const FEATURES = [
    {
      icon: Server,
      title: t("ขอบริการได้ในที่เดียว", "ຂໍບໍລິການໄດ້ໃນບ່ອນດຽວ", "Request everything in one place"),
      text: t(
        "อุปกรณ์ ซอฟต์แวร์ สิทธิ์การใช้งาน และทรัพยากร Cloud เช่น Server, Database, Domain",
        "ອຸປະກອນ ຊອບແວ ສິດການໃຊ້ງານ ແລະ ຊັບພະຍາກອນ Cloud ເຊັ່ນ Server, Database, Domain",
        "Equipment, software, access rights and Cloud resources such as Server, Database and Domain",
      ),
    },
    {
      icon: ShieldCheck,
      title: t("มีผู้อนุมัติและประวัติครบถ้วน", "ມີຜູ້ອະນຸມັດ ແລະ ປະຫວັດຄົບຖ້ວນ", "Approvals and a full history"),
      text: t(
        "คำขอสำคัญผ่านหัวหน้างานอนุมัติ และทุกขั้นตอนมีบันทึกย้อนหลัง",
        "ຄຳຂໍສຳຄັນຜ່ານຫົວໜ້າອະນຸມັດ ແລະ ທຸກຂັ້ນຕອນມີບັນທຶກຍ້ອນຫຼັງ",
        "Important requests are approved by a manager, and every step is recorded",
      ),
    },
    {
      icon: Activity,
      title: t("รู้เวลาดำเนินการล่วงหน้า", "ຮູ້ເວລາດຳເນີນການລ່ວງໜ້າ", "Know the turnaround time upfront"),
      text: t(
        "ติดตามสถานะและกำหนดส่งมอบตาม SLA ของทีม IT ได้ตลอดเวลา",
        "ຕິດຕາມສະຖານະ ແລະ ກຳນົດສົ່ງມອບຕາມ SLA ຂອງທີມ IT ໄດ້ຕະຫຼອດເວລາ",
        "Track status and delivery deadlines under the IT team's SLA at any time",
      ),
    },
  ];

  let signedIn = false;
  let dbDown = false;
  try {
    signedIn = (await getCurrentUser()) !== null;
  } catch (e) {
    console.error("Login page could not check the session", e);
    dbDown = true;
  }
  if (signedIn) redirect(safeNext(next));

  const googleReady = googleCredentials() !== null;
  const devUsers =
    devLoginEnabled() && !dbDown
      ? await db.user.findMany({
          where: { isActive: true },
          select: { id: true, name: true, role: true },
          orderBy: [{ role: "desc" }, { name: "asc" }],
        })
      : [];

  const googleHref = `/api/auth/google${next ? `?next=${encodeURIComponent(safeNext(next))}` : ""}`;

  return (
    <main className="grid min-h-dvh flex-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-linear-to-br from-slate-950 via-indigo-950 to-slate-900 p-12 text-white lg:flex lg:items-center lg:justify-center">
        <div
          className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-violet-600/25 blur-3xl" aria-hidden />

        <div className="relative w-full max-w-lg">
          <Logo size="lg" priority />
          <p className="mt-4 text-lg font-semibold tracking-tight">{APP_NAME}</p>

          <h1 className="mt-14 text-4xl leading-tight font-semibold tracking-tight text-balance">
            {t("ยื่นคำขอบริการ IT", "ຍື່ນຄຳຂໍບໍລິການ IT", "Submit IT service requests")}{" "}
            <span className="bg-linear-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
              {/* Break only at spaces, so a Lao word is never split across two lines. */}
              {t("ง่าย รวดเร็ว โปร่งใส", "ງ່າຍ ວ່ອງໄວ ໂປ່ງໃສ", "simple, fast, transparent")
                .split(" ")
                .map((word, index) => (
                  <span key={index} className="whitespace-nowrap">
                    {word}{" "}
                  </span>
                ))}
            </span>
          </h1>
          <p className="mt-4 text-slate-300">
            {t(
              "ระบบกลางสำหรับพนักงาน AIDC Tech ในการขอทรัพยากรและบริการจากทีม IT",
              "ລະບົບກາງສຳລັບພະນັກງານ AIDC Tech ໃນການຂໍຊັບພະຍາກອນ ແລະ ບໍລິການຈາກທີມ IT",
              "A central system for AIDC Tech employees to request resources and services from the IT team",
            )}
          </p>

          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-indigo-200 ring-1 ring-white/10">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-slate-400">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Sign-in */}
      <section className="relative flex flex-col items-center justify-center px-4 py-12 sm:px-8">
        <div className="absolute top-4 right-4">
          <LanguageSwitch variant="light" />
        </div>
        {/* Above the form, in the normal flow. On a wide screen that is also tall enough (44rem) it floats in the space above
            the form instead: a sixth of the way down the panel, but never lower than a form-height above the centre. */}
        <p className="mb-6 inline-flex items-center gap-2.5 rounded-full bg-amber-50 px-5 py-2 text-center text-base font-medium text-amber-800 ring-1 ring-amber-200 ring-inset lg:[@media(min-height:44rem)]:absolute lg:[@media(min-height:44rem)]:top-[clamp(4rem,16%,calc(50%_-_17.5rem))] lg:[@media(min-height:44rem)]:left-1/2 lg:[@media(min-height:44rem)]:mb-0 lg:[@media(min-height:44rem)]:w-max lg:[@media(min-height:44rem)]:-translate-x-1/2">
          <FlaskConical className="h-5 w-5 shrink-0" aria-hidden />
          {t(`Version Test ถึงวันที่ ${TEST_VERSION_UNTIL}`, `Version Test ຮອດວັນທີ ${TEST_VERSION_UNTIL}`, `Version Test until ${TEST_VERSION_UNTIL}`)}
        </p>
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-4 lg:hidden">
            <Logo size="sm" />
            <p className="text-lg leading-tight font-semibold tracking-tight">{APP_NAME}</p>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{t("เข้าสู่ระบบ", "ເຂົ້າສູ່ລະບົບ", "Sign in")}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {t(
              "ใช้บัญชี Google (Gmail หรืออีเมลบริษัท) กดปุ่มเดียวก็เข้าใช้งานได้",
              "ໃຊ້ບັນຊີ Google (Gmail ຫຼື ອີເມວບໍລິສັດ) ກົດປຸ່ມດຽວກໍເຂົ້າໃຊ້ງານໄດ້",
              "Use your Google account (Gmail or company email). One click and you're in.",
            )}
          </p>

          <div className="mt-6 space-y-4">
            {error && ERRORS[error] && (
              <p role="alert" className="flex gap-2.5 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700 ring-1 ring-red-200 ring-inset">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {ERRORS[error]}
              </p>
            )}
            {dbDown && (
              <p role="alert" className="flex gap-2.5 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-800 ring-1 ring-amber-200 ring-inset">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {t(
                  "เชื่อมต่อฐานข้อมูลไม่ได้ กรุณาลองใหม่ภายหลังหรือติดต่อทีม IT",
                  "ບໍ່ສາມາດເຊື່ອມຕໍ່ Database ໄດ້ ກະລຸນາລອງໃໝ່ພາຍຫຼັງ ຫຼື ຕິດຕໍ່ທີມ IT",
                  "Can't connect to the database. Please try again later or contact the IT team.",
                )}
              </p>
            )}

            {googleReady ? (
              <a
                href={googleHref}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-card ring-1 ring-slate-200 transition hover:bg-slate-50 hover:shadow-lift active:scale-[0.99]"
              >
                <GoogleLogo />
                {t("เข้าสู่ระบบด้วย Google", "ເຂົ້າສູ່ລະບົບດ້ວຍ Google", "Sign in with Google")}
              </a>
            ) : process.env.NODE_ENV !== "production" ? (
              <p className="rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-800 ring-1 ring-amber-200 ring-inset">
                {t("ยังไม่ได้ตั้งค่า", "ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ", "Not yet set:")} <code className="font-mono text-xs">GOOGLE_CLIENT_ID</code>{" "}
                {t("และ", "ແລະ", "and")} <code className="font-mono text-xs">GOOGLE_CLIENT_SECRET</code>{" "}
                {t("ในไฟล์ .env", "ໃນໄຟລ໌ .env", "in the .env file")}
              </p>
            ) : (
              <p className="rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-800 ring-1 ring-amber-200 ring-inset">{ERRORS.config}</p>
            )}
            <p className="text-center text-xs leading-relaxed text-slate-500">
              {t(
                "ครั้งแรกระบบจะผูกอีเมลของคุณให้เอง ถ้าเข้าไม่ได้ ให้ผู้ดูแลระบบลงทะเบียนอีเมลของคุณก่อน",
                "ຄັ້ງທຳອິດລະບົບຈະຜູກອີເມວຂອງທ່ານໃຫ້ເອງ ຖ້າເຂົ້າບໍ່ໄດ້ ໃຫ້ຜູ້ດູແລລະບົບລົງທະບຽນອີເມວຂອງທ່ານກ່ອນ",
                "The first time, your email is linked automatically. If you can't get in, ask the administrator to register your email first.",
              )}
            </p>
          </div>

          {devUsers.length > 0 && (
            <form action={devLogin} className="mt-8 rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-4">
              <p className="mb-3 text-xs font-semibold text-amber-700">
                {t("โหมดพัฒนา · เข้าสู่ระบบโดยไม่ใช้ Google", "ໂໝດພັດທະນາ · ເຂົ້າສູ່ລະບົບໂດຍບໍ່ໃຊ້ Google", "Development mode · sign in without Google")}
              </p>
              <label htmlFor="userId" className={labelClass}>
                {t("เลือกผู้ใช้ตัวอย่าง", "ເລືອກຜູ້ໃຊ້ຕົວຢ່າງ", "Choose a sample user")}
              </label>
              <select id="userId" name="userId" className={inputClass} defaultValue={devUsers[0].id}>
                {devUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({t(ROLE_LABEL[u.role])})
                  </option>
                ))}
              </select>
              <div className="mt-3">
                <SubmitButton className={`${btnSecondary} w-full`} pendingText={t("กำลังเข้าสู่ระบบ...", "ກຳລັງເຂົ້າສູ່ລະບົບ...", "Signing in...")}>
                  {t("เข้าสู่ระบบ", "ເຂົ້າສູ່ລະບົບ", "Sign in")}
                </SubmitButton>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
