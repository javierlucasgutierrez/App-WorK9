import Link from "next/link";
import { Brand } from "./Brand";
import { MemberAvatar } from "./MemberAvatar";
import { NavLinks } from "./NavLinks";
import { VerifyBanner } from "./auth/VerifyBanner";

export type ShellUser = { name: string; avatarKey: string | null; verified: boolean; admin: boolean };

/** Marco de todas las páginas: cabecera arriba y, en el móvil, barra de navegación abajo. */
export function SiteShell({
  user,
  outbox,
  children,
}: {
  user: ShellUser | null;
  outbox: boolean; // modo local: los correos se ven en /correos
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-20 bg-brand-800 text-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/" aria-label="Market Canueve K9, inicio">
            <Brand />
          </Link>
          <NavLinks loggedIn={!!user} variant="top" />
          {user ? (
            <Link href="/perfil" className="hidden items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 text-sm md:flex">
              <MemberAvatar member={user} />
              {user.name.split(" ")[0]}
            </Link>
          ) : (
            <Link href="/entrar" className="hidden rounded-full bg-jute-400 px-4 py-1.5 text-sm font-semibold text-brand-900 md:block">
              Entrar
            </Link>
          )}
        </div>
      </header>
      {user && !user.verified && <VerifyBanner outbox={outbox} />}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5">{children}</main>
      <footer className="border-t border-black/5 px-4 py-6 text-center text-xs text-gray-500 md:text-sm">
        <p>Market Canueve K9 · Conecta, compra y comparte con la comunidad del perro de trabajo</p>
        <nav className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link href="/legal/normas" className="hover:underline">Normas</Link>
          <Link href="/legal/aviso-legal" className="hover:underline">Aviso legal</Link>
          <Link href="/legal/privacidad" className="hover:underline">Privacidad</Link>
          <Link href="/legal/cookies" className="hover:underline">Cookies</Link>
          {user?.admin && <Link href="/admin" className="font-semibold text-amber-800 hover:underline">🛡️ Moderación</Link>}
          {outbox && <Link href="/correos" className="hover:underline">📬 Correos de prueba</Link>}
        </nav>
      </footer>
      <NavLinks loggedIn={!!user} variant="bottom" />
    </div>
  );
}
