import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ClipboardList, Info } from "lucide-react";
import { RequestCatalog, type CatalogGroup } from "@/components/request-catalog";
import { RequestForm } from "@/components/request-form";
import { TypeIcon } from "@/components/type-icon";
import { requiresManagerApproval } from "@/lib/approval";
import { requireUser } from "@/lib/dal";
import { getI18n, getT } from "@/lib/i18n-server";
import { formatDate } from "@/lib/labels";
import { activeStandIns, listApprovers } from "@/lib/queries";
import { REQUEST_CATEGORIES, REQUEST_TYPE_DEFS, isRequestType } from "@/lib/request-types";
import { todayBangkok } from "@/lib/request-number";
import { classifyTier, formatFulfillmentRange } from "@/lib/sla";
import { slaHolidayList } from "@/lib/sla-calendar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("สร้างคำขอใหม่", "ສ້າງຄຳຂໍໃໝ່", "New request") };
}

// `compact` is a slim bar for the catalog, so that the list of request types gets the room.
function Banner({
  title,
  description,
  children,
  compact = false,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-600 via-emerald-600 to-teal-600 px-4 py-3 text-white shadow-lift sm:px-5">
        <div
          className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
          aria-hidden
        />
        <div className="relative flex items-center gap-3">
          <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 sm:flex">
            <ClipboardList className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            <p className="text-xs text-emerald-50/90 sm:text-sm">{description}</p>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 via-emerald-600 to-teal-600 p-6 text-white shadow-lift sm:p-8">
      <div
        className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-teal-300/30 blur-3xl" aria-hidden />
      <div className="relative flex items-start gap-4">
        {children ?? (
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 sm:flex">
            <ClipboardList className="h-6 w-6" aria-hidden />
          </span>
        )}
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/20">Service Request</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-emerald-50/90 sm:text-base">{description}</p>
        </div>
      </div>
    </section>
  );
}

export default async function NewRequestPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { t, lang } = await getI18n();
  const user = await requireUser();
  const { type } = await searchParams;

  if (!isRequestType(type)) {
    const groups: CatalogGroup[] = REQUEST_CATEGORIES.map((category) => ({
      key: category.key,
      label: t(category.label),
      items: category.types.map((requestType) => ({
        type: requestType,
        label: t(REQUEST_TYPE_DEFS[requestType].label),
        description: t(REQUEST_TYPE_DEFS[requestType].description),
        fulfillment: formatFulfillmentRange(classifyTier(requestType, {}), lang),
      })),
    }));

    return (
      <div className="space-y-3.5">
        <Banner
          compact
          title={t("เลือกประเภทบริการที่ต้องการ", "ເລືອກປະເພດບໍລິການທີ່ຕ້ອງການ", "Choose the service you need")}
          description={t(
            "ยื่นคำขอสิทธิ์ ข้อมูล การ Deploy อุปกรณ์ และโครงสร้างพื้นฐาน พร้อมติดตามสถานะและเวลาดำเนินการได้ในระบบนี้",
            "ຍື່ນຄຳຂໍສິດ, ຂໍ້ມູນ, ການ Deploy, ອຸປະກອນ ແລະ ໂຄງສ້າງພື້ນຖານ ພ້ອມຕິດຕາມສະຖານະ ແລະ ເວລາດຳເນີນການໄດ້ໃນລະບົບນີ້",
            "Request access, data, deployments, equipment and infrastructure, and track the status and processing time in this system.",
          )}
        />

        <div className="flex gap-2.5 rounded-xl bg-white px-3.5 py-2.5 text-xs text-slate-600 ring-1 ring-slate-200 ring-inset">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden />
          <div className="space-y-0.5">
            <p>
              {t("ฟอร์มนี้สำหรับ", "ແບບຟອມນີ້ສຳລັບ", "This form is for")} <b className="text-slate-900">{t("คำขอบริการ", "ຄຳຂໍບໍລິການ", "service requests")}</b>{" "}
              {t("ที่วางแผนล่วงหน้าได้ หากอุปกรณ์หรือระบบ", "ທີ່ວາງແຜນລ່ວງໜ້າໄດ້ ຖ້າອຸປະກອນ ຫຼື ລະບົບ", "that can be planned in advance. If equipment or a system is")}{" "}
              <b className="text-slate-900">{t("เสีย / ใช้งานไม่ได้", "ເສຍ / ໃຊ້ງານບໍ່ໄດ້", "broken / not working")}</b>{" "}
              {t(
                "(Incident) กรุณาแจ้งทีม IT ตามช่องทางแจ้งปัญหาเดิมของบริษัท",
                "(Incident) ກະລຸນາແຈ້ງທີມ IT ຜ່ານຊ່ອງທາງແຈ້ງບັນຫາເດີມຂອງບໍລິສັດ",
                "(Incident), please report it to the IT team through the company's usual reporting channel.",
              )}
            </p>
            <p>
              {t("หากต้องการ", "ຖ້າຕ້ອງການ", "To")}{" "}
              <b className="text-slate-900">{t("เพิ่ม / ลด / แก้ไขฟังก์ชันของซอฟต์แวร์", "ເພີ່ມ / ຫຼຸດ / ແກ້ໄຂຟັງຊັນຂອງຊອບແວ", "add, remove or change software functionality")}</b>{" "}
              {t(
                "(Change Request) ซึ่งต้องประเมิน Manday / งบประมาณ ไม่ใช่คำขอบริการ กรุณาแจ้งผ่านช่องทาง CR",
                "(Change Request) ທີ່ຕ້ອງປະເມີນ Manday / ງົບປະມານ ບໍ່ແມ່ນຄຳຂໍບໍລິການ ກະລຸນາແຈ້ງຜ່ານຊ່ອງທາງ CR",
                "(a Change Request), which needs a man-day / budget estimate, use the CR channel. It is not a service request.",
              )}
            </p>
            <p>
              <b className="text-slate-900">{t("ทุกคำขอ", "ທຸກຄຳຂໍ", "Every request")}</b>{" "}
              {t(
                "ต้องได้รับอนุมัติจากหัวหน้างานก่อน ทีม IT จึงจะเริ่มดำเนินการ",
                "ຕ້ອງໄດ້ຮັບອະນຸມັດຈາກຫົວໜ້າກ່ອນ ທີມ IT ຈຶ່ງຈະເລີ່ມດຳເນີນການ",
                "must be approved by a manager before the IT team starts the work",
              )}
            </p>
          </div>
        </div>

        <RequestCatalog groups={groups} />
      </div>
    );
  }

  const def = REQUEST_TYPE_DEFS[type];
  // The requester is whoever is signed in, so the approvers are the managers other than themselves.
  const approverList = await listApprovers(user.id);
  // A manager who is away shows who approves in their place, so the requester knows who will actually see the request.
  const standIns = await activeStandIns(approverList.map((approver) => approver.id));
  const approvers = approverList.map((approver) => {
    const standIn = standIns.find((s) => s.managerId === approver.id);
    if (!standIn) return approver;
    const until = formatDate(new Date(standIn.endsAt.getTime() - 24 * 60 * 60 * 1000), lang);
    return {
      ...approver,
      note: t(
        `ไม่อยู่ — ${standIn.delegate.name} อนุมัติแทนถึง ${until}`,
        `ບໍ່ຢູ່ — ${standIn.delegate.name} ອະນຸມັດແທນຮອດ ${until}`,
        `away — ${standIn.delegate.name} approves until ${until}`,
      ),
    };
  });

  return (
    <div className="mx-auto max-w-5xl space-y-5 2xl:max-w-7xl">
      <nav aria-label={t("เส้นทางนำทาง", "ເສັ້ນທາງນຳທາງ", "Breadcrumb")} className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-800">
          {t("หน้าแรก", "ໜ້າຫຼັກ", "Home")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <Link href="/requests/new" className="hover:text-slate-800">
          {t("สร้างคำขอ", "ສ້າງຄຳຂໍ", "Create request")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="font-medium text-emerald-700">{t(def.label)}</span>
      </nav>

      <Banner title={t(def.label)} description={t(def.description)}>
        <TypeIcon type={type} size="lg" />
      </Banner>

      <RequestForm
        type={type}
        fields={[...def.fields]}
        approvers={approvers}
        needsApproval={requiresManagerApproval(user, approvers.length)}
        holidays={slaHolidayList()}
        today={todayBangkok()}
        requester={{ name: user.name, department: user.department, phone: user.phone }}
      />
    </div>
  );
}
