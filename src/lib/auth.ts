import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { ROLES, type Role } from "./constants";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./session-token";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function checkPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function startSession(user: { id: string; role: string; name: string }) {
  const token = await signSession({ userId: user.id, role: user.role as Role, name: user.name });
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

/** Usuario conectado (o redirige a la página de entrada). Opcionalmente exige un rol. */
export async function requireUser(role?: Role) {
  const session = await getSession();
  if (!session) redirect("/entrar");
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/entrar");
  if (role && user.role !== role) redirect(homeFor(user.role));
  return user;
}

export const requireTrainer = () => requireUser(ROLES.TRAINER);
export const requireClient = () => requireUser(ROLES.CLIENT);

export function homeFor(role: string) {
  return role === ROLES.TRAINER ? "/adiestrador" : "/cliente";
}

/** Genera un código de invitación legible, p. ej. "LAURA-4821". */
export async function generateInviteCode(name: string) {
  const base =
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 6)
      .toUpperCase() || "K9CLUB";
  for (;;) {
    const code = `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!(await db.user.findUnique({ where: { inviteCode: code } }))) return code;
  }
}
