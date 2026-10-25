"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { getTrainerClient, getTrainerDog, getTrainerExercise } from "@/lib/access";
import { hashPassword, requireTrainer } from "@/lib/auth";
import { db } from "@/lib/db";
import { dogDataFromForm } from "@/lib/dog-form";
import { parseInputDate } from "@/lib/format";
import { count, optionalNumber, optionalText, text } from "@/lib/forms";
import { saveVideoFromForm, storage } from "@/lib/storage";

const NOT_FOUND: FormState = { error: "No se ha encontrado (o no es tuyo)." };

// ---------- Clientes ----------

export async function createClient(_: FormState, form: FormData): Promise<FormState> {
  const trainer = await requireTrainer();
  const name = text(form, "clientName");
  const email = text(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!name || !email) return { error: "Escribe el nombre y el correo del cliente." };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };
  if (await db.user.findUnique({ where: { email } })) return { error: "Ya existe una cuenta con ese correo." };

  const client = await db.user.create({
    data: {
      role: "CLIENT",
      name,
      email,
      phone: optionalText(form, "phone"),
      passwordHash: await hashPassword(password),
      trainerId: trainer.id,
    },
  });
  const dog = dogDataFromForm(form);
  if (dog.name) await db.dog.create({ data: { ...dog, ownerId: client.id } });

  redirect(`/adiestrador/clientes/${client.id}`);
}

export async function updateClient(clientId: string, _: FormState, form: FormData): Promise<FormState> {
  const trainer = await requireTrainer();
  if (!(await getTrainerClient(trainer.id, clientId))) return NOT_FOUND;
  const name = text(form, "clientName");
  if (!name) return { error: "El nombre no puede quedar vacío." };
  await db.user.update({ where: { id: clientId }, data: { name, phone: optionalText(form, "phone") } });
  revalidatePath(`/adiestrador/clientes/${clientId}`);
  return { ok: "Datos guardados." };
}

/** Quita al cliente de tu lista (su cuenta sigue existiendo). */
export async function unlinkClient(clientId: string) {
  const trainer = await requireTrainer();
  if (!(await getTrainerClient(trainer.id, clientId))) return;
  await db.user.update({ where: { id: clientId }, data: { trainerId: null } });
  redirect("/adiestrador/clientes");
}

// ---------- Perros ----------

export async function createDog(clientId: string, _: FormState, form: FormData): Promise<FormState> {
  const trainer = await requireTrainer();
  if (!(await getTrainerClient(trainer.id, clientId))) return NOT_FOUND;
  const data = dogDataFromForm(form);
  if (!data.name) return { error: "El perro necesita un nombre." };
  const dog = await db.dog.create({ data: { ...data, ownerId: clientId } });
  redirect(`/adiestrador/perros/${dog.id}`);
}

export async function updateDog(dogId: string, _: FormState, form: FormData): Promise<FormState> {
  const trainer = await requireTrainer();
  if (!(await getTrainerDog(trainer.id, dogId))) return NOT_FOUND;
  const data = dogDataFromForm(form);
  if (!data.name) return { error: "El perro necesita un nombre." };
  await db.dog.update({ where: { id: dogId }, data });
  revalidatePath(`/adiestrador/perros/${dogId}`);
  return { ok: "Ficha guardada." };
}

// ---------- Ejercicios ----------

async function exerciseDataFromForm(form: FormData) {
  return {
    title: text(form, "title"),
    description: text(form, "description"),
    videoUrl: optionalText(form, "videoUrl"),
    videoKey: await saveVideoFromForm(form, "video", "ejercicios"),
  };
}

export async function createExercise(_: FormState, form: FormData): Promise<FormState> {
  const trainer = await requireTrainer();
  if (!text(form, "title") || !text(form, "description")) return { error: "Escribe un título y la explicación." };
  try {
    const data = await exerciseDataFromForm(form);
    await db.exercise.create({ data: { ...data, trainerId: trainer.id } });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/adiestrador/ejercicios");
  return { ok: "Ejercicio creado." };
}

export async function updateExercise(exerciseId: string, _: FormState, form: FormData): Promise<FormState> {
  const trainer = await requireTrainer();
  const exercise = await getTrainerExercise(trainer.id, exerciseId);
  if (!exercise) return NOT_FOUND;
  if (!text(form, "title") || !text(form, "description")) return { error: "Escribe un título y la explicación." };
  try {
    const { videoKey, ...data } = await exerciseDataFromForm(form);
    const removeVideo = form.get("removeVideo") === "on";
    await db.exercise.update({
      where: { id: exerciseId },
      data: { ...data, ...(videoKey || removeVideo ? { videoKey } : {}) },
    });
    if ((videoKey || removeVideo) && exercise.videoKey) await removeIfUnused(exercise.videoKey);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/adiestrador/ejercicios/${exerciseId}`);
  return { ok: "Ejercicio guardado." };
}

export async function deleteExercise(exerciseId: string) {
  const trainer = await requireTrainer();
  const exercise = await getTrainerExercise(trainer.id, exerciseId);
  if (!exercise) return;
  await db.exercise.delete({ where: { id: exerciseId } });
  if (exercise.videoKey) await removeIfUnused(exercise.videoKey);
  redirect("/adiestrador/ejercicios");
}

/** Borra el archivo de vídeo solo si ya no lo usa ningún ejercicio ni contenido. */
async function removeIfUnused(key: string) {
  const inUse =
    (await db.exercise.count({ where: { videoKey: key } })) + (await db.content.count({ where: { videoKey: key } }));
  if (!inUse) await storage.remove(key);
}

// ---------- Deberes ----------

export async function createAssignment(dogId: string, _: FormState, form: FormData): Promise<FormState> {
  const trainer = await requireTrainer();
  if (!(await getTrainerDog(trainer.id, dogId))) return NOT_FOUND;
  const exerciseId = text(form, "exerciseId");
  if (!(await getTrainerExercise(trainer.id, exerciseId))) return { error: "Elige un ejercicio." };
  const reps = optionalNumber(form, "targetReps");
  await db.assignment.create({
    data: {
      dogId,
      exerciseId,
      trainerId: trainer.id,
      instructions: optionalText(form, "instructions"),
      targetReps: reps == null ? null : count(form, "targetReps"),
      dueDate: parseInputDate(form.get("dueDate")),
    },
  });
  revalidatePath(`/adiestrador/perros/${dogId}`);
  return { ok: "Deber asignado." };
}

export async function deleteAssignment(assignmentId: string) {
  const trainer = await requireTrainer();
  const assignment = await db.assignment.findFirst({ where: { id: assignmentId, trainerId: trainer.id } });
  if (!assignment) return;
  await db.assignment.delete({ where: { id: assignmentId } });
  revalidatePath(`/adiestrador/perros/${assignment.dogId}`);
}
