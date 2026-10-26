import { NextResponse, type NextRequest } from "next/server";
import { safeBack, startSession } from "@/lib/auth";
import { appUrl } from "@/lib/app-url";
import { db } from "@/lib/db";
import { GOOGLE_STATE_COOKIE, googleProfile } from "@/lib/google";

// Paso 2: Google devuelve a la persona aquí. Se busca su cuenta (o se crea) y se inicia la sesión.
export async function GET(req: NextRequest) {
  const fail = (reason = "google") => NextResponse.redirect(appUrl(`/entrar?error=${reason}`));
  let saved: { state: string; back: string };
  try {
    saved = JSON.parse(req.cookies.get(GOOGLE_STATE_COOKIE)?.value ?? "");
  } catch {
    return fail();
  }
  const code = req.nextUrl.searchParams.get("code");
  if (!code || req.nextUrl.searchParams.get("state") !== saved.state) return fail();

  let profile: Awaited<ReturnType<typeof googleProfile>>;
  try {
    profile = await googleProfile(code);
  } catch (e) {
    console.error("Error al entrar con Google:", e);
    return fail();
  }
  if (!profile.email || !profile.emailVerified) return fail();

  // 1) Ya entró antes con Google  2) Ya tenía cuenta con ese correo: se enlaza  3) Cuenta nueva
  let user =
    (await db.user.findUnique({ where: { googleId: profile.googleId } })) ??
    (await db.user.findUnique({ where: { email: profile.email } }));
  if (user) {
    user = await db.user.update({
      where: { id: user.id },
      data: { googleId: profile.googleId, emailVerifiedAt: user.emailVerifiedAt ?? new Date() },
    });
  } else {
    user = await db.user.create({
      data: { email: profile.email, name: profile.name, googleId: profile.googleId, emailVerifiedAt: new Date() },
    });
  }
  if (user.blockedAt) return fail("bloqueado");

  await startSession(user);
  const res = NextResponse.redirect(appUrl(safeBack(saved.back)));
  res.cookies.delete(GOOGLE_STATE_COOKIE);
  return res;
}
