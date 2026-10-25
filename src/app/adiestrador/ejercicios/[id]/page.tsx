import { notFound } from "next/navigation";
import { deleteExercise, updateExercise } from "@/app/actions/trainer";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Field, TextArea } from "@/components/Field";
import { Collapsible, PageHeader } from "@/components/ui";
import { VideoFields } from "@/components/VideoFields";
import { VideoPlayer } from "@/components/VideoPlayer";
import { getTrainerExercise } from "@/lib/access";
import { requireTrainer } from "@/lib/auth";

export default async function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trainer = await requireTrainer();
  const exercise = await getTrainerExercise(trainer.id, id);
  if (!exercise) notFound();

  return (
    <>
      <PageHeader title={exercise.title} back={{ href: "/adiestrador/ejercicios", label: "Ejercicios" }} />
      <div className="space-y-4">
        <div className="card space-y-3">
          <VideoPlayer videoKey={exercise.videoKey} videoUrl={exercise.videoUrl} />
          <p className="whitespace-pre-line">{exercise.description}</p>
        </div>
        <Collapsible title="Editar ejercicio">
          <ActionForm action={updateExercise.bind(null, exercise.id)}>
            <Field label="Título" name="title" defaultValue={exercise.title} required />
            <TextArea label="Explicación paso a paso" name="description" rows={6} defaultValue={exercise.description} required />
            <VideoFields videoUrl={exercise.videoUrl} hasVideo={!!exercise.videoKey} />
            <SubmitButton>Guardar</SubmitButton>
          </ActionForm>
          <form action={deleteExercise.bind(null, exercise.id)} className="mt-6 border-t pt-4">
            <ConfirmButton message="¿Borrar este ejercicio? También se borrarán los deberes y resultados que lo usan.">
              Borrar ejercicio
            </ConfirmButton>
          </form>
        </Collapsible>
      </div>
    </>
  );
}
