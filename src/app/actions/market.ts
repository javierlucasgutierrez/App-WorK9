"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { getTrainerDog } from "@/lib/access";
import { homeFor, requireTrainer, requireUser } from "@/lib/auth";
import { LISTING_CATEGORIES, LISTING_STATUS } from "@/lib/constants";
import { db } from "@/lib/db";
import { optionalNumber, optionalText, text } from "@/lib/forms";
import { saveImageFromForm, storage } from "@/lib/storage";

const base = (role: string) => `${homeFor(role)}/material`;

function listingDataFromForm(form: FormData) {
  const isFree = form.get("isFree") === "on";
  const price = optionalNumber(form, "price");
  const category = text(form, "category");
  return {
    title: text(form, "title"),
    description: text(form, "description"),
    category: LISTING_CATEGORIES.includes(category) ? category : "Otros",
    condition: text(form, "condition") === "NEW" ? "NEW" : "USED",
    isFree,
    priceCents: !isFree && price != null && price >= 0 ? Math.round(price * 100) : null,
    location: optionalText(form, "location"),
  };
}

function validate(data: ReturnType<typeof listingDataFromForm>): FormState | null {
  if (!data.title || !data.description) return { error: "Escribe un título y una descripción." };
  if (!data.isFree && data.priceCents == null) return { error: "Pon un precio o marca «Lo regalo»." };
  return null;
}

export async function createListing(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const data = listingDataFromForm(form);
  const invalid = validate(data);
  if (invalid) return invalid;
  let id: string;
  try {
    const photoKey = await saveImageFromForm(form, "photo", "material");
    id = (await db.listing.create({ data: { ...data, photoKey, sellerId: user.id } })).id;
  } catch (e) {
    return { error: (e as Error).message };
  }
  redirect(`${base(user.role)}/${id}`);
}

async function ownListing(listingId: string) {
  const user = await requireUser();
  const listing = await db.listing.findFirst({ where: { id: listingId, sellerId: user.id } });
  return { user, listing };
}

export async function updateListing(listingId: string, _: FormState, form: FormData): Promise<FormState> {
  const { user, listing } = await ownListing(listingId);
  if (!listing) return { error: "No se ha encontrado (o no es tuyo)." };
  const data = listingDataFromForm(form);
  const invalid = validate(data);
  if (invalid) return invalid;
  try {
    const photoKey = await saveImageFromForm(form, "photo", "material");
    await db.listing.update({ where: { id: listingId }, data: { ...data, ...(photoKey ? { photoKey } : {}) } });
    if (photoKey && listing.photoKey) await storage.remove(listing.photoKey);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`${base(user.role)}/${listingId}`);
  return { ok: "Anuncio guardado." };
}

export async function setListingStatus(listingId: string, status: string) {
  const { user, listing } = await ownListing(listingId);
  if (!listing || !(status in LISTING_STATUS)) return;
  await db.listing.update({ where: { id: listingId }, data: { status } });
  revalidatePath(`${base(user.role)}/${listingId}`);
}

export async function deleteListing(listingId: string) {
  const { user, listing } = await ownListing(listingId);
  if (!listing) return;
  await db.listing.delete({ where: { id: listingId } });
  if (listing.photoKey) await storage.remove(listing.photoKey);
  redirect(base(user.role));
}

export async function sendInterest(listingId: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status === "SOLD") return { error: "Este anuncio ya no está disponible." };
  if (listing.sellerId === user.id) return { error: "Es tu propio anuncio." };
  const message = optionalText(form, "message");
  await db.listingInterest.upsert({
    where: { listingId_userId: { listingId, userId: user.id } },
    create: { listingId, userId: user.id, message },
    update: { message },
  });
  revalidatePath(`${base(user.role)}/${listingId}`);
  return { ok: "¡Aviso enviado! El anunciante ya puede ver tus datos de contacto." };
}

export async function cancelInterest(listingId: string) {
  const user = await requireUser();
  await db.listingInterest.deleteMany({ where: { listingId, userId: user.id } });
  revalidatePath(`${base(user.role)}/${listingId}`);
}

// ---------- Recomendaciones del adiestrador ----------

export async function recommendListing(dogId: string, _: FormState, form: FormData): Promise<FormState> {
  const trainer = await requireTrainer();
  if (!(await getTrainerDog(trainer.id, dogId))) return { error: "No se ha encontrado (o no es tuyo)." };
  const listing = await db.listing.findFirst({ where: { id: text(form, "listingId"), status: { not: "SOLD" } } });
  if (!listing) return { error: "Elige un anuncio disponible." };
  await db.recommendation.create({
    data: { trainerId: trainer.id, dogId, listingId: listing.id, note: optionalText(form, "note") },
  });
  revalidatePath(`/adiestrador/perros/${dogId}`);
  return { ok: "Recomendación enviada. La familia la verá en su inicio." };
}

export async function deleteRecommendation(recommendationId: string) {
  const trainer = await requireTrainer();
  const rec = await db.recommendation.findFirst({ where: { id: recommendationId, trainerId: trainer.id } });
  if (!rec) return;
  await db.recommendation.delete({ where: { id: rec.id } });
  revalidatePath(`/adiestrador/perros/${rec.dogId}`);
}
