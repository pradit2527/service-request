// Request types for the "AI & GPU" category: time on the GPU machines (Spark AI, Nvidia 5090) and access to AI
// services (Claude, Gemini, any other). The two machines share one form and so do the three services.
import { l, type Localized } from "@/lib/i18n";
import type { FieldDef, FieldOption, RequestType, RequestTypeDef } from "@/lib/request-types";

const OTHER: Localized = l("อื่นๆ (ระบุในรายละเอียด)", "ອື່ນໆ (ລະບຸໃນລາຍລະອຽດ)", "Other (specify in the details)");

/** A request for time on one of the GPU machines. */
function machineDef(value: RequestType, label: Localized, description: Localized): RequestTypeDef {
  return {
    value,
    label,
    description,
    fields: [
      {
        name: "purpose",
        label: l("วัตถุประสงค์ / โครงการ", "ຈຸດປະສົງ / ໂຄງການ", "Purpose / project"),
        kind: "text",
        required: true,
      },
      {
        name: "workload",
        label: l("ลักษณะงาน", "ລັກສະນະວຽກ", "Kind of work"),
        kind: "select",
        required: true,
        options: [
          { value: "training", label: l("เทรนโมเดล (Training)", "ເທຣນໂມເດວ (Training)", "Training a model") },
          { value: "fine-tuning", label: l("ปรับแต่งโมเดล (Fine-tuning)", "ປັບແຕ່ງໂມເດວ (Fine-tuning)", "Fine-tuning a model") },
          { value: "inference", label: l("รันโมเดล (Inference)", "ຣັນໂມເດວ (Inference)", "Running a model (inference)") },
          { value: "development", label: l("พัฒนา / ทดลอง", "ພັດທະນາ / ທົດລອງ", "Development / experiments") },
          { value: "other", label: OTHER },
        ],
      },
      {
        name: "accessMode",
        label: l("วิธีใช้งาน", "ວິທີໃຊ້ງານ", "How you will use it"),
        kind: "select",
        required: true,
        options: [
          { value: "remote", label: l("ใช้งานระยะไกล (SSH / Jupyter)", "ໃຊ້ງານທາງໄກ (SSH / Jupyter)", "Remotely (SSH / Jupyter)") },
          { value: "onsite", label: l("ใช้ที่เครื่องโดยตรง", "ໃຊ້ທີ່ເຄື່ອງໂດຍກົງ", "At the machine in person") },
        ],
      },
      { name: "startDate", label: l("วันที่เริ่มใช้", "ວັນທີເລີ່ມໃຊ້", "Start date"), kind: "date", required: true },
      { name: "endDate", label: l("ใช้ถึงวันที่", "ໃຊ້ເຖິງວັນທີ", "Use until"), kind: "date", required: true },
      {
        name: "resources",
        label: l("ทรัพยากรที่คาดว่าจะใช้", "ຊັບພະຍາກອນທີ່ຄາດວ່າຈະໃຊ້", "Expected resources"),
        kind: "text",
        placeholder: l("เช่น VRAM 24 GB, วันละ 8 ชม.", "ເຊັ່ນ VRAM 24 GB, ມື້ລະ 8 ຊມ.", "e.g. VRAM 24 GB, 8 hours a day"),
      },
    ],
  };
}

/** A request to use an AI service; `kinds` are the ways that service can be used. */
function aiServiceDef(
  value: RequestType,
  label: Localized,
  description: Localized,
  kinds: readonly FieldOption[],
  other = false,
): RequestTypeDef {
  const fields: FieldDef[] = [];
  if (other) {
    fields.push({
      name: "toolName",
      label: l("ชื่อเครื่องมือ AI", "ຊື່ເຄື່ອງມື AI", "AI tool name"),
      kind: "text",
      required: true,
      placeholder: l("เช่น Mistral Le Chat, Perplexity", "ເຊັ່ນ Mistral Le Chat, Perplexity", "e.g. Mistral Le Chat, Perplexity"),
    });
  }
  fields.push({
    name: "accessKind",
    label: l("รูปแบบการใช้งาน", "ຮູບແບບການໃຊ້ງານ", "How you will use it"),
    kind: "select",
    required: true,
    options: kinds,
  });
  if (other) {
    fields.push({
      name: "sourceUrl",
      label: l("ลิงก์เว็บไซต์ของเครื่องมือ", "ລິ້ງເວັບໄຊຂອງເຄື່ອງມື", "Website of the tool"),
      kind: "text",
    });
  }
  fields.push(
    {
      name: "project",
      label: l("โครงการที่นำไปใช้", "ໂຄງການທີ່ນຳໄປໃຊ້", "Project it will be used in"),
      kind: "text",
      required: true,
    },
    {
      name: "dataLevel",
      label: l("ข้อมูลที่จะใช้กับ AI", "ຂໍ້ມູນທີ່ຈະໃຊ້ກັບ AI", "Data you will use with the AI"),
      kind: "select",
      required: true,
      options: [
        { value: "none", label: l("ไม่ใช้ข้อมูลของบริษัท", "ບໍ່ໃຊ້ຂໍ້ມູນຂອງບໍລິສັດ", "No company data") },
        { value: "internal", label: l("ข้อมูลภายในบริษัท", "ຂໍ້ມູນພາຍໃນບໍລິສັດ", "Internal company data") },
        { value: "customer", label: l("ข้อมูลของลูกค้า", "ຂໍ້ມູນຂອງລູກຄ້າ", "Customer data") },
      ],
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
  );
  return { value, label, description, fields };
}

export const AI_DEFS = {
  SPARK_AI: machineDef(
    "SPARK_AI",
    l("ขอใช้เครื่อง Spark AI", "ຂໍໃຊ້ເຄື່ອງ Spark AI", "Request the Spark AI machine"),
    l(
      "ขอใช้เครื่อง Spark AI (NVIDIA DGX Spark) สำหรับงาน AI เช่น เทรน ปรับแต่ง หรือรันโมเดล",
      "ຂໍໃຊ້ເຄື່ອງ Spark AI (NVIDIA DGX Spark) ສຳລັບວຽກ AI ເຊັ່ນ ເທຣນ, ປັບແຕ່ງ ຫຼື ຣັນໂມເດວ",
      "Ask for time on the Spark AI machine (NVIDIA DGX Spark) for AI work such as training, fine-tuning or running models",
    ),
  ),
  GPU_5090: machineDef(
    "GPU_5090",
    l("ขอใช้เครื่อง 5090 Nvidia", "ຂໍໃຊ້ເຄື່ອງ 5090 Nvidia", "Request the Nvidia 5090 machine"),
    l(
      "ขอใช้เครื่องที่ติดตั้ง Nvidia RTX 5090 สำหรับงานที่ต้องใช้ GPU",
      "ຂໍໃຊ້ເຄື່ອງທີ່ຕິດຕັ້ງ Nvidia RTX 5090 ສຳລັບວຽກທີ່ຕ້ອງໃຊ້ GPU",
      "Ask for time on the machine with an Nvidia RTX 5090 for work that needs a GPU",
    ),
  ),
  CLAUDE_AI: aiServiceDef(
    "CLAUDE_AI",
    l("ขอใช้งาน Claude AI", "ຂໍໃຊ້ງານ Claude AI", "Request access to Claude AI"),
    l(
      "ขอบัญชีหรือสิทธิ์ใช้งาน Claude ทั้งแอป Claude Code และ API",
      "ຂໍບັນຊີ ຫຼື ສິດໃຊ້ງານ Claude ທັງແອັບ, Claude Code ແລະ API",
      "Ask for an account or access to Claude: the app, Claude Code and the API",
    ),
    [
      { value: "app", label: l("แอป Claude (เว็บ / Desktop)", "ແອັບ Claude (ເວັບ / Desktop)", "Claude app (web / desktop)") },
      { value: "code", label: l("Claude Code", "Claude Code", "Claude Code") },
      { value: "api", label: l("Claude API", "Claude API", "Claude API") },
    ],
  ),
  GEMINI_AI: aiServiceDef(
    "GEMINI_AI",
    l("ขอใช้งาน Gemini AI / API", "ຂໍໃຊ້ງານ Gemini AI / API", "Request access to Gemini AI / API"),
    l(
      "ขอบัญชีหรือสิทธิ์ใช้งาน Gemini ทั้งแอปและ API",
      "ຂໍບັນຊີ ຫຼື ສິດໃຊ້ງານ Gemini ທັງແອັບ ແລະ API",
      "Ask for an account or access to Gemini: the app and the API",
    ),
    [
      { value: "app", label: l("แอป Gemini (เว็บ / มือถือ)", "ແອັບ Gemini (ເວັບ / ມືຖື)", "Gemini app (web / mobile)") },
      {
        value: "api-studio",
        label: l("Gemini API ผ่าน Google AI Studio", "Gemini API ຜ່ານ Google AI Studio", "Gemini API through Google AI Studio"),
      },
      { value: "vertex", label: l("Vertex AI (Google Cloud)", "Vertex AI (Google Cloud)", "Vertex AI (Google Cloud)") },
    ],
  ),
  OTHER_AI: aiServiceDef(
    "OTHER_AI",
    l("ขอใช้งาน AI ตัวอื่นๆ (โปรดระบุ)", "ຂໍໃຊ້ງານ AI ຕົວອື່ນໆ (ກະລຸນາລະບຸ)", "Request access to another AI (please specify)"),
    l(
      "ขอใช้งานเครื่องมือ AI อื่นที่ไม่อยู่ในรายการ โปรดระบุชื่อเครื่องมือ",
      "ຂໍໃຊ້ງານເຄື່ອງມື AI ອື່ນທີ່ບໍ່ຢູ່ໃນລາຍການ ກະລຸນາລະບຸຊື່ເຄື່ອງມື",
      "Ask for an AI tool that is not in the list; please give the name of the tool",
    ),
    [
      { value: "app", label: l("แอปเว็บ / Desktop", "ແອັບເວັບ / Desktop", "Web / desktop app") },
      { value: "api", label: l("API", "API", "API") },
      { value: "coding-tool", label: l("เครื่องมือเขียนโค้ด / IDE plugin", "ເຄື່ອງມືຂຽນໂຄ້ດ / IDE plugin", "Coding tool / IDE plugin") },
    ],
    true,
  ),
} satisfies Partial<Record<RequestType, RequestTypeDef>>;
