"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; icon: string };

export function NavLinks({ items, variant }: { items: NavItem[]; variant: "top" | "bottom" }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === items[0].href ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  if (variant === "top") {
    return (
      <nav className="hidden gap-1 md:flex">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              isActive(item.href) ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 grid border-t border-black/10 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
            isActive(item.href) ? "text-brand-700" : "text-gray-500"
          }`}
        >
          <span className="text-xl leading-none">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
