// Request types and their type-specific fields.
// One definition drives the form UI and the server-side validation. Pure module.
//
// This system handles Service Requests (planned requests for new services, equipment or access),
// not Incidents (something is broken).

import { l, makeT, type Lang, type Localized } from "@/lib/i18n";
import { DATA_REPORTING_DEFS } from "@/lib/request-type-defs/data-reporting";
import { DEPLOYMENT_TRAINING_DEFS } from "@/lib/request-type-defs/deployment-training";
import { DEVOPS_SECURITY_DEFS } from "@/lib/request-type-defs/devops-security";
import { INFRASTRUCTURE_DEFS } from "@/lib/request-type-defs/infrastructure";
import { PEOPLE_DEFS } from "@/lib/request-type-defs/people";
import { ENVIRONMENT, YES_NO } from "@/lib/request-type-shared";

export const REQUEST_TYPES = [
  "HARDWARE",
  "SOFTWARE",
  "ACCESS_ACCOUNT",
  "CONSULTATION",
  "NETWORK_WORKPLACE",
  "AWS_SERVER",
  "DATABASE",
  "PUBLIC_IP_DOMAIN",
  "OTHER",
  "DATA_EXTRACT",
  "DATA_CORRECTION",
  "BULK_IMPORT",
  "REPORT_TEMPLATE",
  "SYSTEM_CONFIG",
  "DEPLOYMENT",
  "BACKUP_RESTORE",
  "TRAINING",
  "DOCUMENT",
  "ENVIRONMENT",
  "FIREWALL",
  "RESOURCE_UPGRADE",
  "CLOUD_RESOURCE",
  "API_CREDENTIAL",
  "SECURITY_REVIEW",
  "ONBOARDING",
  "OFFBOARDING",
] as const;

export type RequestType = (typeof REQUEST_TYPES)[number];

export type FieldOption = { value: string; label: Localized };

export type FieldDef = {
  name: string;
  label: Localized;
  kind: "text" | "textarea" | "select" | "number" | "date";
  required?: boolean;
  options?: readonly FieldOption[];
  placeholder?: Localized;
  help?: Localized;
  min?: number;
  max?: number;
  // Field is only shown (and validated) when an EARLIER field is visible and has one of these values.
  showWhen?: { field: string; in: readonly string[] };
};

export type RequestTypeDef = {
  value: RequestType;
  label: Localized;
  description: Localized;
  fields: readonly FieldDef[];
};

// Who a category is mainly for. The new-request page lets people filter by it: "client" categories are
// requests made for customers or for the people who use the delivered systems, "internal" ones support
// the company's own team, and "both" shows up under either filter.
export const REQUEST_AUDIENCES = ["client", "internal"] as const;
export type RequestAudience = (typeof REQUEST_AUDIENCES)[number];

export const AUDIENCE_LABEL: Record<RequestAudience, Localized> = {
  client: l("ลูกค้า / ผู้ใช้งานระบบ", "ລູກຄ້າ / ຜູ້ໃຊ້ງານລະບົບ", "Customers / system users"),
  internal: l("ทีมงานภายใน", "ທີມງານພາຍໃນ", "Internal team"),
};

export const REQUEST_CATEGORIES = [
  {
    key: "access",
    label: l("Access & Permission", "Access & Permission", "Access & Permission"),
    description: l(
      "บัญชีผู้ใช้ สิทธิ์เข้าถึงระบบ Git, Jira, Server และ Staging / UAT",
      "ບັນຊີຜູ້ໃຊ້, ສິດເຂົ້າເຖິງລະບົບ Git, Jira, Server ແລະ Staging / UAT",
      "User accounts and access to systems, Git, Jira, servers and Staging / UAT",
    ),
    audience: ["client", "internal"],
    types: ["ACCESS_ACCOUNT"],
  },
  {
    key: "data",
    label: l("Data & Reporting", "Data & Reporting", "Data & Reporting"),
    description: l(
      "ดึงข้อมูลพิเศษ แก้ไขข้อมูลใน Database Import ข้อมูลชุดใหญ่ และปรับรูปแบบรายงาน",
      "ດຶງຂໍ້ມູນພິເສດ, ແກ້ໄຂຂໍ້ມູນໃນ Database, Import ຂໍ້ມູນຊຸດໃຫຍ່ ແລະ ປັບຮູບແບບລາຍງານ",
      "Custom data extraction, database data correction, bulk import and report template changes",
    ),
    audience: ["client"],
    types: ["DATA_EXTRACT", "DATA_CORRECTION", "BULK_IMPORT", "REPORT_TEMPLATE"],
  },
  {
    key: "deploy",
    label: l("Deployment & Configuration", "Deployment & Configuration", "Deployment & Configuration"),
    description: l(
      "ปรับตั้งค่าระบบ ขอ Deploy / Hotfix และ Backup / Restore ข้อมูล",
      "ປັບຕັ້ງຄ່າລະບົບ, ຂໍ Deploy / Hotfix ແລະ Backup / Restore ຂໍ້ມູນ",
      "System configuration changes, deployments / hotfixes, and data backup / restore",
    ),
    audience: ["client"],
    types: ["SYSTEM_CONFIG", "DEPLOYMENT", "BACKUP_RESTORE"],
  },
  {
    key: "training",
    label: l("Training & Advisory", "Training & Advisory", "Training & Advisory"),
    description: l(
      "ขอคำปรึกษา จัดอบรมการใช้งานระบบ และขอคู่มือ / เอกสาร",
      "ຂໍຄຳປຶກສາ, ຈັດອົບຮົມການນຳໃຊ້ລະບົບ ແລະ ຂໍຄູ່ມື / ເອກະສານ",
      "Consultation, system training, and manuals / documentation",
    ),
    audience: ["client", "internal"],
    types: ["CONSULTATION", "TRAINING", "DOCUMENT"],
  },
  {
    key: "cloud",
    label: l("Cloud & Infrastructure", "Cloud & Infrastructure", "Cloud & Infrastructure"),
    description: l(
      "Environment, Server บน AWS, Database, Cloud Resource / Repository, Public IP / Domain, Firewall และเพิ่ม Resource",
      "Environment, Server ເທິງ AWS, Database, Cloud Resource / Repository, Public IP / Domain, Firewall ແລະ ເພີ່ມ Resource",
      "Environments, servers on AWS, databases, cloud resources / repositories, Public IP / Domain, firewall and extra resources",
    ),
    audience: ["internal"],
    types: ["ENVIRONMENT", "AWS_SERVER", "DATABASE", "CLOUD_RESOURCE", "PUBLIC_IP_DOMAIN", "FIREWALL", "RESOURCE_UPGRADE"],
  },
  {
    key: "software",
    label: l("Software & License", "Software & License", "Software & License"),
    description: l(
      "ติดตั้งโปรแกรม ฟอนต์ License เครื่องมือพัฒนา และ AI Tools",
      "ຕິດຕັ້ງໂປຣແກຣມ, ຟອນ, License, ເຄື່ອງມືພັດທະນາ ແລະ AI Tools",
      "Install software and fonts, request licenses, developer tools and AI tools",
    ),
    audience: ["internal"],
    types: ["SOFTWARE"],
  },
  {
    key: "hardware",
    label: l("Hardware", "Hardware", "Hardware"),
    description: l(
      "ขอเบิกอุปกรณ์ประจำตัว เครื่องทดสอบ และยืมอุปกรณ์สำหรับ Demo",
      "ຂໍເບີກອຸປະກອນປະຈຳຕົວ, ເຄື່ອງທົດສອບ ແລະ ຢືມອຸປະກອນສຳລັບ Demo",
      "Personal equipment, test devices, and equipment loans for demos",
    ),
    audience: ["internal"],
    types: ["HARDWARE"],
  },
  {
    key: "workplace",
    label: l("Workplace & Network", "Workplace & Network", "Workplace & Network"),
    description: l(
      "สายแลน ย้ายโต๊ะ และเซ็ตอัพอุปกรณ์",
      "ສາຍ LAN, ຍ້າຍໂຕະ ແລະ ຕັ້ງຄ່າອຸປະກອນ",
      "LAN cables, desk moves and equipment setup",
    ),
    audience: ["internal"],
    types: ["NETWORK_WORKPLACE"],
  },
  {
    key: "security",
    label: l("Security & Credentials", "Security & Credentials", "Security & Credentials"),
    description: l(
      "ขอ Access Key / Token / API Key และขอให้ตรวจสอบความปลอดภัย (BYOD, Library / ซอฟต์แวร์ภายนอก)",
      "ຂໍ Access Key / Token / API Key ແລະ ຂໍໃຫ້ກວດສອບຄວາມປອດໄພ (BYOD, Library / ຊອບແວພາຍນອກ)",
      "Access keys / tokens / API keys, and security reviews (BYOD, external libraries / software)",
    ),
    audience: ["internal"],
    types: ["API_CREDENTIAL", "SECURITY_REVIEW"],
  },
  {
    key: "people",
    label: l("Onboarding & Offboarding", "Onboarding & Offboarding", "Onboarding & Offboarding"),
    description: l(
      "เตรียมเครื่องและสิทธิ์ให้พนักงานใหม่ และถอนสิทธิ์ / เก็บอุปกรณ์คืนเมื่อสิ้นสุดโปรเจกต์หรือลาออก",
      "ເຕຣຽມເຄື່ອງ ແລະ ສິດໃຫ້ພະນັກງານໃໝ່ ແລະ ຖອນສິດ / ເກັບອຸປະກອນຄືນເມື່ອສິ້ນສຸດໂປຣເຈັກ ຫຼື ລາອອກ",
      "Get equipment and access ready for new hires, and remove access / collect equipment when a project ends or someone leaves",
    ),
    audience: ["internal"],
    types: ["ONBOARDING", "OFFBOARDING"],
  },
  {
    key: "other",
    label: l("อื่นๆ", "ອື່ນໆ", "Other"),
    description: l("คำขอที่ไม่เข้าหมวดด้านบน", "ຄຳຂໍທີ່ບໍ່ຢູ່ໃນໝວດຂ້າງເທິງ", "Requests that don't fit the categories above"),
    audience: ["client", "internal"],
    types: ["OTHER"],
  },
] as const satisfies readonly {
  key: string;
  label: Localized;
  description: Localized;
  audience: readonly RequestAudience[];
  types: readonly RequestType[];
}[];

/** The category a request type is listed under. */
export function categoryOf(type: RequestType) {
  return REQUEST_CATEGORIES.find((category) => (category.types as readonly RequestType[]).includes(type))!;
}

export const REQUEST_TYPE_DEFS: Record<RequestType, RequestTypeDef> = {
  HARDWARE: {
    value: "HARDWARE",
    label: l("ขอเบิก / เพิ่มอุปกรณ์", "ຂໍເບີກ / ເພີ່ມອຸປະກອນ", "Request / add equipment"),
    description: l(
      "โน้ตบุ๊ก จอภาพ เมาส์ คีย์บอร์ด การเพิ่ม RAM หรืออุปกรณ์สำรอง",
      "ໂນດບຸກ, ຈໍພາບ, ເມົ້າ, ຄີບອດ, ການເພີ່ມ RAM ຫຼື ອຸປະກອນສຳຮອງ",
      "Laptops, monitors, mice, keyboards, RAM upgrades or spare equipment",
    ),
    fields: [
      {
        name: "action",
        label: l("ลักษณะคำขอ", "ລັກສະນະຄຳຂໍ", "Kind of request"),
        kind: "select",
        required: true,
        options: [
          { value: "new", label: l("ขอเบิกอุปกรณ์ใหม่", "ຂໍເບີກອຸປະກອນໃໝ່", "Request new equipment") },
          {
            value: "upgrade",
            label: l(
              "ขอเพิ่ม / อัปเกรดอุปกรณ์เดิม (เช่น RAM, SSD)",
              "ຂໍເພີ່ມ / ອັບເກຣດອຸປະກອນເດີມ (ເຊັ່ນ RAM, SSD)",
              "Add to / upgrade existing equipment (e.g. RAM, SSD)",
            ),
          },
          { value: "loan", label: l("ขอยืม / อุปกรณ์สำรอง", "ຂໍຢືມ / ອຸປະກອນສຳຮອງ", "Borrow / spare equipment") },
        ],
      },
      {
        name: "deviceType",
        label: l("ประเภทอุปกรณ์", "ປະເພດອຸປະກອນ", "Equipment type"),
        kind: "select",
        required: true,
        options: [
          { value: "laptop", label: l("โน้ตบุ๊ก", "ໂນດບຸກ", "Laptop") },
          { value: "desktop", label: l("คอมพิวเตอร์ตั้งโต๊ะ", "ຄອມພິວເຕີຕັ້ງໂຕະ", "Desktop computer") },
          { value: "monitor", label: l("จอภาพ", "ຈໍພາບ", "Monitor") },
          {
            value: "peripheral",
            label: l(
              "เมาส์ / คีย์บอร์ด / อุปกรณ์ต่อพ่วง",
              "ເມົ້າ / ຄີບອດ / ອຸປະກອນຕໍ່ພ່ວງ",
              "Mouse / keyboard / peripherals",
            ),
          },
          {
            value: "dock-ergonomic",
            label: l(
              "Docking Station / อุปกรณ์เออร์โกโนมิกส์",
              "Docking Station / ອຸປະກອນເອີໂກໂນມິກ",
              "Docking station / ergonomic equipment",
            ),
          },
          { value: "memory-storage", label: l("RAM / SSD / ฮาร์ดดิสก์", "RAM / SSD / ຮາດດິດ", "RAM / SSD / hard disk") },
          { value: "mobile", label: l("โทรศัพท์ / แท็บเล็ต", "ໂທລະສັບ / ແທັບເລັດ", "Phone / tablet") },
          {
            value: "test-device",
            label: l(
              "เครื่องทดสอบ (Mobile iOS / Android, เครื่องสแกนบาร์โค้ด, AI Box / Mini PC)",
              "ເຄື່ອງທົດສອບ (Mobile iOS / Android, ເຄື່ອງສະແກນບາໂຄດ, AI Box / Mini PC)",
              "Test device (iOS / Android mobile, barcode scanner, AI Box / Mini PC)",
            ),
          },
          {
            value: "demo-device",
            label: l(
              "อุปกรณ์สำหรับ Demo ลูกค้า (เครื่องพิมพ์ความร้อน, Smart Card Reader)",
              "ອຸປະກອນສຳລັບ Demo ລູກຄ້າ (ເຄື່ອງພິມຄວາມຮ້ອນ, Smart Card Reader)",
              "Customer demo equipment (thermal printer, Smart Card Reader)",
            ),
          },
          {
            value: "other",
            label: l("อื่นๆ (ระบุในรายละเอียด)", "ອື່ນໆ (ລະບຸໃນລາຍລະອຽດ)", "Other (specify in the details)"),
          },
        ],
      },
      {
        name: "specification",
        label: l("สเปก / รุ่นที่ต้องการ", "ສະເປັກ / ລຸ້ນທີ່ຕ້ອງການ", "Specification / model needed"),
        kind: "text",
        placeholder: l(
          "เช่น RAM 32GB, Core i7, จอ 27 นิ้ว",
          "ເຊັ່ນ RAM 32GB, Core i7, ຈໍ 27 ນິ້ວ",
          "e.g. RAM 32GB, Core i7, 27-inch monitor",
        ),
      },
      { name: "quantity", label: l("จำนวน", "ຈຳນວນ", "Quantity"), kind: "number", required: true, min: 1, max: 100 },
      {
        name: "forUser",
        label: l("ผู้ใช้งานอุปกรณ์", "ຜູ້ໃຊ້ງານອຸປະກອນ", "Equipment user"),
        kind: "text",
        required: true,
        placeholder: l("ชื่อ-สกุล หรืออีเมล", "ຊື່-ນາມສະກຸນ ຫຼື ອີເມວ", "Full name or email"),
      },
      {
        name: "assetTag",
        label: l("Asset tag ของเครื่องเดิม", "Asset tag ຂອງເຄື່ອງເດີມ", "Asset tag of the existing device"),
        kind: "text",
        required: true,
        placeholder: l("เช่น NB-0123", "ເຊັ່ນ NB-0123", "e.g. NB-0123"),
        showWhen: { field: "action", in: ["upgrade"] },
      },
      {
        name: "loanUntil",
        label: l("คืนภายในวันที่", "ສົ່ງຄືນພາຍໃນວັນທີ", "Return by"),
        kind: "date",
        required: true,
        showWhen: { field: "action", in: ["loan"] },
      },
      {
        name: "deliveryLocation",
        label: l("สถานที่รับอุปกรณ์", "ສະຖານທີ່ຮັບອຸປະກອນ", "Delivery location"),
        kind: "text",
        required: true,
        placeholder: l("อาคาร / ชั้น / แผนก", "ອາຄານ / ຊັ້ນ / ພະແນກ", "Building / floor / department"),
      },
    ],
  },
  SOFTWARE: {
    value: "SOFTWARE",
    label: l("ติดตั้งซอฟต์แวร์ / License / ฟอนต์", "ຕິດຕັ້ງຊອບແວ / License / ຟອນ", "Install software / License / fonts"),
    description: l(
      "ติดตั้งโปรแกรมเฉพาะทาง (เช่น Adobe, Visio) ฟอนต์ใหม่ หรือขอ License",
      "ຕິດຕັ້ງໂປຣແກຣມສະເພາະທາງ (ເຊັ່ນ Adobe, Visio), ຟອນໃໝ່ ຫຼື ຂໍ License",
      "Install specialist programs (e.g. Adobe, Visio) or new fonts, or request a License",
    ),
    fields: [
      {
        name: "itemType",
        label: l("สิ่งที่ต้องการ", "ສິ່ງທີ່ຕ້ອງການ", "What you need"),
        kind: "select",
        required: true,
        options: [
          { value: "program", label: l("โปรแกรม", "ໂປຣແກຣມ", "Program") },
          { value: "font", label: l("ฟอนต์", "ຟອນ", "Font") },
          { value: "license", label: l("License / Subscription", "License / Subscription", "License / Subscription") },
          {
            value: "ai-tool",
            label: l(
              "AI Tools / API Key (เช่น Claude, ChatGPT)",
              "AI Tools / API Key (ເຊັ່ນ Claude, ChatGPT)",
              "AI tools / API key (e.g. Claude, ChatGPT)",
            ),
          },
        ],
      },
      {
        name: "softwareName",
        label: l("ชื่อซอฟต์แวร์ / ฟอนต์", "ຊື່ຊອບແວ / ຟອນ", "Software / font name"),
        kind: "text",
        required: true,
        placeholder: l(
          "เช่น Adobe Illustrator, Microsoft Visio",
          "ເຊັ່ນ Adobe Illustrator, Microsoft Visio",
          "e.g. Adobe Illustrator, Microsoft Visio",
        ),
      },
      { name: "version", label: l("เวอร์ชัน", "ເວີຊັນ", "Version"), kind: "text" },
      {
        name: "licenseType",
        label: l("ประเภท License", "ປະເພດ License", "License type"),
        kind: "select",
        required: true,
        options: [
          { value: "free", label: l("ฟรี / Open source", "ຟຣີ / Open source", "Free / Open source") },
          { value: "licensed", label: l("มี license อยู่แล้ว", "ມີ license ແລ້ວ", "Already have a license") },
          { value: "need-purchase", label: l("ต้องจัดซื้อ license", "ຕ້ອງຈັດຊື້ license", "License must be purchased") },
        ],
      },
      {
        name: "targetMachine",
        label: l("เครื่องที่ต้องการติดตั้ง", "ເຄື່ອງທີ່ຕ້ອງການຕິດຕັ້ງ", "Device to install on"),
        kind: "text",
        required: true,
        placeholder: l("ชื่อเครื่อง หรือ Asset tag", "ຊື່ເຄື່ອງ ຫຼື Asset tag", "Device name or Asset tag"),
        showWhen: { field: "itemType", in: ["program", "font", "license"] },
      },
      {
        name: "sourceUrl",
        label: l("ลิงก์เว็บไซต์ / ดาวน์โหลด", "ລິ້ງເວັບໄຊ / ດາວໂຫຼດ", "Website / download link"),
        kind: "text",
      },
    ],
  },
  ACCESS_ACCOUNT: {
    value: "ACCESS_ACCOUNT",
    label: l("ขอสิทธิ์ / บัญชีผู้ใช้", "ຂໍສິດ / ບັນຊີຜູ້ໃຊ້", "Request access / user account"),
    description: l(
      "สร้างอีเมลพนักงานใหม่ ขอสิทธิ์ Shared Folder, ERP / CRM หรือระบบอื่นๆ",
      "ສ້າງອີເມວພະນັກງານໃໝ່, ຂໍສິດ Shared Folder, ERP / CRM ຫຼື ລະບົບອື່ນໆ",
      "Create an email for a new employee, or request access to a Shared Folder, ERP / CRM or other systems",
    ),
    fields: [
      {
        name: "system",
        label: l("ระบบ / บริการ", "ລະບົບ / ບໍລິການ", "System / service"),
        kind: "select",
        required: true,
        options: [
          { value: "email", label: l("อีเมลบริษัท", "ອີເມວບໍລິສັດ", "Company email") },
          {
            value: "shared-folder",
            label: l("Shared Folder / ไฟล์เซิร์ฟเวอร์", "Shared Folder / ໄຟລ໌ Server", "Shared Folder / file server"),
          },
          { value: "erp-crm", label: l("ระบบ ERP / CRM", "ລະບົບ ERP / CRM", "ERP / CRM system") },
          {
            value: "cloud",
            label: l(
              "Cloud / DevOps (AWS, GitHub, Supabase ฯลฯ)",
              "Cloud / DevOps (AWS, GitHub, Supabase ແລະ ອື່ນໆ)",
              "Cloud / DevOps (AWS, GitHub, Supabase, etc.)",
            ),
          },
          {
            value: "git",
            label: l(
              "Git Repository / Project Workspace (GitHub, GitLab, Bitbucket)",
              "Git Repository / Project Workspace (GitHub, GitLab, Bitbucket)",
              "Git repository / project workspace (GitHub, GitLab, Bitbucket)",
            ),
          },
          {
            value: "pm-tool",
            label: l(
              "ระบบบริหารโครงการ (Jira, ClickUp, Asana, Monday.com)",
              "ລະບົບບໍລິຫານໂຄງການ (Jira, ClickUp, Asana, Monday.com)",
              "Project management tool (Jira, ClickUp, Asana, Monday.com)",
            ),
          },
          {
            value: "server-access",
            label: l(
              "Cloud / Database Server (SSH Key, VPN, Bastion Host, Zero Trust, Supabase / Postgres)",
              "Cloud / Database Server (SSH Key, VPN, Bastion Host, Zero Trust, Supabase / Postgres)",
              "Cloud / database server (SSH key, VPN, bastion host, Zero Trust, Supabase / Postgres)",
            ),
          },
          {
            value: "database",
            label: l(
              "Database ของโปรเจกต์ (อ่านอย่างเดียว / เขียน แยกตาม Environment)",
              "Database ຂອງໂປຣເຈັກ (ອ່ານຢ່າງດຽວ / ຂຽນ ແຍກຕາມ Environment)",
              "Project database (read-only / write, per environment)",
            ),
          },
          {
            value: "cloud-iam",
            label: l(
              "Cloud IAM Permissions (AWS, GCP, Azure)",
              "Cloud IAM Permissions (AWS, GCP, Azure)",
              "Cloud IAM permissions (AWS, GCP, Azure)",
            ),
          },
          {
            value: "special-env",
            label: l(
              "สภาพแวดล้อมพิเศษ / รายงานพิเศษ (Staging, UAT)",
              "ສະພາບແວດລ້ອມພິເສດ / ລາຍງານພິເສດ (Staging, UAT)",
              "Special environment / special report (Staging, UAT)",
            ),
          },
          { value: "other", label: l("ระบบอื่นๆ", "ລະບົບອື່ນໆ", "Other system") },
        ],
      },
      {
        name: "systemDetail",
        label: l("ชื่อระบบ / โฟลเดอร์ / ทรัพยากร", "ຊື່ລະບົບ / ໂຟນເດີ / ຊັບພະຍາກອນ", "System / folder / resource name"),
        kind: "text",
        required: true,
        placeholder: l(
          "เช่น \\\\fileserver\\Finance, SAP, GitHub organization",
          "ເຊັ່ນ \\\\fileserver\\Finance, SAP, GitHub organization",
          "e.g. \\\\fileserver\\Finance, SAP, GitHub organization",
        ),
        showWhen: {
          field: "system",
          in: ["shared-folder", "erp-crm", "cloud", "git", "pm-tool", "server-access", "database", "cloud-iam", "special-env", "other"],
        },
      },
      {
        name: "environment",
        label: l("สภาพแวดล้อม", "ສະພາບແວດລ້ອມ", "Environment"),
        kind: "select",
        required: true,
        options: ENVIRONMENT,
        showWhen: { field: "system", in: ["database", "cloud-iam"] },
      },
      {
        name: "action",
        label: l("ประเภทคำขอ", "ປະເພດຄຳຂໍ", "Request type"),
        kind: "select",
        required: true,
        options: [
          {
            value: "new-account",
            label: l(
              "สร้างบัญชีใหม่ (เช่น พนักงานใหม่)",
              "ສ້າງບັນຊີໃໝ່ (ເຊັ່ນ ພະນັກງານໃໝ່)",
              "Create a new account (e.g. new employee)",
            ),
          },
          { value: "grant", label: l("ขอสิทธิ์เพิ่ม", "ຂໍສິດເພີ່ມ", "Request additional access") },
          {
            value: "change-role",
            label: l(
              "ปรับระดับสิทธิ์ (เช่น Viewer เป็น Editor / Approver)",
              "ປັບລະດັບສິດ (ເຊັ່ນ Viewer ເປັນ Editor / Approver)",
              "Change access level (e.g. Viewer to Editor / Approver)",
            ),
          },
          { value: "revoke", label: l("ถอนสิทธิ์ / ปิดบัญชี", "ຖອນສິດ / ປິດບັນຊີ", "Remove access / close account") },
          { value: "reset", label: l("รีเซ็ตรหัสผ่าน / MFA", "ຣີເຊັດລະຫັດຜ່ານ / MFA", "Reset password / MFA") },
          { value: "unblock", label: l("ปลดล็อกบัญชี", "ປົດລັອກບັນຊີ", "Unblock account") },
        ],
      },
      {
        name: "targetUser",
        label: l(
          "ผู้ที่จะได้รับสิทธิ์ / เจ้าของบัญชี",
          "ຜູ້ທີ່ຈະໄດ້ຮັບສິດ / ເຈົ້າຂອງບັນຊີ",
          "Person receiving access / account owner",
        ),
        kind: "text",
        required: true,
        placeholder: l("ชื่อ-สกุล หรืออีเมล", "ຊື່-ນາມສະກຸນ ຫຼື ອີເມວ", "Full name or email"),
      },
      {
        name: "startDate",
        label: l("วันที่เริ่มงาน (พนักงานใหม่)", "ວັນທີເລີ່ມວຽກ (ພະນັກງານໃໝ່)", "Start date (new employee)"),
        kind: "date",
        showWhen: { field: "action", in: ["new-account"] },
      },
      {
        name: "accessLevel",
        label: l("ระดับสิทธิ์", "ລະດັບສິດ", "Access level"),
        kind: "select",
        required: true,
        options: [
          { value: "read", label: l("อ่านอย่างเดียว", "ອ່ານຢ່າງດຽວ", "Read only") },
          { value: "write", label: l("อ่านและเขียน", "ອ່ານ ແລະ ຂຽນ", "Read and write") },
          { value: "approver", label: l("ผู้อนุมัติ (Approver)", "ຜູ້ອະນຸມັດ (Approver)", "Approver") },
          { value: "admin", label: l("ผู้ดูแล (Admin)", "ຜູ້ດູແລ (Admin)", "Administrator (Admin)") },
        ],
        showWhen: { field: "action", in: ["new-account", "grant", "change-role"] },
      },
      {
        name: "duration",
        label: l("ระยะเวลา", "ໄລຍະເວລາ", "Duration"),
        kind: "select",
        required: true,
        options: [
          { value: "permanent", label: l("ถาวร", "ຖາວອນ", "Permanent") },
          { value: "temporary", label: l("ชั่วคราว", "ຊົ່ວຄາວ", "Temporary") },
        ],
        showWhen: { field: "action", in: ["new-account", "grant"] },
      },
      {
        name: "expiresOn",
        label: l("วันที่สิ้นสุดสิทธิ์", "ວັນທີສິ້ນສຸດສິດ", "Access end date"),
        kind: "date",
        required: true,
        showWhen: { field: "duration", in: ["temporary"] },
      },
    ],
  },
  CONSULTATION: {
    value: "CONSULTATION",
    label: l("ขอคำปรึกษา", "ຂໍຄຳປຶກສາ", "Request a consultation"),
    description: l(
      "ขอคำแนะนำการใช้งานระบบ การวางแผนระบบ หรือความปลอดภัยของข้อมูล",
      "ຂໍຄຳແນະນຳການນຳໃຊ້ລະບົບ, ການວາງແຜນລະບົບ ຫຼື ຄວາມປອດໄພຂອງຂໍ້ມູນ",
      "Get advice on using systems, planning systems or data security",
    ),
    fields: [
      {
        name: "topic",
        label: l("หัวข้อที่ต้องการปรึกษา", "ຫົວຂໍ້ທີ່ຕ້ອງການປຶກສາ", "Consultation topic"),
        kind: "select",
        required: true,
        options: [
          { value: "system-usage", label: l("การใช้งานระบบ / โปรแกรม", "ການນຳໃຊ້ລະບົບ / ໂປຣແກຣມ", "Using systems / programs") },
          {
            value: "planning",
            label: l(
              "การวางแผนระบบ / ทรัพยากรใหม่",
              "ການວາງແຜນລະບົບ / ຊັບພະຍາກອນໃໝ່",
              "Planning systems / new resources",
            ),
          },
          {
            value: "security",
            label: l("ความปลอดภัย / การเข้าถึงข้อมูล", "ຄວາມປອດໄພ / ການເຂົ້າເຖິງຂໍ້ມູນ", "Security / data access"),
          },
          {
            value: "api-integration",
            label: l(
              "การต่อเชื่อม API กับระบบภายนอก (ก่อนทำ Change Request)",
              "ການເຊື່ອມຕໍ່ API ກັບລະບົບພາຍນອກ (ກ່ອນເຮັດ Change Request)",
              "Connecting an API to an external system (before a Change Request)",
            ),
          },
          {
            value: "tool-setup",
            label: l(
              "ช่วยตั้งค่าเครื่องมือพื้นฐาน (SSH Key, VPN, สิทธิ์ใน Jira / Confluence)",
              "ຊ່ວຍຕັ້ງຄ່າເຄື່ອງມືພື້ນຖານ (SSH Key, VPN, ສິດໃນ Jira / Confluence)",
              "Help setting up basic tools (SSH key, VPN, Jira / Confluence access)",
            ),
          },
          { value: "other", label: l("อื่นๆ", "ອື່ນໆ", "Other") },
        ],
      },
      {
        name: "relatedSystem",
        label: l("ระบบที่เกี่ยวข้อง", "ລະບົບທີ່ກ່ຽວຂ້ອງ", "Related system"),
        kind: "text",
        placeholder: l("เช่น Microsoft 365, ERP", "ເຊັ່ນ Microsoft 365, ERP", "e.g. Microsoft 365, ERP"),
      },
      {
        name: "channel",
        label: l("ช่องทางที่สะดวก", "ຊ່ອງທາງທີ່ສະດວກ", "Preferred channel"),
        kind: "select",
        required: true,
        options: [
          { value: "online", label: l("ประชุมออนไลน์", "ປະຊຸມອອນລາຍ", "Online meeting") },
          { value: "onsite", label: l("พบที่ออฟฟิศ", "ພົບທີ່ຫ້ອງການ", "In person at the office") },
          { value: "message", label: l("ตอบทางข้อความ", "ຕອບທາງຂໍ້ຄວາມ", "Reply by message") },
        ],
      },
    ],
  },
  NETWORK_WORKPLACE: {
    value: "NETWORK_WORKPLACE",
    label: l(
      "สายแลน / ย้ายโต๊ะ / เซ็ตอัพอุปกรณ์",
      "ສາຍ LAN / ຍ້າຍໂຕະ / ຕັ້ງຄ່າອຸປະກອນ",
      "LAN cable / desk move / equipment setup",
    ),
    description: l(
      "ขอสายแลนหรือจุดเชื่อมต่อเพิ่ม ย้ายจุดโต๊ะทำงาน และให้เซ็ตอัพอุปกรณ์ใหม่",
      "ຂໍສາຍ LAN ຫຼື ຈຸດເຊື່ອມຕໍ່ເພີ່ມ, ຍ້າຍຈຸດໂຕະເຮັດວຽກ ແລະ ໃຫ້ຕັ້ງຄ່າອຸປະກອນໃໝ່",
      "Request extra LAN cables or connection points, move a workstation, or have new equipment set up",
    ),
    fields: [
      {
        name: "service",
        label: l("บริการที่ต้องการ", "ບໍລິການທີ່ຕ້ອງການ", "Service needed"),
        kind: "select",
        required: true,
        options: [
          {
            value: "lan-cable",
            label: l("ขอสายแลน / จุด LAN เพิ่ม", "ຂໍສາຍ LAN / ຈຸດ LAN ເພີ່ມ", "Request extra LAN cable / LAN point"),
          },
          {
            value: "desk-move",
            label: l(
              "ย้ายจุดโต๊ะทำงาน (พร้อมเซ็ตอัพ)",
              "ຍ້າຍຈຸດໂຕະເຮັດວຽກ (ພ້ອມຕັ້ງຄ່າ)",
              "Move workstation (with setup)",
            ),
          },
          { value: "device-setup", label: l("เซ็ตอัพอุปกรณ์ใหม่", "ຕັ້ງຄ່າອຸປະກອນໃໝ່", "Set up new equipment") },
        ],
      },
      {
        name: "location",
        label: l("สถานที่ (อาคาร / ชั้น / โซน)", "ສະຖານທີ່ (ອາຄານ / ຊັ້ນ / ໂຊນ)", "Location (building / floor / zone)"),
        kind: "text",
        required: true,
        placeholder: l(
          "เช่น อาคาร A ชั้น 3 โซนบัญชี",
          "ເຊັ່ນ ອາຄານ A ຊັ້ນ 3 ໂຊນບັນຊີ",
          "e.g. Building A, floor 3, accounting zone",
        ),
      },
      {
        name: "toLocation",
        label: l(
          "ย้ายไปที่ (อาคาร / ชั้น / โซน)",
          "ຍ້າຍໄປທີ່ (ອາຄານ / ຊັ້ນ / ໂຊນ)",
          "Move to (building / floor / zone)",
        ),
        kind: "text",
        required: true,
        showWhen: { field: "service", in: ["desk-move"] },
      },
      {
        name: "quantity",
        label: l("จำนวนจุด / อุปกรณ์", "ຈຳນວນຈຸດ / ອຸປະກອນ", "Number of points / devices"),
        kind: "number",
        min: 1,
        max: 500,
      },
      {
        name: "devices",
        label: l("อุปกรณ์ที่ต้องเซ็ตอัพ", "ອຸປະກອນທີ່ຕ້ອງຕັ້ງຄ່າ", "Equipment to set up"),
        kind: "text",
        placeholder: l(
          "เช่น คอมพิวเตอร์ 1 เครื่อง จอ 2 จอ โทรศัพท์ 1 เครื่อง",
          "ເຊັ່ນ ຄອມພິວເຕີ 1 ເຄື່ອງ, ຈໍ 2 ຈໍ, ໂທລະສັບ 1 ເຄື່ອງ",
          "e.g. 1 computer, 2 monitors, 1 phone",
        ),
        showWhen: { field: "service", in: ["desk-move", "device-setup"] },
      },
    ],
  },
  AWS_SERVER: {
    value: "AWS_SERVER",
    label: l("ติดตั้ง Server บน AWS", "ຕິດຕັ້ງ Server ເທິງ AWS", "Set up a Server on AWS"),
    description: l(
      "ขอสร้างและติดตั้ง EC2 / Server บน AWS สำหรับโปรเจ็คหรือระบบงาน",
      "ຂໍສ້າງ ແລະ ຕິດຕັ້ງ EC2 / Server ເທິງ AWS ສຳລັບໂປຣເຈັກ ຫຼື ລະບົບງານ",
      "Request creation and setup of an EC2 / Server on AWS for a project or system",
    ),
    fields: [
      {
        name: "projectName",
        label: l("ชื่อโปรเจ็ค / ระบบ", "ຊື່ໂປຣເຈັກ / ລະບົບ", "Project / system name"),
        kind: "text",
        required: true,
      },
      {
        name: "environment",
        label: l("สภาพแวดล้อม", "ສະພາບແວດລ້ອມ", "Environment"),
        kind: "select",
        required: true,
        options: ENVIRONMENT,
      },
      {
        name: "awsRegion",
        label: l("AWS Region", "AWS Region", "AWS Region"),
        kind: "select",
        required: true,
        options: [
          {
            value: "ap-southeast-1",
            label: l("Singapore (ap-southeast-1)", "Singapore (ap-southeast-1)", "Singapore (ap-southeast-1)"),
          },
          {
            value: "ap-southeast-7",
            label: l("Thailand (ap-southeast-7)", "Thailand (ap-southeast-7)", "Thailand (ap-southeast-7)"),
          },
          { value: "us-east-1", label: l("N. Virginia (us-east-1)", "N. Virginia (us-east-1)", "N. Virginia (us-east-1)") },
          {
            value: "other",
            label: l("อื่นๆ (ระบุในรายละเอียด)", "ອື່ນໆ (ລະບຸໃນລາຍລະອຽດ)", "Other (specify in the details)"),
          },
        ],
      },
      {
        name: "os",
        label: l("ระบบปฏิบัติการ", "ລະບົບປະຕິບັດການ", "Operating system"),
        kind: "select",
        required: true,
        options: [
          { value: "ubuntu-24.04", label: l("Ubuntu 24.04 LTS", "Ubuntu 24.04 LTS", "Ubuntu 24.04 LTS") },
          { value: "ubuntu-22.04", label: l("Ubuntu 22.04 LTS", "Ubuntu 22.04 LTS", "Ubuntu 22.04 LTS") },
          { value: "amazon-linux-2023", label: l("Amazon Linux 2023", "Amazon Linux 2023", "Amazon Linux 2023") },
          { value: "windows-2022", label: l("Windows Server 2022", "Windows Server 2022", "Windows Server 2022") },
          {
            value: "other",
            label: l("อื่นๆ (ระบุในรายละเอียด)", "ອື່ນໆ (ລະບຸໃນລາຍລະອຽດ)", "Other (specify in the details)"),
          },
        ],
      },
      {
        name: "instanceType",
        label: l("ขนาด Instance", "ຂະໜາດ Instance", "Instance size"),
        kind: "text",
        required: true,
        placeholder: l("เช่น t3.medium", "ເຊັ່ນ t3.medium", "e.g. t3.medium"),
      },
      {
        name: "storageGb",
        label: l("พื้นที่จัดเก็บ (GB)", "ພື້ນທີ່ຈັດເກັບ (GB)", "Storage (GB)"),
        kind: "number",
        required: true,
        min: 8,
        max: 16000,
      },
      {
        name: "publicAccess",
        label: l(
          "ต้องเข้าถึงจากอินเทอร์เน็ตหรือไม่",
          "ຕ້ອງການເຂົ້າເຖິງຈາກອິນເຕີເນັດ ຫຼື ບໍ່",
          "Internet access needed",
        ),
        kind: "select",
        required: true,
        options: YES_NO(
          l("ต้องการ (Public)", "ຕ້ອງການ (Public)", "Needed (Public)"),
          l("ไม่ต้องการ (Private / VPN)", "ບໍ່ຕ້ອງການ (Private / VPN)", "Not needed (Private / VPN)"),
        ),
      },
      {
        name: "monthlyBudget",
        label: l("งบประมาณต่อเดือน (บาท)", "ງົບປະມານຕໍ່ເດືອນ (ບາດ)", "Monthly budget (THB)"),
        kind: "number",
        min: 0,
        max: 100000000,
        help: l("ประมาณการคร่าวๆ ถ้ามี", "ຄາດຄະເນໂດຍປະມານ ຖ້າມີ", "Rough estimate, if available"),
      },
    ],
  },
  DATABASE: {
    value: "DATABASE",
    label: l("สร้าง Database", "ສ້າງ Database", "Create a Database"),
    description: l(
      "ขออนุมัติสร้าง Database เช่น Supabase (PostgreSQL) หรือ MongoDB",
      "ຂໍອະນຸມັດສ້າງ Database ເຊັ່ນ Supabase (PostgreSQL) ຫຼື MongoDB",
      "Request approval to create a Database such as Supabase (PostgreSQL) or MongoDB",
    ),
    fields: [
      {
        name: "engine",
        label: l("ชนิด Database", "ປະເພດ Database", "Database type"),
        kind: "select",
        required: true,
        options: [
          { value: "supabase", label: l("Supabase (PostgreSQL)", "Supabase (PostgreSQL)", "Supabase (PostgreSQL)") },
          { value: "mongodb", label: l("MongoDB", "MongoDB", "MongoDB") },
          {
            value: "other",
            label: l("อื่นๆ (ระบุในรายละเอียด)", "ອື່ນໆ (ລະບຸໃນລາຍລະອຽດ)", "Other (specify in the details)"),
          },
        ],
      },
      {
        name: "projectName",
        label: l("ชื่อโปรเจ็ค / ระบบ", "ຊື່ໂປຣເຈັກ / ລະບົບ", "Project / system name"),
        kind: "text",
        required: true,
      },
      {
        name: "environment",
        label: l("สภาพแวดล้อม", "ສະພາບແວດລ້ອມ", "Environment"),
        kind: "select",
        required: true,
        options: ENVIRONMENT,
      },
      {
        name: "hosting",
        label: l("รูปแบบการติดตั้ง", "ຮູບແບບການຕິດຕັ້ງ", "Deployment type"),
        kind: "select",
        required: true,
        options: [
          {
            value: "managed-cloud",
            label: l(
              "Managed Cloud (Supabase Cloud / MongoDB Atlas)",
              "Managed Cloud (Supabase Cloud / MongoDB Atlas)",
              "Managed Cloud (Supabase Cloud / MongoDB Atlas)",
            ),
          },
          { value: "self-hosted-aws", label: l("Self-hosted บน AWS", "Self-hosted ເທິງ AWS", "Self-hosted on AWS") },
          {
            value: "other",
            label: l("อื่นๆ (ระบุในรายละเอียด)", "ອື່ນໆ (ລະບຸໃນລາຍລະອຽດ)", "Other (specify in the details)"),
          },
        ],
      },
      {
        name: "expectedSize",
        label: l("ขนาดข้อมูลโดยประมาณ", "ຂະໜາດຂໍ້ມູນໂດຍປະມານ", "Estimated data size"),
        kind: "select",
        options: [
          { value: "lt-1gb", label: l("น้อยกว่า 1 GB", "ໜ້ອຍກວ່າ 1 GB", "Less than 1 GB") },
          { value: "1-10gb", label: l("1 – 10 GB", "1 – 10 GB", "1 – 10 GB") },
          { value: "10-100gb", label: l("10 – 100 GB", "10 – 100 GB", "10 – 100 GB") },
          { value: "gt-100gb", label: l("มากกว่า 100 GB", "ຫຼາຍກວ່າ 100 GB", "More than 100 GB") },
        ],
      },
      {
        name: "personalData",
        label: l(
          "มีข้อมูลส่วนบุคคล (PII) หรือไม่",
          "ມີຂໍ້ມູນສ່ວນບຸກຄົນ (PII) ຫຼື ບໍ່",
          "Contains personal data (PII)",
        ),
        kind: "select",
        required: true,
        options: YES_NO(l("มี", "ມີ", "Yes"), l("ไม่มี", "ບໍ່ມີ", "No")),
        help: l(
          "ใช้ประกอบการพิจารณาด้านความปลอดภัยและ PDPA",
          "ໃຊ້ປະກອບການພິຈາລະນາດ້ານຄວາມປອດໄພ ແລະ PDPA",
          "Used to assess security and PDPA requirements",
        ),
      },
      {
        name: "admins",
        label: l("ผู้ดูแล / ผู้ที่ต้องเข้าถึง", "ຜູ້ດູແລ / ຜູ້ທີ່ຕ້ອງເຂົ້າເຖິງ", "Administrators / people who need access"),
        kind: "text",
        placeholder: l(
          "อีเมล คั่นด้วยเครื่องหมายจุลภาค",
          "ອີເມວ ແຍກດ້ວຍເຄື່ອງໝາຍ ( , )",
          "Emails, separated by commas",
        ),
      },
    ],
  },
  PUBLIC_IP_DOMAIN: {
    value: "PUBLIC_IP_DOMAIN",
    label: l("Public IP / Domain / SSL", "Public IP / Domain / SSL", "Public IP / Domain / SSL"),
    description: l(
      "ขออนุมัติสร้าง Public IP (Elastic IP) Domain / Subdomain, SSL/TLS Certificate หรือ Cloudflare Setup",
      "ຂໍອະນຸມັດສ້າງ Public IP (Elastic IP), Domain / Subdomain, SSL/TLS Certificate ຫຼື Cloudflare Setup",
      "Request approval for a Public IP (Elastic IP), a Domain / Subdomain, an SSL/TLS Certificate or a Cloudflare setup",
    ),
    fields: [
      {
        name: "kind",
        label: l("สิ่งที่ต้องการ", "ສິ່ງທີ່ຕ້ອງການ", "What you need"),
        kind: "select",
        required: true,
        options: [
          { value: "public-ip", label: l("Public IP (Elastic IP)", "Public IP (Elastic IP)", "Public IP (Elastic IP)") },
          { value: "domain", label: l("Domain / Subdomain", "Domain / Subdomain", "Domain / Subdomain") },
          { value: "both", label: l("ทั้ง Public IP และ Domain", "ທັງ Public IP ແລະ Domain", "Both Public IP and Domain") },
          {
            value: "ssl-only",
            label: l("SSL/TLS Certificate เท่านั้น", "SSL/TLS Certificate ເທົ່ານັ້ນ", "SSL/TLS Certificate only"),
          },
          { value: "cloudflare", label: l("Cloudflare Setup", "Cloudflare Setup", "Cloudflare setup") },
        ],
      },
      {
        name: "domainName",
        label: l("ชื่อ Domain", "ຊື່ Domain", "Domain name"),
        kind: "text",
        required: true,
        placeholder: l("เช่น app.example.com", "ເຊັ່ນ app.example.com", "e.g. app.example.com"),
        showWhen: { field: "kind", in: ["domain", "both", "ssl-only", "cloudflare"] },
      },
      {
        name: "targetServer",
        label: l("ปลายทาง (Server / บริการ)", "ປາຍທາງ (Server / ບໍລິການ)", "Destination (Server / service)"),
        kind: "text",
        required: true,
        placeholder: l(
          "เช่น EC2 instance id, IP หรือชื่อบริการ",
          "ເຊັ່ນ EC2 instance id, IP ຫຼື ຊື່ບໍລິການ",
          "e.g. EC2 instance id, IP or service name",
        ),
      },
      {
        name: "sslCertificate",
        label: l("SSL/TLS Certificate", "SSL/TLS Certificate", "SSL/TLS Certificate"),
        kind: "select",
        required: true,
        options: YES_NO(l("ต้องการ", "ຕ້ອງການ", "Needed"), l("ไม่ต้องการ", "ບໍ່ຕ້ອງການ", "Not needed")),
        showWhen: { field: "kind", in: ["public-ip", "domain", "both", "cloudflare"] },
      },
    ],
  },
  OTHER: {
    value: "OTHER",
    label: l("อื่นๆ", "ອື່ນໆ", "Other"),
    description: l(
      "คำขอบริการที่ไม่เข้าหมวดด้านบน ระบุรายละเอียดให้ครบในช่องรายละเอียด",
      "ຄຳຂໍບໍລິການທີ່ບໍ່ຢູ່ໃນໝວດຂ້າງເທິງ ລະບຸລາຍລະອຽດໃຫ້ຄົບໃນຊ່ອງລາຍລະອຽດ",
      "Service requests that don't fit the categories above. Give full details in the details field",
    ),
    fields: [],
  },
  ...DATA_REPORTING_DEFS,
  ...DEPLOYMENT_TRAINING_DEFS,
  ...INFRASTRUCTURE_DEFS,
  ...DEVOPS_SECURITY_DEFS,
  ...PEOPLE_DEFS,
};

export function isRequestType(value: unknown): value is RequestType {
  return typeof value === "string" && (REQUEST_TYPES as readonly string[]).includes(value);
}

/**
 * Names of the fields that are currently shown. A conditional field is visible only when the field
 * it depends on is itself visible, so stale values of hidden fields never keep a dependent field alive.
 */
export function visibleFieldNames(type: RequestType, values: Record<string, string | undefined>): Set<string> {
  const visible = new Set<string>();
  for (const field of REQUEST_TYPE_DEFS[type].fields) {
    if (!field.showWhen) {
      visible.add(field.name);
    } else if (visible.has(field.showWhen.field) && field.showWhen.in.includes(values[field.showWhen.field] ?? "")) {
      visible.add(field.name);
    }
  }
  return visible;
}

export type DetailsResult = {
  values: Record<string, string | number>;
  errors: Record<string, string>;
};

const MAX_TEXT = 200;

/**
 * Validates the type-specific fields. `raw` holds the submitted strings keyed by field name.
 * Hidden fields are ignored so stale values never reach the database. Error messages are written in `lang`.
 */
export function validateDetails(type: RequestType, raw: Record<string, string | undefined>, lang: Lang): DetailsResult {
  const t = makeT(lang);
  const values: Record<string, string | number> = {};
  const errors: Record<string, string> = {};
  const visible = visibleFieldNames(type, raw);

  for (const field of REQUEST_TYPE_DEFS[type].fields) {
    if (!visible.has(field.name)) continue;

    const label = t(field.label);
    const input = (raw[field.name] ?? "").trim();
    if (input === "") {
      if (field.required) {
        errors[field.name] =
          field.kind === "select"
            ? t(`กรุณาเลือก${label}`, `ກະລຸນາເລືອກ ${label}`, `${label}: please select an option`)
            : t(`กรุณากรอก${label}`, `ກະລຸນາປ້ອນ ${label}`, `${label}: please fill in this field`);
      }
      continue;
    }

    switch (field.kind) {
      case "text":
      case "textarea": {
        const limit = field.kind === "text" ? MAX_TEXT : 2000;
        if (input.length > limit) {
          errors[field.name] = t(
            `${label}ยาวเกิน ${limit} ตัวอักษร`,
            `${label} ຍາວເກີນ ${limit} ຕົວອັກສອນ`,
            `${label} is too long (maximum ${limit} characters)`,
          );
        } else values[field.name] = input;
        break;
      }
      case "select": {
        if (!field.options?.some((o) => o.value === input)) {
          errors[field.name] = t(`${label}ไม่ถูกต้อง`, `${label} ບໍ່ຖືກຕ້ອງ`, `${label} is invalid`);
        } else values[field.name] = input;
        break;
      }
      case "number": {
        const n = Number(input);
        const min = field.min ?? Number.NEGATIVE_INFINITY;
        const max = field.max ?? Number.POSITIVE_INFINITY;
        if (!Number.isFinite(n) || !Number.isInteger(n)) {
          errors[field.name] = t(`${label}ต้องเป็นจำนวนเต็ม`, `${label} ຕ້ອງເປັນຈຳນວນເຕັມ`, `${label} must be a whole number`);
        } else if (n < min || n > max) {
          errors[field.name] = t(
            `${label}ต้องอยู่ระหว่าง ${min} ถึง ${max}`,
            `${label} ຕ້ອງຢູ່ລະຫວ່າງ ${min} ຫາ ${max}`,
            `${label} must be between ${min} and ${max}`,
          );
        } else values[field.name] = n;
        break;
      }
      case "date": {
        const valid = /^\d{4}-\d{2}-\d{2}$/.test(input) && !Number.isNaN(new Date(`${input}T00:00:00Z`).getTime());
        if (!valid) errors[field.name] = t(`${label}ไม่ถูกต้อง`, `${label} ບໍ່ຖືກຕ້ອງ`, `${label} is invalid`);
        else values[field.name] = input;
        break;
      }
    }
  }

  return { values, errors };
}

/** Human-readable rows for the detail page: [label, display value], in `lang`. */
export function describeDetails(type: RequestType, details: unknown, lang: Lang): { label: string; value: string }[] {
  const t = makeT(lang);
  const data = (details && typeof details === "object" ? details : {}) as Record<string, unknown>;
  const rows: { label: string; value: string }[] = [];

  for (const field of REQUEST_TYPE_DEFS[type].fields) {
    const raw = data[field.name];
    if (raw === undefined || raw === null || raw === "") continue;
    const text = String(raw);
    const option = field.kind === "select" ? field.options?.find((o) => o.value === text) : undefined;
    const value = option ? t(option.label) : text;
    rows.push({ label: t(field.label), value });
  }
  return rows;
}
