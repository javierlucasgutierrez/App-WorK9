"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { checkPassword, endSession, hashPassword, safeBack, startSession } from "@/lib/auth";
import type { FormState } from "@/components/ActionForm";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { optionalText, text } from "@/lib/forms";

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await checkPassword(password, user.passwordHash))) {
    return { error: "Correo o contraseña incorrectos." };
  }
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
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };
  if (await db.user.findUnique({ where: { email } })) return { error: "Ya existe una cuenta con ese correo." };

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

  await startSession(user);
  redirect(safeBack(form.get("volver")));
}

export async function logout() {
  await endSession();
  redirect("/");
}
