import type { Metadata, Viewport } from "next";
import { SiteShell } from "@/components/SiteShell";
import { getUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MercaK9 · El mercado del perro de trabajo", template: "%s · MercaK9" },
  description: "Material de perro de trabajo nuevo y de segunda mano, creadores y talleres, cursos y servicios. Conecta, aprende y comparte con la comunidad canina.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#163d29",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();
  return (
    <html lang="es">
      <body className="antialiased">
        <SiteShell user={user ? { name: user.name } : null}>{children}</SiteShell>
      </body>
    </html>
  );
}
