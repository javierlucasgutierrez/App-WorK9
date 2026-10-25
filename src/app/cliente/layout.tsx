import { AppShell } from "@/components/AppShell";
import { requireClient } from "@/lib/auth";

const items = [
  { href: "/cliente", label: "Deberes", icon: "✅" },
  { href: "/cliente/perros", label: "Mis perros", icon: "🐕" },
  { href: "/cliente/practicas", label: "Prácticas", icon: "📝" },
  { href: "/cliente/material", label: "Material", icon: "🦴" },
  { href: "/cliente/formacion", label: "Formación", icon: "📚" },
];

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireClient();
  return (
    <AppShell userName={user.name} items={items}>
      {children}
    </AppShell>
  );
}
