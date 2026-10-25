import Link from "next/link";
import { joinTrainer } from "@/app/actions/client";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Field } from "@/components/Field";
import { Empty, StatusBadge } from "@/components/ui";
import { requireClient } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function ClientHome() {
  const client = await requireClient();
  const [trainer, dogs] = await Promise.all([
    client.trainerId ? db.user.findUnique({ where: { id: client.trainerId } }) : null,
    db.dog.findMany({
      where: { ownerId: client.id },
      include: {
        assignments: {
          include: { exercise: true },
          orderBy: [{ status: "desc" }, { createdAt: "desc" }],
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">Hola, {client.name.split(" ")[0]} 👋</h1>
        {trainer && <p className="muted">Tu adiestrador/a: {trainer.name}</p>}
      </div>

      {!trainer && (
        <div className="card">
          <h2 className="h2 mb-3">Únete a tu adiestrador</h2>
          <ActionForm action={joinTrainer}>
            <Field label="Código de invitación" name="inviteCode" placeholder="Ej.: MARTA-1234" required />
            <SubmitButton>Unirme</SubmitButton>
          </ActionForm>
        </div>
      )}

      {dogs.length === 0 ? (
        <Empty>
          Aún no has añadido a tu perro.{" "}
          <Link href="/cliente/perros/nuevo" className="link">
            Añadirlo
          </Link>
        </Empty>
      ) : (
        dogs.map((dog) => {
          const pending = dog.assignments.filter((a) => a.status !== "DONE").length;
          return (
            <section key={dog.id} className="space-y-3">
              <h2 className="h2">
                🐕 Deberes de {dog.name}{" "}
                {pending > 0 && <span className="badge bg-amber-100 align-middle text-amber-800">{pending} pendientes</span>}
              </h2>
              {dog.assignments.length === 0 ? (
                <Empty>Sin deberes por ahora.</Empty>
              ) : (
                <ul className="space-y-3">
                  {dog.assignments.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/cliente/deberes/${a.id}`}
                        className={`card block hover:border-brand-500 ${a.status === "DONE" ? "opacity-70" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold">
                            🎯 {a.exercise.title} {(a.exercise.videoKey || a.exercise.videoUrl) && "🎬"}
                          </p>
                          <StatusBadge done={a.status === "DONE"} />
                        </div>
                        {a.instructions && <p className="mt-1 line-clamp-2 text-sm text-gray-700">{a.instructions}</p>}
                        <p className="muted mt-1">
                          {[a.targetReps && `${a.targetReps} repeticiones/día`, a.dueDate && `Para el ${formatDate(a.dueDate)}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
