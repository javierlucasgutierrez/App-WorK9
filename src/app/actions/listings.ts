"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { isAdmin, requireUser, verificationError } from "@/lib/auth";
import { appUrl } from "@/lib/app-url";
import { LISTING_CATEGORIES, LISTING_STATUS, MAX_PHOTOS, REPORT_REASONS } from "@/lib/constants";
import { db } from "@/lib/db";
import { optionalNumber, optionalText, text } from "@/lib/forms";
import { sendMail } from "@/lib/mailer";
import { allow, TOO_MANY } from "@/lib/rate-limit";
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
  const notVerified = verificationError(user);
  if (notVerified) return { error: notVerified };
  const data = listingDataFromForm(form);
  const invalid = validate(data);
  if (invalid) return invalid;
  if (!(await allow(`publish:${user.id}`, 20, 24 * 60))) return { error: TOO_MANY };
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
  const notVerified = verificationError(user);
  if (notVerified) return { error: notVerified };
  if (!(await allow(`interest:${user.id}`, 30, 24 * 60))) return { error: TOO_MANY };
  const message = optionalText(form, "message")?.slice(0, 1000) ?? null;
  const existing = await db.listingInterest.findUnique({ where: { listingId_userId: { listingId, userId: user.id } } });
  await db.listingInterest.upsert({
    where: { listingId_userId: { listingId, userId: user.id } },
    create: { listingId, userId: user.id, message },
    update: { message },
  });
  // Aviso por correo al anunciante (solo la primera vez que esta persona se interesa).
  const seller = !existing && (await db.user.findUnique({ where: { id: listing.sellerId } }));
  if (seller) {
    await sendMail({
      to: seller.email,
      subject: `${user.name} está interesado en «${listing.title}»`,
      text:
        `Hola, ${seller.name}:\n\n${user.name} ha pulsado «Me interesa» en tu anuncio «${listing.title}».` +
        (message ? `\n\nTe ha escrito: «${message}»` : "") +
        `\n\nEn el anuncio tienes su correo${user.phone ? " y su teléfono" : ""} para contactar.`,
      link: { label: "Ver interesados", url: appUrl(`/anuncios/${listingId}`) },
    });
  }
  revalidatePath(`/anuncios/${listingId}`);
  return { ok: "¡Aviso enviado! El anunciante ya puede ver tus datos de contacto." };
}

export async function cancelInterest(listingId: string) {
  const user = await requireUser(`/anuncios/${listingId}`);
  await db.listingInterest.deleteMany({ where: { listingId, userId: user.id } });
  revalidatePath(`/anuncios/${listingId}`);
}

export async function reportListing(listingId: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser(`/anuncios/${listingId}`);
  const reason = text(form, "reason");
  if (!(reason in REPORT_REASONS)) return { error: "Elige un motivo." };
  if (!(await allow(`report:${user.id}`, 10, 24 * 60))) return { error: TOO_MANY };
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing) return { error: "Este anuncio ya no existe." };
  await db.report.create({
    data: { listingId, reporterId: user.id, reason, details: optionalText(form, "details")?.slice(0, 1000) ?? null },
  });
  return { ok: "Gracias por avisar. Lo revisaremos lo antes posible." };
}

// ---------- Moderación (solo administradores) ----------

async function requireAdminAction() {
  const user = await requireUser("/admin");
  if (!isAdmin(user)) throw new Error("No autorizado");
  return user;
}

export async function setListingHidden(listingId: string, hidden: boolean) {
  await requireAdminAction();
  await db.listing.update({ where: { id: listingId }, data: { hiddenAt: hidden ? new Date() : null } });
  if (hidden) await db.report.updateMany({ where: { listingId, resolvedAt: null }, data: { resolvedAt: new Date() } });
  revalidatePath("/admin");
  revalidatePath(`/anuncios/${listingId}`);
}

export async function dismissReport(reportId: string) {
  await requireAdminAction();
  await db.report.update({ where: { id: reportId }, data: { resolvedAt: new Date() } });
  revalidatePath("/admin");
}

export async function setUserBlocked(userId: string, blocked: boolean) {
  const admin = await requireAdminAction();
  if (userId === admin.id) return;
  await db.user.update({ where: { id: userId }, data: { blockedAt: blocked ? new Date() : null } });
  if (blocked) {
    await db.report.updateMany({ where: { listing: { sellerId: userId }, resolvedAt: null }, data: { resolvedAt: new Date() } });
  }
  revalidatePath("/admin");
}
