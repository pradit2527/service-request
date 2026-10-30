import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CircleCheck,
  History,
  Hourglass,
  Inbox,
  Plus,
  Search,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  Wrench,
} from "lucide-react";
import { HeroLights, HeroWatermark } from "@/components/hero-lights";
import { RequestList, RequestTable } from "@/components/request-list";
import { SectionHeader } from "@/components/section-header";
import { SlaOverviewCard } from "@/components/sla-overview-card";
import { StatCard } from "@/components/stat-card";
import { StatusBar } from "@/components/status-bar";
import { requireUser } from "@/lib/dal";
import { l } from "@/lib/i18n";
import { getI18n, getT } from "@/lib/i18n-server";
import { formatDateLong, formatNumber } from "@/lib/labels";
import { isStaff } from "@/lib/permissions";
import { countPendingApprovals, getEmployeeDashboard, getSlaOverview, getStaffDashboard, searchArticles } from "@/lib/queries";
import { kbCategoryLabel } from "@/lib/kb";
import { cardClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("ภาพรวม", "ພາບລວມ", "Overview") };
}

async function Hero({ name, summary, search }: { name: string; summary: string; search: boolean }) {
  const { t, lang } = await getI18n();
  const popularSearches = ["Wi-Fi", "VPN", t("รีเซ็ตรหัสผ่าน", "ຣີເຊັດລະຫັດຜ່ານ", "Reset password"), "Shared Folder"];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-white shadow-lift sm:p-10">
      <div
        className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_72%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute -top-20 -right-16 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl" aria-hidden />
      <HeroWatermark />
      <HeroLights />

      <div className="relative max-w-2xl">
        <p className="text-xs font-medium tracking-wide text-indigo-200/80">{formatDateLong(lang)}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">
          {t("ยินดีต้อนรับ", "ຍິນດີຕ້ອນຮັບ", "Welcome")}, {name}
        </h1>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">{summary}</p>

        {search ? (
          <>
            <form action="/kb" method="get" role="search" className="mt-6">
              <label htmlFor="hero-search" className="sr-only">
                {t("ค้นหาบทความช่วยเหลือ", "ຄົ້ນຫາບົດຄວາມຊ່ວຍເຫຼືອ", "Search help articles")}
              </label>
              <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-2xl shadow-black/30 ring-4 ring-white/10 focus-within:ring-indigo-400/40">
                <Search className="ml-3 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                <input
                  id="hero-search"
                  name="q"
                  type="search"
                  placeholder={t(
                    "ค้นหาบทความช่วยเหลือ วิธีตั้งค่า Wi-Fi หรือคู่มือ VPN...",
                    "ຄົ້ນຫາບົດຄວາມຊ່ວຍເຫຼືອ ວິທີຕັ້ງຄ່າ Wi-Fi ຫຼື ຄູ່ມື VPN...",
                    "Search help articles, Wi-Fi setup or VPN guides...",
                  )}
                  className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98]"
                >
                  {t("ค้นหา", "ຄົ້ນຫາ", "Search")}
                </button>
              </div>
            </form>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              {t("ยอดนิยม:", "ຍອດນິຍົມ:", "Popular:")}
              {popularSearches.map((word) => (
                <Link
                  key={word}
                  href={`/kb?q=${encodeURIComponent(word)}`}
                  className="rounded-full bg-white/10 px-3 py-1 text-slate-200 ring-1 ring-white/10 transition hover:bg-white/20"
                >
                  {word}
                </Link>
              ))}
            </p>
          </>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/requests/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-black/20 transition hover:bg-indigo-50 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              {t("สร้างคำขอใหม่", "ສ້າງຄຳຂໍໃໝ່", "New request")}
            </Link>
            <Link
              href="/requests"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15"
            >
              {t("ดูคำขอทั้งหมด", "ເບິ່ງຄຳຂໍທັງໝົດ", "View all requests")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

const SERVICE_EXAMPLES = [
  l(
    "ขอสิทธิ์เข้าถึง Shared Folder / ระบบงานเพิ่มเติม",
    "ຂໍສິດເຂົ້າເຖິງ Shared Folder / ລະບົບງານເພີ່ມເຕີມ",
    "Request access to a Shared Folder / additional systems",
  ),
  l(
    "ขอเบิกโน้ตบุ๊กเครื่องใหม่ / จอภาพ / เมาส์ / คีย์บอร์ด",
    "ຂໍເບີກໂນດບຸກເຄື່ອງໃໝ່ / ຈໍພາບ / ເມົ້າ / ຄີບອດ",
    "Request a new laptop / monitor / mouse / keyboard",
  ),
  l(
    "ขอติดตั้งซอฟต์แวร์ลิขสิทธิ์เพิ่มเติม (Adobe, Visio)",
    "ຂໍຕິດຕັ້ງຊອບແວ License ເພີ່ມເຕີມ (Adobe, Visio)",
    "Request installation of additional licensed software (Adobe, Visio)",
  ),
];

const INCIDENT_EXAMPLES = [
  l(
    "คอมพิวเตอร์เปิดไม่ติด / จอฟ้า / คีย์บอร์ดเสีย",
    "ຄອມພິວເຕີເປີດບໍ່ຕິດ / ຈໍຟ້າ / ຄີບອດເສຍ",
    "Computer won't turn on / blue screen / broken keyboard",
  ),
  l(
    "ระบบหลุด / โปรแกรมค้าง / ขึ้นข้อความ Error",
    "ລະບົບຫຼຸດ / ໂປຣແກຣມຄ້າງ / ຂຶ້ນຂໍ້ຄວາມ Error",
    "System disconnects / program freezes / error message appears",
  ),
  l(
    "อินเทอร์เน็ตหลุด / ต่อ Wi-Fi ไม่ได้",
    "ອິນເຕີເນັດຫຼຸດ / ເຊື່ອມຕໍ່ Wi-Fi ບໍ່ໄດ້",
    "Internet drops / can't connect to Wi-Fi",
  ),
];

async function ActionCards() {
  const t = await getT();

  return (
    <div className="grid gap-5 md:grid-cols-2 md:gap-6">
      {/* Service Request: available */}
      <section className="group relative flex flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-8">
        <span className="absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-emerald-400 to-teal-500" aria-hidden />
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl" aria-hidden />
        <div className="relative flex items-start justify-between gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30 transition duration-300 group-hover:scale-105">
            <ShieldCheck className="h-7 w-7" aria-hidden />
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 ring-inset">
            {t("ขอสิทธิ์ / เบิกอุปกรณ์", "ຂໍສິດ / ເບີກອຸປະກອນ", "Access / equipment")}
          </span>
        </div>
        <h2 className="relative mt-5 text-xl font-semibold tracking-tight text-slate-900">
          {t("ขอสิทธิ์ / ขออุปกรณ์ / บริการใหม่", "ຂໍສິດ / ຂໍອຸປະກອນ / ບໍລິການໃໝ່", "Request access / equipment / new services")}
        </h2>
        <p className="relative mt-1 text-sm text-slate-500">
          {t(
            "(Service Request) สำหรับยื่นคำขอรับบริการใหม่ๆ เพิ่มเติมจากเดิม ที่ไม่ได้เกิดจากอุปกรณ์เสีย",
            "(Service Request) ສຳລັບຍື່ນຄຳຂໍຮັບບໍລິການໃໝ່ ເພີ່ມເຕີມຈາກເດີມ ທີ່ບໍ່ໄດ້ເກີດຈາກອຸປະກອນເສຍ",
            "(Service Request) For requesting additional new services, not caused by faulty equipment",
          )}
        </p>
        <ul className="relative mt-5 flex-1 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
          {SERVICE_EXAMPLES.map((example) => (
            <li key={example.th} className="flex items-start gap-2.5">
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
              {t(example)}
            </li>
          ))}
        </ul>
        <Link
          href="/requests/new"
          className="relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400 active:scale-[0.99]"
        >
          {t("ส่งคำขอบริการ", "ສົ່ງຄຳຂໍບໍລິການ", "Submit request")}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </section>

      {/* Incident: coming soon */}
      <section className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-6 sm:p-8">
        <span className="absolute inset-y-0 left-0 w-1.5 bg-linear-to-b from-rose-300 to-red-400" aria-hidden />
        <div className="relative flex items-start justify-between gap-3 opacity-80">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-rose-300 to-red-400 text-white shadow-lg shadow-rose-400/25">
            <TriangleAlert className="h-7 w-7" aria-hidden />
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 ring-inset">
            {t("เร็วๆ นี้", "ໄວໆ ນີ້", "Coming soon")}
          </span>
        </div>
        <h2 className="relative mt-5 text-xl font-semibold tracking-tight text-slate-700">
          {t("แจ้งปัญหา / อุปกรณ์ขัดข้อง", "ແຈ້ງບັນຫາ / ອຸປະກອນຂັດຂ້ອງ", "Report a problem / faulty equipment")}
        </h2>
        <p className="relative mt-1 text-sm text-slate-500">
          {t(
            "(Incident Report) สำหรับแจ้งเหตุที่เคยใช้งานได้ปกติแต่เกิดเสีย ชำรุด หรือใช้งานไม่ได้กะทันหัน",
            "(Incident Report) ສຳລັບແຈ້ງເຫດທີ່ເຄີຍໃຊ້ງານໄດ້ປົກກະຕິ ແຕ່ເກີດເສຍ ຊຳລຸດ ຫຼື ໃຊ້ງານບໍ່ໄດ້ໂດຍກະທັນຫັນ",
            "(Incident Report) For reporting something that used to work normally but has broken, been damaged or suddenly stopped working",
          )}
        </p>
        <ul className="relative mt-5 flex-1 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-500">
          {INCIDENT_EXAMPLES.map((example) => (
            <li key={example.th} className="flex items-start gap-2.5">
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
              {t(example)}
            </li>
          ))}
        </ul>
        <div className="relative mt-6">
          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400"
          >
            {t("ยังไม่เปิดให้บริการในระบบนี้", "ຍັງບໍ່ເປີດໃຫ້ບໍລິການໃນລະບົບນີ້", "Not yet available in this system")}
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">
            {t(
              "ระหว่างนี้ โปรดแจ้งเหตุขัดข้องกับทีม IT ตามช่องทางแจ้งปัญหาเดิมของบริษัท",
              "ໃນລະຫວ່າງນີ້ ກະລຸນາແຈ້ງເຫດຂັດຂ້ອງກັບທີມ IT ຕາມຊ່ອງທາງແຈ້ງບັນຫາເດີມຂອງບໍລິສັດ",
              "In the meantime, please report issues to the IT team through the company's existing channels",
            )}
          </p>
        </div>
      </section>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name.split(/\s+/)[0] || user.name;
  const pendingApprovals = await countPendingApprovals(user.id);

  return (
    <div className="space-y-6">
      {isStaff(user) ? <StaffView firstName={firstName} /> : <EmployeeView user={user} firstName={firstName} />}
      {pendingApprovals > 0 && <ApprovalBanner count={pendingApprovals} />}
    </div>
  );
}

async function ApprovalBanner({ count }: { count: number }) {
  const { t, lang } = await getI18n();
  const n = formatNumber(count, lang);

  return (
    <Link
      href="/approvals"
      className="group flex items-center gap-4 rounded-2xl bg-linear-to-r from-indigo-50 to-violet-50 p-4 ring-1 ring-indigo-200 ring-inset transition hover:shadow-card"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/30">
        <ShieldCheck className="h-5 w-5" aria-hidden />
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-slate-900">
          {t(
            `คุณมี ${n} คำขอรอการอนุมัติ`,
            `ທ່ານມີ ${n} ຄຳຂໍລໍຖ້າການອະນຸມັດ`,
            `You have ${n} ${count === 1 ? "request" : "requests"} awaiting approval`,
          )}
        </span>
        <span className="block text-sm text-slate-600">
          {t(
            "พนักงานเลือกคุณเป็นผู้อนุมัติ คำขอจะเข้าคิวทีม IT หลังจากคุณอนุมัติ",
            "ພະນັກງານເລືອກທ່ານເປັນຜູ້ອະນຸມັດ ຄຳຂໍຈະເຂົ້າຄິວທີມ IT ຫຼັງຈາກທ່ານອະນຸມັດ",
            "Employees have chosen you as their approver. Requests join the IT team's queue after you approve them.",
          )}
        </span>
      </span>
      <ArrowRight className="h-5 w-5 text-indigo-400 transition group-hover:translate-x-1" aria-hidden />
    </Link>
  );
}

type ViewProps = { user: Awaited<ReturnType<typeof requireUser>>; firstName: string };

async function EmployeeView({ user, firstName }: ViewProps) {
  const { t, lang } = await getI18n();
  const [{ counts, recent }, articles] = await Promise.all([getEmployeeDashboard(user), searchArticles(user, {})]);
  const open = counts.PENDING_APPROVAL + counts.SUBMITTED + counts.IN_REVIEW + counts.ON_HOLD + counts.APPROVED + counts.IN_PROGRESS;
  const needInfo = formatNumber(counts.NEED_INFO, lang);
  const openText = formatNumber(open, lang);

  const summary =
    counts.NEED_INFO > 0
      ? t(
          `ทีม IT รอข้อมูลเพิ่มเติมจากคุณ ${needInfo} รายการ กรุณาตอบกลับเพื่อให้ดำเนินการต่อได้`,
          `ທີມ IT ລໍຖ້າຂໍ້ມູນເພີ່ມເຕີມຈາກທ່ານ ${needInfo} ລາຍການ ກະລຸນາຕອບກັບເພື່ອໃຫ້ດຳເນີນການຕໍ່ໄດ້`,
          `The IT team needs more information from you on ${needInfo} ${counts.NEED_INFO === 1 ? "request" : "requests"}. Please reply so we can continue.`,
        )
      : t(
          "ค้นหาวิธีแก้ไขปัญหาเบื้องต้น หรือเลือกประเภทบริการที่คุณต้องการจากการ์ดด้านล่าง",
          "ຄົ້ນຫາວິທີແກ້ໄຂບັນຫາເບື້ອງຕົ້ນ ຫຼື ເລືອກປະເພດບໍລິການທີ່ທ່ານຕ້ອງການຈາກບັດດ້ານລຸ່ມ",
          "Search for quick fixes, or choose the service you need from the cards below.",
        );

  return (
    <>
      <Hero name={firstName} summary={summary} search />
      <ActionCards />

      <section>
        <SectionHeader
          title={t(
            `ติดตามสถานะคำขอของฉัน${open > 0 ? ` · กำลังดำเนินการ ${openText}` : ""}`,
            `ຕິດຕາມສະຖານະຄຳຂໍຂອງຂ້ອຍ${open > 0 ? ` · ກຳລັງດຳເນີນການ ${openText}` : ""}`,
            `Track my requests${open > 0 ? ` · ${openText} in progress` : ""}`,
          )}
          href="/requests"
        />
        <RequestTable
          items={recent}
          emptyText={t(
            "คุณยังไม่เคยยื่นคำขอ กด “ส่งคำขอบริการ” เพื่อเริ่มต้น",
            "ທ່ານຍັງບໍ່ເຄີຍຍື່ນຄຳຂໍ ກົດ “ສົ່ງຄຳຂໍບໍລິການ” ເພື່ອເລີ່ມຕົ້ນ",
            "You haven't submitted any requests yet. Click “Submit request” to get started.",
          )}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-2">
          <StatusBar counts={counts} title={t("สถานะคำขอของฉัน", "ສະຖານະຄຳຂໍຂອງຂ້ອຍ", "My request status")} />
        </div>

        <section className="min-w-0 lg:col-span-3">
          <SectionHeader
            title={t("บทความช่วยเหลือ", "ບົດຄວາມຊ່ວຍເຫຼືອ", "Help articles")}
            href="/kb"
            linkLabel={t("ดูบทความทั้งหมด", "ເບິ່ງບົດຄວາມທັງໝົດ", "View all articles")}
          />
          {articles.length === 0 ? (
            <div className={`${cardClass} flex items-center gap-3 p-5 text-sm text-slate-500`}>
              <BookOpen className="h-5 w-5 text-slate-300" aria-hidden />
              {t(
                "ยังไม่มีบทความ ทีม IT จะเพิ่มคู่มือและวิธีแก้ปัญหาเบื้องต้นที่นี่",
                "ຍັງບໍ່ມີບົດຄວາມ ທີມ IT ຈະເພີ່ມຄູ່ມື ແລະ ວິທີແກ້ໄຂບັນຫາເບື້ອງຕົ້ນຢູ່ບ່ອນນີ້",
                "No articles yet. The IT team will add guides and quick fixes here.",
              )}
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {articles.slice(0, 3).map((article) => (
                <li key={article.id}>
                  <Link
                    href={`/kb/${article.id}`}
                    className={`${cardClass} group block h-full p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift`}
                  >
                    <span className="text-[11px] font-semibold text-indigo-600">{kbCategoryLabel(article.category, lang)}</span>
                    <p className="mt-1 line-clamp-2 font-medium text-slate-900 transition group-hover:text-indigo-700">{article.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{article.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

async function StaffView({ firstName }: Pick<ViewProps, "firstName">) {
  const { t, lang } = await getI18n();
  const [{ counts, unassigned, queue }, sla] = await Promise.all([getStaffDashboard(), getSlaOverview()]);

  const plural = (n: number) => (n === 1 ? "request" : "requests");
  const parts: string[] = [];
  if (counts.SUBMITTED > 0) {
    const n = formatNumber(counts.SUBMITTED, lang);
    parts.push(t(`${n} คำขอรอ IT ดำเนินการ`, `${n} ຄຳຂໍລໍ IT ດຳເນີນການ`, `${n} ${plural(counts.SUBMITTED)} waiting for IT`));
  }
  if (unassigned > 0) {
    const n = formatNumber(unassigned, lang);
    parts.push(t(`${n} คำขอยังไม่มีผู้รับผิดชอบ`, `${n} ຄຳຂໍຍັງບໍ່ມີຜູ້ຮັບຜິດຊອບ`, `${n} unassigned ${plural(unassigned)}`));
  }
  if (sla.breachedOpen > 0) {
    const n = formatNumber(sla.breachedOpen, lang);
    parts.push(t(`${n} รายการเกิน SLA`, `${n} ລາຍການເກີນ SLA`, `${n} over SLA`));
  }
  const joined = parts.join(" · ");
  const summary =
    parts.length > 0
      ? t(`วันนี้มี ${joined}`, `ມື້ນີ້ມີ ${joined}`, `Today: ${joined}`)
      : t("ไม่มีคำขอที่รอดำเนินการ ทุกอย่างเรียบร้อยดี", "ບໍ່ມີຄຳຂໍທີ່ລໍຖ້າດຳເນີນການ ທຸກຢ່າງຮຽບຮ້ອຍດີ", "No pending requests. Everything is in order.");

  return (
    <>
      <Hero name={firstName} summary={summary} search={false} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label={t("รอหัวหน้าอนุมัติ", "ລໍຫົວໜ້າອະນຸມັດ", "Awaiting manager approval")}
          value={counts.PENDING_APPROVAL}
          href="/requests?status=PENDING_APPROVAL"
          icon={ShieldCheck}
          tone="indigo"
        />
        <StatCard
          label={t("รอ IT ดำเนินการ", "ລໍ IT ດຳເນີນການ", "Waiting for IT")}
          value={counts.SUBMITTED}
          href="/requests?status=SUBMITTED"
          icon={Inbox}
          tone="slate"
        />
        <StatCard
          label={t("กำลังดำเนินการ", "ກຳລັງດຳເນີນການ", "In progress")}
          value={counts.IN_PROGRESS + counts.IN_REVIEW + counts.APPROVED}
          href="/requests?status=IN_PROGRESS"
          icon={Wrench}
          tone="violet"
        />
        <StatCard
          label={t("รอข้อมูล / Vendor", "ລໍຂໍ້ມູນ / Vendor", "Waiting for info / Vendor")}
          value={counts.NEED_INFO + counts.ON_HOLD}
          href="/requests?status=WAITING"
          icon={Hourglass}
          tone="orange"
          hint={t("SLA หยุดนับ", "ຢຸດນັບ SLA", "SLA paused")}
        />
        <StatCard
          label={t("เกิน SLA", "ເກີນ SLA", "Over SLA")}
          value={sla.breachedOpen}
          href="/requests?sla=breached"
          icon={TriangleAlert}
          tone="red"
          hint={t("ที่ยังไม่ปิด", "ທີ່ຍັງບໍ່ປິດ", "Still open")}
        />
        <StatCard
          label={t("ยังไม่มีผู้รับผิดชอบ", "ຍັງບໍ່ມີຜູ້ຮັບຜິດຊອບ", "Unassigned")}
          value={unassigned}
          href="/requests?scope=unassigned&status=OPEN"
          icon={UserRound}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="min-w-0 lg:col-span-3">
          <SectionHeader
            title={t("คิวรอ IT ดำเนินการ (เก่าสุดก่อน)", "ຄິວລໍ IT ດຳເນີນການ (ເກົ່າສຸດກ່ອນ)", "IT queue (oldest first)")}
            href="/requests?status=SUBMITTED"
          />
          <RequestList
            items={queue}
            showRequester
            emptyText={t("ไม่มีคำขอที่รอ IT ดำเนินการ", "ບໍ່ມີຄຳຂໍທີ່ລໍ IT ດຳເນີນການ", "No requests waiting for IT")}
          />
        </section>

        <div className="min-w-0 space-y-6 lg:col-span-2">
          <SlaOverviewCard overview={sla} />
          <StatusBar counts={counts} title={t("สถานะคำขอทั้งหมด", "ສະຖານະຄຳຂໍທັງໝົດ", "All request status")} />
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-slate-400">
        <History className="h-3.5 w-3.5" aria-hidden />
        {t(
          "SLA นับเฉพาะเวลาทำการ และหยุดนับเมื่อรอหัวหน้าอนุมัติ ข้อมูลจากผู้ขอ หรือ Vendor / งบประมาณ",
          "SLA ນັບສະເພາະເວລາເຮັດວຽກ ແລະ ຢຸດນັບເມື່ອລໍຖ້າຫົວໜ້າອະນຸມັດ ຂໍ້ມູນຈາກຜູ້ຂໍ ຫຼື Vendor / ງົບປະມານ",
          "SLA counts business hours only and pauses while waiting for manager approval, information from the requester, or a Vendor / budget",
        )}
      </p>
    </>
  );
}
