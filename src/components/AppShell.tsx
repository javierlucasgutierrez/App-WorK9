import { logout } from "@/app/actions/auth";
import { NavLinks, type NavItem } from "./NavLinks";

export function AppShell({ userName, items, children }: { userName: string; items: NavItem[]; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-20 md:pb-8">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <span className="text-lg font-extrabold text-brand-700">🐾 WorK9</span>
          <NavLinks items={items} variant="top" />
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-gray-600 sm:inline">{userName}</span>
            <form action={logout}>
              <button className="rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">Salir</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-5">{children}</main>
      <NavLinks items={items} variant="bottom" />
    </div>
  );
}
