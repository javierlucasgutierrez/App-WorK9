import Link from "next/link";
import { notFound } from "next/navigation";
import { createAssignment, deleteAssignment, deleteSession, updateDog } from "@/app/actions/trainer";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { AssignmentSummary } from "@/components/AssignmentCard";
import { ConfirmButton } from "@/components/ConfirmButton";
import { DogFields } from "@/components/DogFields";
import { DogProgress } from "@/components/DogProgress";
import { Field, TextArea } from "@/components/Field";
import { SessionList } from "@/components/SessionList";
import { Collapsible, Empty, PageHeader } from "@/components/ui";
import { getTrainerDog } from "@/lib/access";
import { requireTrainer } from "@/lib/auth";
import { DOG_SEX } from "@/lib/constants";
import { db } from "@/lib/db";
import { age } from "@/lib/format";

export default async function TrainerDogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trainer = await requireTrainer();
  const dog = await getTrainerDog(trainer.id, id);
  if (!dog) notFound();

  const [assignments, exercises] = await Promise.all([
    db.assignment.findMany({
      where: { dogId: dog.id },
      include: { exercise: true, homePractices: true },
      orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    }),
    db.exercise.findMany({ where: { trainerId: trainer.id }, orderBy: { title: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        title={`🐕 ${dog.name}`}
        back={{ href: `/adiestrador/clientes/${dog.ownerId}`, label: dog.owner.name }}
        subtitle={[dog.breed, dog.sex && DOG_SEX[dog.sex], age(dog.birthDate), dog.weightKg && `${dog.weightKg} kg`]
          .filter(Boolean)
          .join(" · ")}
        action={
          <Link href={`/adiestrador/perros/${dog.id}/sesion`} className="btn shrink-0">
            + Sesión
          </Link>
        }
      />

      {dog.notes && <p className="card mb-4 whitespace-pre-line text-sm">{dog.notes}</p>}

      <div className="mb-6">
        <Collapsible title="Editar ficha">
          <ActionForm action={updateDog.bind(null, dog.id)}>
            <DogFields dog={dog} />
            <SubmitButton>Guardar ficha</SubmitButton>
          </ActionForm>
        </Collapsible>
      </div>

      <div className="mb-6">
        <DogProgress dogId={dog.id} />
      </div>

      <section className="mb-6 space-y-3">
        <h2 className="h2">Deberes</h2>
        <Collapsible title="+ Mandar deber">
          {exercises.length === 0 ? (
            <p className="muted">
              Primero crea algún ejercicio en{" "}
              <Link href="/adiestrador/ejercicios" className="link">
                Ejercicios
              </Link>
              .
            </p>
          ) : (
            <ActionForm action={createAssignment.bind(null, dog.id)} resetOnSuccess>
              <div>
                <label htmlFor="exerciseId" className="label">
                  Ejercicio
                </label>
                <select id="exerciseId" name="exerciseId" className="input" required>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title}
                    </option>
                  ))}
                </select>
              </div>
              <TextArea label="Indicaciones para esta familia (opcional)" name="instructions" rows={3} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Repeticiones/día" name="targetReps" type="number" min={0} inputMode="numeric" />
                <Field label="Para el día" name="dueDate" type="date" />
              </div>
              <SubmitButton>Mandar deber</SubmitButton>
            </ActionForm>
          )}
        </Collapsible>
        {assignments.length === 0 ? (
          <Empty>Sin deberes todavía.</Empty>
        ) : (
          assignments.map((a) => (
            <AssignmentSummary key={a.id} assignment={a}>
              <form action={deleteAssignment.bind(null, a.id)} className="text-right">
                <ConfirmButton message="¿Borrar este deber?">Borrar</ConfirmButton>
              </form>
            </AssignmentSummary>
          ))
        )}
      </section>

      <section id="sesiones" className="space-y-3">
        <h2 className="h2">Sesiones</h2>
        <SessionList
          dogId={dog.id}
          renderActions={(sessionId) => (
            <form action={deleteSession.bind(null, sessionId)} className="text-right">
              <ConfirmButton message="¿Borrar esta sesión?">Borrar</ConfirmButton>
            </form>
          )}
        />
      </section>
    </>
  );
}
