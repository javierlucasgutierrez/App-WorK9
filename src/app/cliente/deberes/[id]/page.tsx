import { notFound } from "next/navigation";
import { deletePractice, toggleAssignmentDone } from "@/app/actions/client";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PracticeForm } from "@/components/PracticeForm";
import { PageHeader, StatusBadge } from "@/components/ui";
import { VideoPlayer } from "@/components/VideoPlayer";
import { requireClient } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, percent } from "@/lib/format";

export default async function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await requireClient();
  const a = await db.assignment.findFirst({
    where: { id, dog: { ownerId: client.id } },
    include: { exercise: true, dog: true, trainer: true, homePractices: { orderBy: { date: "desc" } } },
  });
  if (!a) notFound();
  const done = a.status === "DONE";

  return (
    <>
      <PageHeader
        title={a.exercise.title}
        back={{ href: "/cliente", label: "Deberes" }}
        subtitle={`Para ${a.dog.name} · de ${a.trainer.name}`}
        action={<StatusBadge done={done} />}
      />
      <div className="space-y-4">
        {a.instructions && (
          <div className="card border-brand-100 bg-brand-50">
            <p className="text-sm font-semibold text-brand-700">Indicaciones para vosotros</p>
            <p className="mt-1 whitespace-pre-line">{a.instructions}</p>
            <p className="muted mt-2">
              {[a.targetReps && `${a.targetReps} repeticiones al día`, a.dueDate && `Para el ${formatDate(a.dueDate)}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        )}

        <div className="card space-y-3">
          <VideoPlayer videoKey={a.exercise.videoKey} videoUrl={a.exercise.videoUrl} />
          <h2 className="h2">Cómo se hace</h2>
          <p className="whitespace-pre-line">{a.exercise.description}</p>
        </div>

        <form action={toggleAssignmentDone.bind(null, a.id)}>
          <button className={done ? "btn-secondary w-full" : "btn w-full"}>
            {done ? "↩ Marcar como pendiente" : "✅ Marcar como hecho"}
          </button>
        </form>

        <div className="card">
          <h2 className="h2 mb-3">Apuntar práctica en casa</h2>
          <PracticeForm assignments={[{ id: a.id, label: a.exercise.title }]} />
        </div>

        {a.homePractices.length > 0 && (
          <section className="space-y-2">
            <h2 className="h2">Vuestras prácticas</h2>
            <ul className="card divide-y divide-gray-100 p-0">
              {a.homePractices.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="font-medium">
                      {formatDate(p.date)} · {p.successes}/{p.repetitions} ({percent(p.successes, p.repetitions)}%)
                    </p>
                    {p.notes && <p className="muted">{p.notes}</p>}
                  </div>
                  <form action={deletePractice.bind(null, p.id)}>
                    <ConfirmButton message="¿Borrar esta práctica?">✕</ConfirmButton>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
