"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { endSession, requireUser, startSession } from "@/lib/auth";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { db } from "@/lib/db";
import { optionalText, text } from "@/lib/forms";
import { photosFromForm, storage } from "@/lib/storage";

/** Web escrita a mano ("miweb.es", "https://miweb.es"...) → dirección completa, o error. */
function normalizeWebsite(value: string | null) {
  if (!value) return { url: null };
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes(".")) throw new Error();
    return { url: url.toString() };
  } catch {
    return { error: "La web no parece válida. Escríbela así: miweb.es" };
  }
}

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/perfil");
  const name = text(form, "name");
  if (!name) return { error: "Escribe tu nombre." };
  const accountType = text(form, "accountType");
  const website = normalizeWebsite(optionalText(form, "website"));
  if (website.error) return { error: website.error };

  let avatarKey = user.avatarKey;
  try {
    const [logo] = photosFromForm(form, "avatar", 1);
    const remove = form.getAll("removeAvatar").length > 0;
    if (logo || remove) {
      if (user.avatarKey) await storage.remove(user.avatarKey);
      avatarKey = logo ? await storage.save(logo, "socios") : null;
    }
  } catch (e) {
    return { error: (e as Error).message };
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      name,
      phone: optionalText(form, "phone"),
      location: optionalText(form, "location"),
      accountType: accountType in ACCOUNT_TYPES ? accountType : user.accountType,
      bio: optionalText(form, "bio")?.slice(0, 600) ?? null,
      website: website.url,
      instagram: optionalText(form, "instagram"),
      avatarKey,
    },
  });
  await startSession(updated); // el nombre va dentro de la sesión
  revalidatePath("/", "layout");
  return { ok: "Perfil guardado." };
}

/** Borra la cuenta, sus anuncios y sus fotos (derecho de supresión del RGPD). */
export async function deleteAccount(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/perfil");
  if (text(form, "confirm").toUpperCase() !== "BORRAR") return { error: "Escribe BORRAR para confirmar." };
  const photos = await db.listingPhoto.findMany({ where: { listing: { sellerId: user.id } }, select: { key: true } });
  await db.user.delete({ where: { id: user.id } }); // borra también anuncios, interesados y denuncias
  for (const p of photos) await storage.remove(p.key);
  if (user.avatarKey) await storage.remove(user.avatarKey);
  await endSession();
  redirect("/?cuenta-borrada=1");
}
