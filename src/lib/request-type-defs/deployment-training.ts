// Request types for system configuration, deployment, backup / restore, training and documentation.
import { l } from "@/lib/i18n";
import type { RequestType, RequestTypeDef } from "@/lib/request-types";
import { ENVIRONMENT, YES_NO } from "@/lib/request-type-shared";

export const DEPLOYMENT_TRAINING_DEFS = {
  SYSTEM_CONFIG: {
    value: "SYSTEM_CONFIG",
    label: l("ขอปรับตั้งค่าระบบ", "ຂໍປັບຕັ້ງຄ່າລະບົບ", "System configuration change"),
    description: l(
      "ขอให้ปรับตั้งค่าระบบ เช่น Workflow การอนุมัติ Master Code ปีงบประมาณ หรืออัตราภาษี / VAT",
      "ຂໍໃຫ້ປັບຕັ້ງຄ່າລະບົບ ເຊັ່ນ Workflow ການອະນຸມັດ, Master Code, ປີງົບປະມານ ຫຼື ອັດຕາພາສີ / VAT",
      "Request a change to system settings, such as an approval Workflow, Master Code, fiscal year or tax rate / VAT",
    ),
    fields: [
      {
        name: "system",
        label: l("ระบบ", "ລະບົບ", "System"),
        kind: "text",
        required: true,
        placeholder: l("เช่น ERP, CRM", "ເຊັ່ນ ERP, CRM", "e.g. ERP, CRM"),
      },
      {
        name: "changeKind",
        label: l("สิ่งที่ต้องการปรับ", "ສິ່ງທີ່ຕ້ອງການປັບ", "What to change"),
        kind: "select",
        required: true,
        options: [
          { value: "workflow", label: l("Workflow การอนุมัติ", "Workflow ການອະນຸມັດ", "Approval Workflow") },
          { value: "master-code", label: l("Master Code", "Master Code", "Master Code") },
          { value: "fiscal-year", label: l("ปีงบประมาณ", "ປີງົບປະມານ", "Fiscal year") },
          { value: "tax-rate", label: l("อัตราภาษี / VAT", "ອັດຕາພາສີ / VAT", "Tax rate / VAT") },
          { value: "other", label: l("อื่นๆ", "ອື່ນໆ", "Other") },
        ],
      },
      {
        name: "environment",
        label: l("สภาพแวดล้อม", "ສະພາບແວດລ້ອມ", "Environment"),
        kind: "select",
        required: true,
        options: ENVIRONMENT,
      },
      {
        name: "changeDetail",
        label: l(
          "รายละเอียดที่ต้องการปรับ (จาก → เป็น)",
          "ລາຍລະອຽດທີ່ຕ້ອງການປັບ (ຈາກ → ເປັນ)",
          "What to change (from → to)",
        ),
        kind: "textarea",
        required: true,
        placeholder: l(
          "เช่น ผู้อนุมัติขั้นที่ 2 จากหัวหน้าแผนก เป็นหัวหน้าฝ่าย",
          "ເຊັ່ນ ຜູ້ອະນຸມັດຂັ້ນທີ 2 ຈາກຫົວໜ້າພະແນກ ເປັນຫົວໜ້າຝ່າຍ",
          "e.g. 2nd-level approver from department manager to division manager",
        ),
      },
      {
        name: "effectiveDate",
        label: l("วันที่มีผลบังคับใช้", "ວັນທີມີຜົນບັງຄັບໃຊ້", "Effective date"),
        kind: "date",
      },
    ],
  },
  DEPLOYMENT: {
    value: "DEPLOYMENT",
    label: l("ขอ Scheduled Deployment / Hotfix", "ຂໍ Scheduled Deployment / Hotfix", "Scheduled deployment / hotfix"),
    description: l(
      "ขอให้นำระบบขึ้น Staging / UAT หรือ Production ตามกำหนดเวลา หรือ Deploy Hotfix แก้ไขเร่งด่วน",
      "ຂໍໃຫ້ນຳລະບົບຂຶ້ນ Staging / UAT ຫຼື Production ຕາມກຳນົດເວລາ ຫຼື Deploy Hotfix ແກ້ໄຂດ່ວນ",
      "Request a scheduled deployment, or an urgent hotfix, to Staging / UAT or Production",
    ),
    fields: [
      {
        name: "system",
        label: l("ระบบ / แอปพลิเคชัน", "ລະບົບ / ແອັບພລິເຄຊັນ", "System / application"),
        kind: "text",
        required: true,
      },
      {
        name: "deployKind",
        label: l("ประเภทการ Deploy", "ປະເພດການ Deploy", "Deployment type"),
        kind: "select",
        required: true,
        options: [
          {
            value: "scheduled",
            label: l("Scheduled Deployment (ตามกำหนดการ)", "Scheduled Deployment (ຕາມກຳນົດການ)", "Scheduled deployment"),
          },
          {
            value: "hotfix",
            label: l("Hotfix Deployment (แก้ไขเร่งด่วน)", "Hotfix Deployment (ແກ້ໄຂດ່ວນ)", "Hotfix deployment"),
          },
        ],
      },
      {
        name: "environment",
        label: l("สภาพแวดล้อมปลายทาง", "ສະພາບແວດລ້ອມປາຍທາງ", "Target environment"),
        kind: "select",
        required: true,
        options: [
          { value: "staging", label: l("Staging / UAT", "Staging / UAT", "Staging / UAT") },
          { value: "prod", label: l("Production", "Production", "Production") },
        ],
      },
      {
        name: "version",
        label: l("เวอร์ชัน / Release / Tag", "ເວີຊັນ / Release / Tag", "Version / release / tag"),
        kind: "text",
        required: true,
        placeholder: l("เช่น v2.4.1", "ເຊັ່ນ v2.4.1", "e.g. v2.4.1"),
      },
      {
        name: "window",
        label: l("ช่วงเวลาที่ต้องการ Deploy", "ໄລຍະເວລາທີ່ຕ້ອງການ Deploy", "Deployment window"),
        kind: "select",
        required: true,
        options: [
          { value: "business-hours", label: l("ในเวลาทำการ", "ໃນເວລາເຮັດວຽກ", "During business hours") },
          { value: "after-hours", label: l("นอกเวลาทำการ", "ນອກເວລາເຮັດວຽກ", "Outside business hours") },
        ],
      },
      {
        name: "tested",
        label: l(
          "ทดสอบบน Staging / UAT แล้วหรือไม่",
          "ໄດ້ທົດສອບເທິງ Staging / UAT ແລ້ວ ຫຼື ບໍ່",
          "Tested on Staging / UAT",
        ),
        kind: "select",
        required: true,
        options: YES_NO(
          l("ทดสอบแล้ว", "ທົດສອບແລ້ວ", "Tested"),
          l("ยังไม่ได้ทดสอบ", "ຍັງບໍ່ໄດ້ທົດສອບ", "Not tested yet"),
        ),
      },
      {
        name: "rollbackPlan",
        label: l("แผน Rollback", "ແຜນ Rollback", "Rollback plan"),
        kind: "textarea",
        required: true,
        placeholder: l(
          "เช่น ย้อนกลับเป็นเวอร์ชันก่อนหน้า v2.4.0 และกู้คืน Database จาก Snapshot",
          "ເຊັ່ນ ຍ້ອນກັບເປັນເວີຊັນກ່ອນໜ້າ v2.4.0 ແລະ ກູ້ຄືນ Database ຈາກ Snapshot",
          "e.g. Revert to the previous version v2.4.0 and restore the Database from a Snapshot",
        ),
      },
    ],
  },
  BACKUP_RESTORE: {
    value: "BACKUP_RESTORE",
    label: l("ขอ Backup / Restore ข้อมูล", "ຂໍ Backup / Restore ຂໍ້ມູນ", "Data backup / restore"),
    description: l(
      "ขอสำรองข้อมูลหรือสร้าง Snapshot เช่น ก่อนย้ายระบบ หรือขอกู้คืนข้อมูลย้อนหลังไปยังจุดเวลาที่ต้องการ",
      "ຂໍສຳຮອງຂໍ້ມູນ ຫຼື ສ້າງ Snapshot ເຊັ່ນ ກ່ອນຍ້າຍລະບົບ ຫຼື ຂໍກູ້ຄືນຂໍ້ມູນຍ້ອນຫຼັງໄປຍັງຈຸດເວລາທີ່ຕ້ອງການ",
      "Request a backup or Snapshot, for example before a migration, or restore data to an earlier point in time",
    ),
    fields: [
      {
        name: "action",
        label: l("สิ่งที่ต้องการ", "ສິ່ງທີ່ຕ້ອງການ", "What you need"),
        kind: "select",
        required: true,
        options: [
          {
            value: "snapshot",
            label: l(
              "สำรองข้อมูล / Snapshot (เช่น ก่อนย้ายระบบ)",
              "ສຳຮອງຂໍ້ມູນ / Snapshot (ເຊັ່ນ ກ່ອນຍ້າຍລະບົບ)",
              "Back up / Snapshot (e.g. before a migration)",
            ),
          },
          { value: "restore", label: l("กู้คืนข้อมูล", "ກູ້ຄືນຂໍ້ມູນ", "Restore data") },
        ],
      },
      {
        name: "system",
        label: l("ระบบ / Database", "ລະບົບ / Database", "System / database"),
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
        name: "restorePoint",
        label: l("จุดเวลาที่ต้องการกู้คืน", "ຈຸດເວລາທີ່ຕ້ອງການກູ້ຄືນ", "Point in time to restore to"),
        kind: "text",
        required: true,
        placeholder: l("เช่น 2026-10-28 14:00", "ເຊັ່ນ 2026-10-28 14:00", "e.g. 2026-10-28 14:00"),
        showWhen: { field: "action", in: ["restore"] },
      },
      {
        name: "restoreTarget",
        label: l("ปลายทางการกู้คืน", "ປາຍທາງການກູ້ຄືນ", "Restore destination"),
        kind: "select",
        required: true,
        options: [
          { value: "original", label: l("เขียนทับข้อมูลเดิม", "ຂຽນທັບຂໍ້ມູນເດີມ", "Overwrite the original") },
          {
            value: "new-instance",
            label: l("กู้คืนไปยัง Instance ใหม่", "ກູ້ຄືນໄປຍັງ Instance ໃໝ່", "Restore to a new instance"),
          },
        ],
        showWhen: { field: "action", in: ["restore"] },
      },
    ],
  },
  TRAINING: {
    value: "TRAINING",
    label: l("ขอจัดอบรมการใช้งานระบบ", "ຂໍຈັດອົບຮົມການນຳໃຊ້ລະບົບ", "Additional user training"),
    description: l(
      "ขอให้จัดอบรมการใช้งานระบบเพิ่มเติม เช่น สำหรับพนักงานใหม่ของลูกค้า",
      "ຂໍໃຫ້ຈັດອົບຮົມການນຳໃຊ້ລະບົບເພີ່ມເຕີມ ເຊັ່ນ ສຳລັບພະນັກງານໃໝ່ຂອງລູກຄ້າ",
      "Request extra training on using a system, for example for a customer's new staff",
    ),
    fields: [
      {
        name: "system",
        label: l("ระบบที่ต้องการอบรม", "ລະບົບທີ່ຕ້ອງການອົບຮົມ", "System to be trained on"),
        kind: "text",
        required: true,
      },
      {
        name: "customer",
        label: l("ลูกค้า / ชื่อโครงการ", "ລູກຄ້າ / ຊື່ໂຄງການ", "Customer / project name"),
        kind: "text",
      },
      {
        name: "audience",
        label: l("กลุ่มผู้เข้าอบรม", "ກຸ່ມຜູ້ເຂົ້າອົບຮົມ", "Audience"),
        kind: "select",
        required: true,
        options: [
          { value: "new-users", label: l("ผู้ใช้งานใหม่", "ຜູ້ໃຊ້ງານໃໝ່", "New users") },
          {
            value: "refresher",
            label: l("ผู้ใช้งานเดิม (อบรมทบทวน)", "ຜູ້ໃຊ້ງານເດີມ (ອົບຮົມທົບທວນ)", "Existing users (refresher)"),
          },
        ],
      },
      {
        name: "attendees",
        label: l("จำนวนผู้เข้าอบรม", "ຈຳນວນຜູ້ເຂົ້າອົບຮົມ", "Number of attendees"),
        kind: "number",
        required: true,
        min: 1,
        max: 500,
      },
      {
        name: "format",
        label: l("รูปแบบการอบรม", "ຮູບແບບການອົບຮົມ", "Training format"),
        kind: "select",
        required: true,
        options: [
          {
            value: "onsite",
            label: l(
              "อบรมในสถานที่ (สถานที่ของลูกค้าหรือห้องอบรม)",
              "ອົບຮົມຢູ່ສະຖານທີ່ (ສະຖານທີ່ຂອງລູກຄ້າ ຫຼື ຫ້ອງອົບຮົມ)",
              "On site (customer location or training room)",
            ),
          },
          { value: "online", label: l("ออนไลน์", "ອອນລາຍ", "Online") },
        ],
      },
      {
        name: "preferredPeriod",
        label: l("ช่วงเวลาที่ต้องการ", "ໄລຍະເວລາທີ່ຕ້ອງການ", "Preferred period"),
        kind: "text",
        placeholder: l(
          "เช่น สัปดาห์ที่ 2 ของเดือนพฤศจิกายน 2026",
          "ເຊັ່ນ ອາທິດທີ 2 ຂອງເດືອນພະຈິກ 2026",
          "e.g. 2nd week of November 2026",
        ),
      },
    ],
  },
  DOCUMENT: {
    value: "DOCUMENT",
    label: l(
      "ขอเอกสาร / คู่มือ / API Documentation",
      "ຂໍເອກະສານ / ຄູ່ມື / API Documentation",
      "Manuals and documentation",
    ),
    description: l(
      "ขอคู่มือการใช้งาน SRS ERD หรือเอกสาร API (Swagger) ของระบบ",
      "ຂໍຄູ່ມືການນຳໃຊ້, SRS, ERD ຫຼື ເອກະສານ API (Swagger) ຂອງລະບົບ",
      "Request a user manual, SRS, ERD or API documentation (Swagger) for a system",
    ),
    fields: [
      {
        name: "docKind",
        label: l("ประเภทเอกสาร", "ປະເພດເອກະສານ", "Document type"),
        kind: "select",
        required: true,
        options: [
          { value: "user-manual", label: l("คู่มือการใช้งาน (User Manual)", "ຄູ່ມືການນຳໃຊ້ (User Manual)", "User manual") },
          { value: "srs", label: l("SRS", "SRS", "SRS") },
          { value: "erd", label: l("ERD", "ERD", "ERD") },
          { value: "api-docs", label: l("API Documentation / Swagger", "API Documentation / Swagger", "API documentation / Swagger") },
          { value: "other", label: l("อื่นๆ", "ອື່ນໆ", "Other") },
        ],
      },
      {
        name: "system",
        label: l("ระบบ", "ລະບົບ", "System"),
        kind: "text",
        required: true,
      },
      {
        name: "version",
        label: l("เวอร์ชัน / การอัปเดตที่ต้องการ", "ເວີຊັນ / ການອັບເດດທີ່ຕ້ອງການ", "Version / update wanted"),
        kind: "text",
        placeholder: l(
          "เช่น เวอร์ชัน 2.4 หรืออัปเดตล่าสุด",
          "ເຊັ່ນ ເວີຊັນ 2.4 ຫຼື ອັບເດດລ່າສຸດ",
          "e.g. version 2.4 or the latest update",
        ),
      },
    ],
  },
} satisfies Partial<Record<RequestType, RequestTypeDef>>;
