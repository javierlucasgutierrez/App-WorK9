"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string; match: (path: string) => boolean };

function itemsFor(loggedIn: boolean): Item[] {
  return [
    { href: "/", label: "Inicio", icon: "🏠", match: (p) => p === "/" },
    { href: "/anuncios", label: "Buscar", icon: "🔍", match: (p) => p.startsWith("/anuncios") },
    { href: "/publicar", label: "Publicar", icon: "＋", match: (p) => p === "/publicar" },
    { href: "/mis-anuncios", label: "Mis anuncios", icon: "📋", match: (p) => p.startsWith("/mis-anuncios") },
    loggedIn
      ? { href: "/perfil", label: "Perfil", icon: "👤", match: (p) => p === "/perfil" }
      : { href: "/entrar", label: "Entrar", icon: "👤", match: (p) => p === "/entrar" || p === "/registro" },
  ];
}

export function NavLinks({ loggedIn, variant }: { loggedIn: boolean; variant: "top" | "bottom" }) {
  const pathname = usePathname();
  const items = itemsFor(loggedIn);

  if (variant === "top") {
    return (
      <nav className="hidden gap-1 md:flex">
        {items.slice(0, 4).map((item) =>
          item.href === "/publicar" ? (
            <Link key={item.href} href={item.href} className="ml-1 rounded-full bg-jute-400 px-4 py-1.5 text-sm font-semibold text-brand-900 hover:bg-jute-200">
              + Publicar
            </Link>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                item.match(pathname) ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          ),
        )}
      </nav>
    );
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-black/10 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {items.map((item) => {
        const active = item.match(pathname);
        if (item.href === "/publicar") {
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 pb-1.5 text-[11px] font-semibold text-brand-800">
              <span className="-mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-jute-400 text-2xl font-bold text-brand-900 shadow-md ring-4 ring-white">
                ＋
              </span>
              {item.label}
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? "text-brand-700" : "text-gray-500"}`}
          >
            <span className={`text-xl leading-none ${active ? "" : "opacity-70 grayscale"}`}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
