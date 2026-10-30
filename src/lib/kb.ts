// Knowledge base categories. Pure module.

import { l, type Lang, type Localized } from "./i18n";

export const KB_CATEGORIES = [
  { value: "account", label: l("บัญชี & รหัสผ่าน", "ບັນຊີ & ລະຫັດຜ່ານ", "Accounts & passwords") },
  { value: "network", label: l("เครือข่าย / Wi-Fi / VPN", "ເຄືອຂ່າຍ / Wi-Fi / VPN", "Network / Wi-Fi / VPN") },
  { value: "software", label: l("ซอฟต์แวร์ & โปรแกรม", "ຊອບແວ & ໂປຣແກຣມ", "Software & programs") },
  { value: "hardware", label: l("อุปกรณ์ & Hardware", "ອຸປະກອນ & Hardware", "Hardware & devices") },
  { value: "cloud", label: l("Cloud & Infrastructure", "Cloud & Infrastructure", "Cloud & Infrastructure") },
  { value: "request", label: l("วิธียื่นคำขอ", "ວິທີຍື່ນຄຳຂໍ", "How to submit a request") },
  { value: "general", label: l("ทั่วไป", "ທົ່ວໄປ", "General") },
] as const satisfies readonly { value: string; label: Localized }[];

export type KbCategory = (typeof KB_CATEGORIES)[number]["value"];

export function isKbCategory(value: unknown): value is KbCategory {
  return KB_CATEGORIES.some((c) => c.value === value);
}

export function kbCategoryLabel(value: string, lang: Lang): string {
  return KB_CATEGORIES.find((c) => c.value === value)?.label[lang] ?? value;
}
