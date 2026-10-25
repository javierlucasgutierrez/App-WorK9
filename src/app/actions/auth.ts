"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/constants";
import {
  checkPassword,
  endSession,
  generateInviteCode,
  hashPassword,
  homeFor,
  startSession,
} from "@/lib/auth";
import type { FormState } from "@/components/ActionForm";

import { text } from "@/lib/forms";

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await checkPassword(password, user.passwordHash))) {
    return { error: "Correo o contraseña incorrectos." };
  }
  await startSession(user);
  redirect(homeFor(user.role));
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const role = text(form, "role") === ROLES.TRAINER ? ROLES.TRAINER : ROLES.CLIENT;
  const name = text(form, "name");
  const email = text(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!name || !email) return { error: "Escribe tu nombre y tu correo." };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };
  if (await db.user.findUnique({ where: { email } })) return { error: "Ya existe una cuenta con ese correo." };

  let trainerId: string | undefined;
  if (role === ROLES.CLIENT) {
    const code = text(form, "inviteCode").toUpperCase();
    const trainer = code ? await db.user.findUnique({ where: { inviteCode: code } }) : null;
    if (!trainer) return { error: "El código de invitación no es válido. Pídeselo a tu adiestrador." };
    trainerId = trainer.id;
  }

  const user = await db.user.create({
    data: {
      role,
      name,
      email,
      phone: text(form, "phone") || null,
      passwordHash: await hashPassword(password),
      trainerId,
      inviteCode: role === ROLES.TRAINER ? await generateInviteCode(name) : null,
    },
  });

  const dogName = text(form, "dogName");
  if (role === ROLES.CLIENT && dogName) {
    await db.dog.create({ data: { name: dogName, breed: text(form, "dogBreed") || null, ownerId: user.id } });
  }

  await startSession(user);
  redirect(homeFor(user.role));
}

export async function logout() {
  await endSession();
  redirect("/entrar");
}
