// Demo data for local development (demo content is written in Lao). Run with: npm run db:seed
// Users use the reserved ".test" domain, so they can never match a real Google account;
// sign in as them through the development login (ENABLE_DEV_LOGIN=true).

import { PrismaClient, type EventAction, type Priority, type RequestStatus, type RequestType, type Role } from "@prisma/client";
import { classifyTier, dueDates } from "../src/lib/sla";
import { isPaused } from "../src/lib/status";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to seed demo data when NODE_ENV=production");
}

try {
  process.loadEnvFile(); // tsx does not read .env by itself
} catch {
  // No .env file: rely on variables already in the environment.
}

const db = new PrismaClient();

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

type UserSeed = { key: string; email: string; name: string; role: Role; department: string; phone: string };

const USERS: UserSeed[] = [
  { key: "admin", email: "admin@example.test", name: "ອາທິດ ຜູ້ດູແລລະບົບ", role: "ADMIN", department: "IT", phone: "081-000-0001" },
  { key: "it1", email: "it1@example.test", name: "ສົມສີ ທີມ IT", role: "IT_STAFF", department: "IT", phone: "081-000-0002" },
  { key: "it2", email: "it2@example.test", name: "ທະນາ ທີມ IT", role: "IT_STAFF", department: "IT", phone: "081-000-0003" },
  { key: "mgr1", email: "mgr1@example.test", name: "Decha Ning", role: "MANAGER", department: "CTO", phone: "081-000-0021" },
  { key: "emp1", email: "emp1@example.test", name: "ວິພາ ພັດທະນາ", role: "EMPLOYEE", department: "Software Development", phone: "081-000-0011" },
  { key: "emp2", email: "emp2@example.test", name: "ພາຄິນ ເຄືອຂ່າຍ", role: "EMPLOYEE", department: "Data & AI", phone: "081-000-0012" },
  { key: "emp3", email: "emp3@example.test", name: "ນະພາ ການຕະຫຼາດ", role: "EMPLOYEE", department: "Marketing", phone: "081-000-0013" },
];

const STAFF_KEYS = new Set(["admin", "it1", "it2"]);

type Step = { status: RequestStatus; afterHours: number; actor: string; note?: string };

type RequestSeed = {
  requester: string;
  type: RequestType;
  title: string;
  description: string;
  details: Record<string, string | number>;
  hoursAgo: number;
  neededInDays: number;
  approver?: string;
  requestedForName?: string;
  steps: Step[];
  /** Business minutes the request has already spent waiting (approval, requester, vendor). */
  pausedMinutes?: number;
};

const REQUESTS: RequestSeed[] = [
  {
    requester: "emp1",
    type: "HARDWARE",
    title: "ຂໍເບີກໂນດບຸກສຳລັບພະນັກງານໃໝ່ 2 ເຄື່ອງ",
    description: "ທີມພັດທະນາຮັບພະນັກງານໃໝ່ 2 ຄົນ ເລີ່ມວຽກຕົ້ນເດືອນໜ້າ ຕ້ອງການໂນດບຸກສະເປັກທີ່ເໝາະກັບການພັດທະນາຊອບແວ",
    details: { action: "new", deviceType: "laptop", specification: "Core i7, RAM 32GB, SSD 512GB", quantity: 2, forUser: "ພະນັກງານໃໝ່ 2 ຄົນ (ຝ່າຍພັດທະນາ)", deliveryLocation: "ຕຶກ A ຊັ້ນ 3" },
    hoursAgo: 3,
    neededInDays: 12,
    approver: "mgr1",
    requestedForName: "ພະນັກງານໃໝ່ 2 ຄົນ ພະແນກພັດທະນາຊອບແວ",
    steps: [],
  },
  {
    requester: "emp1",
    type: "ACCESS_ACCOUNT",
    title: "ຂໍສິດອ່ານ Shared Folder Finance_Q4",
    description: "ຕ້ອງໃຊ້ອ້າງອີງຂໍ້ມູນງົບປະມານເພື່ອຈັດທຳລາຍງານປະຈຳໄຕມາດ",
    details: { system: "shared-folder", systemDetail: "\\\\fileserver\\Finance_Q4", action: "grant", targetUser: "ວິພາ ພັດທະນາ", accessLevel: "read", duration: "permanent" },
    hoursAgo: 1,
    neededInDays: 1,
    approver: "mgr1",
    steps: [
      { status: "SUBMITTED", afterHours: 0.5, actor: "mgr1" },
    ],
  },
  {
    requester: "emp2",
    type: "AWS_SERVER",
    title: "ຂໍ EC2 ສຳລັບ API ລະບົບວິເຄາະຂໍ້ມູນ",
    description: "ຕ້ອງການ Server ສຳລັບ deploy API ທີ່ Staging ກ່ອນຂຶ້ນ Production ພາຍໃນໄຕມາດນີ້",
    details: { projectName: "Analytics API", environment: "staging", awsRegion: "ap-southeast-1", os: "ubuntu-24.04", instanceType: "t3.large", storageGb: 100, publicAccess: "yes" },
    hoursAgo: 24 * 7,
    neededInDays: 14,
    approver: "mgr1",
    pausedMinutes: 240,
    steps: [
      { status: "SUBMITTED", afterHours: 20, actor: "mgr1" },
      { status: "IN_PROGRESS", afterHours: 40, actor: "admin" },
    ],
  },
  {
    requester: "emp2",
    type: "PUBLIC_IP_DOMAIN",
    title: "ຂໍ Domain ສຳລັບ demo ລະບົບ Chatbot",
    description: "ຕ້ອງການ chatbot.example.com ຊີ້ໄປທີ່ Server demo ເພື່ອໃຫ້ລູກຄ້າທົດລອງໃຊ້",
    details: { kind: "both", domainName: "chatbot.example.com", targetServer: "i-0abc123def456", sslCertificate: "yes" },
    hoursAgo: 24 * 4,
    neededInDays: 7,
    approver: "mgr1",
    pausedMinutes: 120,
    steps: [
      { status: "SUBMITTED", afterHours: 6, actor: "mgr1" },
      { status: "ON_HOLD", afterHours: 26, actor: "it1", note: "ລໍຖ້າຜູ້ໃຫ້ບໍລິການ DNS ເປີດສິດຈັດການ Domain ຄາດວ່າຈະໄດ້ຮັບພາຍໃນ 2 ວັນເຮັດວຽກ" },
    ],
  },
  {
    requester: "emp3",
    type: "SOFTWARE",
    title: "ຕິດຕັ້ງ Adobe Illustrator ໃນເຄື່ອງ MKT-014",
    description: "ໃຊ້ອອກແບບສື່ໂຄສະນາສຳລັບແຄມເປນໄຕມາດ 4",
    details: { itemType: "program", softwareName: "Adobe Illustrator", version: "2026", licenseType: "licensed", targetMachine: "MKT-014" },
    hoursAgo: 24 * 9,
    neededInDays: 3,
    approver: "mgr1",
    steps: [
      { status: "SUBMITTED", afterHours: 3, actor: "mgr1" },
      { status: "IN_PROGRESS", afterHours: 5, actor: "it2" },
      { status: "COMPLETED", afterHours: 20, actor: "it2" },
    ],
  },
  {
    requester: "emp3",
    type: "DATABASE",
    title: "ຂໍ MongoDB Atlas ສຳລັບເກັບ log ການຕະຫຼາດ",
    description: "ຕ້ອງການເກັບ event ຈາກເວັບໄຊແຄມເປນ ປະລິມານປະມານ 10 GB",
    details: { engine: "mongodb", projectName: "Marketing Events", environment: "prod", hosting: "managed-cloud", expectedSize: "10-100gb", personalData: "yes" },
    hoursAgo: 24 * 6,
    neededInDays: 10,
    approver: "mgr1",
    steps: [{ status: "REJECTED", afterHours: 4, actor: "mgr1", note: "ຂໍ້ມູນມີ PII ແຕ່ຍັງບໍ່ມີແຜນ PDPA ກະລຸນາປຶກສາຝ່າຍກົດໝາຍ ແລ້ວຍື່ນຄຳຂໍໃໝ່" }],
  },
  {
    requester: "emp1",
    type: "CONSULTATION",
    title: "ຂໍຄຳປຶກສາການວາງລະບົບສຳຮອງຂໍ້ມູນຂອງທີມ",
    description: "ຕ້ອງການແນວທາງສຳຮອງຂໍ້ມູນໂປຣເຈັກ ແລະ ໂຄ້ດຂອງທີມ 12 ຄົນ ໃຫ້ເໝາະກັບງົບປະມານ",
    details: { topic: "planning", relatedSystem: "Git / File server", channel: "online" },
    hoursAgo: 30,
    neededInDays: 3,
    approver: "mgr1",
    steps: [
      { status: "SUBMITTED", afterHours: 0.5, actor: "mgr1" },
      { status: "IN_PROGRESS", afterHours: 1, actor: "it1", note: "ຮັບເລື່ອງແລ້ວ ຂໍນັດເວົ້າລົມທາງອອນລາຍມື້ອື່ນ ເວລາ 10:00" },
    ],
  },
  {
    requester: "emp2",
    type: "ACCESS_ACCOUNT",
    title: "ຂໍສ້າງອີເມວບໍລິສັດສຳລັບພະນັກງານໃໝ່",
    description: "ມີພະນັກງານໃໝ່ເຂົ້າທີມ Data & AI ຕ້ອງການອີເມວ ແລະ ສິດພື້ນຖານກ່ອນວັນເລີ່ມວຽກ",
    details: { system: "email", action: "new-account", targetUser: "(ລໍຖ້າລະບຸ)", accessLevel: "read", duration: "permanent" },
    hoursAgo: 26,
    neededInDays: 2,
    requestedForName: "ພະນັກງານໃໝ່ ທີມ Data & AI",
    pausedMinutes: 0,
    approver: "mgr1",
    steps: [
      { status: "SUBMITTED", afterHours: 1, actor: "mgr1" },
      { status: "NEED_INFO", afterHours: 2, actor: "it2", note: "ກະລຸນາລະບຸຊື່-ນາມສະກຸນຂອງພະນັກງານໃໝ່ ຕຳແໜ່ງ ແລະ ວັນເລີ່ມວຽກ" },
    ],
  },
  {
    requester: "emp3",
    type: "NETWORK_WORKPLACE",
    title: "ຍ້າຍໂຕະເຮັດວຽກຂອງທີມການຕະຫຼາດຈາກຊັ້ນ 4 ໄປຊັ້ນ 5",
    description: "ທີມການຕະຫຼາດຍ້າຍບ່ອນເຮັດວຽກທັງທີມ ຕ້ອງການໃຫ້ຕິດຕັ້ງຄອມພິວເຕີ ຈໍ ແລະ ສາຍ LAN ຢູ່ຈຸດໃໝ່",
    details: { service: "desk-move", location: "ຕຶກ A ຊັ້ນ 4 ໂຊນການຕະຫຼາດ", toLocation: "ຕຶກ A ຊັ້ນ 5", quantity: 8, devices: "ຄອມພິວເຕີ 8 ເຄື່ອງ ຈໍ 8 ຈໍ" },
    hoursAgo: 24 * 3,
    neededInDays: 15,
    approver: "mgr1",
    steps: [
      { status: "SUBMITTED", afterHours: 2, actor: "mgr1" },
    ],
  },
  {
    requester: "emp3",
    type: "ACCESS_ACCOUNT",
    title: "ຂໍຣີເຊັດ MFA ຂອງອີເມວບໍລິສັດ",
    description: "ປ່ຽນໂທລະສັບເຄື່ອງໃໝ່ ຕ້ອງການລົງທະບຽນ MFA ໃໝ່",
    details: { system: "email", action: "reset", targetUser: "ນະພາ ການຕະຫຼາດ" },
    hoursAgo: 24 * 8,
    neededInDays: 1,
    approver: "mgr1",
    steps: [{ status: "CANCELLED", afterHours: 1, actor: "emp3" }],
  },
  {
    requester: "emp2",
    type: "HARDWARE",
    title: "ຂໍເພີ່ມ RAM ເຄື່ອງ Workstation ຂອງທີມ Data",
    description: "ປະມວນຜົນຊຸດຂໍ້ມູນຂະໜາດໃຫຍ່ ແຕ່ໜ່ວຍຄວາມຈຳບໍ່ພໍ ຕ້ອງການເພີ່ມ RAM ເປັນ 64GB",
    details: { action: "upgrade", deviceType: "memory-storage", specification: "RAM DDR5 32GB x2", quantity: 1, forUser: "ພາຄິນ ເຄືອຂ່າຍ", assetTag: "WS-0045", deliveryLocation: "ຕຶກ B ຊັ້ນ 2" },
    hoursAgo: 24 * 16,
    neededInDays: 5,
    approver: "mgr1",
    pausedMinutes: 300,
    steps: [
      { status: "SUBMITTED", afterHours: 5, actor: "mgr1" },
      { status: "IN_PROGRESS", afterHours: 48, actor: "it1" },
      { status: "COMPLETED", afterHours: 24 * 13, actor: "it1" },
    ],
  },
  {
    requester: "emp1",
    type: "BACKUP_RESTORE",
    title: "ຂໍ Restore ຖານຂໍ້ມູນລູກຄ້າ ກັບໄປກ່ອນການ Import ຜິດພາດ",
    description: "ມີການ Import ຂໍ້ມູນລູກຄ້າຜິດຊຸດ ຕ້ອງການກູ້ຄືນຂໍ້ມູນໄປຈຸດເວລາກ່ອນການ Import",
    details: { action: "restore", system: "CRM Database", environment: "staging", restorePoint: "2026-10-29 16:00", restoreTarget: "new-instance" },
    hoursAgo: 2,
    neededInDays: 3,
    approver: "mgr1",
    steps: [],
  },
  {
    requester: "emp3",
    type: "TRAINING",
    title: "ຂໍຈັດອົບຮົມການໃຊ້ລະບົບ CRM ໃຫ້ພະນັກງານໃໝ່ຂອງລູກຄ້າ",
    description: "ລູກຄ້າມີພະນັກງານໃໝ່ 12 ຄົນ ຕ້ອງການອົບຮົມການໃຊ້ງານລະບົບ CRM ພື້ນຖານ",
    details: { system: "CRM", customer: "ບໍລິສັດ ຕົວຢ່າງ ຈຳກັດ", audience: "new-users", attendees: 12, format: "onsite", preferredPeriod: "ອາທິດທີ 2 ຂອງເດືອນພະຈິກ" },
    hoursAgo: 30,
    neededInDays: 14,
    requestedForName: "ພະນັກງານໃໝ່ຂອງລູກຄ້າ 12 ຄົນ",
    approver: "mgr1",
    steps: [
      { status: "SUBMITTED", afterHours: 2, actor: "mgr1" },
      { status: "IN_PROGRESS", afterHours: 4, actor: "it2" },
    ],
  },
  {
    requester: "emp2",
    type: "FIREWALL",
    title: "ຂໍເປີດ Port 443 ເພື່ອເຊື່ອມຕໍ່ API ຂອງລູກຄ້າ",
    description: "ລະບົບ Integration ຕ້ອງເອີ້ນໃຊ້ API ຂອງ Server ລູກຄ້າ ຕ້ອງເປີດ outbound Port 443 ໄປຫາ IP ຂອງລູກຄ້າ",
    details: { action: "open-port", direction: "outbound", protocol: "tcp", port: "443", address: "203.0.113.25", environment: "prod", purpose: "ເອີ້ນໃຊ້ API ການຊຳລະເງິນຂອງລູກຄ້າ", duration: "permanent" },
    hoursAgo: 24 * 2,
    neededInDays: 7,
    approver: "mgr1",
    pausedMinutes: 90,
    steps: [
      { status: "SUBMITTED", afterHours: 3, actor: "mgr1" },
      { status: "IN_PROGRESS", afterHours: 5, actor: "it2" },
    ],
  },
];

const ARTICLES = [
  {
    title: "ວິທີເຊື່ອມຕໍ່ Wi-Fi ຂອງບໍລິສັດ",
    category: "network",
    summary: "ຂັ້ນຕອນເຊື່ອມຕໍ່ Wi-Fi ສຳລັບພະນັກງານ ແລະ ວິທີແກ້ໄຂບັນຫາເບື້ອງຕົ້ນເມື່ອເຊື່ອມຕໍ່ບໍ່ໄດ້ (ເນື້ອໃນຕົວຢ່າງ)",
    body: [
      "## ກ່ອນເລີ່ມ",
      "ກວດເບິ່ງວ່າເປີດ Wi-Fi ໃນອຸປະກອນແລ້ວ ແລະ ຢູ່ໃນພື້ນທີ່ທີ່ມີສັນຍານ",
      "## ຂັ້ນຕອນເຊື່ອມຕໍ່",
      "1. ເປີດລາຍການເຄືອຂ່າຍ Wi-Fi ແລ້ວເລືອກເຄືອຂ່າຍພະນັກງານ (ຊື່ SSID ຕາມທີ່ທີມ IT ປະກາດ)",
      "2. ເຂົ້າສູ່ລະບົບດ້ວຍ **ອີເມວບໍລິສັດ** ແລະ ລະຫັດຜ່ານຂອງທ່ານ",
      "3. ຍອມຮັບໃບຮັບຮອງຄວາມປອດໄພເມື່ອລະບົບຖາມ",
      "## ເຊື່ອມຕໍ່ບໍ່ໄດ້?",
      "- ລອງ **ລືມເຄືອຂ່າຍ** ແລ້ວເຊື່ອມຕໍ່ໃໝ່",
      "- ປິດເປີດອຸປະກອນໃໝ່",
      "- ກວດເບິ່ງວ່າລະຫັດຜ່ານອີເມວຍັງບໍ່ໝົດອາຍຸ",
      "ຖ້າຍັງບໍ່ໄດ້ ໃຫ້ແຈ້ງທີມ IT ພ້ອມລະບຸສະຖານທີ່ທີ່ໃຊ້ງານ",
    ].join("\n"),
  },
  {
    title: "ຂັ້ນຕອນເຊື່ອມຕໍ່ VPN ເພື່ອເຮັດວຽກຈາກນອກຫ້ອງການ",
    category: "network",
    summary: "ກຽມອຸປະກອນ ແລະ ເຊື່ອມຕໍ່ VPN ຢ່າງປອດໄພເມື່ອເຮັດວຽກຢູ່ເຮືອນ ຫຼື ນອກສະຖານທີ່ (ເນື້ອໃນຕົວຢ່າງ)",
    body: [
      "## ສິ່ງທີ່ຕ້ອງມີ",
      "- ບັນຊີຜູ້ໃຊ້ທີ່ໄດ້ຮັບສິດໃຊ້ VPN",
      "- ໂປຣແກຣມ VPN ຕາມທີ່ທີມ IT ກຳນົດ",
      "## ຂັ້ນຕອນ",
      "1. ເປີດໂປຣແກຣມ VPN",
      "2. ປ້ອນຊື່ຜູ້ໃຊ້ ແລະ ລະຫັດຜ່ານຂອງບໍລິສັດ",
      "3. ຢືນຢັນຕົວຕົນແບບສອງຂັ້ນຕອນ (MFA)",
      "4. ເມື່ອເຊື່ອມຕໍ່ສຳເລັດ ໃຫ້ທົດສອບເຂົ້າລະບົບພາຍໃນ",
      "ຍັງບໍ່ມີສິດໃຊ້ VPN? ຍື່ນ **ຄຳຂໍສິດ / ບັນຊີຜູ້ໃຊ້** ໄດ້ທີ່ເມນູສ້າງຄຳຂໍໃໝ່",
    ].join("\n"),
  },
  {
    title: "ຣີເຊັດລະຫັດຜ່ານອີເມວບໍລິສັດດ້ວຍຕົນເອງ",
    category: "account",
    summary: "ລືມລະຫັດຜ່ານ ຫຼື ລະຫັດຜ່ານໝົດອາຍຸ ໃຫ້ເຮັດຕາມຂັ້ນຕອນນີ້ເພື່ອຕັ້ງລະຫັດຜ່ານໃໝ່ (ເນື້ອໃນຕົວຢ່າງ)",
    body: [
      "## ຣີເຊັດລະຫັດຜ່ານ",
      "1. ເຂົ້າໄປທີ່ໜ້າເຂົ້າສູ່ລະບົບອີເມວບໍລິສັດ ແລ້ວເລືອກ **ລືມລະຫັດຜ່ານ**",
      "2. ຢືນຢັນຕົວຕົນດ້ວຍເບີໂທ ຫຼື ອີເມວສຳຮອງທີ່ລົງທະບຽນໄວ້",
      "3. ຕັ້ງລະຫັດຜ່ານໃໝ່ຕາມເງື່ອນໄຂຄວາມປອດໄພ",
      "## ຄຳແນະນຳສຳລັບລະຫັດຜ່ານທີ່ດີ",
      "- ຍາວຢ່າງໜ້ອຍ 12 ຕົວອັກສອນ",
      "- ບໍ່ຊ້ຳກັບບໍລິການອື່ນ",
      "- ເປີດໃຊ້ການຢືນຢັນຕົວຕົນສອງຂັ້ນຕອນ (MFA)",
      "ຖ້າເຮັດເອງບໍ່ໄດ້ ໃຫ້ຍື່ນ **ຄຳຂໍຣີເຊັດລະຫັດຜ່ານ / MFA** ໃນໝວດ Access & Permission",
    ].join("\n"),
  },
  {
    title: "ຂໍສິດ Shared Folder ຕ້ອງກຽມຂໍ້ມູນຫຍັງແດ່",
    category: "request",
    summary: "ລາຍການຂໍ້ມູນທີ່ຄວນລະບຸ ເພື່ອໃຫ້ທີມ IT ດຳເນີນການໄດ້ທັນທີ ແລະ ຫຼຸດການສອບຖາມກັບ (ເນື້ອໃນຕົວຢ່າງ)",
    body: [
      "## ຂໍ້ມູນທີ່ຄວນກຽມ",
      "- **Path ຂອງໂຟນເດີ** ເຊັ່ນ `\\\\fileserver\\Finance_Q4`",
      "- ລະດັບສິດທີ່ຕ້ອງການ: ອ່ານຢ່າງດຽວ ຫຼື ອ່ານ ແລະ ຂຽນ",
      "- ໄລຍະເວລາ: ຖາວອນ ຫຼື ຊົ່ວຄາວ (ລະບຸວັນສິ້ນສຸດ)",
      "- ເຫດຜົນ ແລະ ຄວາມຈຳເປັນໃນການໃຊ້ງານ",
      "## ໄລຍະເວລາດຳເນີນການ",
      "ຄຳຂໍລັກສະນະນີ້ຖືກຈັດເປັນລະດັບ **Standard** ທີມ IT ຕັ້ງເປົ້າຕອບຮັບພາຍໃນ 2 ຊົ່ວໂມງເຮັດວຽກ ແລະ ສົ່ງມອບພາຍໃນ 1 ວັນເຮັດວຽກ",
    ].join("\n"),
  },
  {
    title: "ຕິດຕັ້ງຟອນໃໝ່ໃນ Windows",
    category: "software",
    summary: "ຕິດຕັ້ງຟອນທີ່ໄດ້ຮັບອະນຸຍາດໃຫ້ໃຊ້ງານດ້ວຍຕົນເອງ ຫຼື ຍື່ນຄຳຂໍໃຫ້ທີມ IT ຕິດຕັ້ງໃຫ້ (ເນື້ອໃນຕົວຢ່າງ)",
    body: [
      "## ຕິດຕັ້ງດ້ວຍຕົນເອງ",
      "1. ດາວໂຫຼດໄຟລ໌ຟອນ (`.ttf` ຫຼື `.otf`) ຈາກແຫຼ່ງທີ່ເຊື່ອຖືໄດ້",
      "2. ຄລິກຂວາທີ່ໄຟລ໌ ແລ້ວເລືອກ **ຕິດຕັ້ງ**",
      "3. ເປີດໂປຣແກຣມໃໝ່ເພື່ອໃຫ້ເຫັນຟອນ",
      "## ຕ້ອງການໃຫ້ທີມ IT ຕິດຕັ້ງໃຫ້",
      "ຍື່ນ **ຄຳຂໍຕິດຕັ້ງຊອບແວ / License / ຟອນ** ໂດຍເລືອກສິ່ງທີ່ຕ້ອງການເປັນ *ຟອນ* ແລະ ລະບຸລິ້ງທີ່ມາຂອງຟອນ",
    ].join("\n"),
  },
];

async function main() {
  const users = new Map<string, { id: string; name: string }>();
  for (const u of USERS) {
    const row = await db.user.upsert({
      where: { email: u.email },
      create: { email: u.email, name: u.name, role: u.role, department: u.department, phone: u.phone },
      update: { name: u.name, role: u.role, department: u.department, phone: u.phone, isActive: true },
      select: { id: true, name: true },
    });
    users.set(u.key, row);
  }
  console.log(`Users ready: ${users.size}`);

  if ((await db.kbArticle.count()) === 0) {
    const author = users.get("it1")!;
    for (const article of ARTICLES) await db.kbArticle.create({ data: { ...article, authorId: author.id } });
    console.log(`Knowledge base articles created: ${ARTICLES.length}`);
  }

  if ((await db.serviceRequest.count()) > 0) {
    console.log("Requests already exist, skipping sample requests");
    return;
  }

  const now = Date.now();
  const year = new Date().getFullYear();
  const user = (key: string) => users.get(key)!;

  for (const r of REQUESTS) {
    const requester = user(r.requester);
    const createdAt = new Date(now - r.hoursAgo * HOUR);
    const needsApproval = r.approver !== undefined;
    const tier = classifyTier(r.type, r.details);
    const pausedMinutes = r.pausedMinutes ?? 0;
    const due = dueDates(tier, createdAt, pausedMinutes);

    let status: RequestStatus = needsApproval ? "PENDING_APPROVAL" : "SUBMITTED";
    let assignee: { id: string; name: string } | null = null;
    const approverId = r.approver ? user(r.approver).id : null;
    let managerApprovedAt: Date | null = null;
    let firstResponseAt: Date | null = null;
    let decidedBy: string | null = null;
    let decidedAt: Date | null = null;
    let closedAt: Date | null = null;
    let slaPausedAt: Date | null = needsApproval ? createdAt : null;

    const events: { actorId: string; action: EventAction; fromValue?: string; toValue?: string; createdAt: Date }[] = [
      { actorId: requester.id, action: "CREATED", toValue: status, createdAt },
    ];
    const comments: { authorId: string; body: string; isInternal: boolean; createdAt: Date }[] = [];

    for (const step of r.steps) {
      const at = new Date(createdAt.getTime() + step.afterHours * HOUR);
      const actor = user(step.actor);
      const fromStatus = status;
      events.push({ actorId: actor.id, action: "STATUS_CHANGED", fromValue: fromStatus, toValue: step.status, createdAt: at });

      if (fromStatus === "PENDING_APPROVAL" && step.status === "SUBMITTED") managerApprovedAt = at;
      if (STAFF_KEYS.has(step.actor) && fromStatus !== "PENDING_APPROVAL") {
        firstResponseAt ??= at;
        if (!assignee) {
          assignee = actor;
          events.push({ actorId: actor.id, action: "ASSIGNED", toValue: actor.name, createdAt: at });
        }
      }
      if (step.status === "APPROVED" || step.status === "REJECTED") {
        decidedBy = actor.id;
        decidedAt = at;
      }
      if (["COMPLETED", "REJECTED", "CANCELLED"].includes(step.status)) closedAt = at;
      if (isPaused(step.status) && !slaPausedAt) slaPausedAt = at;
      if (!isPaused(step.status)) slaPausedAt = null;
      if (step.note) comments.push({ authorId: actor.id, body: step.note, isInternal: false, createdAt: new Date(at.getTime() + 60_000) });
      status = step.status;
    }

    if (r.type === "AWS_SERVER") assignee = user("admin");

    const counter = await db.counter.upsert({
      where: { key: `SR-${year}` },
      create: { key: `SR-${year}`, value: 1 },
      update: { value: { increment: 1 } },
    });

    await db.serviceRequest.create({
      data: {
        requestNo: `SR-${year}-${String(counter.value).padStart(4, "0")}`,
        type: r.type,
        title: r.title,
        description: r.description,
        priority: "MEDIUM" satisfies Priority,
        status,
        details: r.details,
        neededBy: new Date(new Date(now + r.neededInDays * DAY).toISOString().slice(0, 10) + "T00:00:00Z"),
        requestedForName: r.requestedForName ?? null,
        requesterId: requester.id,
        assigneeId: assignee?.id ?? null,
        approverId,
        managerApprovedAt,
        decidedById: decidedBy,
        decidedAt,
        closedAt,
        createdAt,
        slaTier: tier,
        firstResponseAt,
        responseDueAt: due.responseDueAt,
        fulfillmentDueAt: due.fulfillmentDueAt,
        slaPausedAt,
        slaPausedMinutes: pausedMinutes,
        events: { create: events },
        comments: { create: comments },
      },
    });
  }
  console.log(`Sample requests created: ${REQUESTS.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
