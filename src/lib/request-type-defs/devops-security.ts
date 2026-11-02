// Request types for cloud resources, credentials and security reviews: creating or deleting a cloud resource or
// repository, access keys and tokens, and the review of personal devices and third-party software.
import { l } from "@/lib/i18n";
import type { RequestType, RequestTypeDef } from "@/lib/request-types";
import { ENVIRONMENT, YES_NO } from "@/lib/request-type-shared";

const OTHER = l("อื่นๆ (ระบุในรายละเอียด)", "ອື່ນໆ (ລະບຸໃນລາຍລະອຽດ)", "Other (specify in the details)");

export const DEVOPS_SECURITY_DEFS = {
  CLOUD_RESOURCE: {
    value: "CLOUD_RESOURCE",
    label: l(
      "ขอสร้าง / ลบ Cloud Resource หรือ Repository",
      "ຂໍສ້າງ / ລຶບ Cloud Resource ຫຼື Repository",
      "Create / delete a cloud resource or repository",
    ),
    description: l(
      "ขอสร้างหรือลบ S3 Bucket, GCP Project, Azure VM หรือ Git Repository สำหรับ Sandbox / Staging / Production",
      "ຂໍສ້າງ ຫຼື ລຶບ S3 Bucket, GCP Project, Azure VM ຫຼື Git Repository ສຳລັບ Sandbox / Staging / Production",
      "Create or delete an S3 bucket, GCP project, Azure VM or Git repository for Sandbox / Staging / Production",
    ),
    fields: [
      {
        name: "action",
        label: l("ลักษณะคำขอ", "ລັກສະນະຄຳຂໍ", "Kind of request"),
        kind: "select",
        required: true,
        options: [
          { value: "create", label: l("ขอสร้างใหม่", "ຂໍສ້າງໃໝ່", "Create a new one") },
          { value: "delete", label: l("ขอลบ", "ຂໍລຶບ", "Delete an existing one") },
        ],
      },
      {
        name: "provider",
        label: l("ผู้ให้บริการ (Provider)", "ຜູ້ໃຫ້ບໍລິການ (Provider)", "Provider"),
        kind: "select",
        required: true,
        options: [
          { value: "aws", label: l("AWS", "AWS", "AWS") },
          { value: "gcp", label: l("Google Cloud (GCP)", "Google Cloud (GCP)", "Google Cloud (GCP)") },
          { value: "azure", label: l("Microsoft Azure", "Microsoft Azure", "Microsoft Azure") },
          { value: "github", label: l("GitHub", "GitHub", "GitHub") },
          { value: "gitlab", label: l("GitLab", "GitLab", "GitLab") },
          { value: "other", label: OTHER },
        ],
      },
      {
        name: "resourceKind",
        label: l("ประเภท Resource", "ປະເພດ Resource", "Kind of resource"),
        kind: "select",
        required: true,
        options: [
          {
            value: "bucket",
            label: l("Storage Bucket (เช่น S3)", "Storage Bucket (ເຊັ່ນ S3)", "Storage bucket (e.g. S3)"),
          },
          {
            value: "project",
            label: l(
              "Cloud Project / Account (เช่น GCP Project)",
              "Cloud Project / Account (ເຊັ່ນ GCP Project)",
              "Cloud project / account (e.g. GCP project)",
            ),
          },
          {
            value: "vm",
            label: l("Virtual Machine (เช่น Azure VM)", "Virtual Machine (ເຊັ່ນ Azure VM)", "Virtual machine (e.g. Azure VM)"),
          },
          { value: "repository", label: l("Git Repository", "Git Repository", "Git repository") },
          { value: "other", label: OTHER },
        ],
      },
      {
        name: "resourceName",
        label: l("ชื่อ Resource / Repository", "ຊື່ Resource / Repository", "Resource / repository name"),
        kind: "text",
        required: true,
        help: l(
          "ถ้าขอลบ ให้ระบุชื่อหรือ ID ของตัวที่มีอยู่",
          "ຖ້າຂໍລຶບ ໃຫ້ລະບຸຊື່ ຫຼື ID ຂອງໂຕທີ່ມີຢູ່",
          "When deleting, give the name or ID of the existing one",
        ),
      },
      {
        name: "project",
        label: l("ชื่อโครงการ / ระบบ", "ຊື່ໂຄງການ / ລະບົບ", "Project / system name"),
        kind: "text",
        required: true,
      },
      {
        name: "environment",
        label: l("สภาพแวดล้อม", "ສະພາບແວດລ້ອມ", "Environment"),
        kind: "select",
        required: true,
        options: [
          { value: "sandbox", label: l("Sandbox", "Sandbox", "Sandbox") },
          { value: "staging", label: l("Staging / UAT", "Staging / UAT", "Staging / UAT") },
          { value: "prod", label: l("Production", "Production", "Production") },
        ],
        showWhen: { field: "resourceKind", in: ["bucket", "project", "vm", "other"] },
      },
      {
        name: "spec",
        label: l("สเปก / ขนาดที่ต้องการ", "ສະເປັກ / ຂະໜາດທີ່ຕ້ອງການ", "Specification / size needed"),
        kind: "text",
        placeholder: l(
          "เช่น t3.medium, 100 GB, Region ap-southeast-1",
          "ເຊັ່ນ t3.medium, 100 GB, Region ap-southeast-1",
          "e.g. t3.medium, 100 GB, region ap-southeast-1",
        ),
        showWhen: { field: "action", in: ["create"] },
      },
      {
        name: "backedUp",
        label: l("สำรองข้อมูลก่อนลบแล้วหรือยัง", "ສຳຮອງຂໍ້ມູນກ່ອນລຶບແລ້ວ ຫຼື ຍັງ", "Backed up before deleting"),
        kind: "select",
        required: true,
        options: YES_NO(
          l("สำรองแล้ว หรือไม่มีข้อมูลที่ต้องเก็บ", "ສຳຮອງແລ້ວ ຫຼື ບໍ່ມີຂໍ້ມູນທີ່ຕ້ອງເກັບ", "Backed up, or nothing to keep"),
          l("ยังไม่ได้สำรอง", "ຍັງບໍ່ໄດ້ສຳຮອງ", "Not backed up yet"),
        ),
        showWhen: { field: "action", in: ["delete"] },
      },
    ],
  },
  API_CREDENTIAL: {
    value: "API_CREDENTIAL",
    label: l("ขอ Access Key / Token / API Key", "ຂໍ Access Key / Token / API Key", "Request an access key / token / API key"),
    description: l(
      "ขอ Access Key / Secret Key ของ Cloud, Access Token ของ Git หรือ API Key ของบริการภายนอก ห้ามพิมพ์ Secret Key หรือ Token ลงในคำขอ ทีม IT จะส่งให้ทางช่องทางที่ปลอดภัย",
      "ຂໍ Access Key / Secret Key ຂອງ Cloud, Access Token ຂອງ Git ຫຼື API Key ຂອງບໍລິການພາຍນອກ ຫ້າມພິມ Secret Key ຫຼື Token ລົງໃນຄຳຂໍ ທີມ IT ຈະສົ່ງໃຫ້ທາງຊ່ອງທາງທີ່ປອດໄພ",
      "Request a cloud access key / secret key, a Git access token or an API key for an external service. Never type a secret key or token into the request; the IT team sends it through a secure channel",
    ),
    fields: [
      {
        name: "credentialKind",
        label: l("ประเภทที่ต้องการ", "ປະເພດທີ່ຕ້ອງການ", "What you need"),
        kind: "select",
        required: true,
        options: [
          {
            value: "cloud-key",
            label: l(
              "Cloud Access Key / Secret Key (AWS, GCP, Azure)",
              "Cloud Access Key / Secret Key (AWS, GCP, Azure)",
              "Cloud access key / secret key (AWS, GCP, Azure)",
            ),
          },
          {
            value: "repo-token",
            label: l(
              "Access Token ของ Git (GitHub, GitLab)",
              "Access Token ຂອງ Git (GitHub, GitLab)",
              "Git access token (GitHub, GitLab)",
            ),
          },
          {
            value: "saas-api",
            label: l(
              "API Key ของบริการภายนอก (OpenAI, SendGrid, Twilio)",
              "API Key ຂອງບໍລິການພາຍນອກ (OpenAI, SendGrid, Twilio)",
              "API key of an external service (OpenAI, SendGrid, Twilio)",
            ),
          },
          { value: "other", label: OTHER },
        ],
      },
      {
        name: "service",
        label: l("บริการ / ชื่อ Account", "ບໍລິການ / ຊື່ Account", "Service / account name"),
        kind: "text",
        required: true,
        placeholder: l(
          "เช่น AWS account 1234, GitHub org, OpenAI",
          "ເຊັ່ນ AWS account 1234, GitHub org, OpenAI",
          "e.g. AWS account 1234, GitHub org, OpenAI",
        ),
      },
      {
        name: "project",
        label: l("โครงการที่นำไปใช้", "ໂຄງການທີ່ນຳໄປໃຊ້", "Project it will be used in"),
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
        name: "scope",
        label: l("สิทธิ์ / ขอบเขตที่ต้องการ", "ສິດ / ຂອບເຂດທີ່ຕ້ອງການ", "Permissions / scope needed"),
        kind: "text",
        required: true,
        placeholder: l("เช่น S3 อ่านอย่างเดียว, repo:read", "ເຊັ່ນ S3 ອ່ານຢ່າງດຽວ, repo:read", "e.g. S3 read-only, repo:read"),
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
        label: l("วันที่สิ้นสุด", "ວັນທີສິ້ນສຸດ", "End date"),
        kind: "date",
        required: true,
        showWhen: { field: "duration", in: ["temporary"] },
      },
    ],
  },
  SECURITY_REVIEW: {
    value: "SECURITY_REVIEW",
    label: l(
      "ขอ Security Review (BYOD / ซอฟต์แวร์ภายนอก)",
      "ຂໍ Security Review (BYOD / ຊອບແວພາຍນອກ)",
      "Request a security review (BYOD / external software)",
    ),
    description: l(
      "ขออนุมัติใช้อุปกรณ์ส่วนตัว (BYOD) หรือ Library / ซอฟต์แวร์ภายนอกที่ไม่อยู่ในรายการที่อนุมัติไว้",
      "ຂໍອະນຸມັດໃຊ້ອຸປະກອນສ່ວນຕົວ (BYOD) ຫຼື Library / ຊອບແວພາຍນອກທີ່ບໍ່ຢູ່ໃນລາຍການທີ່ອະນຸມັດໄວ້",
      "Ask for approval to use a personal device (BYOD) or a library / software that is not on the approved list",
    ),
    fields: [
      {
        name: "reviewKind",
        label: l("สิ่งที่ขอให้ตรวจสอบ", "ສິ່ງທີ່ຂໍໃຫ້ກວດສອບ", "What to review"),
        kind: "select",
        required: true,
        options: [
          { value: "byod", label: l("อุปกรณ์ส่วนตัว (BYOD)", "ອຸປະກອນສ່ວນຕົວ (BYOD)", "Personal device (BYOD)") },
          { value: "third-party-lib", label: l("Library / Package ภายนอก", "Library / Package ພາຍນອກ", "Third-party library / package") },
          {
            value: "third-party-software",
            label: l("ซอฟต์แวร์ / เครื่องมือภายนอก", "ຊອບແວ / ເຄື່ອງມືພາຍນອກ", "Third-party software / tool"),
          },
          { value: "other", label: OTHER },
        ],
      },
      {
        name: "itemName",
        label: l("ชื่ออุปกรณ์ / Library / ซอฟต์แวร์", "ຊື່ອຸປະກອນ / Library / ຊອບແວ", "Device / library / software name"),
        kind: "text",
        required: true,
      },
      { name: "version", label: l("เวอร์ชัน / รุ่น", "ເວີຊັນ / ລຸ້ນ", "Version / model"), kind: "text" },
      {
        name: "sourceUrl",
        label: l("ลิงก์เว็บไซต์ / แหล่งดาวน์โหลด", "ລິ້ງເວັບໄຊ / ແຫຼ່ງດາວໂຫຼດ", "Website / download link"),
        kind: "text",
      },
      {
        name: "license",
        label: l("License ของ Library", "License ຂອງ Library", "Library licence"),
        kind: "text",
        placeholder: l("เช่น MIT, Apache-2.0, GPL", "ເຊັ່ນ MIT, Apache-2.0, GPL", "e.g. MIT, Apache-2.0, GPL"),
        showWhen: { field: "reviewKind", in: ["third-party-lib"] },
      },
      {
        name: "usedFor",
        label: l("ใช้งานกับ", "ໃຊ້ງານກັບ", "Used for"),
        kind: "select",
        required: true,
        options: [
          { value: "internal", label: l("งานภายในบริษัท", "ວຽກພາຍໃນບໍລິສັດ", "Internal company work") },
          { value: "customer-project", label: l("โปรเจกต์ของลูกค้า", "ໂປຣເຈັກຂອງລູກຄ້າ", "A customer project") },
          { value: "production", label: l("ระบบ Production", "ລະບົບ Production", "A production system") },
        ],
      },
      {
        name: "touchesData",
        label: l(
          "เข้าถึงข้อมูลของบริษัทหรือลูกค้าหรือไม่",
          "ເຂົ້າເຖິງຂໍ້ມູນຂອງບໍລິສັດ ຫຼື ລູກຄ້າ ຫຼື ບໍ່",
          "Reaches company or customer data",
        ),
        kind: "select",
        required: true,
        options: YES_NO(
          l("เข้าถึงข้อมูล", "ເຂົ້າເຖິງຂໍ້ມູນ", "Yes, it reaches data"),
          l("ไม่เข้าถึงข้อมูล", "ບໍ່ເຂົ້າເຖິງຂໍ້ມູນ", "No, it does not"),
        ),
      },
    ],
  },
} satisfies Partial<Record<RequestType, RequestTypeDef>>;
