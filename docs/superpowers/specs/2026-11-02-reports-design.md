# ระบบรายงาน (ตารางข้อมูล) สำหรับแอดมินและผู้อนุมัติ

วันที่: 2026-11-02 · สถานะ: รอผู้ใช้รีวิว · เส้นทาง: architectural

## 1. เป้าหมาย

เพิ่มเมนู "รายงาน" ให้ผู้ดูแลระบบ (ADMIN) และผู้อนุมัติ (MANAGER, ตอนนี้คือพี่เดชา) ดูข้อมูลเป็นตาราง (datatable)
ที่สวยงาม ค้นหาและกรองได้ เรียงได้ และมีปุ่มเพิ่ม/แก้ไข/ลบ ที่แถวหรือหัวตาราง โดยแก้ไขในหน้าต่างเล็ก (popup)
ไม่ต้องออกจากหน้ารายงาน

สิ่งที่ผู้ใช้เลือกไว้แล้ว (จาก AskUserQuestion และการอนุมัติดีไซน์ในแชต):
- รายงาน 3 ชุด: คำขอ, ผู้ใช้, สถิติสรุป (ไม่รวมบทความ KB)
- แก้ไขในหน้าต่างเล็ก (popup) ไม่ใช่หน้าใหม่ และให้เป็นตารางที่มีช่องค้นหา ตัวกรอง
- หัวหน้างานเห็นเฉพาะคำขอที่เลือกตนเป็นผู้อนุมัติ
- ประวัติการอนุมัติรวมเข้ารายงานนี้ ส่วน "ขอข้อมูลเพิ่ม" และ "อนุมัติหลายรายการ" พักไว้รอบหลัง

เกณฑ์ว่าสำเร็จ:
- ADMIN เห็นแท็บ คำขอ/ผู้ใช้/สถิติ ส่วน MANAGER เห็นแท็บ คำขอ/สถิติ ของคำขอที่เลือกตนเป็นผู้อนุมัติเท่านั้น
  ไม่ว่าจะแก้ค่าใน URL อย่างไร (บังคับที่ฝั่งเซิร์ฟเวอร์)
- ทุกตารางค้นหา กรอง เรียง แบ่งหน้าละ 14 ได้ และ URL เก็บสถานะทั้งหมด (แชร์ลิงก์ รีเฟรช ปุ่มย้อนกลับใช้ได้)
- แก้ไข/เพิ่ม/ลบจาก popup แล้วกลับมาที่ตารางเดิมโดยตัวกรองและหน้าไม่หาย
- ใช้ได้บนมือถือ ไอแพด จอกว้าง และมีข้อความ 3 ภาษา (ไทย/ลาว/อังกฤษ)
- ไม่มีการเปลี่ยน DB (ไม่มี migration)

## 2. ขอบเขต

อยู่ในขอบเขต: เมนู/หน้า `/reports/*`, คอมโพเนนต์ตารางกลาง (DataTable) และ popup (Modal), query รายงาน,
ปรับฟอร์มแก้ไขเดิมให้กลับมาที่รายงานได้

อยู่นอกขอบเขตรอบนี้ (ผู้ใช้ไม่ได้ขอหรือเลื่อนไว้):
- export CSV/พิมพ์, กราฟ, บันทึกรายงานที่ตั้งค่าไว้
- "ขอข้อมูลเพิ่ม" และ "อนุมัติหลายรายการ" ของผู้อนุมัติ
- เปลี่ยนหน้า "จัดการระบบ" เดิมให้ใช้ตารางใหม่ (คงไว้ตามเดิม)
- รายงานบทความ KB, แก้ประเภท/ข้อมูลเฉพาะประเภท/สถานะของคำขอ (ข้อจำกัดเดิมของฟอร์มแก้ไขคำขอ)
- แจ้งเตือน

## 3. สถานะปัจจุบัน (ที่ดีไซน์นี้ต่อยอด)

- สิทธิ์: `canManageSystem` (ADMIN หรือ MANAGER), `canEditRequest`, `canModifyUser`, `canCreateUser` ใน
  `src/lib/permissions.ts`; หน้า `/admin/*` มี guard `requireSystemManager` และมีแท็บ `AdminTabs` ให้ใช้ซ้ำ
- action เดิมที่ตรวจสิทธิ์เองแล้ว: `updateRequestByAdmin`, `deleteRequest`, `restoreRequest`
  (`src/app/actions/admin-requests.ts`), `createUser`, `updateUserAdmin`, `deleteUser` (`admin-users.ts`)
  แต่ action แก้ไข/เพิ่ม/ลบผู้ใช้และแก้คำขอ `redirect` ไปหน้า `/admin/...` ตายตัว
- ฟอร์มเดิม: `RequestEditForm`, `UserForm` (ปุ่มยกเลิกลิงก์ไป `/admin/...` ตายตัว), `ConfirmActionButton`
- query: `listRequests` มี `console`/`deleted`; SLA: `evaluateSla`, `tally`, `SLA_TIER_DEF` ใน `src/lib/sla.ts`;
  `paginate` และ `PaginationNav` ใช้แบ่งหน้าละ 14; `safeNext` ป้องกัน open redirect
- ผลการตัดสินอนุมัติของหัวหน้ามีใน `RequestEvent` (`STATUS_CHANGED` จาก `PENDING_APPROVAL` โดยผู้อนุมัติ)
  ส่วน `decidedById` ถูกตั้งเฉพาะตอนปฏิเสธ จึงใช้ event เป็นแหล่งข้อมูลผลตัดสิน

## 4. ดีไซน์

### 4.1 เมนูและเส้นทาง

เพิ่มรายการ **"รายงาน"** (ไอคอน `BarChart3`) ในกลุ่ม "การจัดการ" ของแถบข้าง ถัดจาก "จัดการระบบ"
เห็นเฉพาะ `canManageSystem` (ต้องปรับ `app-shell.tsx` ให้กลุ่มนี้รวมไอคอน `settings` และ `reports`)

| เส้นทาง | เนื้อหา | ใครเห็น |
|---|---|---|
| `/reports` | redirect ไป `/reports/requests` | ADMIN, MANAGER |
| `/reports/requests` | รายงานคำขอ | ADMIN (ทั้งหมด), MANAGER (เฉพาะที่เลือกตนเป็นผู้อนุมัติ) |
| `/reports/users` | รายงานผู้ใช้ | ADMIN เท่านั้น (MANAGER ถูก redirect ไป `/reports/requests`) |
| `/reports/summary` | สถิติสรุป | ADMIN (ทั้งหมด), MANAGER (เฉพาะของตน) |

`reports/layout.tsx` เรียก `requireSystemManager()` แสดงหัวเรื่อง "รายงาน" และแท็บ (ใช้ `AdminTabs`; แท็บ "ผู้ใช้" แสดงเฉพาะ ADMIN)
guard ใน layout เป็นแค่ด่านแรก ทุก query รับ `viewer` และบังคับขอบเขตเอง

### 4.2 พารามิเตอร์ใน URL (อ่านและตรวจที่ `src/lib/report-params.ts`, pure)

ทุกค่านอก whitelist ถูกทิ้งแล้วใช้ค่าเริ่มต้น ไม่เกิด error

- ร่วม: `q` (ตัดที่ 100 ตัวอักษร), `page` (≥ 1), `sort`, `dir` (`asc|desc`), `edit` (รหัสเรคอร์ด), `new` (`1`)
- คำขอ: `status` (`OPEN` หรือสถานะปัจจุบันตัวใดตัวหนึ่ง), `type`, `priority`, `from`/`to` (วันที่สร้าง `YYYY-MM-DD`
  ตามเวลา Bangkok รวมทั้งต้นและปลายวัน), `sla=breached`, `assignee` (รหัส หรือ `unassigned`), `approver` (รหัส, เฉพาะ ADMIN),
  `result` (`pending|approved|rejected`), `deleted` (`include|only`)
- เรียงคำขอได้ตาม: `requestNo`, `title`, `status`, `priority`, `createdAt` (ค่าเริ่มต้น `desc`), `neededBy`, `fulfillmentDueAt`
- ผู้ใช้: `role`, `status` (`active|inactive`), `login` (`never`); เรียงตาม `name`, `email`, `role`, `lastLoginAt`, `createdAt`
- สถิติ: `from`/`to` (ค่าเริ่มต้น: ตั้งแต่ต้นเดือนนี้ถึงวันนี้ ตามเวลา Bangkok), `group` (`type|month|assignee`, ค่าเริ่มต้น `type`)
  เรียงตามคอลัมน์ผลลัพธ์ (`sort` ∈ `label|total|open|completed|rejected|cancelled|pendingApproval|responseRate|fulfillmentRate|avgApprovalHours`)

### 4.3 ขอบเขตข้อมูลของหัวหน้างาน (บังคับที่เซิร์ฟเวอร์)

ฟังก์ชัน pure `requestReportScope(viewer)` คืนเงื่อนไขที่ query ต้องใส่เสมอ: ADMIN → ไม่จำกัด; MANAGER → `approverId = viewer.id`;
role อื่น → ไม่ผ่าน (ใช้เมื่อมีคนเรียกฟังก์ชัน query โดยไม่ผ่าน guard)
- `approver` ใน URL ของ MANAGER ถูกทิ้ง (บังคับเป็นตัวเอง)
- พารามิเตอร์ `edit` ที่ชี้ไปคำขอนอกขอบเขตจะไม่เปิด popup
- คำขอที่ลบแล้ว (`deletedAt`) ซ่อนเป็นค่าเริ่มต้นสำหรับทั้งสองบทบาท; `deleted=include|only` ใช้ได้ภายในขอบเขตเดิม

### 4.4 ตารางกลาง (`DataTable`) และแถบเครื่องมือ

คอมโพเนนต์ฝั่งเซิร์ฟเวอร์ (ไม่เพิ่มไลบรารี): `DataTable<T>({ columns, rows, rowKey, sort, dir, hrefForSort, actions, emptyText })`
- `columns`: `{ key, header, sortKey?, align?, render(row), card?: "title" | "meta" | "hidden" }`
- บนจอ ≥ `lg` เป็น `<table>` ห่อด้วย `overflow-x-auto` หัวตารางติดบน (sticky) แถวสลับสี ไฮไลต์เมื่อชี้ หัวคอลัมน์ที่เรียงได้
  เป็นลิงก์สลับ `asc/desc` พร้อมลูกศรบอกทิศทาง และ `aria-sort`
- ต่ำกว่า `lg` เป็นการ์ดต่อเรคอร์ด แสดงคอลัมน์ `title`/`meta` พร้อมปุ่มท้ายการ์ด (รูปแบบเดียวกับหน้ารายการคำขอเดิม)
- `ReportToolbar`: ฟอร์ม GET (ช่องค้นหา + ตัวกรองที่ส่งเข้ามาเป็น children + ปุ่มค้นหา/ล้าง) และช่อง `actions` ด้านขวา (ปุ่ม "เพิ่ม")
  ฟอร์มส่งค่าเดิมของ `sort/dir` ต่อไปด้วย; ค้นหาแล้วกลับหน้า 1
- แสดง "พบ N รายการ" และ `PaginationNav` (14 ต่อหน้า) ใช้ `paginate` เหมือนหน้าอื่น
- สไตล์ใช้โทเคนเดิม (`cardClass`, `inputClass`, `btnPrimary/Secondary/Danger`, ป้าย `Badge`/`StatusBadge`, `SlaChip`)

### 4.5 รายงานคำขอ

คอลัมน์: เลขที่ (เรียงได้), หัวข้อ+ไอคอนประเภท (เรียงได้), ผู้ขอ, ผู้อนุมัติ, ผู้รับผิดชอบ, สถานะ (เรียงได้), ความสำคัญ (เรียงได้),
SLA (`SlaChip`), วันที่ยื่น (เรียงได้), ต้องการใช้ภายใน/ครบกำหนด (เรียงได้) และ **ผลตัดสิน** (อนุมัติ/ไม่อนุมัติ/รออนุมัติ + วันที่ตัดสิน)
คอลัมน์ผู้อนุมัติซ่อนสำหรับ MANAGER (เป็นตัวเองทุกแถว)

ผลตัดสินหาจาก `RequestEvent`: ฟังก์ชัน pure `approvalOutcome(status, decision)` โดย `decision` คือ event แรกที่
`STATUS_CHANGED` จาก `PENDING_APPROVAL` → `SUBMITTED` หรือ `APPROVED` (ของเก่า) = อนุมัติ, → `REJECTED` = ไม่อนุมัติ; ไม่มี event
และสถานะ `PENDING_APPROVAL` = รออนุมัติ; ที่เหลือ (ยกเลิกก่อนตัดสิน หรือไม่ต้องอนุมัติ) = ไม่มีผลตัดสิน (แสดง "-")
ตัวกรอง `result` แปลงเป็นเงื่อนไข `status = PENDING_APPROVAL` หรือ `events: { some: {...} }`

ปุ่มท้ายแถว: **เปิด** (ลิงก์ไปหน้ารายละเอียดเดิม), **แก้ไข** (เปิด popup, ซ่อนเมื่อคำขอถูกลบ), **ลบ**/**กู้คืน** (ใช้
`ConfirmActionButton` + `deleteRequest`/`restoreRequest`); ปุ่ม **เพิ่ม** หัวตารางลิงก์ไป `/requests/new` (ยื่นแทนผู้อื่น)
เพราะฟอร์มมี 21 ประเภทใหญ่เกินใส่ popup

### 4.6 รายงานผู้ใช้ (ADMIN)

คอลัมน์: ผู้ใช้ (avatar+ชื่อ+อีเมล, เรียงตามชื่อ/อีเมลได้), แผนก, สิทธิ์ (เรียงได้), สถานะ, เข้าสู่ระบบล่าสุด (เรียงได้), จำนวนคำขอที่ยื่น
(ไม่นับที่ลบแล้ว; ไม่เรียงตามคอลัมน์นี้), วันที่เพิ่ม (เรียงได้) ตัวกรอง สิทธิ์, สถานะ, ไม่เคยเข้าสู่ระบบ ค้นหาตามชื่อ/อีเมล/แผนก
ปุ่มท้ายแถว: **แก้ไข** (popup `UserForm`), **ลบ** (ซ่อนเมื่อเป็นตัวเอง; กติกาลบเดิมคงไว้ รวมถึงผู้ใช้ที่มีประวัติลบไม่ได้)
ปุ่ม **เพิ่ม** หัวตาราง เปิด popup `UserForm` โหมดสร้าง

### 4.7 สถิติสรุป

ตารางอ่านอย่างเดียว (ไม่มีปุ่มท้ายแถว) แถวละหนึ่งกลุ่ม (ตามประเภท/เดือน/ผู้รับผิดชอบ) คอลัมน์: ทั้งหมด, ยังเปิดอยู่, เสร็จสิ้น,
ไม่อนุมัติ, ยกเลิก, รออนุมัติ, อัตราผ่าน SLA ตอบรับ, อัตราผ่าน SLA ส่งมอบ, เวลาอนุมัติเฉลี่ย (ชั่วโมง) และแถวรวมท้ายตาราง
ตัวกรอง: ช่วงวันที่ + ปุ่มลัด (เดือนนี้, เดือนที่แล้ว, 3 เดือน, ปีนี้) + จัดกลุ่มตาม
- คำนวณใน `src/lib/report-summary.ts` (pure): `summarizeRequests(rows, group, now, cal)` ใช้ `evaluateSla` และ `tally`;
  `monthKeyBangkok(date)` คืน `YYYY-MM` ตามเวลา Bangkok; เวลาอนุมัติเฉลี่ย = ค่าเฉลี่ยของ `managerApprovedAt - createdAt`
  (เวลาจริง ไม่นับเฉพาะเวลาทำการ) เฉพาะคำขอที่ผ่านการอนุมัติ; ไม่มีข้อมูล = "-"
- ดึงแถวด้วย select ขั้นต่ำ ภายในขอบเขตสิทธิ์ ไม่นับที่ลบแล้ว ตั้งเพดาน 20,000 แถวและแสดงข้อความเตือนถ้าถึงเพดาน
- ไม่แบ่งหน้า (จำนวนกลุ่มน้อย) เรียงตามคอลัมน์ได้

### 4.8 popup (Modal) แบบเปิดจาก URL

`Modal` เป็นคอมโพเนนต์ฝั่งไคลเอนต์ใช้ `<dialog>` ดั้งเดิม (`showModal()` ตอนติดตั้ง จึงได้ focus trap, Esc ปิด, พื้นหลังมืด)
- กด "แก้ไข" = ลิงก์ไป URL เดิมพร้อม `edit=<id>` (คงตัวกรอง/เรียง/หน้า) หน้าเซิร์ฟเวอร์เห็น `edit` แล้ว render
  `<Modal closeHref=...>` พร้อมฟอร์มของเรคอร์ดนั้น; "เพิ่ม" ผู้ใช้ใช้ `new=1`
- ปิด popup (Esc, คลิกพื้นหลัง, ปุ่มยกเลิก, ปุ่ม X) = `router.replace(closeHref)` คือ URL เดิมที่ตัด `edit/new` ออก
- ฟอร์ม `RequestEditForm` และ `UserForm` รับ prop ใหม่ `returnTo?: string` และ `cancelHref?: string`: ส่ง `returnTo`
  เป็น hidden field และใช้ `cancelHref` แทนลิงก์ยกเลิกตายตัว; action `updateRequestByAdmin`, `createUser`,
  `updateUserAdmin`, `deleteUser` อ่าน `returnTo` ตรวจด้วย `safeReturn(value, fallback)` (ใหม่, pure) ที่ยอมเฉพาะ path ภายในที่ขึ้นต้นด้วย
  `/reports/` หรือ `/admin/` (ไม่มี `//`, `\`, หรือขึ้นบรรทัดใหม่) ไม่ผ่านใช้ค่าเดิม (`/admin/...`) แล้ว `redirect` ไปที่นั่น
- `deleteRequest`/`restoreRequest` เพิ่ม `revalidatePath("/reports", "layout")`; action ผู้ใช้ revalidate `/reports` ด้วย
- เรคอร์ดของ `edit` โหลดผ่าน query ที่บังคับขอบเขตเดียวกับตาราง (4.3) ไม่พบ/นอกขอบเขต/ลบแล้ว (กรณีแก้คำขอ) = ไม่เปิด popup

### 4.9 สิทธิ์และความปลอดภัย

- ทุก query ใน `src/lib/report-queries.ts` (server-only) รับ `viewer` และใส่ `requestReportScope` เอง; หน้า `/reports/users`
  ตรวจ `isAdmin` ซ้ำเองนอกเหนือจาก layout
- ปุ่มท้ายแถวเรียก server action เดิมที่ตรวจ `canEditRequest`/`canModifyUser`/`canCreateUser` เองอยู่แล้ว ไม่มีสิทธิ์ใหม่
- พารามิเตอร์ทั้งหมดผ่าน whitelist (ประเภท/สถานะ/สิทธิ์/ฟิลด์เรียง/วันที่) ไม่ส่งสตริงจาก URL เข้า `orderBy` หรือ `where` โดยตรง
- `returnTo` ผ่าน `safeReturn` กัน open redirect

## 5. ไฟล์ที่คาดว่าจะเพิ่ม/แก้

- เพิ่ม (pure + เทสต์): `src/lib/report-params.ts`, `src/lib/report-summary.ts`, `src/lib/safe-return.ts`
- เพิ่ม (server): `src/lib/report-queries.ts`
- เพิ่ม (UI): `src/components/data-table.tsx`, `report-toolbar.tsx`, `modal.tsx`; หน้า
  `src/app/(app)/reports/{layout,page}.tsx`, `reports/requests/page.tsx`, `reports/users/page.tsx`, `reports/summary/page.tsx`
- แก้: `app-shell.tsx` (ไอคอน `reports` และกลุ่ม), `(app)/layout.tsx` (รายการเมนู), `request-edit-form.tsx`, `user-form.tsx`,
  `actions/admin-requests.ts`, `actions/admin-users.ts`, `README.md`

## 6. การทดสอบ

- เทสต์ pure ด้วย vitest (เขียนก่อน): `report-params` (ค่านอก whitelist → ค่าเริ่มต้น, ทิศทางเรียง, วันที่ผิดรูปแบบ, `approver`
  ของ MANAGER ถูกบังคับเป็นตัวเอง, `requestReportScope` ทุก role), `approvalOutcome` (อนุมัติ/ไม่อนุมัติ/รอ/ไม่มี, ค่า `APPROVED` ของเก่า),
  `monthKeyBangkok` (ขอบเขตเวลา 23:30 UTC ข้ามเดือน), `summarizeRequests` (นับ, อัตรา SLA, ค่าเฉลี่ย, แถวรวม, ไม่มีข้อมูล), `safeReturn`
  (ยอม `/reports/...` และ `/admin/...`, ปฏิเสธ `//x`, `/\x`, `https://x`, `/other`, ขึ้นบรรทัดใหม่)
- เทสต์ guard เดิม `deleted-filter.test.ts` ต้องผ่านต่อ (query ใหม่อ่าน `serviceRequest` ต้องกรอง `deletedAt` เสมอ ยกเว้นเมื่อ `deleted=include|only`
  ที่ตั้งใจ — ต้องปรับเทสต์ guard ให้ยอมไฟล์ `report-queries.ts` ตามเงื่อนไขนี้ และเพิ่มเทสต์ว่าฟังก์ชันที่อ่านโดยไม่กรองต้องรับพารามิเตอร์ `deleted`)
- i18n guard เดิมครอบข้อความใหม่ทั้งหมด
- ตรวจกับ DB ชั่วคราว (ขั้นตอนเดิม) ในเบราว์เซอร์ แล้วรัน `tsc`, `eslint`, `vitest`: ADMIN และ MANAGER เปิดทุกแท็บ; MANAGER เปิด
  `/reports/users` ถูกส่งกลับ; MANAGER ใส่ `approver=<คนอื่น>` ใน URL ก็ยังเห็นเฉพาะของตน; ค้นหา/กรอง/เรียง/แบ่งหน้าและ URL;
  popup แก้คำขอ/ผู้ใช้ บันทึกแล้วกลับตารางเดิมโดยตัวกรองไม่หาย; ลบแล้วกู้คืนคำขอ; ลบผู้ใช้ที่มีประวัติถูกปฏิเสธ; จอ 375/768/กว้าง ทั้งสามภาษา
- ส่งรีวิวอิสระทั้ง branch ก่อน merge เหมือนรอบที่แล้ว

## 7. ความเสี่ยง

- query รายงานคำขออ่านโดยไม่กรอง `deletedAt` ได้เมื่อ `deleted=include|only` จึงต้องปรับเทสต์ guard อย่างระมัดระวังไม่ให้เปิดช่องให้ query อื่นลืมกรอง
- สถิติดึงแถวมาคำนวณใน JS (เหมือน `getSlaOverview`) เหมาะกับข้อมูลระดับหลักพันถึงหมื่น ถ้าโตกว่านี้ต้องย้ายไปรวมกลุ่มใน SQL
- `<dialog>` ใน dev mode ต้อง hydrate ก่อนจึงเปิด/ปิดได้ครบ ตรวจด้วยการคลิกจริงในเบราว์เซอร์ที่แสดงอยู่
- ตารางใหม่ซ้อนกับหน้า "จัดการระบบ" เดิม (รายการคำขอ/ผู้ใช้) ผู้ใช้อาจสับสน ควรพิจารณารวมในรอบถัดไป

## 8. ส่วนที่เพิ่มเพื่อให้ดีไซน์ครบ (ไม่ได้อยู่ในข้อความที่อนุมัติในแชต)

เสนอให้ตรวจเป็นพิเศษตอนรีวิว:
1. เพดาน 20,000 แถวและข้อความเตือนในสถิติ
2. ปุ่มลัดช่วงวันที่ (เดือนนี้/เดือนที่แล้ว/3 เดือน/ปีนี้) และไม่แบ่งหน้าในแท็บสถิติ
3. คอลัมน์ "จำนวนคำขอที่ยื่น" ไม่เรียงได้ เพราะนับเฉพาะที่ยังไม่ถูกลบ
4. `safeReturn` ยอมเฉพาะ `/reports/` และ `/admin/`
5. หน้า "เปิดรายละเอียด" ของแถวพาไปหน้ารายละเอียดคำขอเดิม (ไม่ใช่ popup)
