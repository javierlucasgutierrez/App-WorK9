import Link from "next/link";
import { deletePractice } from "@/app/actions/client";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PracticeForm } from "@/components/PracticeForm";
import { Empty, PageHeader } from "@/components/ui";
import { requireClient } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, percent } from "@/lib/format";

export default async function PracticesPage() {
  const client = await requireClient();
  const [assignments, practices] = await Promise.all([
    db.assignment.findMany({
      where: { dog: { ownerId: client.id } },
      include: { exercise: true, dog: true },
      orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    }),
    db.homePractice.findMany({
      where: { clientId: client.id },
      include: { exercise: true, dog: true },
      orderBy: { date: "desc" },
      take: 50,
    }),
  ]);

  return (
    <>
      <PageHeader title="Prácticas en casa" subtitle="Apunta lo que practicáis: tu adiestrador lo verá." />
      <div className="space-y-6">
        {assignments.length === 0 ? (
          <Empty>Cuando tu adiestrador te mande deberes, podrás apuntar aquí las prácticas.</Empty>
        ) : (
          <div className="card">
            <h2 className="h2 mb-3">Nueva práctica</h2>
            <PracticeForm
              assignments={assignments.map((a) => ({
                id: a.id,
                label: `${a.dog.name} · ${a.exercise.title}${a.status === "DONE" ? " (hecho)" : ""}`,
              }))}
            />
          </div>
        )}

        <section className="space-y-2">
          <h2 className="h2">Historial</h2>
          {practices.length === 0 ? (
            <Empty>Todavía no hay prácticas apuntadas.</Empty>
          ) : (
            <ul className="card divide-y divide-gray-100 p-0">
              {practices.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="font-medium">
                      🐕 {p.dog.name} · {p.exercise.title}
                    </p>
                    <p className="muted">
                      {formatDate(p.date)} · {p.successes}/{p.repetitions} ({percent(p.successes, p.repetitions)}%)
                      {p.assignmentId && (
                        <>
                          {" · "}
                          <Link href={`/cliente/deberes/${p.assignmentId}`} className="link">
                            ver deber
                          </Link>
                        </>
                      )}
                    </p>
                    {p.notes && <p className="text-sm text-gray-700">{p.notes}</p>}
                  </div>
                  <form action={deletePractice.bind(null, p.id)}>
                    <ConfirmButton message="¿Borrar esta práctica?">✕</ConfirmButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
