import type { Metadata, Viewport } from "next";
import { SiteShell } from "@/components/SiteShell";
import { getUser, isAdmin } from "@/lib/auth";
import { appUrl } from "@/lib/app-url";
import { outboxEnabled } from "@/lib/mailer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "Market Canueve K9 · El mercado del perro de trabajo", template: "%s · Canueve K9" },
  description: "Material de perro de trabajo nuevo y de segunda mano, creadores y talleres, cursos y servicios. Conecta, compra y comparte con la comunidad del perro de trabajo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c1c1e",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();
  return (
    <html lang="es">
      <body className="antialiased">
        <SiteShell
          user={user && { name: user.name, avatarKey: user.avatarKey, verified: !!user.emailVerifiedAt, admin: isAdmin(user) }}
          outbox={outboxEnabled()}
        >
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
