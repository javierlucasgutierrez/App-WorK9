import Link from "next/link";
import { notFound } from "next/navigation";
import { createSession } from "@/app/actions/trainer";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Field, TextArea } from "@/components/Field";
import { Empty, PageHeader } from "@/components/ui";
import { getTrainerDog } from "@/lib/access";
import { requireTrainer } from "@/lib/auth";
import { db } from "@/lib/db";
import { toInputDate } from "@/lib/format";
import { SessionRows } from "./SessionRows";

export default async function NewSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trainer = await requireTrainer();
  const dog = await getTrainerDog(trainer.id, id);
  if (!dog) notFound();

  const [exercises, pending] = await Promise.all([
    db.exercise.findMany({ where: { trainerId: trainer.id }, orderBy: { title: "asc" } }),
    db.assignment.findMany({ where: { dogId: dog.id, status: "PENDING" }, select: { exerciseId: true } }),
  ]);

  return (
    <>
      <PageHeader title={`Nueva sesión · ${dog.name}`} back={{ href: `/adiestrador/perros/${dog.id}`, label: dog.name }} />
      {exercises.length === 0 ? (
        <Empty>
          Primero crea algún ejercicio en{" "}
          <Link href="/adiestrador/ejercicios" className="link">
            Ejercicios
          </Link>
          .
        </Empty>
      ) : (
        <ActionForm action={createSession.bind(null, dog.id)}>
          <Field label="Fecha" name="date" type="date" defaultValue={toInputDate()} required />
          {/* Empieza con los ejercicios que tiene de deberes */}
          <SessionRows exercises={exercises} initial={[...new Set(pending.map((p) => p.exerciseId))]} />
          <TextArea label="Notas de la sesión" name="notes" rows={3} />
          <SubmitButton>Guardar sesión</SubmitButton>
        </ActionForm>
      )}
    </>
  );
}
