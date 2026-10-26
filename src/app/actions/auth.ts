"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { checkPassword, endSession, getUser, hashPassword, safeBack, startSession } from "@/lib/auth";
import type { FormState } from "@/components/ActionForm";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { optionalText, text } from "@/lib/forms";
import { allow, clientIp, TOO_MANY } from "@/lib/rate-limit";
import { sendPasswordResetEmail, sendVerificationEmail, consumeToken } from "@/lib/tokens";

const MIN_PASSWORD = 8;

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!(await allow(`login:${email}`, 10, 15)) || !(await allow(`login-ip:${await clientIp()}`, 30, 15))) return { error: TOO_MANY };
  const user = await db.user.findUnique({ where: { email } });
  if (user && !user.passwordHash) return { error: "Esta cuenta entra con Google. Pulsa «Continuar con Google»." };
  if (!user?.passwordHash || !(await checkPassword(password, user.passwordHash))) {
    return { error: "Correo o contraseña incorrectos." };
  }
  if (user.blockedAt) return { error: "Esta cuenta está bloqueada. Si crees que es un error, escríbenos." };
  await startSession(user);
  redirect(safeBack(form.get("volver")));
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const name = text(form, "name");
  const email = text(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const accountType = text(form, "accountType");

  if (!name || !email) return { error: "Escribe tu nombre y tu correo." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "El correo no parece válido." };
  if (password.length < MIN_PASSWORD) return { error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.` };
  if (form.get("acepto") !== "on") return { error: "Para crear la cuenta tienes que aceptar las normas y la política de privacidad." };
  if (!(await allow(`register:${await clientIp()}`, 5, 60))) return { error: TOO_MANY };
  if (await db.user.findUnique({ where: { email } })) return { error: "Ya existe una cuenta con ese correo. ¿Has olvidado la contraseña?" };

  const user = await db.user.create({
    data: {
      name,
      email,
      phone: optionalText(form, "phone"),
      location: optionalText(form, "location"),
      accountType: accountType in ACCOUNT_TYPES ? accountType : "INDIVIDUAL",
      passwordHash: await hashPassword(password),
    },
  });
  await sendVerificationEmail(user);
  await startSession(user);
  redirect(safeBack(form.get("volver")));
}

export async function logout() {
  await endSession();
  redirect("/");
}

export async function resendVerification(): Promise<FormState> {
  const user = await getUser();
  if (!user || user.emailVerifiedAt) return undefined;
  if (!(await allow(`verify:${user.id}`, 3, 60))) return { error: TOO_MANY };
  await sendVerificationEmail(user);
  return { ok: `Te hemos enviado otro enlace a ${user.email}.` };
}

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").toLowerCase();
  if (!(await allow(`reset:${email}`, 3, 60)) || !(await allow(`reset-ip:${await clientIp()}`, 10, 60))) return { error: TOO_MANY };
  const user = await db.user.findUnique({ where: { email } });
  if (user && !user.blockedAt) await sendPasswordResetEmail(user);
  // Mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados.
  return { ok: `Si ${email} tiene cuenta, te hemos enviado un enlace para elegir una contraseña nueva. Mira también en spam.` };
}

export async function resetPassword(token: string, _: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("password") ?? "");
  if (password.length < MIN_PASSWORD) return { error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.` };
  if (password !== String(form.get("password2") ?? "")) return { error: "Las dos contraseñas no coinciden." };
  const userId = await consumeToken(token, "RESET_PASSWORD");
  if (!userId) return { error: "El enlace ha caducado o ya se ha usado. Pide otro." };
  // Si llega aquí, el correo es suyo: también queda confirmado.
  const user = await db.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password), emailVerifiedAt: new Date() },
  });
  await startSession(user);
  redirect("/?contrasena=1");
}
