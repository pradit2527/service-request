// Request types for the "Cloud & Infrastructure" category: new environments, firewall rules and resource upgrades.
import { l } from "@/lib/i18n";
import type { RequestType, RequestTypeDef } from "@/lib/request-types";
import { ENVIRONMENT, YES_NO } from "@/lib/request-type-shared";

export const INFRASTRUCTURE_DEFS = {
  ENVIRONMENT: {
    value: "ENVIRONMENT",
    label: l("ขอสร้าง Environment ใหม่", "ຂໍສ້າງ Environment ໃໝ່", "Create a new environment"),
    description: l(
      "ขอสร้าง Environment สำหรับ Development, Staging / UAT หรือ Sandbox ของโครงการหรือระบบใหม่",
      "ຂໍສ້າງ Environment ສຳລັບ Development, Staging / UAT ຫຼື Sandbox ຂອງໂຄງການ ຫຼື ລະບົບໃໝ່",
      "Request a Development, Staging / UAT or Sandbox environment for a new project or system",
    ),
    fields: [
      {
        name: "project",
        label: l("ชื่อโครงการ / ระบบ", "ຊື່ໂຄງການ / ລະບົບ", "Project / system name"),
        kind: "text",
        required: true,
      },
      {
        name: "envKind",
        label: l("ประเภท Environment", "ປະເພດ Environment", "Environment type"),
        kind: "select",
        required: true,
        options: [
          { value: "dev", label: l("Development", "Development", "Development") },
          { value: "staging", label: l("Staging / UAT", "Staging / UAT", "Staging / UAT") },
          { value: "sandbox", label: l("Sandbox", "Sandbox", "Sandbox") },
          {
            value: "full-set",
            label: l(
              "ครบชุด (Development + Staging / UAT)",
              "ຄົບຊຸດ (Development + Staging / UAT)",
              "Full set (Development + Staging / UAT)",
            ),
          },
        ],
      },
      {
        name: "stack",
        label: l("เทคโนโลยีที่ใช้ (Tech stack)", "ເຕັກໂນໂລຢີທີ່ໃຊ້ (Tech stack)", "Tech stack"),
        kind: "text",
        required: true,
        placeholder: l(
          "เช่น Next.js, Node.js, PostgreSQL",
          "ເຊັ່ນ Next.js, Node.js, PostgreSQL",
          "e.g. Next.js, Node.js, PostgreSQL",
        ),
      },
      {
        name: "needsDatabase",
        label: l("ต้องการ Database หรือไม่", "ຕ້ອງການ Database ຫຼື ບໍ່", "Needs a Database"),
        kind: "select",
        required: true,
        options: YES_NO(
          l("ต้องการ Database", "ຕ້ອງການ Database", "Yes, needs a Database"),
          l("ไม่ต้องการ Database", "ບໍ່ຕ້ອງການ Database", "No Database needed"),
        ),
      },
      {
        name: "cloud",
        label: l("ที่ติดตั้ง", "ບ່ອນຕິດຕັ້ງ", "Where to host"),
        kind: "select",
        required: true,
        options: [
          { value: "aws", label: l("AWS", "AWS", "AWS") },
          { value: "on-premise", label: l("On-premise", "On-premise", "On-premise") },
          {
            value: "other",
            label: l("อื่นๆ (ระบุในรายละเอียด)", "ອື່ນໆ (ລະບຸໃນລາຍລະອຽດ)", "Other (specify in the details)"),
          },
        ],
      },
      {
        name: "neededUntil",
        label: l("ใช้งานจนถึงวันที่", "ໃຊ້ຈົນເຖິງວັນທີ", "Needed until"),
        kind: "date",
        help: l(
          "ระบุเฉพาะกรณีที่ต้องการใช้งานชั่วคราว",
          "ລະບຸສະເພາະກໍລະນີທີ່ຕ້ອງການໃຊ້ຊົ່ວຄາວ",
          "Fill in only if it is needed for a limited time",
        ),
      },
    ],
  },
  FIREWALL: {
    value: "FIREWALL",
    label: l(
      "ขอเปิด Port / Firewall / Whitelist IP",
      "ຂໍເປີດ Port / Firewall / Whitelist IP",
      "Open a port / firewall rule / whitelist an IP",
    ),
    description: l(
      "ขอเปิด Port หรือเพิ่ม IP ใน Whitelist เพื่อเชื่อมต่อกับ Server ของลูกค้าหรือ API ของบริษัทภายนอก",
      "ຂໍເປີດ Port ຫຼື ເພີ່ມ IP ໃນ Whitelist ເພື່ອເຊື່ອມຕໍ່ກັບ Server ຂອງລູກຄ້າ ຫຼື API ຂອງບໍລິສັດພາຍນອກ",
      "Open a port or whitelist an IP to connect to a customer's server or a third-party API",
    ),
    fields: [
      {
        name: "action",
        label: l("ลักษณะคำขอ", "ລັກສະນະຄຳຂໍ", "Kind of request"),
        kind: "select",
        required: true,
        options: [
          { value: "open-port", label: l("เปิด Port", "ເປີດ Port", "Open a port") },
          { value: "whitelist-ip", label: l("Whitelist IP", "Whitelist IP", "Whitelist an IP") },
          {
            value: "other",
            label: l("อื่นๆ (ระบุในรายละเอียด)", "ອື່ນໆ (ລະບຸໃນລາຍລະອຽດ)", "Other (specify in the details)"),
          },
        ],
      },
      {
        name: "direction",
        label: l("ทิศทางการเชื่อมต่อ", "ທິດທາງການເຊື່ອມຕໍ່", "Direction"),
        kind: "select",
        required: true,
        options: [
          { value: "inbound", label: l("ขาเข้า (Inbound)", "ຂາເຂົ້າ (Inbound)", "Inbound") },
          { value: "outbound", label: l("ขาออก (Outbound)", "ຂາອອກ (Outbound)", "Outbound") },
        ],
        help: l(
          "Inbound = ภายนอกเชื่อมต่อเข้ามายัง Server ของเรา, Outbound = Server ของเราเชื่อมต่อออกไปภายนอก",
          "Inbound = ພາຍນອກເຊື່ອມຕໍ່ເຂົ້າມາຫາ Server ຂອງເຮົາ, Outbound = Server ຂອງເຮົາເຊື່ອມຕໍ່ອອກໄປພາຍນອກ",
          "Inbound = traffic coming in to our server, outbound = our server connecting out",
        ),
      },
      {
        name: "protocol",
        label: l("โปรโตคอล", "ໂປຣໂຕຄອນ", "Protocol"),
        kind: "select",
        required: true,
        options: [
          { value: "tcp", label: l("TCP", "TCP", "TCP") },
          { value: "udp", label: l("UDP", "UDP", "UDP") },
          { value: "both", label: l("TCP และ UDP", "TCP ແລະ UDP", "TCP and UDP") },
        ],
        showWhen: { field: "action", in: ["open-port"] },
      },
      {
        name: "port",
        label: l("หมายเลข Port", "ໝາຍເລກ Port", "Port number(s)"),
        kind: "text",
        required: true,
        placeholder: l("เช่น 443, 5432", "ເຊັ່ນ 443, 5432", "e.g. 443, 5432"),
        showWhen: { field: "action", in: ["open-port"] },
      },
      {
        name: "address",
        label: l("IP / CIDR / Domain ของอีกฝั่ง", "IP / CIDR / Domain ຂອງອີກຝ່າຍ", "IP / CIDR / Domain of the other side"),
        kind: "text",
        required: true,
        placeholder: l(
          "เช่น 203.0.113.10 หรือ 203.0.113.0/24",
          "ເຊັ່ນ 203.0.113.10 ຫຼື 203.0.113.0/24",
          "e.g. 203.0.113.10 or 203.0.113.0/24",
        ),
      },
      {
        name: "environment",
        label: l("สภาพแวดล้อม", "ສະພາບແວດລ້ອມ", "Environment"),
        kind: "select",
        required: true,
        options: ENVIRONMENT,
      },
      {
        name: "purpose",
        label: l("เชื่อมต่อกับอะไร และเพื่ออะไร", "ເຊື່ອມຕໍ່ກັບຫຍັງ ແລະ ເພື່ອຫຍັງ", "What it connects to and why"),
        kind: "text",
        required: true,
        placeholder: l(
          "เช่น Server ของลูกค้า, Payment API",
          "ເຊັ່ນ Server ຂອງລູກຄ້າ, Payment API",
          "e.g. customer server, payment API",
        ),
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
      },
      {
        name: "expiresOn",
        label: l("วันที่สิ้นสุดการเปิดใช้งาน", "ວັນທີສິ້ນສຸດການເປີດໃຊ້ງານ", "Rule end date"),
        kind: "date",
        required: true,
        showWhen: { field: "duration", in: ["temporary"] },
      },
    ],
  },
  RESOURCE_UPGRADE: {
    value: "RESOURCE_UPGRADE",
    label: l("ขอเพิ่ม Resource Server", "ຂໍເພີ່ມ Resource Server", "Increase server resources"),
    description: l(
      "ขอเพิ่ม CPU, RAM, พื้นที่ Disk หรือจำนวนการเชื่อมต่อ Database ของ Server ที่ใช้งานอยู่",
      "ຂໍເພີ່ມ CPU, RAM, ພື້ນທີ່ Disk ຫຼື ຈຳນວນການເຊື່ອມຕໍ່ Database ຂອງ Server ທີ່ໃຊ້ງານຢູ່",
      "Request more CPU, RAM, Disk space or Database connections for a server that is already running",
    ),
    fields: [
      {
        name: "server",
        label: l("ชื่อ / รหัส Server (Instance)", "ຊື່ / ລະຫັດ Server (Instance)", "Server / instance name or ID"),
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
        name: "resource",
        label: l("Resource ที่ต้องการเพิ่ม", "Resource ທີ່ຕ້ອງການເພີ່ມ", "Resource to increase"),
        kind: "select",
        required: true,
        options: [
          { value: "cpu", label: l("CPU", "CPU", "CPU") },
          { value: "ram", label: l("RAM", "RAM", "RAM") },
          { value: "disk", label: l("พื้นที่ Disk", "ພື້ນທີ່ Disk", "Disk space") },
          {
            value: "db-connections",
            label: l(
              "จำนวนการเชื่อมต่อ Database สูงสุด",
              "ຈຳນວນການເຊື່ອມຕໍ່ Database ສູງສຸດ",
              "Database connection limit",
            ),
          },
        ],
      },
      {
        name: "currentValue",
        label: l("ค่าปัจจุบัน", "ຄ່າປັດຈຸບັນ", "Current value"),
        kind: "text",
        required: true,
        placeholder: l("เช่น 2 vCPU, 100 GB", "ເຊັ່ນ 2 vCPU, 100 GB", "e.g. 2 vCPU, 100 GB"),
      },
      {
        name: "targetValue",
        label: l("ค่าที่ต้องการ", "ຄ່າທີ່ຕ້ອງການ", "Value needed"),
        kind: "text",
        required: true,
        placeholder: l("เช่น 4 vCPU, 200 GB", "ເຊັ່ນ 4 vCPU, 200 GB", "e.g. 4 vCPU, 200 GB"),
      },
      {
        name: "downtimeOk",
        label: l(
          "ยอมให้ระบบหยุดชั่วคราวระหว่างปรับหรือไม่",
          "ຍອມໃຫ້ລະບົບຢຸດຊົ່ວຄາວລະຫວ່າງປັບ ຫຼື ບໍ່",
          "Short downtime acceptable",
        ),
        kind: "select",
        required: true,
        options: YES_NO(
          l("ได้ (หยุดช่วงสั้นๆ)", "ໄດ້ (ຢຸດໄລຍະສັ້ນໆ)", "Yes, a short downtime is fine"),
          l("ไม่ได้ (ห้ามหยุด)", "ບໍ່ໄດ້ (ຫ້າມຢຸດ)", "No, no downtime allowed"),
        ),
      },
    ],
  },
} satisfies Partial<Record<RequestType, RequestTypeDef>>;
