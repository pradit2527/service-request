"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminTab = { href: string; label: string };

/** Tabs of the system management area. On a narrow screen the row scrolls sideways instead of wrapping. */
export function AdminTabs({ items, ariaLabel }: { items: AdminTab[]; ariaLabel: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label={ariaLabel} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-slate-200">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px inline-flex items-center border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
