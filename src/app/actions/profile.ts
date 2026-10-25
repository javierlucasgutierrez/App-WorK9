"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/ActionForm";
import { requireUser, startSession } from "@/lib/auth";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { db } from "@/lib/db";
import { optionalText, text } from "@/lib/forms";

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/perfil");
  const name = text(form, "name");
  if (!name) return { error: "Escribe tu nombre." };
  const accountType = text(form, "accountType");
  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      name,
      phone: optionalText(form, "phone"),
      location: optionalText(form, "location"),
      accountType: accountType in ACCOUNT_TYPES ? accountType : user.accountType,
    },
  });
  await startSession(updated); // el nombre va dentro de la sesión
  revalidatePath("/", "layout");
  return { ok: "Perfil guardado." };
}
