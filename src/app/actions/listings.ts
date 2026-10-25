"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { requireUser } from "@/lib/auth";
import { LISTING_CATEGORIES, LISTING_STATUS, MAX_PHOTOS } from "@/lib/constants";
import { db } from "@/lib/db";
import { optionalNumber, optionalText, text } from "@/lib/forms";
import { searchFields } from "@/lib/search";
import { photosFromForm, storage } from "@/lib/storage";

function listingDataFromForm(form: FormData) {
  const isFree = form.get("isFree") === "on";
  const price = optionalNumber(form, "price");
  const category = text(form, "category");
  const data = {
    title: text(form, "title"),
    description: text(form, "description"),
    category: LISTING_CATEGORIES.includes(category) ? category : "Otros",
    condition: text(form, "condition") === "NEW" ? "NEW" : "USED",
    isFree,
    priceCents: !isFree && price != null && price >= 0 ? Math.round(price * 100) : null,
    location: text(form, "location"),
  };
  return { ...data, ...searchFields(data) };
}

function validate(data: ReturnType<typeof listingDataFromForm>): FormState | null {
  if (!data.title || !data.description) return { error: "Escribe un título y una descripción." };
  if (!data.isFree && data.priceCents == null) return { error: "Pon un precio o marca «Lo regalo»." };
  if (!data.location) return { error: "Indica la zona o ciudad." };
  return null;
}

/** Guarda las fotos en el almacenamiento y las enlaza al anuncio a partir de la posición `from`. */
async function addPhotos(listingId: string, files: File[], from: number) {
  for (const [i, file] of files.entries()) {
    const key = await storage.save(file, "anuncios");
    await db.listingPhoto.create({ data: { listingId, key, position: from + i } });
  }
}

export async function createListing(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/publicar");
  const data = listingDataFromForm(form);
  const invalid = validate(data);
  if (invalid) return invalid;
  let id: string;
  try {
    const files = photosFromForm(form, "photos", MAX_PHOTOS);
    if (files.length === 0) return { error: "Añade al menos una foto." };
    id = (await db.listing.create({ data: { ...data, sellerId: user.id } })).id;
    await addPhotos(id, files, 0);
  } catch (e) {
    return { error: (e as Error).message };
  }
  redirect(`/anuncios/${id}?publicado=1`);
}

async function ownListing(listingId: string) {
  const user = await requireUser(`/anuncios/${listingId}`);
  const listing = await db.listing.findFirst({
    where: { id: listingId, sellerId: user.id },
    include: { photos: { orderBy: { position: "asc" } } },
  });
  return { user, listing };
}

export async function updateListing(listingId: string, _: FormState, form: FormData): Promise<FormState> {
  const { listing } = await ownListing(listingId);
  if (!listing) return { error: "No se ha encontrado (o no es tuyo)." };
  const data = listingDataFromForm(form);
  const invalid = validate(data);
  if (invalid) return invalid;
  try {
    const remove = new Set(form.getAll("removePhoto").map(String));
    const kept = listing.photos.filter((p) => !remove.has(p.id));
    const files = photosFromForm(form, "photos", MAX_PHOTOS - kept.length);
    if (kept.length + files.length === 0) return { error: "El anuncio necesita al menos una foto." };

    await db.listing.update({ where: { id: listingId }, data });
    const removed = listing.photos.filter((p) => remove.has(p.id));
    await db.listingPhoto.deleteMany({ where: { id: { in: removed.map((p) => p.id) } } });
    for (const p of removed) await storage.remove(p.key);
    await addPhotos(listingId, files, (kept.at(-1)?.position ?? -1) + 1);
  } catch (e) {
    return { error: (e as Error).message };
  }
  redirect(`/anuncios/${listingId}?guardado=1`);
}

export async function setListingStatus(listingId: string, status: string) {
  const { listing } = await ownListing(listingId);
  if (!listing || !(status in LISTING_STATUS)) return;
  await db.listing.update({ where: { id: listingId }, data: { status } });
  revalidatePath(`/anuncios/${listingId}`);
  revalidatePath("/mis-anuncios");
}

export async function deleteListing(listingId: string) {
  const { listing } = await ownListing(listingId);
  if (!listing) return;
  await db.listing.delete({ where: { id: listingId } });
  for (const p of listing.photos) await storage.remove(p.key);
  redirect("/mis-anuncios?borrado=1");
}

export async function sendInterest(listingId: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser(`/anuncios/${listingId}`);
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status === "SOLD") return { error: "Este anuncio ya no está disponible." };
  if (listing.sellerId === user.id) return { error: "Es tu propio anuncio." };
  const message = optionalText(form, "message");
  await db.listingInterest.upsert({
    where: { listingId_userId: { listingId, userId: user.id } },
    create: { listingId, userId: user.id, message },
    update: { message },
  });
  revalidatePath(`/anuncios/${listingId}`);
  return { ok: "¡Aviso enviado! El anunciante ya puede ver tus datos de contacto." };
}

export async function cancelInterest(listingId: string) {
  const user = await requireUser(`/anuncios/${listingId}`);
  await db.listingInterest.deleteMany({ where: { listingId, userId: user.id } });
  revalidatePath(`/anuncios/${listingId}`);
}
