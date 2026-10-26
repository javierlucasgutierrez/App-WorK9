import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { consumeToken } from "@/lib/tokens";

// Enlace del correo de confirmación: marca el correo como confirmado y vuelve al inicio.
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const userId = await consumeToken((await params).token, "VERIFY_EMAIL");
  if (!userId) return NextResponse.redirect(appUrl("/?verificado=caducado"));
  await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return NextResponse.redirect(appUrl("/?verificado=1"));
}
