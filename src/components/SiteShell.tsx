import Link from "next/link";
import { Brand } from "./Brand";
import { NavLinks } from "./NavLinks";

/** Marco de todas las páginas: cabecera arriba y, en el móvil, barra de navegación abajo. */
export function SiteShell({ user, children }: { user: { name: string } | null; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-20 bg-brand-800 text-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/" aria-label="K9 Club, inicio">
            <Brand />
          </Link>
          <NavLinks loggedIn={!!user} variant="top" />
          {user ? (
            <Link href="/perfil" className="hidden items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 text-sm md:flex">
              <Avatar name={user.name} />
              {user.name.split(" ")[0]}
            </Link>
          ) : (
            <Link href="/entrar" className="hidden rounded-full bg-jute-400 px-4 py-1.5 text-sm font-semibold text-brand-900 md:block">
              Entrar
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5">{children}</main>
      <footer className="hidden border-t border-black/5 py-6 text-center text-sm text-gray-500 md:block">
        K9 Club · Conecta, aprende y comparte con la comunidad canina
      </footer>
      <NavLinks loggedIn={!!user} variant="bottom" />
    </div>
  );
}

/** Círculo con la inicial del nombre. */
export function Avatar({ name, className = "h-7 w-7 text-sm" }: { name: string; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-jute-200 font-bold text-brand-900 ${className}`}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
