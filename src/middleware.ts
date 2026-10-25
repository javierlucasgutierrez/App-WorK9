import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";

// Protege las zonas privadas: si no hay sesión, manda a /entrar.
// Si un cliente intenta entrar en la zona del adiestrador (o al revés), lo lleva a la suya.
export async function middleware(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = req.nextUrl;

  if (!session) return NextResponse.redirect(new URL("/entrar", req.url));

  const home = session.role === "TRAINER" ? "/adiestrador" : "/cliente";
  if (!pathname.startsWith(home)) return NextResponse.redirect(new URL(home, req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/adiestrador/:path*", "/cliente/:path*"] };
