import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./session-token";

// Las contraseñas nunca se guardan tal cual: solo su "huella" cifrada con bcrypt.
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function checkPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function startSession(user: { id: string; name: string }) {
  const token = await signSession({ userId: user.id, name: user.name });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Usuario conectado, o null si nadie ha entrado (o si su cuenta está bloqueada). */
export async function getUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.userId } });
  return user && !user.blockedAt ? user : null;
}

/** Administradores: los que tienen role "ADMIN" o cuyo correo está en ADMIN_EMAILS (.env). */
export function isAdmin(user: { email: string; role: string } | null) {
  if (!user) return false;
  const emails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return user.role === "ADMIN" || emails.includes(user.email.toLowerCase());
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (!isAdmin(user)) redirect("/");
  return user;
}

export const googleEnabled = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/** Mensaje si el usuario aún no puede publicar ni contactar (correo sin confirmar), o null. */
export function verificationError(user: { emailVerifiedAt: Date | null }) {
  return user.emailVerifiedAt ? null : "Antes, confirma tu correo: te hemos enviado un enlace (mira también en spam).";
}

/** Usuario conectado; si no hay, manda a /entrar y después vuelve a `back`. */
export async function requireUser(back = "/") {
  const user = await getUser();
  if (!user) redirect(loginUrl(back));
  return user;
}

export function loginUrl(back: string) {
  return `/entrar?volver=${encodeURIComponent(back)}`;
}

/** Solo admite direcciones internas para volver después de entrar (evita saltos a otras webs). */
export function safeBack(value: FormDataEntryValue | string | null | undefined) {
  const s = String(value ?? "");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}
