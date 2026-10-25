"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/ActionForm";
import { getClientDog } from "@/lib/access";
import { requireClient } from "@/lib/auth";
import { db } from "@/lib/db";
import { dogDataFromForm } from "@/lib/dog-form";
import { parseInputDate } from "@/lib/format";
import { count, optionalText, text } from "@/lib/forms";

/** Deber del cliente (de alguno de sus perros). */
function getClientAssignment(clientId: string, assignmentId: string) {
  return db.assignment.findFirst({ where: { id: assignmentId, dog: { ownerId: clientId } } });
}

export async function toggleAssignmentDone(assignmentId: string) {
  const client = await requireClient();
  const a = await getClientAssignment(client.id, assignmentId);
  if (!a) return;
  const done = a.status !== "DONE";
  await db.assignment.update({
    where: { id: a.id },
    data: { status: done ? "DONE" : "PENDING", completedAt: done ? new Date() : null },
  });
  revalidatePath("/cliente", "layout");
}

export async function createPractice(_: FormState, form: FormData): Promise<FormState> {
  const client = await requireClient();
  const assignment = await getClientAssignment(client.id, text(form, "assignmentId"));
  if (!assignment) return { error: "Elige el deber que has practicado." };
  const date = parseInputDate(form.get("date"));
  if (!date) return { error: "Pon la fecha." };
  const repetitions = count(form, "repetitions");
  const successes = count(form, "successes");
  if (repetitions === 0) return { error: "Indica cuántas repeticiones habéis hecho." };
  if (successes > repetitions) return { error: "Los aciertos no pueden ser más que las repeticiones." };

  await db.homePractice.create({
    data: {
      date,
      repetitions,
      successes,
      notes: optionalText(form, "notes"),
      clientId: client.id,
      dogId: assignment.dogId,
      exerciseId: assignment.exerciseId,
      assignmentId: assignment.id,
    },
  });
  revalidatePath("/cliente", "layout");
  return { ok: "¡Práctica guardada! 🐾" };
}

export async function deletePractice(practiceId: string) {
  const client = await requireClient();
  await db.homePractice.deleteMany({ where: { id: practiceId, clientId: client.id } });
  revalidatePath("/cliente", "layout");
}

export async function createOwnDog(_: FormState, form: FormData): Promise<FormState> {
  const client = await requireClient();
  const data = dogDataFromForm(form);
  if (!data.name) return { error: "Tu perro necesita un nombre." };
  const dog = await db.dog.create({ data: { ...data, ownerId: client.id } });
  redirect(`/cliente/perros/${dog.id}`);
}

export async function updateOwnDog(dogId: string, _: FormState, form: FormData): Promise<FormState> {
  const client = await requireClient();
  if (!(await getClientDog(client.id, dogId))) return { error: "No se ha encontrado." };
  const data = dogDataFromForm(form);
  if (!data.name) return { error: "Tu perro necesita un nombre." };
  await db.dog.update({ where: { id: dogId }, data });
  revalidatePath(`/cliente/perros/${dogId}`);
  return { ok: "Ficha guardada." };
}

/** Unirse a un adiestrador con su código (si el cliente aún no tiene uno). */
export async function joinTrainer(_: FormState, form: FormData): Promise<FormState> {
  const client = await requireClient();
  const trainer = await db.user.findUnique({ where: { inviteCode: text(form, "inviteCode").toUpperCase() } });
  if (!trainer) return { error: "El código no es válido." };
  await db.user.update({ where: { id: client.id }, data: { trainerId: trainer.id } });
  revalidatePath("/cliente", "layout");
  return { ok: `Ya estás con ${trainer.name}.` };
}
