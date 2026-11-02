# เมนู "จัดการระบบ" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ให้ ADMIN และ MANAGER (พี่เดชา) ทำ CRUD ผู้ใช้ คำขอ และบทความ KB จากเมนู "จัดการระบบ" เมนูเดียว ตามกฎสิทธิ์ใน spec

**Architecture:** กฎสิทธิ์และกฎอื่นที่ไม่แตะ DB อยู่ใน pure module (`permissions.ts`, `admin-rules.ts`, `audit.ts`) ที่เทสต์ด้วย vitest; server action ทุกตัวเรียก `requireSystemManager()` แล้วตรวจกฎซ้ำเอง; หน้า `/admin/*` อยู่ใต้ `admin/layout.tsx` ที่มีแท็บ; คำขอใช้ soft delete (`deletedAt`) และทุก query ที่อ่านคำขอต้องกรอง `deletedAt: null`

**Tech Stack:** Next.js 16.4.3 App Router (server actions, `useActionState`), TypeScript, Tailwind 4, Prisma 6.19.3, PostgreSQL, zod 4, vitest, lucide-react

**Spec:** `docs/superpowers/specs/2026-11-02-system-management-design.md` (อ่านก่อนเริ่ม ข้อ 4.x ในแผนนี้อ้างถึง spec)

## Global Constraints

- ข้อความ UI ทุกจุดผ่าน `t(th, lo, en)` (ไทย, ลาว, อังกฤษ ตามลำดับนี้) หรือ `l(...)`; ห้ามเขียนข้อความไทย/ลาวนอก `t()/l()`; ห้าม hard-code locale — ตรวจด้วย `npx vitest run src/lib/i18n.test.ts`
- ทุกรายการในเมนูจัดการระบบแบ่งหน้า 14 รายการ (`PAGE_SIZE` ใน `queries.ts`; query ใหม่ทุกตัวคำนวณหน้าด้วย `paginate` จาก Task 5 ไม่เขียนบีบหน้าเอง) และใช้ได้ที่ 375px / 768px / จอกว้าง (การ์ดต่ำกว่า `lg`, drawer ต่ำกว่า `xl`, input 16px บนมือถือ — ใช้ `inputClass` `btnPrimary` `btnSecondary` `btnDanger` `cardClass` จาก `src/lib/ui.ts`)
- ทุก server action เรียก `requireSystemManager()` (หรือ `requireKbEditor()` สำหรับสร้าง/แก้ KB) แล้วตรวจกฎจาก `permissions.ts` อีกครั้ง; การซ่อนปุ่มใน UI ไม่ใช่การควบคุมสิทธิ์
- `src/app/actions/requests.ts` และ `prisma/seed.ts` เป็นไฟล์ CRLF: แก้ด้วย Edit ทีละจุด ห้ามเขียนทับทั้งไฟล์ และห้ามเปลี่ยน line ending
- ห้ามแตะ `cotester/` และ `.claude/`; lint เฉพาะ `npx eslint src prisma next.config.ts vitest.config.mts`; typecheck ด้วย `npx tsc --noEmit`; เทสต์ด้วย `npx vitest run` (สคริปต์ `npm test` เป็นของ jest ใน cotester ห้ามใช้)
- ทุก commit ลงท้ายด้วยบรรทัด `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`; commit เฉพาะไฟล์ของ task นั้น (`git add <paths>` ห้าม `git add -A`)
- **ขั้นตอน scratch DB (S)** ใช้ทุกครั้งที่ต้องรันกับ DB: (1) หยุด `npm run dev` ที่ตัวเองเปิด (2) รัน `node "C:\Users\ATECH-~1\AppData\Local\Temp\claude\D--comfy\ed5a6c94-8f94-47a8-8074-7e5556cfadc5\scratchpad\pg\start.mjs"` แบบ background (3) ตั้ง `DATABASE_URL` และ `DIRECT_URL` เป็น `postgresql://postgres:postgres@localhost:54329/service-request_db?schema=public` ใน shell นั้น (4) `npx prisma migrate deploy` แล้ว `npx prisma db seed` (5) `npm run dev` ด้วย env เดิม (6) จบงานให้หยุดเฉพาะโปรเซสของตัวเอง แล้วเปิด `npm run dev` ใหม่บน `.env` (DB จริง) ห้ามพิมพ์รหัสผ่านใน `.env` ออกมา และห้าม migrate DB จริงจนกว่าจะถึง Task 11
- `prisma generate` ต้องหยุด dev server ก่อน (EPERM บน Windows)

## Review Focus

อินพุต/สภาวะที่ spec ไม่ได้ระบุเทสต์ตรงๆ แต่น่าจะพลาดมากที่สุด (เรียงจากมีโอกาสมากไปน้อย) แต่ละข้อมีเทสต์อยู่ใน task ที่ระบุ:

1. ฟอร์ม POST ปลอมที่ MANAGER ส่ง `role=ADMIN` หรือชี้ `userId` ของ ADMIN ต้องถูกปฏิเสธ → Task 2 (เมทริกซ์) และ Task 11 (ลองจริง)
2. คำขอที่ลบแล้วยังถูกเรียกผ่าน action ด้วย `requestId` (comment, เปลี่ยนสถานะ, ยกเลิก, อนุมัติ) หรือโผล่ใน query ที่ลืมกรอง → Task 4 (เทสต์ guard ที่สแกนซอร์ส)
3. ผู้ใช้ที่ถูกอ้างถึงทางความสัมพันธ์ `SetNull` เท่านั้น (เป็น assignee/approver/decidedBy) ต้องลบไม่ได้ → Task 3 (`userDeletionBlockers`)
4. ลงทะเบียนอีเมลตัวพิมพ์ใหญ่/มีช่องว่าง/ซ้ำกับที่มีอยู่ ต้องได้อีเมลที่ normalize แล้วหรือ error ที่ช่อง ไม่ใช่ exception จาก unique constraint → Task 6 (เทสต์ `emailField`) และ Task 11
5. ลบรายการสุดท้ายของหน้าสุดท้าย หรือรายการว่าง ต้องไม่ได้หน้าว่างเกินจำนวนหน้า → Task 5 (`paginate`)

---

### Task 1: Schema และ migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261104000000_system_management/migration.sql`

**Interfaces:**
- Produces: Prisma types `ServiceRequest.deletedAt: Date | null`, `ServiceRequest.deletedById: string | null`, relation `deletedBy`, `User.deletedRequests`, `EventAction` ที่มี `EDITED | DELETED | RESTORED`, model `AuditLog { id, actorId, action: string, entity: string, entityId: string, summary: string, createdAt }` พร้อม relation `actor` และ `User.auditLogs`

- [ ] **Step 1: แก้ `schema.prisma`** — เพิ่ม enum value `EDITED`, `DELETED`, `RESTORED` ต่อท้าย `EventAction`; ใน `ServiceRequest` เพิ่ม `deletedAt DateTime? @map("deleted_at")`, `deletedById String? @map("deleted_by_id")`, `deletedBy User? @relation("Deleter", fields: [deletedById], references: [id], onDelete: Restrict)`, `@@index([deletedAt])`; ใน `User` เพิ่ม `deletedRequests ServiceRequest[] @relation("Deleter")` และ `auditLogs AuditLog[]`; เพิ่ม model `AuditLog` ตาม Interfaces (`@@map("tbl_audit_logs")`, `actor` เป็น `onDelete: Restrict`, `@@index([createdAt])`, `@@index([entity, entityId])`, คอลัมน์ snake_case ด้วย `@map` ตามแบบ model อื่น)
- [ ] **Step 2: เขียน `migration.sql`** ตามที่ Prisma จะสร้าง: `ALTER TYPE "EventAction" ADD VALUE` สามครั้ง (ใส่คอมเมนต์ว่าค่าใหม่ยังไม่ถูกใช้ใน migration นี้); `ALTER TABLE "tbl_service_requests" ADD COLUMN "deleted_at" TIMESTAMP(3), ADD COLUMN "deleted_by_id" TEXT`; `CREATE INDEX "tbl_service_requests_deleted_at_idx"`; FK `tbl_service_requests_deleted_by_id_fkey` → `tbl_users("id") ON DELETE RESTRICT ON UPDATE CASCADE`; `CREATE TABLE "tbl_audit_logs"` (`id TEXT` PK, `actor_id TEXT NOT NULL`, `action/entity/entity_id/summary TEXT NOT NULL`, `created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`) พร้อม index สองตัวและ FK `actor_id` → `tbl_users("id") ON DELETE RESTRICT ON UPDATE CASCADE`
- [ ] **Step 3: ตรวจ** — ทำขั้นตอน (S) ข้อ 1–4 แล้วรัน `npx prisma migrate diff --from-url "<scratch url>" --to-schema-datamodel prisma/schema.prisma --exit-code`; ผ่านเมื่อ exit code 0 (ไม่มี drift) แล้ว `npx prisma generate` และ `npx tsc --noEmit` ผ่าน
- [ ] **Step 4: Commit** — `git add prisma/schema.prisma prisma/migrations/20261104000000_system_management` · `feat(db): soft delete for requests and audit log table`

### Task 2: กฎสิทธิ์ (pure) และ helper ใน dal

**Files:**
- Modify: `src/lib/permissions.ts`, `src/lib/permissions.test.ts`, `src/lib/dal.ts`

**Interfaces:**
- Produces (ใน `permissions.ts`):
  - `canManageSystem(viewer: Viewer): boolean` — ADMIN หรือ MANAGER
  - `type UserTarget = { id: string; role: Role; isActive: boolean }`
  - `type UserEdit = { role: Role; isActive: boolean } | { delete: true }`
  - `type ModifyUserResult = { ok: true } | { ok: false; reason: "not-allowed" | "admin-protected" | "admin-grant" | "self" }`
  - `canModifyUser(actor: Viewer, target: UserTarget, edit: UserEdit): ModifyUserResult` — ลำดับตรวจ: `not-allowed` (actor ไม่ใช่ system manager) → `admin-protected` (actor เป็น MANAGER และ target เป็น ADMIN ทุกกรณี) → `admin-grant` (actor เป็น MANAGER และ edit ตั้ง `role: "ADMIN"`) → `self` (actor คือ target และเป็น delete หรือ role/isActive ต่างจากเดิม) → `{ ok: true }`
  - `canCreateUser(actor: Viewer, role: Role): boolean` — system manager และ (role ไม่ใช่ ADMIN หรือ actor เป็น ADMIN)
  - `canEditKb(viewer: Viewer): boolean` — `isStaff` หรือ `canManageSystem`; `canDeleteKb(viewer: Viewer): boolean` — `canManageSystem`
  - `canEditRequest(viewer: Viewer, request: { deletedAt: Date | null }): boolean` — `canManageSystem` และ `deletedAt === null`
  - แก้ `canViewRequest`: เพิ่ม `canManageSystem(viewer)` เป็นเงื่อนไขหนึ่ง (เพื่อให้ลิงก์จากเมนูจัดการเปิดหน้ารายละเอียดได้)
  - แก้ `canComment`: ผู้ที่เห็นคำขอเพราะเป็น system manager เท่านั้น (ไม่ใช่ staff/ผู้ขอ/ผู้อนุมัติ) เขียนความคิดเห็นไม่ได้ — พฤติกรรมเดิมของคนอื่นต้องไม่เปลี่ยน
- Produces (ใน `dal.ts`): `requireSystemManager(): Promise<CurrentUser>` (redirect `/` ถ้า `!canManageSystem`), `requireKbEditor(): Promise<CurrentUser>` (redirect `/` ถ้า `!canEditKb`); ลบ `requireAdmin` เมื่อไม่มีที่ใช้แล้ว (Task 6)

- [ ] **Step 1: เขียนเทสต์ที่ล้มเหลวใน `permissions.test.ts`** (ใช้ตัวแปร `employee/staff/manager/admin` ที่มีอยู่) — `describe("system management")`:
  - `expect([employee, staff, manager, admin].map(canManageSystem)).toEqual([false, false, true, true])`
  - เมทริกซ์ `canModifyUser` (target ตัวอย่าง `adminTarget = {id:"a2", role:"ADMIN", isActive:true}`, `empTarget = {id:"e2", role:"EMPLOYEE", isActive:true}`):

    | actor | target | edit | ผลที่ต้องได้ |
    |---|---|---|---|
    | employee, staff | empTarget | `{role:"EMPLOYEE", isActive:true}` | `{ok:false, reason:"not-allowed"}` |
    | manager | adminTarget | `{role:"ADMIN", isActive:true}` และ `{delete:true}` | `admin-protected` |
    | manager | empTarget | `{role:"ADMIN", isActive:true}` | `admin-grant` |
    | manager | empTarget | `{role:"IT_STAFF", isActive:false}` และ `{delete:true}` | `{ok:true}` |
    | admin | adminTarget | `{role:"EMPLOYEE", isActive:true}` และ `{delete:true}` | `{ok:true}` |
    | admin (self `{id:admin.id, role:"ADMIN", isActive:true}`) | self | `{role:"EMPLOYEE", isActive:true}`, `{role:"ADMIN", isActive:false}`, `{delete:true}` | `self` ทั้งสาม |
    | admin | self | `{role:"ADMIN", isActive:true}` (แก้โปรไฟล์อย่างเดียว) | `{ok:true}` |
    | manager (self `{id:manager.id, role:"MANAGER", isActive:true}`) | self | `{role:"ADMIN", isActive:true}` | `admin-grant` |

  - เคส ADMIN คนสุดท้าย: มี ADMIN เพียง `soleAdmin` — วนทุก actor ที่ไม่ใช่ตัวเอง (`employee, staff, manager`) ต้องได้ `ok:false` สำหรับ demote/disable/delete และ `soleAdmin` ทำกับตัวเองได้ `self`
  - `canCreateUser`: admin ได้ทุก role, manager ได้ทุก role ยกเว้น `"ADMIN"`, employee/staff ได้ `false`
  - `canEditKb` = `[false, true, true, true]` ตามลำดับ `[employee, staff, manager, admin]`; `canDeleteKb` = `[false, false, true, true]`
  - `canEditRequest(manager, {deletedAt:null})` true, `canEditRequest(manager, {deletedAt:new Date()})` false, `canEditRequest(staff, {deletedAt:null})` false
  - `canViewRequest(manager, {requesterId:"x"})` true (manager ที่ไม่ใช่ผู้อนุมัติ) แต่ `canComment(manager, {requesterId:"x", status:"IN_PROGRESS"})` false; `canComment(manager, {requesterId:"x", approverId:manager.id, status:"PENDING_APPROVAL"})` true
- [ ] **Step 2: รัน** `npx vitest run src/lib/permissions.test.ts` — คาดว่า FAIL (ฟังก์ชันยังไม่มี)
- [ ] **Step 3: เขียนโค้ดใน `permissions.ts` และ `dal.ts`** ตาม Interfaces (ใช้ `isAdmin`/`isManager` ที่มีอยู่)
- [ ] **Step 4: รัน** `npx vitest run src/lib/permissions.test.ts` — คาดว่า PASS ทุกเคส (เคสเดิมต้องไม่พัง) แล้ว `npx tsc --noEmit`
- [ ] **Step 5: Commit** — `git add src/lib/permissions.ts src/lib/permissions.test.ts src/lib/dal.ts` · `feat: permission rules for system management`

### Task 3: กฎ pure อื่นและตัวเขียน audit

**Files:**
- Create: `src/lib/admin-rules.ts`, `src/lib/admin-rules.test.ts`, `src/lib/audit.ts`, `src/lib/audit.test.ts`

**Interfaces:**
- Produces (`admin-rules.ts`, pure, import `l`, `Localized`, `LANGS` จาก `./i18n`):
  - `type UserReferenceCounts = { requests: number; comments: number; events: number; articles: number; assigned: number; approvals: number; decided: number; deleted: number }`
  - `userDeletionBlockers(counts: UserReferenceCounts): (keyof UserReferenceCounts)[]` — คีย์ที่ค่า > 0 เรียงตามลำดับที่ประกาศใน type
  - `USER_REFERENCE_LABEL: Record<keyof UserReferenceCounts, Localized>` (เช่น `requests` = "คำขอที่ยื่น")
  - `EDITABLE_REQUEST_FIELDS = ["title", "description", "priority", "neededBy", "requestedForName"] as const` และ `REQUEST_EDIT_FIELD_LABEL: Record<(typeof EDITABLE_REQUEST_FIELDS)[number], Localized>`
  - `changedFields<K extends string>(before: Record<K, unknown>, after: Record<K, unknown>, keys: readonly K[]): K[]` — คีย์ที่ค่าต่างกันด้วย `!==` (ผู้เรียกแปลงค่าเป็น string/number/null ก่อน)
  - `profileNameOnSignIn(existing: { googleSub: string | null } | null, googleName: string): string | undefined` — `googleName` เมื่อไม่มีแถวเดิมหรือ `googleSub` ว่าง; `undefined` เมื่อผูก Google แล้ว (ผู้ดูแลเป็นเจ้าของชื่อ)
- Produces (`audit.ts`, ไม่ import `db`):
  - `AUDIT_ACTIONS = ["USER_CREATED","USER_UPDATED","USER_DELETED","KB_CREATED","KB_UPDATED","KB_DELETED"] as const`, `type AuditAction`, `type AuditEntity = "USER" | "KB_ARTICLE"`, `AUDIT_ACTION_LABEL: Record<AuditAction, Localized>`
  - `writeAudit(client: Pick<Prisma.TransactionClient, "auditLog">, actorId: string, entry: { action: AuditAction; entity: AuditEntity; entityId: string; summary: string }): Promise<void>` — `summary` ตัดที่ 300 ตัวอักษร

- [ ] **Step 1: เขียนเทสต์ที่ล้มเหลว**
  - `admin-rules.test.ts`: `userDeletionBlockers(zeroCounts)` → `[]`; `{...zeroCounts, assigned: 2, comments: 1}` → `["comments", "assigned"]`; `changedFields({title:"a",priority:"LOW"}, {title:"a",priority:"HIGH"}, ["title","priority"])` → `["priority"]` และค่าเท่ากันทั้งหมด → `[]`; `profileNameOnSignIn(null,"G")` → `"G"`, `profileNameOnSignIn({googleSub:null},"G")` → `"G"`, `profileNameOnSignIn({googleSub:"sub"},"G")` → `undefined`; ทุก label ใน `USER_REFERENCE_LABEL` และ `REQUEST_EDIT_FIELD_LABEL` มีข้อความไม่ว่างทุกภาษาใน `LANGS` (รูปแบบเดียวกับเทสต์ "approval texts" ใน `approval.test.ts`)
  - `audit.test.ts`: ใช้ client ปลอม `{ auditLog: { create: vi.fn() } }`; `writeAudit` เรียก `create` ด้วย `{ data: { actorId: "u1", action: "USER_CREATED", entity: "USER", entityId: "e1", summary: "x" } }`; summary ยาว 500 ตัวอักษรถูกตัดเหลือ 300; `AUDIT_ACTION_LABEL` ครบทุกภาษา
- [ ] **Step 2: รัน** `npx vitest run src/lib/admin-rules.test.ts src/lib/audit.test.ts` — คาดว่า FAIL
- [ ] **Step 3: เขียน `admin-rules.ts` และ `audit.ts`** ตาม Interfaces (ข้อความ label ไทย/ลาว/อังกฤษ เขียนตามสไตล์ `labels.ts`)
- [ ] **Step 4: รัน** คำสั่งเดิม — คาดว่า PASS แล้ว `npx tsc --noEmit`
- [ ] **Step 5: Commit** — `git add src/lib/admin-rules.ts src/lib/admin-rules.test.ts src/lib/audit.ts src/lib/audit.test.ts` · `feat: admin rules and audit writer`

### Task 4: คำขอที่ถูกลบหายจากทั้งระบบ

**Files:**
- Modify: `src/lib/queries.ts`, `src/app/actions/requests.ts`, `src/app/(app)/requests/[id]/page.tsx`, `src/components/request-timeline.tsx`
- Create: `src/lib/deleted-filter.test.ts`

**Interfaces:**
- Consumes: `canManageSystem` (Task 2); ฟิลด์ `deletedAt/deletedBy` (Task 1)
- Produces: `rowSelect` มี `deletedAt: true`; `ListFilters` มี `console?: boolean` (true + `canManageSystem(viewer)` = เห็นคำขอทุกคน ค้นด้วยชื่อ/อีเมลผู้ขอได้ ไม่จำกัดผู้ขอ/ผู้อนุมัติ) และ `deleted?: "include" | "only"` (ใช้ได้เฉพาะเมื่อ `console` ผ่านเงื่อนไขข้างต้น; ค่าเริ่มต้นไม่แสดงที่ลบ); `getRequestDetail` คืนข้อมูลของคำขอที่ลบแล้วเฉพาะ `canManageSystem(viewer)` (คนอื่นได้ `null`) และ include `deletedBy: { select: { name: true } }`

- [ ] **Step 1: เขียน `deleted-filter.test.ts`** — สแกน `src/lib/queries.ts` ด้วย TypeScript AST (รูปแบบเดียวกับ `i18n.test.ts`): ทุก CallExpression ที่เป็น `db.serviceRequest.findMany|findFirst|count|groupBy` ต้องอยู่ในฟังก์ชันระดับบนสุดที่ซอร์สมีคำว่า `deletedAt`; และสแกนทุกไฟล์ใน `src/app/actions/` ว่าไม่มี `db.serviceRequest.findUnique(` เหลืออยู่ (action ต้องใช้ `findFirst` ที่กรอง `deletedAt: null`) ข้อความ assertion ระบุชื่อฟังก์ชัน/ไฟล์ที่ผิด
- [ ] **Step 2: รันเทสต์** `npx vitest run src/lib/deleted-filter.test.ts` — คาดว่า FAIL
- [ ] **Step 3: แก้ `queries.ts`** — เพิ่ม `deletedAt: null` ใน: `listRequests`, `listPendingApprovals`, `countPendingApprovals`, `getEmployeeDashboard` (`mine`), `listMyTasks`, `countMyTasks`, `getStaffDashboard` (สามคำสั่ง), `getSlaOverview` (สองคำสั่ง); `listRequests` รองรับ `console`/`deleted` ตาม Interfaces (ตัวกรอง `scope`/`sla` ยังจำกัดเฉพาะ `isStaff`); `getRequestDetail` ตามที่ระบุ
- [ ] **Step 4: แก้ `requests.ts`** — ใน action ทั้งเจ็ด (`addComment`, `changeStatus`, `assignRequest`, `reassignApprover`, `changeSlaTier`, `decideByManager`, `cancelRequest`) เปลี่ยน `db.serviceRequest.findUnique({ where: { id: requestId }` เป็น `db.serviceRequest.findFirst({ where: { id: requestId, deletedAt: null }` (ผลลัพธ์ `null` ใช้ทางออก "ไม่พบคำขอ" เดิม)
- [ ] **Step 5: แก้หน้ารายละเอียด `requests/[id]/page.tsx`** — เมื่อ `request.deletedAt` ไม่ว่าง (เห็นได้เฉพาะ system manager): แสดงแบนเนอร์สีเหลือง "คำขอนี้ถูกลบโดย {deletedBy.name} เมื่อ {เวลา}" (ปุ่มกู้คืนเพิ่มใน Task 7) และซ่อน `ManagerDecision`, `CommentForm`, `StaffPanel`, `CancelButton`
- [ ] **Step 6: แก้ `request-timeline.tsx`** — เพิ่ม case `EDITED` (ไอคอน `Pencil`; "แก้ไขข้อมูลคำขอ ({ชื่อฟิลด์ที่แปลแล้วคั่นด้วยจุลภาค จาก `toValue` โดยใช้ `REQUEST_EDIT_FIELD_LABEL`})"), `DELETED` (`Trash2`, tone `bg-red-100 text-red-600`), `RESTORED` (`Undo2`, tone `bg-emerald-100 text-emerald-600`); case `CREATED` ที่ `fromValue` ไม่ว่าง แสดง "สร้างคำขอแทน {fromValue}"
- [ ] **Step 7: ตรวจ** — `npx vitest run src/lib/deleted-filter.test.ts src/lib/i18n.test.ts` PASS; `npx tsc --noEmit`; `npx eslint src`
- [ ] **Step 8: Commit** — `git add src/lib/queries.ts src/lib/deleted-filter.test.ts src/app/actions/requests.ts "src/app/(app)/requests/[id]/page.tsx" src/components/request-timeline.tsx` · `feat: hide soft-deleted requests everywhere`

### Task 5: โครงเมนู "จัดการระบบ" และตัวแบ่งหน้า

**Files:**
- Create: `src/app/(app)/admin/layout.tsx`, `src/app/(app)/admin/page.tsx`, `src/components/admin-tabs.tsx`, `src/components/pagination-nav.tsx`
- Modify: `src/lib/pagination.ts`, `src/lib/pagination.test.ts`, `src/components/app-shell.tsx`, `src/app/(app)/layout.tsx`, `src/lib/labels.ts`

**Interfaces:**
- Produces:
  - `paginate(total: number, requested: number, pageSize: number): { page: number; pageCount: number; skip: number }` (ใน `pagination.ts`; `pageCount = max(1, ceil(total/pageSize))`, `page` ถูกบีบให้อยู่ใน `1..pageCount`, `skip = (page-1)*pageSize`)
  - `PaginationNav({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (page: number) => string })` — server component (ใช้ `getI18n`) หน้าตา/ข้อความเหมือนแถบแบ่งหน้าใน `requests/page.tsx` (ปุ่มก่อนหน้า/ถัดไป, `pageItems`, "หน้า X จาก Y (14 รายการต่อหน้า)")
  - `AdminTabs({ items }: { items: { href: string; label: string }[] })` — client component; แท็บ active เมื่อ `pathname === href || pathname.startsWith(href + "/")`; แถบเลื่อนแนวนอนบนจอแคบ
  - `NavItem.icon` เพิ่ม `"settings"` (ไอคอน `Settings` ของ lucide) และเอา `"users"` ออก

- [ ] **Step 1: เทสต์ `paginate`** ใน `pagination.test.ts`: `paginate(0, 1, 14)` → `{page:1,pageCount:1,skip:0}`; `paginate(15, 2, 14)` → `{page:2,pageCount:2,skip:14}`; `paginate(15, 9, 14)` → `{page:2,...}` (เกินจำนวนหน้า — เคสลบรายการสุดท้ายของหน้าสุดท้าย); `paginate(15, 0, 14)` → page 1; รัน → FAIL → เขียนฟังก์ชัน → PASS
- [ ] **Step 2: `app-shell.tsx`** — `main = items.filter(i => i.icon !== "settings")`, `admin = items.filter(i => i.icon === "settings")`; ชื่อกลุ่มเปลี่ยนจาก "ผู้ดูแลระบบ/Administration" เป็น "การจัดการ / ການຈັດການ / Management" (เพราะพี่เดชาไม่ใช่ผู้ดูแลระบบ)
- [ ] **Step 3: `(app)/layout.tsx`** — แทนรายการ "จัดการผู้ใช้" ด้วย `if (canManageSystem(user)) items.push({ href: "/admin", label: t("จัดการระบบ", "ຈັດການລະບົບ", "System management"), icon: "settings" })`
- [ ] **Step 4: `admin/layout.tsx`** — เรียก `requireSystemManager()` แล้วแสดง `PageHeader`-สไตล์หัวเรื่อง "จัดการระบบ" + `AdminTabs` สี่แท็บ (`/admin/users` ผู้ใช้, `/admin/requests` คำขอ, `/admin/kb` ฐานความรู้, `/admin/audit` บันทึกการเปลี่ยนแปลง) + `children`; `admin/page.tsx` เรียก `redirect("/admin/users")`
- [ ] **Step 5: `labels.ts`** — ปรับ `ROLE_DESCRIPTION.MANAGER` ให้ต่อท้ายว่าจัดการผู้ใช้ คำขอ และบทความได้ (ยกเว้นบัญชีผู้ดูแลระบบ) และ `ROLE_DESCRIPTION.ADMIN` ให้บอกว่าจัดการระบบได้ทั้งหมดรวมถึงตั้ง/ถอดผู้ดูแลระบบ (ทั้งสามภาษา)
- [ ] **Step 6: ตรวจ** — `npx vitest run` ทั้งชุดผ่าน; `npx tsc --noEmit`; `npx eslint src` (หน้า `/admin/users` เดิมยังทำงานจนกว่าจะถูกแทนที่ใน Task 6; `requireAdmin` ยังไม่ลบ)
- [ ] **Step 7: Commit** — `git add src/lib/pagination.ts src/lib/pagination.test.ts src/components/admin-tabs.tsx src/components/pagination-nav.tsx src/components/app-shell.tsx "src/app/(app)/layout.tsx" "src/app/(app)/admin" src/lib/labels.ts` · `feat: system management menu shell`

### Task 6: ผู้ใช้ (เพิ่ม/ดู/แก้/ลบ)

**Files:**
- Create: `src/lib/user-fields.ts`, `src/lib/user-fields.test.ts`, `src/lib/env.test.ts`, `src/app/actions/admin-users.ts`, `src/components/user-form.tsx`, `src/components/confirm-action-button.tsx`, `src/app/(app)/admin/users/new/page.tsx`, `src/app/(app)/admin/users/[id]/page.tsx`
- Modify: `src/lib/env.ts`, `src/lib/queries.ts`, `src/app/actions/users.ts`, `src/app/(app)/admin/users/page.tsx`, `src/lib/dal.ts`
- Delete: `src/components/user-admin-row.tsx`

**Interfaces:**
- Consumes: `canModifyUser`, `canCreateUser` (Task 2); `userDeletionBlockers`, `USER_REFERENCE_LABEL`, `changedFields` (Task 3); `writeAudit` (Task 3); `paginate`, `PaginationNav`, `AdminTabs` (Task 5)
- Produces:
  - `user-fields.ts`: `nameField(t: Translate)` (trim, 1–100 ตัวอักษร), `departmentField(t)`, `phoneField(t)` — ย้ายกฎเดิมจาก `profileSchema` ใน `users.ts` (แผนกสูงสุด 100, เบอร์สูงสุด 30 ตามรูปแบบเดิม) แล้วให้ `updateProfile` ใช้ตัวเดียวกัน
  - `env.ts`: `registrationEmailAllowed(email: string): boolean` — ถ้า `allowedEmailDomains()` ว่าง คืน `devLoginEnabled()` ไม่เช่นนั้นคืน `isAllowedEmail(email)`
  - `queries.ts`: `listUsersForAdmin(filters: { q?: string; role?: Role; status?: "active" | "inactive"; page?: number })` คืน `{ items: {id,name,email,department,role,isActive,lastLoginAt}[]; total; page; pageCount }` (ค้นใน name/email แบบไม่สนตัวพิมพ์, เรียง `role desc, name asc`, 14 ต่อหน้า)
  - `admin-users.ts` (ทุกตัวมี signature `(prev: ActionState, formData: FormData) => Promise<ActionState>`): `createUser` (ฟิลด์ `email, name, role, department, phone`), `updateUserAdmin` (ฟิลด์ `userId, name, role, isActive` ("on"), `department, phone`), `deleteUser` (ฟิลด์ `userId`)
  - `ConfirmActionButton({ action, fields, label, pendingLabel, confirmText, variant }: { action: (prev: ActionState, fd: FormData) => Promise<ActionState>; fields: Record<string, string>; label: string; pendingLabel: string; confirmText: string; variant?: "danger" | "secondary" })` — client component ตามแบบ `CancelButton` (`window.confirm`, แสดง `state.error`)
  - `UserForm({ mode, initial, canGrantAdmin, lockRoleAndStatus, readOnly })` — client component ใช้กับหน้า new/edit

- [ ] **Step 1: เทสต์ที่ล้มเหลว** — (ก) `env.test.ts` ด้วย `vi.stubEnv` (NODE_ENV เป็น `test` ตามค่าเริ่มต้นของ vitest): ไม่ตั้ง domains + `ENABLE_DEV_LOGIN=true` → `registrationEmailAllowed("a@x.test")` true; ไม่ตั้ง domains และไม่เปิด dev login → false; ตั้ง `ALLOWED_EMAIL_DOMAINS="aidc.test"` → `a@aidc.test` true, `a@other.test` false (ข) `user-fields.test.ts` (ใช้ `makeT("en")` จาก `./i18n`): `emailField(t).parse("  A@AIDC.test ")` → `"a@aidc.test"`, `emailField(t).safeParse("abc").success` → false, `nameField(t).safeParse("   ").success` → false; รัน → FAIL → เขียนโค้ด → PASS
  - `user-fields.ts` ต้องส่งออก `emailField(t: Translate)` ด้วย (trim → lower-case → `z.email()`)
- [ ] **Step 2: `user-fields.ts`** และแก้ `users.ts` ให้ `updateProfile` ใช้ `departmentField/phoneField` (พฤติกรรมเดิมไม่เปลี่ยน); ลบ `updateUser` เดิมและ import ที่ไม่ใช้แล้ว
- [ ] **Step 3: `createUser`** — `requireSystemManager()`; อีเมล trim + lower-case + `z.email()` + `registrationEmailAllowed` (error ที่ช่อง `email`); role ต้องอยู่ใน `ROLES` และ `canCreateUser(actor, role)` (ไม่ผ่าน → error ที่ช่อง `role`); ตรวจอีเมลซ้ำด้วย `findUnique` ก่อน (error ช่อง `email` "อีเมลนี้มีอยู่ในระบบแล้ว") และดัก Prisma `P2002` ซ้ำอีกชั้น; สร้างใน `db.$transaction` พร้อม `writeAudit(tx, actor.id, { action: "USER_CREATED", entity: "USER", entityId, summary: "<email> (<role>)" })`; `revalidatePath("/admin/users")` แล้ว `redirect("/admin/users")`
- [ ] **Step 4: `updateUserAdmin`** — โหลด target; `canModifyUser(actor, target, { role, isActive })`; แปลง `reason` เป็นข้อความสามภาษา (`self`: เปลี่ยนสิทธิ์/ปิดบัญชีตัวเองไม่ได้ ให้ผู้ดูแลคนอื่นทำ; `admin-protected`: หัวหน้างานแก้บัญชีผู้ดูแลระบบไม่ได้; `admin-grant`: ตั้งเป็นผู้ดูแลระบบได้เฉพาะผู้ดูแลระบบ; `not-allowed`: ไม่มีสิทธิ์); `changedFields` บน `name, department, phone, role, isActive` (แปลงค่าว่างของ department/phone เป็น `null` ก่อนเทียบ); ไม่มีอะไรเปลี่ยน → redirect เฉยๆ; มีการเปลี่ยน → update + `USER_UPDATED` (summary `"<email>: <ฟิลด์ที่เปลี่ยนคั่น , >"`) ใน transaction เดียวกัน
- [ ] **Step 5: `deleteUser`** — `canModifyUser(actor, target, { delete: true })`; นับด้วย `db.user.findUnique({ select: { _count: { select: { requests, assignedRequests, decidedRequests, approvalRequests, comments, events, articles, deletedRequests } } } })` แปลงเป็น `UserReferenceCounts`; ถ้า `userDeletionBlockers(...)` ไม่ว่าง คืน error "ผู้ใช้นี้มีประวัติการใช้งาน ให้ปิดการใช้งานแทน" ตามด้วยรายการ `USER_REFERENCE_LABEL` พร้อมจำนวน; ไม่ติดอะไร → ลบ + `USER_DELETED` (summary = อีเมล) ใน transaction; ดัก `P2003/P2025` (แข่งกับคำสั่งอื่น) เป็นข้อความ error ทั่วไป ไม่ throw
- [ ] **Step 6: `listUsersForAdmin` และหน้า list** — `admin/users/page.tsx` (`searchParams`: `q, role, status, page`) ฟอร์มค้นหา/กรอง รายการแบบแถวการ์ด (avatar ชื่อ อีเมล แผนก ป้ายสิทธิ์ ป้าย "ปิดใช้งาน" เข้าสู่ระบบล่าสุด ปุ่ม "แก้ไข" → `/admin/users/[id]`), ปุ่ม "เพิ่มผู้ใช้" → `/admin/users/new`, การ์ดอธิบายสิทธิ์ (`ROLE_DESCRIPTION`) แบบหน้าเดิม, `PaginationNav`
- [ ] **Step 7: หน้า new / edit** — `UserForm` (ฟิลด์: อีเมล [แก้ได้เฉพาะ create], ชื่อ, สิทธิ์, แผนก, เบอร์, ใช้งานอยู่ [เฉพาะ edit]); ตัวเลือก ADMIN ซ่อนเมื่อ `!canGrantAdmin`; `lockRoleAndStatus` (ดูตัวเอง) ทำให้ select สิทธิ์และ checkbox disabled พร้อมส่ง hidden copy ค่าเดิมเหมือนที่ `UserAdminRow` เดิมทำ; `readOnly` (หัวหน้างานเปิดบัญชี ADMIN: `canModifyUser` ได้ `admin-protected`) แสดงข้อมูลอย่างเดียวพร้อมข้อความอธิบาย; หน้า edit มีส่วน "ลบผู้ใช้" ด้วย `ConfirmActionButton` (ซ่อนเมื่อดูตัวเองหรือ `readOnly`) และแสดงคำเตือนเมื่ออีเมลอยู่ใน `adminEmails()` ว่าถ้าจะลดสิทธิ์ต้องเอาออกจาก `ADMIN_EMAILS` ก่อน
- [ ] **Step 8: ลบของเก่า** — ลบ `user-admin-row.tsx`; ลบ `requireAdmin` ใน `dal.ts` (และ import `isAdmin` ถ้าไม่ใช้) เมื่อ `grep requireAdmin src` ไม่เหลือผล
- [ ] **Step 9: ตรวจ** — `npx vitest run` ผ่านทั้งชุดรวม i18n guard; `npx tsc --noEmit`; `npx eslint src`
- [ ] **Step 10: Commit** — `git add src/lib/user-fields.ts src/lib/user-fields.test.ts src/lib/env.ts src/lib/env.test.ts src/lib/queries.ts src/lib/dal.ts src/app/actions/admin-users.ts src/app/actions/users.ts src/components/user-form.tsx src/components/confirm-action-button.tsx "src/app/(app)/admin/users" src/components/user-admin-row.tsx` · `feat: manage users from system management`

### Task 7: คำขอ (สร้างแทน/แก้/ลบ/กู้คืน)

**Files:**
- Create: `src/app/actions/admin-requests.ts`, `src/components/request-edit-form.tsx`, `src/app/(app)/admin/requests/page.tsx`, `src/app/(app)/admin/requests/[id]/edit/page.tsx`
- Modify: `src/app/actions/requests.ts` (เฉพาะ `createRequest`), `src/components/request-form.tsx`, `src/app/(app)/requests/new/page.tsx`, `src/app/(app)/requests/[id]/page.tsx`, `src/lib/queries.ts`

**Interfaces:**
- Consumes: `canEditRequest`, `canManageSystem` (Task 2); `changedFields`, `EDITABLE_REQUEST_FIELDS` (Task 3); `listRequests` พร้อม `console/deleted` (Task 4); `ConfirmActionButton`, `PaginationNav`, `paginate` (Tasks 5–6)
- Produces (`admin-requests.ts`, signature `(prev: ActionState, formData: FormData) => Promise<ActionState>`):
  - `updateRequestByAdmin` ฟิลด์ `requestId, title, description, priority, neededBy, requestedForName, approverId` — กฎ title 3–150, description 10–5000 (เหมือน `createSchema`), `priority ∈ PRIORITIES`, `neededBy` รูปแบบ `YYYY-MM-DD` ที่เป็นวันที่จริง (ไม่ตรวจวันขั้นต่ำของ SLA), `requestedForName` ≤ 150 (ว่าง = `null`); เปลี่ยน `approverId` ได้เฉพาะสถานะ `PENDING_APPROVAL` (สถานะอื่นไม่สนค่าที่ส่งมา) ด้วยกฎเดียวกับ `reassignApprover` และเขียน event `APPROVER_CHANGED` แยก; ฟิลด์อื่นที่เปลี่ยน (คำนวณด้วย `changedFields`) เขียน event `EDITED` เดียวโดย `toValue` = ชื่อฟิลด์คั่น `,`; ไม่มีอะไรเปลี่ยน → ไม่เขียน event; คำขอที่ลบแล้ว → error "ไม่พบคำขอ"
  - `deleteRequest` ฟิลด์ `requestId` — `updateMany({ where: { id, deletedAt: null }, data: { deletedAt: now, deletedById: actor.id } })` ถ้า `count === 0` คืน `{ ok: true }` เฉยๆ (กดซ้ำไม่ error) มิฉะนั้นเขียน event `DELETED` ใน transaction เดียวกัน
  - `restoreRequest` ฟิลด์ `requestId` — กลับด้านของ `deleteRequest`, event `RESTORED`
  - ทั้งสามเรียก `revalidateRequest`-เทียบเท่า: `revalidatePath` ของ `/admin/requests`, `/requests`, `/approvals`, `/`, `/requests/<id>`
- Produces: `RequestForm` รับ prop ใหม่ `requesters?: { id: string; name: string; department: string | null; role: Role }[]` และ `selfId: string`; `createRequest` อ่านฟิลด์ `requesterId` เฉพาะเมื่อ `canManageSystem(user)`

- [ ] **Step 1: `createRequest` สร้างแทนผู้อื่น** — ถ้า `canManageSystem(user)` และ `requesterId` ไม่ว่างและไม่ใช่ `user.id`: โหลด `db.user.findFirst({ where: { id, isActive: true }, select: { id, name, role } })` (ไม่พบ → `fieldErrors.requesterId`); ตัวแปร `requester` นี้แทน `user` ในทุกจุดของกฎการอนุมัติ (`requiresManagerApproval(requester, otherApprovers)`, การนับผู้อนุมัติอื่น, ตรวจผู้อนุมัติห้ามเป็นผู้ขอ) และ `requesterId: requester.id`; event `CREATED` ยังใช้ `actorId: user.id` และตั้ง `fromValue: requester.name` เมื่อสร้างแทน
- [ ] **Step 2: `RequestForm` + `requests/new/page.tsx`** — หน้าส่ง `requesters` (ผู้ใช้ active ทุกคน เรียงชื่อ) และ `selfId` เฉพาะ `canManageSystem(user)` และส่ง `approvers` เป็นผู้จัดการ active ทั้งหมดรวมตัวเอง (ใช้ `listApprovers("")`) เมื่อมี `requesters`; ฟอร์มแสดงช่องเลือก "ผู้ขอ" (ค่าเริ่มต้น "ตัวฉันเอง", `name="requesterId"`) ก่อนส่วนอื่น, กรองรายการผู้อนุมัติไม่ให้มีผู้ขอที่เลือก, และคำนวณ `needsApproval` ใหม่ฝั่ง client ด้วย `requiresManagerApproval` จากผู้ขอที่เลือก; ค่าเริ่มต้นของ `approverId` คำนวณจากรายการหลังกรองผู้ขอ (มีคนเดียวให้เลือกอัตโนมัติ) และรีเซ็ตเป็นว่างเมื่อผู้ขอที่เปลี่ยนไปคือผู้อนุมัติที่เลือกไว้; ผู้ใช้ทั่วไปไม่เห็นช่องนี้และพฤติกรรมเดิมไม่เปลี่ยน
- [ ] **Step 3: `admin-requests.ts`** ตาม Interfaces
- [ ] **Step 4: หน้า list `admin/requests/page.tsx`** (`searchParams`: `q, status, deleted, page`) ใช้ `listRequests(user, { console: true, deleted, ... , page })`; แถวการ์ด: เลขที่ หัวข้อ ผู้ขอ `StatusBadge` ป้าย "ถูกลบ" (เมื่อ `deletedAt`) ปุ่ม "เปิด" → `/requests/[id]`, "แก้ไข" → `/admin/requests/[id]/edit` (ซ่อนเมื่อลบแล้ว), "ลบ"/"กู้คืน" ด้วย `ConfirmActionButton`; ตัวกรอง "การลบ": ซ่อนที่ลบ (ค่าเริ่มต้น) / รวมที่ลบ / เฉพาะที่ลบ; ปุ่มหัวหน้า "สร้างคำขอแทนผู้อื่น" → `/requests/new`; `PaginationNav`
- [ ] **Step 5: หน้าแก้ `admin/requests/[id]/edit/page.tsx` + `RequestEditForm`** — โหลดด้วย `getRequestDetail`; `canEditRequest` ไม่ผ่าน → `notFound()`; แสดงประเภท/สถานะ/ผู้ขอแบบอ่านอย่างเดียว; ช่องผู้อนุมัติแก้ได้เมื่อสถานะ `PENDING_APPROVAL` เท่านั้น (รายการจาก `listApprovers(request.requesterId)`)
- [ ] **Step 6: หน้ารายละเอียด** — ในแบนเนอร์คำขอที่ลบ (จาก Task 4) เพิ่มปุ่ม "กู้คืน" (`ConfirmActionButton` + `restoreRequest`)
- [ ] **Step 7: ตรวจ** — `npx vitest run` ทั้งชุด; `npx tsc --noEmit`; `npx eslint src`
- [ ] **Step 8: Commit** — `git add src/app/actions/admin-requests.ts src/app/actions/requests.ts src/components/request-edit-form.tsx src/components/request-form.tsx src/lib/queries.ts "src/app/(app)/admin/requests" "src/app/(app)/requests"` · `feat: manage requests from system management`

### Task 8: ฐานความรู้ (สิทธิ์ แก้ ลบ สลับเผยแพร่)

**Files:**
- Create: `src/app/(app)/admin/kb/page.tsx`
- Modify: `src/app/actions/kb.ts`, `src/lib/queries.ts`, `src/app/(app)/kb/page.tsx`, `src/app/(app)/kb/new/page.tsx`, `src/app/(app)/kb/[id]/page.tsx`, `src/app/(app)/kb/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `canEditKb`, `requireKbEditor`, `requireSystemManager` (Task 2); `writeAudit` (Task 3); `ConfirmActionButton`, `PaginationNav`, `paginate` (Tasks 5–6)
- Produces: `deleteArticle(prev, formData)` ฟิลด์ `articleId`; `setArticlePublished(prev, formData)` ฟิลด์ `articleId, published` ("true"/"false") — ทั้งสองใช้ `requireSystemManager()` และ `canDeleteKb`; `listArticlesForAdmin(filters: { q?: string; page?: number })` ใน `queries.ts` (ทุกสถานะเผยแพร่, 14 ต่อหน้า) คืน `{ items: ArticleRow[]; total; page; pageCount }`

- [ ] **Step 1: ขยายสิทธิ์** — `saveArticle` และหน้า `kb/new`, `kb/[id]/edit` ใช้ `requireKbEditor()` แทน `requireStaff()`; `searchArticles`/`getArticle` ใน `queries.ts` และปุ่ม "เพิ่ม/แก้ไข" กับป้าย "ฉบับร่าง" ใน `kb/page.tsx`, `kb/[id]/page.tsx` เปลี่ยนจาก `isStaff` เป็น `canEditKb`
- [ ] **Step 2: audit** — `saveArticle` ห่อการเขียนใน `db.$transaction` พร้อม `writeAudit` (`KB_CREATED` / `KB_UPDATED`, summary = ชื่อบทความ)
- [ ] **Step 3: `deleteArticle` และ `setArticlePublished`** — ลบถาวรหรือสลับ `isPublished` พร้อม `KB_DELETED` / `KB_UPDATED` (summary `"<ชื่อ>: isPublished"`) ใน transaction; ไม่พบบทความ → ข้อความ "ไม่พบบทความ" ไม่ throw; `revalidatePath("/kb")` และ `/admin/kb`
- [ ] **Step 4: `listArticlesForAdmin` และหน้า `admin/kb/page.tsx`** (`searchParams`: `q, page`) แถวการ์ด: ชื่อ หมวด (ใช้ `kbCategoryLabel`) ป้าย "ฉบับร่าง" ปุ่ม "แก้ไข" → `/kb/[id]/edit`, ปุ่มเผยแพร่/ซ่อน (`ConfirmActionButton` variant secondary), ปุ่ม "ลบ"; ปุ่มหัวหน้า "เพิ่มบทความ" → `/kb/new`
- [ ] **Step 5: ตรวจ** — `npx vitest run`; `npx tsc --noEmit`; `npx eslint src`
- [ ] **Step 6: Commit** — `git add src/app/actions/kb.ts src/lib/queries.ts "src/app/(app)/kb" "src/app/(app)/admin/kb"` · `feat: manage knowledge base from system management`

### Task 9: แท็บบันทึกการเปลี่ยนแปลง

**Files:**
- Create: `src/app/(app)/admin/audit/page.tsx`
- Modify: `src/lib/queries.ts`

**Interfaces:**
- Consumes: `AUDIT_ACTION_LABEL` (Task 3), `paginate`, `PaginationNav` (Task 5)
- Produces: `listAuditLogs(page: number)` คืน `{ items: { id, action: AuditAction, entity, summary, createdAt, actor: { name } }[]; total; page; pageCount }` เรียงใหม่สุดก่อน 14 ต่อหน้า

- [ ] **Step 1: เขียน `listAuditLogs` และหน้า** — หน้าเป็นรายการอ่านอย่างเดียว (เวลา `formatDateTime`, ผู้ทำ, ป้ายการกระทำจาก `AUDIT_ACTION_LABEL`, summary), ข้อความ "ยังไม่มีบันทึก" เมื่อว่าง, `PaginationNav`
- [ ] **Step 2: ตรวจ** — `npx tsc --noEmit`; `npx eslint src`; `npx vitest run src/lib/i18n.test.ts`
- [ ] **Step 3: Commit** — `git add src/lib/queries.ts "src/app/(app)/admin/audit"` · `feat: audit log tab`

### Task 10: ชื่อจาก Google ใช้เฉพาะครั้งแรก

**Files:**
- Modify: `src/lib/users.ts`

**Interfaces:**
- Consumes: `profileNameOnSignIn` (Task 3)

- [ ] **Step 1: แก้ `signInGoogleUser`** — ใน `upsert.update` ใช้ `name: profileNameOnSignIn(existing, profile.name)` (ค่า `undefined` = Prisma ไม่แก้) ส่วน `create.name` ยังเป็น `profile.name`; `image` ยังอัปเดตทุกครั้งเหมือนเดิม; แก้คอมเมนต์ docblock ของฟังก์ชันให้ตรงพฤติกรรม
- [ ] **Step 2: ตรวจ** — `npx tsc --noEmit`; `npx eslint src`
- [ ] **Step 3: Commit** — `git add src/lib/users.ts` · `fix: keep admin-edited display names across Google sign-ins`

### Task 11: เอกสาร ตรวจรวม และ migrate DB จริง

**Files:**
- Modify: `README.md`

- [ ] **Step 1: README** — ในหัวข้อ RBAC เพิ่มสิทธิ์ของ "จัดการระบบ" (ตารางบทบาท × ผู้ใช้/คำขอ/KB และกฎ ADMIN-protected); ในหัวข้อโครงสร้าง DB เพิ่ม `deletedAt/deletedById` และ `tbl_audit_logs`; ในหัวข้อโครงสร้างหน้า/เมนูเพิ่ม `/admin/*`
- [ ] **Step 2: ตรวจอัตโนมัติ** — `npx vitest run` ทั้งชุด (คาดว่าผ่านทุกไฟล์ จำนวนเทสต์มากกว่า 191), `npx tsc --noEmit`, `npx eslint src prisma next.config.ts vitest.config.mts` ไม่มี error
- [ ] **Step 3: ตรวจใน scratch DB** — ทำขั้นตอน (S) ข้อ 1–5 แล้วใช้ dev login ทีละบัญชี (admin, mgr1 = พี่เดชา, it1, emp1) และยืนยันทุกข้อ:
  - emp1 และ it1 ไม่เห็นเมนู "จัดการระบบ"; เปิด `/admin/users`, `/admin/requests`, `/admin/kb`, `/admin/audit` ตรงๆ ถูก redirect ไป `/`
  - mgr1: ลงทะเบียนผู้ใช้ใหม่ (อีเมลตัวพิมพ์ใหญ่/มีช่องว่าง) ได้และถูกแปลงเป็นตัวพิมพ์เล็ก, อีเมลซ้ำได้ error ที่ช่อง, ตัวเลือก ADMIN ไม่ปรากฏ, เปิดแก้บัญชี admin ได้แบบอ่านอย่างเดียว; ปลอม POST `role=ADMIN` ด้วย DevTools แล้วถูกปฏิเสธ
  - ลบผู้ใช้ที่ไม่มีประวัติสำเร็จ; ลบ it1 (เป็น assignee ของงาน) ถูกปฏิเสธพร้อมรายการจำนวน
  - สร้างคำขอแทน emp1 จาก mgr1 → ขึ้นในคิวของ emp1 พร้อมไทม์ไลน์ "สร้างคำขอแทน"; แก้หัวข้อ/ความสำคัญ → ไทม์ไลน์มี "แก้ไขข้อมูลคำขอ"
  - ลบคำขอหนึ่งรายการ → หายจาก `/requests`, แดชบอร์ด, ตัวเลข "รออนุมัติ"/"งานของฉัน", SLA; เปิดลิงก์ตรงด้วย emp1 ได้ 404; เมนูจัดการคำขอตัวกรอง "เฉพาะที่ลบ" เห็นและกู้คืนได้
  - บทความ KB: mgr1 เพิ่ม/แก้/สลับเผยแพร่/ลบได้, it1 เพิ่ม/แก้ได้แต่ไม่เห็นปุ่มลบในเมนู (เข้าเมนูไม่ได้)
  - แท็บบันทึกการเปลี่ยนแปลงมีรายการของทุกการกระทำข้างบน
  - ลบรายการสุดท้ายของหน้าสุดท้ายในแต่ละรายการ → ไม่ได้หน้าว่าง
  - ตรวจหน้าจริงที่ 375px, 768px และจอกว้างครบทั้งสามภาษา (ไม่มี horizontal scroll, แท็บเลื่อนได้บนมือถือ)
  - ไม่มี error ใน console ของเบราว์เซอร์
- [ ] **Step 4: Commit เอกสาร** — `git add README.md` · `docs: document system management`
- [ ] **Step 5: ขออนุมัติผู้ใช้ก่อนแตะ DB จริง** — สรุปผลข้อ 3 แล้วถามผู้ใช้ว่าจะ apply migration กับ DB จริงและ push หรือไม่ (การกระทำที่ย้อนยาก ต้องได้คำตอบ "ใช่" ก่อน)
- [ ] **Step 6: เมื่อได้รับอนุมัติ** — หยุดโปรเซส scratch และ dev server ของตัวเอง, รัน `npx prisma migrate deploy` กับ `.env` (DB จริง), `npx prisma generate`, เปิด `npm run dev` ใหม่บน `.env`, เปิด `/admin/users` ด้วยบัญชีที่ล็อกอินอยู่เพื่อยืนยันว่าโหลดได้; ถ้าผู้ใช้สั่ง push ค่อย `git push origin main`
