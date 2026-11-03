import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Search, ShieldCheck, TriangleAlert } from "lucide-react";
import { HeroWatermark } from "@/components/hero-watermark";
import { TrendCard, TypeBreakdownCard, WorkloadCard } from "@/components/insight-cards";
import { RequestTable } from "@/components/request-list";
import { SectionHeader } from "@/components/section-header";
import { SlaOverviewCard } from "@/components/sla-overview-card";
import { StatStrip } from "@/components/stat-strip";
import { StatusBar } from "@/components/status-bar";
import { requireUser } from "@/lib/dal";
import { l } from "@/lib/i18n";
import { getI18n, getT } from "@/lib/i18n-server";
import { formatDateLong, formatNumber } from "@/lib/labels";
import { isStaff } from "@/lib/permissions";
import {
  countPendingApprovals,
  getEmployeeDashboard,
  getSlaOverview,
  getStaffDashboard,
  getStaffInsights,
  searchArticles,
} from "@/lib/queries";
import { kbCategoryLabel } from "@/lib/kb";
import { cardClass } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("ภาพรวม", "ພາບລວມ", "Overview") };
}

// A calm header: a deep navy panel with a faint glow, the greeting, one line of summary and the next step.
async function Hero({ name, summary, search }: { name: string; summary: string; search: boolean }) {
  const { t, lang } = await getI18n();
  const popularSearches = ["Wi-Fi", "VPN", t("รีเซ็ตรหัสผ่าน", "ຣີເຊັດລະຫັດຜ່ານ", "Reset password"), "Shared Folder"];

  return (
    <section className="relative flex flex-col justify-center overflow-hidden rounded-3xl bg-slate-950 px-5 py-6 text-white sm:min-h-44 sm:px-8 sm:py-8">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_130%_at_88%_-15%,rgb(99_102_241/0.38),transparent_62%),radial-gradient(45%_90%_at_8%_125%,rgb(14_165_233/0.2),transparent_62%)]"
        aria-hidden
      />
      <div
        className="bg-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
        aria-hidden
      />
      <HeroWatermark />

      <div className="relative max-w-2xl">
        <p className="text-xs font-medium tracking-wide text-slate-400">{formatDateLong(lang)}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("ยินดีต้อนรับ", "ຍິນດີຕ້ອນຮັບ", "Welcome")}, {name}
        </h1>
        <p className="mt-2 text-sm text-slate-400 sm:text-[15px]">{summary}</p>
      </div>

      {search && (
        <div className="relative mt-6 max-w-2xl">
          <form action="/kb" method="get" role="search">
            <label htmlFor="hero-search" className="sr-only">
              {t("ค้นหาบทความช่วยเหลือ", "ຄົ້ນຫາບົດຄວາມຊ່ວຍເຫຼືອ", "Search help articles")}
            </label>
            <div className="flex items-center gap-2 rounded-xl bg-white/[0.07] p-1.5 ring-1 ring-white/15 transition focus-within:bg-white/10 focus-within:ring-indigo-400/60">
              <Search className="ml-3 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <input
                id="hero-search"
                name="q"
                type="search"
                placeholder={t(
                  "ค้นหาบทความช่วยเหลือ วิธีตั้งค่า Wi-Fi หรือคู่มือ VPN...",
                  "ຄົ້ນຫາບົດຄວາມຊ່ວຍເຫຼືອ ວິທີຕັ້ງຄ່າ Wi-Fi ຫຼື ຄູ່ມື VPN...",
                  "Search help articles, Wi-Fi setup or VPN guides...",
                )}
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base text-white placeholder:text-slate-500 focus:outline-none sm:text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 active:scale-[0.98]"
              >
                {t("ค้นหา", "ຄົ້ນຫາ", "Search")}
              </button>
            </div>
          </form>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {t("ยอดนิยม:", "ຍອດນິຍົມ:", "Popular:")}
            {popularSearches.map((word) => (
              <Link
                key={word}
                href={`/kb?q=${encodeURIComponent(word)}`}
                className="rounded-full bg-white/[0.06] px-3 py-1 text-slate-300 ring-1 ring-white/10 transition hover:bg-white/[0.12]"
              >
                {word}
              </Link>
            ))}
          </p>
        </div>
      )}
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
    <div className="grid gap-4 md:grid-cols-2 md:gap-5">
      {/* Service Request: available */}
      <section className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-shadow duration-300 hover:shadow-lift sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {t("ขอสิทธิ์ / เบิกอุปกรณ์", "ຂໍສິດ / ເບີກອຸປະກອນ", "Access / equipment")}
          </span>
        </div>
        <h2 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">
          {t("ขอสิทธิ์ / ขออุปกรณ์ / บริการใหม่", "ຂໍສິດ / ຂໍອຸປະກອນ / ບໍລິການໃໝ່", "Request access / equipment / new services")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {t(
            "(Service Request) สำหรับยื่นคำขอรับบริการใหม่ๆ เพิ่มเติมจากเดิม ที่ไม่ได้เกิดจากอุปกรณ์เสีย",
            "(Service Request) ສຳລັບຍື່ນຄຳຂໍຮັບບໍລິການໃໝ່ ເພີ່ມເຕີມຈາກເດີມ ທີ່ບໍ່ໄດ້ເກີດຈາກອຸປະກອນເສຍ",
            "(Service Request) For requesting additional new services, not caused by faulty equipment",
          )}
        </p>
        <ul className="mt-5 flex-1 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
          {SERVICE_EXAMPLES.map((example) => (
            <li key={example.th} className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
              {t(example)}
            </li>
          ))}
        </ul>
        <Link
          href="/requests/new"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]"
        >
          {t("ส่งคำขอบริการ", "ສົ່ງຄຳຂໍບໍລິການ", "Submit request")}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </section>

      {/* Incident: coming soon */}
      <section className="flex flex-col rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <TriangleAlert className="h-5 w-5" aria-hidden />
          </span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200 ring-inset">
            {t("เร็วๆ นี้", "ໄວໆ ນີ້", "Coming soon")}
          </span>
        </div>
        <h2 className="mt-5 text-lg font-semibold tracking-tight text-slate-700">
          {t("แจ้งปัญหา / อุปกรณ์ขัดข้อง", "ແຈ້ງບັນຫາ / ອຸປະກອນຂັດຂ້ອງ", "Report a problem / faulty equipment")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {t(
            "(Incident Report) สำหรับแจ้งเหตุที่เคยใช้งานได้ปกติแต่เกิดเสีย ชำรุด หรือใช้งานไม่ได้กะทันหัน",
            "(Incident Report) ສຳລັບແຈ້ງເຫດທີ່ເຄີຍໃຊ້ງານໄດ້ປົກກະຕິ ແຕ່ເກີດເສຍ ຊຳລຸດ ຫຼື ໃຊ້ງານບໍ່ໄດ້ໂດຍກະທັນຫັນ",
            "(Incident Report) For reporting something that used to work normally but has broken, been damaged or suddenly stopped working",
          )}
        </p>
        <ul className="mt-5 flex-1 space-y-2.5 border-t border-slate-200/70 pt-5 text-sm text-slate-500">
          {INCIDENT_EXAMPLES.map((example) => (
            <li key={example.th} className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
              {t(example)}
            </li>
          ))}
        </ul>
        <div className="mt-6">
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
    <div className="space-y-5 sm:space-y-6">
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
      className="group flex items-center gap-3.5 rounded-2xl border border-indigo-200/70 bg-indigo-50/60 px-4 py-3.5 transition-colors hover:bg-indigo-50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <ShieldCheck className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900">
          {t(
            `คุณมี ${n} คำขอรอการอนุมัติ`,
            `ທ່ານມີ ${n} ຄຳຂໍລໍຖ້າການອະນຸມັດ`,
            `You have ${n} ${count === 1 ? "request" : "requests"} awaiting approval`,
          )}
        </span>
        <span className="mt-0.5 block text-xs text-slate-500">
          {t(
            "พนักงานเลือกคุณเป็นผู้อนุมัติ คำขอจะเข้าคิวทีม IT หลังจากคุณอนุมัติ",
            "ພະນັກງານເລືອກທ່ານເປັນຜູ້ອະນຸມັດ ຄຳຂໍຈະເຂົ້າຄິວທີມ IT ຫຼັງຈາກທ່ານອະນຸມັດ",
            "Employees have chosen you as their approver. Requests join the IT team's queue after you approve them.",
          )}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-indigo-400 transition group-hover:translate-x-0.5" aria-hidden />
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
  const [{ counts, unassigned }, sla, insights] = await Promise.all([getStaffDashboard(), getSlaOverview(), getStaffInsights()]);

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

      <div className="animate-fade-up motion-reduce:animate-none" style={{ animationDelay: "60ms" }}>
        <StatStrip
          items={[
            {
              label: t("รอหัวหน้าอนุมัติ", "ລໍຫົວໜ້າອະນຸມັດ", "Awaiting manager approval"),
              value: counts.PENDING_APPROVAL,
              href: "/requests?status=PENDING_APPROVAL",
            },
            { label: t("รอ IT ดำเนินการ", "ລໍ IT ດຳເນີນການ", "Waiting for IT"), value: counts.SUBMITTED, href: "/requests?status=SUBMITTED" },
            {
              label: t("กำลังดำเนินการ", "ກຳລັງດຳເນີນການ", "In progress"),
              value: counts.IN_PROGRESS + counts.IN_REVIEW + counts.APPROVED,
              href: "/requests?status=IN_PROGRESS",
            },
            {
              label: t("รอข้อมูล / Vendor", "ລໍຂໍ້ມູນ / Vendor", "Waiting for info / Vendor"),
              value: counts.NEED_INFO + counts.ON_HOLD,
              href: "/requests?status=WAITING",
              hint: t("SLA หยุดนับ", "ຢຸດນັບ SLA", "SLA paused"),
            },
            {
              label: t("เกิน SLA", "ເກີນ SLA", "Over SLA"),
              value: sla.breachedOpen,
              href: "/requests?sla=breached",
              alert: "danger",
              hint: t("ที่ยังไม่ปิด", "ທີ່ຍັງບໍ່ປິດ", "Still open"),
            },
            {
              label: t("ยังไม่มีผู้รับผิดชอบ", "ຍັງບໍ່ມີຜູ້ຮັບຜິດຊອບ", "Unassigned"),
              value: unassigned,
              href: "/requests?scope=unassigned&status=OPEN",
              alert: "warning",
            },
          ]}
        />
      </div>

      <div className="animate-fade-up grid gap-5 motion-reduce:animate-none lg:grid-cols-5" style={{ animationDelay: "120ms" }}>
        <div className="min-w-0 space-y-5 lg:col-span-3">
          <TrendCard daily={insights.daily} />
          {/* grid-cols-1 lets the cards shrink to the screen, so a long type or assignee name is cut off instead of widening the page. */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <TypeBreakdownCard byType={insights.byType} />
            <WorkloadCard workload={insights.workload} />
          </div>
        </div>

        <div className="min-w-0 space-y-5 lg:col-span-2">
          <SlaOverviewCard overview={sla} />
          <StatusBar counts={counts} title={t("สถานะคำขอทั้งหมด", "ສະຖານະຄຳຂໍທັງໝົດ", "All request status")} />
        </div>
      </div>
    </>
  );
}
