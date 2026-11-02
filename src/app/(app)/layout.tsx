import { AppShell, type NavItem } from "@/components/app-shell";
import { requireUser } from "@/lib/dal";
import { getT } from "@/lib/i18n-server";
import { ROLE_LABEL } from "@/lib/labels";
import { canManageSystem, isManager, isStaff } from "@/lib/permissions";
import { countMyTasks, countPendingApprovals } from "@/lib/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const t = await getT();
  const [pendingApprovals, myTasks] = await Promise.all([
    isManager(user) ? countPendingApprovals(user.id) : 0,
    isStaff(user) ? countMyTasks(user.id) : 0,
  ]);

  const items: NavItem[] = [
    { href: "/", label: t("ภาพรวม", "ພາບລວມ", "Overview"), icon: "dashboard" },
    {
      href: "/requests",
      label: isStaff(user) ? t("คำขอทั้งหมด", "ຄຳຂໍທັງໝົດ", "All requests") : t("คำขอของฉัน", "ຄຳຂໍຂອງຂ້ອຍ", "My requests"),
      icon: "requests",
    },
  ];
  if (isStaff(user)) items.push({ href: "/my-tasks", label: t("งานของฉัน", "ວຽກຂອງຂ້ອຍ", "My tasks"), icon: "tasks", badge: myTasks });
  if (isManager(user)) {
    items.push({ href: "/approvals", label: t("รออนุมัติ", "ລໍຖ້າອະນຸມັດ", "Approvals"), icon: "approvals", badge: pendingApprovals });
  }
  if (canManageSystem(user)) items.push({ href: "/admin", label: t("จัดการระบบ", "ຈັດການລະບົບ", "System management"), icon: "settings" });

  return (
    <AppShell user={{ name: user.name, email: user.email, roleLabel: t(ROLE_LABEL[user.role]) }} items={items}>
      {children}
    </AppShell>
  );
}
