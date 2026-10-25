import { AppShell } from "@/components/AppShell";
import { requireTrainer } from "@/lib/auth";

const items = [
  { href: "/adiestrador", label: "Inicio", icon: "🏠" },
  { href: "/adiestrador/clientes", label: "Clientes", icon: "👥" },
  { href: "/adiestrador/ejercicios", label: "Ejercicios", icon: "🎯" },
  { href: "/adiestrador/formacion", label: "Formación", icon: "📚" },
];

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireTrainer();
  return (
    <AppShell userName={user.name} items={items}>
      {children}
    </AppShell>
  );
}
