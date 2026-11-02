"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Plus,
  Settings,
  ShieldCheck,
  UserCog,
  X,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { Avatar } from "./avatar";
import { LanguageSwitch } from "./language-switch";
import { useT } from "./lang-provider";
import { Logo } from "./logo";

export type NavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "requests" | "tasks" | "kb" | "approvals" | "settings";
  badge?: number;
};

const ICONS: Record<NavItem["icon"], LucideIcon> = {
  dashboard: LayoutDashboard,
  requests: ListChecks,
  tasks: ClipboardCheck,
  kb: BookOpen,
  approvals: ShieldCheck,
  settings: Settings,
};

type ShellUser = { name: string; email: string; roleLabel: string };

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  // "/requests/new" belongs to the "new request" button, not to the list entry.
  if (href === "/requests") return pathname === "/requests" || (pathname.startsWith("/requests/") && pathname !== "/requests/new");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({
  user,
  items,
  pathname,
  onNavigate,
}: {
  user: ShellUser;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const t = useT();
  const main = items.filter((i) => i.icon !== "settings");
  const admin = items.filter((i) => i.icon === "settings");
  const creating = pathname === "/requests/new";

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-slate-950 text-slate-300">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-28 -left-20 h-72 w-72 rounded-full bg-indigo-600/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-24 bottom-24 h-64 w-64 rounded-full bg-violet-600/15 blur-3xl" aria-hidden />

      <Link href="/" onClick={onNavigate} className="relative block px-5 pt-6 pb-5" aria-label={t(`${APP_NAME} หน้าแรก`, `${APP_NAME} ໜ້າຫຼັກ`, `${APP_NAME} home`)}>
        <Logo size="md" />
        <p className="mt-3.5 text-base leading-tight font-semibold tracking-tight text-white">{APP_NAME}</p>
        <p className="mt-0.5 text-xs text-slate-400">{t(APP_TAGLINE)}</p>
      </Link>

      <div className="relative px-4">
        <Link
          href="/requests/new"
          onClick={onNavigate}
          className={`flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-violet-400 active:scale-[0.98] ${
            creating ? "ring-2 ring-white/30" : ""
          }`}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          {t("สร้างคำขอใหม่", "ສ້າງຄຳຂໍໃໝ່", "New request")}
        </Link>
      </div>

      <nav aria-label={t("เมนูหลัก", "ເມນູຫຼັກ", "Main menu")} className="relative mt-6 flex-1 space-y-6 overflow-y-auto px-3">
        <NavGroup label={t("เมนู", "ເມນູ", "Menu")} items={main} pathname={pathname} onNavigate={onNavigate} />
        {admin.length > 0 && <NavGroup label={t("การจัดการ", "ການຈັດການ", "Management")} items={admin} pathname={pathname} onNavigate={onNavigate} />}
      </nav>

      <div className="relative px-3 pb-2">
        <LanguageSwitch variant="dark" />
      </div>

      <div className="relative border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <Avatar name={user.name} size="md" />
          <Link href="/profile" onClick={onNavigate} className="min-w-0 flex-1 leading-tight" title={t("ข้อมูลส่วนตัว", "ຂໍ້ມູນສ່ວນຕົວ", "Profile")}>
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.roleLabel}</p>
          </Link>
          <Link
            href="/profile"
            onClick={onNavigate}
            aria-label={t("ข้อมูลส่วนตัว", "ຂໍ້ມູນສ່ວນຕົວ", "Profile")}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <UserCog className="h-4 w-4" aria-hidden />
          </Link>
          <form action={logout}>
            <button
              type="submit"
              aria-label={t("ออกจากระบบ", "ອອກຈາກລະບົບ", "Sign out")}
              title={t("ออกจากระบบ", "ອອກຈາກລະບົບ", "Sign out")}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/15 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div>
      <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{label}</p>
      <ul className="space-y-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = ICONS[item.icon];
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {active && (
                  <span className="absolute top-2 bottom-2 left-0 w-1 rounded-r-full bg-linear-to-b from-indigo-400 to-violet-400" aria-hidden />
                )}
                <Icon
                  className={`h-[18px] w-[18px] transition-colors ${active ? "text-indigo-300" : "text-slate-500 group-hover:text-slate-300"}`}
                  aria-hidden
                />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-linear-to-r from-indigo-500 to-violet-500 px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums shadow-sm">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AppShell({ user, items, children }: { user: ShellUser; items: NavItem[]; children: React.ReactNode }) {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="min-h-dvh xl:pl-72">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 xl:block">
        <SidebarContent user={user} items={items} pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-slate-950 px-4 text-white shadow-lg shadow-slate-950/10 xl:hidden">
        <Link href="/" className="flex items-center gap-3" aria-label={t(`${APP_NAME} หน้าแรก`, `${APP_NAME} ໜ້າຫຼັກ`, `${APP_NAME} home`)}>
          <Logo size="xs" />
          <span className="text-sm leading-tight font-semibold">{APP_NAME}</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("เปิดเมนู", "ເປີດເມນູ", "Open menu")}
          aria-expanded={open}
          className="rounded-lg p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 xl:hidden" role="dialog" aria-modal="true" aria-label={t("เมนู", "ເມນູ", "Menu")}>
          <button
            type="button"
            aria-label={t("ปิดเมนู", "ປິດເມນູ", "Close menu")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm motion-safe:animate-fade-in"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl motion-safe:animate-slide-in">
            <SidebarContent user={user} items={items} pathname={pathname} onNavigate={() => setOpen(false)} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("ปิดเมนู", "ປິດເມນູ", "Close menu")}
              className="absolute top-3.5 right-3 rounded-lg p-2.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[96rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-6">{children}</main>
    </div>
  );
}
