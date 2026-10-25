import type { Metadata, Viewport } from "next";
import { SiteShell } from "@/components/SiteShell";
import { getUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "K9 Club · Conecta, aprende y comparte",
  description: "Compra, vende y regala material de perro de trabajo, nuevo y de segunda mano, con la comunidad canina.",
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
