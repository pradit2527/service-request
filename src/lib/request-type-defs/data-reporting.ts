// Request types in the "Data & Reporting" category: custom data extraction, database data correction,
// bulk import and report template changes. Pure module.
import { l } from "@/lib/i18n";
import type { RequestType, RequestTypeDef } from "@/lib/request-types";
import { ENVIRONMENT, YES_NO } from "@/lib/request-type-shared";

export const DATA_REPORTING_DEFS = {
  DATA_EXTRACT: {
    value: "DATA_EXTRACT",
    label: l("ขอดึงข้อมูลพิเศษ", "ຂໍດຶງຂໍ້ມູນພິເສດ", "Custom data extraction / export"),
    description: l(
      "ขอดึงข้อมูลเป็นไฟล์ CSV / Excel ที่หน้าจอของระบบไม่มีให้ดึงเอง",
      "ຂໍດຶງຂໍ້ມູນເປັນໄຟລ໌ CSV / Excel ທີ່ໜ້າຈໍຂອງລະບົບບໍ່ມີໃຫ້ດຶງເອງ",
      "Request data as a CSV / Excel file when the system screens do not offer that export",
    ),
    fields: [
      {
        name: "system",
        label: l("ระบบ / Database ต้นทาง", "ລະບົບ / Database ຕົ້ນທາງ", "Source system / database"),
        kind: "text",
        required: true,
        placeholder: l(
          "เช่น ERP, CRM, Database คำสั่งซื้อ",
          "ເຊັ່ນ ERP, CRM, Database ຄຳສັ່ງຊື້",
          "e.g. ERP, CRM, orders database",
        ),
      },
      {
        name: "dataScope",
        label: l("ข้อมูลและเงื่อนไขที่ต้องการ", "ຂໍ້ມູນ ແລະ ເງື່ອນໄຂທີ່ຕ້ອງການ", "Data and conditions needed"),
        kind: "textarea",
        required: true,
        placeholder: l(
          "ระบุตาราง ฟิลด์ และตัวกรอง",
          "ລະບຸຕາຕະລາງ, ຊ່ອງຂໍ້ມູນ ແລະ ຕົວກັ່ນຕອງ",
          "Tables, fields and filters",
        ),
      },
      {
        name: "period",
        label: l("ช่วงเวลาของข้อมูล", "ໄລຍະເວລາຂອງຂໍ້ມູນ", "Data period"),
        kind: "text",
        required: true,
        placeholder: l(
          "เช่น 1 ม.ค. – 30 มิ.ย. 2026",
          "ເຊັ່ນ 1 ມັງກອນ – 30 ມິຖຸນາ 2026",
          "e.g. 1 Jan – 30 Jun 2026",
        ),
      },
      {
        name: "format",
        label: l("รูปแบบไฟล์", "ຮູບແບບໄຟລ໌", "File format"),
        kind: "select",
        required: true,
        options: [
          { value: "csv", label: l("CSV", "CSV", "CSV") },
          { value: "excel", label: l("Excel (.xlsx)", "Excel (.xlsx)", "Excel (.xlsx)") },
          { value: "json", label: l("JSON", "JSON", "JSON") },
          { value: "other", label: l("อื่นๆ", "ອື່ນໆ", "Other") },
        ],
      },
      {
        name: "containsPii",
        label: l(
          "มีข้อมูลส่วนบุคคล (PII) หรือไม่",
          "ມີຂໍ້ມູນສ່ວນບຸກຄົນ (PII) ຫຼື ບໍ່",
          "Contains personal data (PII)",
        ),
        kind: "select",
        required: true,
        options: YES_NO(
          l("มีข้อมูลส่วนบุคคล", "ມີຂໍ້ມູນສ່ວນບຸກຄົນ", "Yes, contains personal data"),
          l("ไม่มีข้อมูลส่วนบุคคล", "ບໍ່ມີຂໍ້ມູນສ່ວນບຸກຄົນ", "No personal data"),
        ),
        help: l(
          "ถ้ามีข้อมูลส่วนบุคคล หัวหน้าต้องอนุมัติก่อน",
          "ຖ້າມີຂໍ້ມູນສ່ວນບຸກຄົນ ຫົວໜ້າຕ້ອງອະນຸມັດກ່ອນ",
          "If it contains personal data, a manager must approve first",
        ),
      },
      {
        name: "delivery",
        label: l("ช่องทางรับข้อมูล", "ຊ່ອງທາງຮັບຂໍ້ມູນ", "How to receive the data"),
        kind: "select",
        required: true,
        options: [
          {
            value: "secure-link",
            label: l("ลิงก์ดาวน์โหลดที่ปลอดภัย", "ລິ້ງດາວໂຫຼດທີ່ປອດໄພ", "Secure download link"),
          },
          { value: "shared-folder", label: l("Shared Folder", "Shared Folder", "Shared Folder") },
        ],
      },
    ],
  },
  DATA_CORRECTION: {
    value: "DATA_CORRECTION",
    label: l("ขอแก้ไขข้อมูลใน Database", "ຂໍແກ້ໄຂຂໍ້ມູນໃນ Database", "Database data correction"),
    description: l(
      "แก้ไข Master Data ที่ผิดพลาดซึ่งผู้ใช้แก้ไขเองไม่ได้",
      "ແກ້ໄຂ Master Data ທີ່ຜິດພາດ ເຊິ່ງຜູ້ໃຊ້ບໍ່ສາມາດແກ້ໄຂເອງໄດ້",
      "Fix incorrect Master Data that users cannot correct themselves",
    ),
    fields: [
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
        name: "target",
        label: l(
          "ตาราง / รายการที่ต้องแก้ไข",
          "ຕາຕະລາງ / ລາຍການທີ່ຕ້ອງແກ້ໄຂ",
          "Table / records to correct",
        ),
        kind: "text",
        required: true,
        placeholder: l(
          "เช่น ตาราง customers, id C-0123",
          "ເຊັ່ນ ຕາຕະລາງ customers, id C-0123",
          "e.g. table customers, id C-0123",
        ),
      },
      {
        name: "recordCount",
        label: l(
          "จำนวนรายการที่ได้รับผลกระทบ",
          "ຈຳນວນລາຍການທີ່ໄດ້ຮັບຜົນກະທົບ",
          "Number of records affected",
        ),
        kind: "number",
        required: true,
        min: 1,
        max: 1000000,
      },
      {
        name: "currentData",
        label: l(
          "ข้อมูลปัจจุบัน (ที่ไม่ถูกต้อง)",
          "ຂໍ້ມູນປັດຈຸບັນ (ທີ່ບໍ່ຖືກຕ້ອງ)",
          "Current data (incorrect)",
        ),
        kind: "textarea",
        required: true,
      },
      {
        name: "correctData",
        label: l(
          "ข้อมูลที่ถูกต้อง (ที่ต้องการให้เป็น)",
          "ຂໍ້ມູນທີ່ຖືກຕ້ອງ (ທີ່ຕ້ອງການໃຫ້ເປັນ)",
          "Correct data (what it should become)",
        ),
        kind: "textarea",
        required: true,
      },
      {
        name: "approvalRef",
        label: l(
          "เลขที่เอกสารอนุมัติ หรือลิงก์",
          "ເລກທີ່ເອກະສານອະນຸມັດ ຫຼື ລິ້ງ",
          "Approval document number or link",
        ),
        kind: "text",
        required: true,
        help: l(
          "การแก้ไข Master Data ต้องมีเอกสารอนุมัติ",
          "ການແກ້ໄຂ Master Data ຕ້ອງມີເອກະສານອະນຸມັດ",
          "Corrections to Master Data need an approval document",
        ),
      },
    ],
  },
  BULK_IMPORT: {
    value: "BULK_IMPORT",
    label: l("ขอ Import ข้อมูลชุดใหญ่", "ຂໍ Import ຂໍ້ມູນຊຸດໃຫຍ່", "Bulk data import"),
    description: l(
      "ขอ Import ข้อมูลจำนวนมากเข้าระบบ เช่น สินค้า อัตราแลกเปลี่ยน หรือ Asset Master Data",
      "ຂໍ Import ຂໍ້ມູນຈຳນວນຫຼາຍເຂົ້າລະບົບ ເຊັ່ນ ສິນຄ້າ, ອັດຕາແລກປ່ຽນ ຫຼື Asset Master Data",
      "Import a large amount of data into a system, such as products, exchange rates or Asset Master Data",
    ),
    fields: [
      {
        name: "dataKind",
        label: l("ประเภทข้อมูล", "ປະເພດຂໍ້ມູນ", "Data type"),
        kind: "select",
        required: true,
        options: [
          { value: "product", label: l("สินค้า", "ສິນຄ້າ", "Products") },
          { value: "exchange-rate", label: l("อัตราแลกเปลี่ยน", "ອັດຕາແລກປ່ຽນ", "Exchange rates") },
          { value: "asset-master", label: l("Asset Master Data", "Asset Master Data", "Asset Master Data") },
          { value: "partner", label: l("ลูกค้า / ผู้ขาย", "ລູກຄ້າ / ຜູ້ຂາຍ", "Customers / vendors") },
          { value: "other", label: l("อื่นๆ", "ອື່ນໆ", "Other") },
        ],
      },
      {
        name: "targetSystem",
        label: l("ระบบที่จะ Import เข้า", "ລະບົບທີ່ຈະ Import ເຂົ້າ", "System to import into"),
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
        name: "recordCount",
        label: l("จำนวนรายการ", "ຈຳນວນລາຍການ", "Number of records"),
        kind: "number",
        required: true,
        min: 1,
        max: 10000000,
      },
      {
        name: "fileLocation",
        label: l("ตำแหน่งไฟล์", "ຕຳແໜ່ງໄຟລ໌", "File location"),
        kind: "text",
        required: true,
        placeholder: l(
          "ลิงก์ หรือที่อยู่ไฟล์ใน Shared Folder เช่น \\\\fileserver\\Import\\products.xlsx",
          "ລິ້ງ ຫຼື ທີ່ຢູ່ໄຟລ໌ໃນ Shared Folder ເຊັ່ນ \\\\fileserver\\Import\\products.xlsx",
          "Link or Shared Folder path, e.g. \\\\fileserver\\Import\\products.xlsx",
        ),
      },
      {
        name: "backupBefore",
        label: l(
          "สำรองข้อมูลก่อน Import หรือไม่",
          "ສຳຮອງຂໍ້ມູນກ່ອນ Import ຫຼື ບໍ່",
          "Back up the data before importing",
        ),
        kind: "select",
        required: true,
        options: YES_NO(
          l("สำรองข้อมูลก่อน Import", "ສຳຮອງຂໍ້ມູນກ່ອນ Import", "Yes, back up first"),
          l("ไม่ต้องสำรองข้อมูล", "ບໍ່ຕ້ອງສຳຮອງຂໍ້ມູນ", "No backup needed"),
        ),
      },
    ],
  },
  REPORT_TEMPLATE: {
    value: "REPORT_TEMPLATE",
    label: l("ขอปรับแต่งรูปแบบรายงาน", "ຂໍປັບແຕ່ງຮູບແບບລາຍງານ", "Report template change"),
    description: l(
      "ปรับ Layout, Logo หรือฟอนต์ของไฟล์ PDF ใบเสร็จรับเงิน และใบแจ้งหนี้",
      "ປັບ Layout, Logo ຫຼື ຟອນຂອງໄຟລ໌ PDF, ໃບຮັບເງິນ ແລະ ໃບແຈ້ງໜີ້",
      "Change the layout, logo or font of PDFs, receipts and invoices",
    ),
    fields: [
      {
        name: "report",
        label: l("ชื่อรายงาน / เอกสาร", "ຊື່ລາຍງານ / ເອກະສານ", "Report / document name"),
        kind: "text",
        required: true,
        placeholder: l(
          "เช่น ใบแจ้งหนี้, ใบเสร็จรับเงิน",
          "ເຊັ່ນ ໃບແຈ້ງໜີ້, ໃບຮັບເງິນ",
          "e.g. invoice, receipt",
        ),
      },
      {
        name: "changeKind",
        label: l("สิ่งที่ต้องการปรับ", "ສິ່ງທີ່ຕ້ອງການປັບ", "What to change"),
        kind: "select",
        required: true,
        options: [
          {
            value: "layout",
            label: l("Layout / ส่วนหัวเอกสาร", "Layout / ສ່ວນຫົວເອກະສານ", "Layout / header"),
          },
          { value: "logo", label: l("Logo บริษัท", "Logo ບໍລິສັດ", "Company logo") },
          { value: "font", label: l("ฟอนต์", "ຟອນ", "Font") },
          { value: "other", label: l("อื่นๆ", "ອື່ນໆ", "Other") },
        ],
      },
      {
        name: "system",
        label: l("ระบบที่ออกรายงาน", "ລະບົບທີ່ອອກລາຍງານ", "System that produces the report"),
        kind: "text",
      },
      {
        name: "reference",
        label: l("ไฟล์ตัวอย่าง หรือลิงก์งานออกแบบ", "ໄຟລ໌ຕົວຢ່າງ ຫຼື ລິ້ງການອອກແບບ", "Sample file or design link"),
        kind: "text",
      },
    ],
  },
} satisfies Partial<Record<RequestType, RequestTypeDef>>;
