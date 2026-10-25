import Link from "next/link";
import { createExercise } from "@/app/actions/trainer";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Field, TextArea } from "@/components/Field";
import { Collapsible, Empty, PageHeader } from "@/components/ui";
import { VideoFields } from "@/components/VideoFields";
import { requireTrainer } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ExercisesPage() {
  const trainer = await requireTrainer();
  const exercises = await db.exercise.findMany({
    where: { trainerId: trainer.id },
    include: { _count: { select: { assignments: true } } },
    orderBy: { title: "asc" },
  });

  return (
    <>
      <PageHeader title="Ejercicios" subtitle="Tu biblioteca. Desde la ficha de cada perro puedes mandarlos como deberes." />
      <div className="mb-5">
        <Collapsible title="+ Nuevo ejercicio">
          <ActionForm action={createExercise} resetOnSuccess>
            <Field label="Título" name="title" placeholder="Ej.: Sentado" required />
            <TextArea label="Explicación paso a paso" name="description" rows={6} required />
            <VideoFields />
            <SubmitButton>Crear ejercicio</SubmitButton>
          </ActionForm>
        </Collapsible>
      </div>
      {exercises.length === 0 ? (
        <Empty>Crea tu primer ejercicio.</Empty>
      ) : (
        <ul className="space-y-3">
          {exercises.map((ex) => (
            <li key={ex.id}>
              <Link href={`/adiestrador/ejercicios/${ex.id}`} className="card block hover:border-brand-500">
                <p className="font-semibold">
                  🎯 {ex.title} {(ex.videoKey || ex.videoUrl) && <span title="Tiene vídeo">🎬</span>}
                </p>
                <p className="muted line-clamp-2">{ex.description}</p>
                <p className="muted mt-1">Asignado {ex._count.assignments} veces</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
