// Request types for the "Onboarding & Offboarding" category: getting a new developer ready, and taking access and
// equipment back when someone leaves or a project ends.
import { l } from "@/lib/i18n";
import type { RequestType, RequestTypeDef } from "@/lib/request-types";
import { YES_NO } from "@/lib/request-type-shared";

export const PEOPLE_DEFS = {
  ONBOARDING: {
    value: "ONBOARDING",
    label: l(
      "เตรียมเครื่องและระบบสำหรับพนักงานใหม่ (Dev Onboarding)",
      "ເຕຣຽມເຄື່ອງ ແລະ ລະບົບສຳລັບພະນັກງານໃໝ່ (Dev Onboarding)",
      "Prepare equipment and systems for a new hire (Dev onboarding)",
    ),
    description: l(
      "จัดเตรียมเครื่อง และสิทธิ์ใน GitHub, Slack, Jira, Cloud account แบบครบชุดก่อนวันเริ่มงาน",
      "ຈັດເຕຣຽມເຄື່ອງ ແລະ ສິດໃນ GitHub, Slack, Jira, Cloud account ແບບຄົບຊຸດກ່ອນວັນເລີ່ມວຽກ",
      "Get a machine and access to GitHub, Slack, Jira and cloud accounts ready as a full set before the start date",
    ),
    fields: [
      {
        name: "newUser",
        label: l("ชื่อ-สกุลพนักงานใหม่", "ຊື່-ນາມສະກຸນພະນັກງານໃໝ່", "New hire's full name"),
        kind: "text",
        required: true,
      },
      {
        name: "startDate",
        label: l("วันที่เริ่มงาน", "ວັນທີເລີ່ມວຽກ", "Start date"),
        kind: "date",
        required: true,
      },
      {
        name: "team",
        label: l("ทีม / ตำแหน่ง", "ທີມ / ຕຳແໜ່ງ", "Team / role"),
        kind: "text",
        required: true,
        placeholder: l("เช่น Backend Developer", "ເຊັ່ນ Backend Developer", "e.g. Backend developer"),
      },
      {
        name: "deviceKind",
        label: l("เครื่องคอมพิวเตอร์", "ເຄື່ອງຄອມພິວເຕີ", "Computer"),
        kind: "select",
        required: true,
        options: [
          { value: "none", label: l("ไม่ต้องเบิกเครื่อง", "ບໍ່ຕ້ອງເບີກເຄື່ອງ", "No computer needed") },
          { value: "laptop", label: l("โน้ตบุ๊กมาตรฐาน", "ໂນດບຸກມາດຕະຖານ", "Standard laptop") },
          {
            value: "high-spec",
            label: l(
              "เครื่องสเปกสูง (RAM 32 GB ขึ้นไป)",
              "ເຄື່ອງສະເປັກສູງ (RAM 32 GB ຂຶ້ນໄປ)",
              "High-spec machine (32 GB RAM or more)",
            ),
          },
          { value: "macbook", label: l("MacBook (Apple Silicon)", "MacBook (Apple Silicon)", "MacBook (Apple Silicon)") },
        ],
      },
      {
        name: "deliveryLocation",
        label: l("สถานที่รับเครื่อง", "ສະຖານທີ່ຮັບເຄື່ອງ", "Delivery location"),
        kind: "text",
        required: true,
        showWhen: { field: "deviceKind", in: ["laptop", "high-spec", "macbook"] },
      },
      {
        name: "accounts",
        label: l("บัญชีและสิทธิ์ที่ต้องเตรียม", "ບັນຊີ ແລະ ສິດທີ່ຕ້ອງເຕຣຽມ", "Accounts and access to prepare"),
        kind: "textarea",
        required: true,
        placeholder: l(
          "เช่น อีเมลบริษัท, GitHub org ..., Slack, Jira project ..., AWS dev account",
          "ເຊັ່ນ ອີເມວບໍລິສັດ, GitHub org ..., Slack, Jira project ..., AWS dev account",
          "e.g. company email, GitHub org ..., Slack, Jira project ..., AWS dev account",
        ),
      },
      {
        name: "mentor",
        label: l("พี่เลี้ยง / ผู้ดูแล", "ພີ່ລ້ຽງ / ຜູ້ດູແລ", "Mentor / buddy"),
        kind: "text",
      },
    ],
  },
  OFFBOARDING: {
    value: "OFFBOARDING",
    label: l(
      "ถอนสิทธิ์และส่งคืนทรัพย์สิน (Offboarding)",
      "ຖອນສິດ ແລະ ສົ່ງຄືນຊັບສິນ (Offboarding)",
      "Remove access and return assets (Offboarding)",
    ),
    description: l(
      "ถอน Access Key, SSH Key, Cloud account และเก็บอุปกรณ์คืน เมื่อโปรเจกต์สิ้นสุดหรือพนักงานลาออก",
      "ຖອນ Access Key, SSH Key, Cloud account ແລະ ເກັບອຸປະກອນຄືນ ເມື່ອໂປຣເຈັກສິ້ນສຸດ ຫຼື ພະນັກງານລາອອກ",
      "Remove access keys, SSH keys and cloud accounts and collect equipment when a project ends or someone leaves",
    ),
    fields: [
      {
        name: "leavingUser",
        label: l(
          "ชื่อ-สกุล หรืออีเมลของผู้ที่สิ้นสุด",
          "ຊື່-ນາມສະກຸນ ຫຼື ອີເມວຂອງຜູ້ທີ່ສິ້ນສຸດ",
          "Full name or email of the person leaving",
        ),
        kind: "text",
        required: true,
      },
      {
        name: "reason",
        label: l("เหตุผล", "ເຫດຜົນ", "Reason"),
        kind: "select",
        required: true,
        options: [
          { value: "resign", label: l("ลาออก / พ้นสภาพ", "ລາອອກ / ພົ້ນສະພາບ", "Resignation / leaving the company") },
          { value: "project-end", label: l("โปรเจกต์สิ้นสุด", "ໂປຣເຈັກສິ້ນສຸດ", "Project ended") },
          { value: "transfer", label: l("ย้ายทีม / ย้ายหน้าที่", "ຍ້າຍທີມ / ຍ້າຍໜ້າທີ່", "Moving to another team / role") },
          {
            value: "other",
            label: l("อื่นๆ (ระบุในรายละเอียด)", "ອື່ນໆ (ລະບຸໃນລາຍລະອຽດ)", "Other (specify in the details)"),
          },
        ],
      },
      {
        name: "lastDay",
        label: l("วันทำงานวันสุดท้าย", "ວັນທີເຮັດວຽກວັນສຸດທ້າຍ", "Last working day"),
        kind: "date",
        required: true,
      },
      {
        name: "revokeScope",
        label: l("สิ่งที่ต้องถอน", "ສິ່ງທີ່ຕ້ອງຖອນ", "What to remove"),
        kind: "select",
        required: true,
        options: [
          {
            value: "all",
            label: l(
              "ทั้งหมด (บัญชีทั้งหมด + Key + อุปกรณ์)",
              "ທັງໝົດ (ບັນຊີທັງໝົດ + Key + ອຸປະກອນ)",
              "Everything (all accounts + keys + equipment)",
            ),
          },
          {
            value: "cloud-keys",
            label: l(
              "เฉพาะ Cloud Account / Access Key / SSH Key",
              "ສະເພາະ Cloud Account / Access Key / SSH Key",
              "Only cloud accounts / access keys / SSH keys",
            ),
          },
          {
            value: "project-only",
            label: l(
              "เฉพาะสิทธิ์ของโปรเจกต์ที่ระบุ",
              "ສະເພາະສິດຂອງໂປຣເຈັກທີ່ລະບຸ",
              "Only the access of one project",
            ),
          },
        ],
      },
      {
        name: "project",
        label: l("ชื่อโครงการ", "ຊື່ໂຄງການ", "Project name"),
        kind: "text",
        required: true,
        showWhen: { field: "revokeScope", in: ["project-only"] },
      },
      {
        name: "returnDevices",
        label: l("มีอุปกรณ์ที่ต้องส่งคืนหรือไม่", "ມີອຸປະກອນທີ່ຕ້ອງສົ່ງຄືນ ຫຼື ບໍ່", "Equipment to return"),
        kind: "select",
        required: true,
        options: YES_NO(
          l("มีอุปกรณ์ต้องส่งคืน", "ມີອຸປະກອນຕ້ອງສົ່ງຄືນ", "Yes, there is equipment to return"),
          l("ไม่มีอุปกรณ์ต้องส่งคืน", "ບໍ່ມີອຸປະກອນຕ້ອງສົ່ງຄືນ", "No equipment to return"),
        ),
      },
      {
        name: "assetTags",
        label: l("Asset tag ของอุปกรณ์", "Asset tag ຂອງອຸປະກອນ", "Asset tags of the equipment"),
        kind: "text",
        required: true,
        showWhen: { field: "returnDevices", in: ["yes"] },
      },
      {
        name: "handover",
        label: l("ผู้รับมอบงาน / ข้อมูลที่ต้องโอน", "ຜູ້ຮັບມອບວຽກ / ຂໍ້ມູນທີ່ຕ້ອງໂອນ", "Person taking over / data to hand over"),
        kind: "text",
      },
    ],
  },
} satisfies Partial<Record<RequestType, RequestTypeDef>>;
