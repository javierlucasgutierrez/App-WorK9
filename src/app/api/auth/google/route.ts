import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { googleEnabled, safeBack } from "@/lib/auth";
import { appUrl } from "@/lib/app-url";
import { GOOGLE_STATE_COOKIE, googleAuthUrl } from "@/lib/google";

// Paso 1: mandar a la persona a Google, recordando a dónde volver después.
export async function GET(req: NextRequest) {
  if (!googleEnabled()) return NextResponse.redirect(appUrl("/entrar"));
  const state = randomBytes(16).toString("base64url");
  const back = safeBack(req.nextUrl.searchParams.get("volver"));
  const res = NextResponse.redirect(googleAuthUrl(state));
  res.cookies.set(GOOGLE_STATE_COOKIE, JSON.stringify({ state, back }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
