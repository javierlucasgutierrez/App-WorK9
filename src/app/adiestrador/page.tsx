import Link from "next/link";
import { Empty } from "@/components/ui";
import { requireTrainer } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, percent } from "@/lib/format";

export default async function TrainerHome() {
  const trainer = await requireTrainer();
  const mine = { owner: { trainerId: trainer.id } };

  const [clients, dogs, pending, practices, lastSessions] = await Promise.all([
    db.user.count({ where: { trainerId: trainer.id } }),
    db.dog.count({ where: mine }),
    db.assignment.count({ where: { trainerId: trainer.id, status: "PENDING" } }),
    db.homePractice.findMany({
      where: { dog: mine },
      include: { dog: true, exercise: true, client: true },
      orderBy: { date: "desc" },
      take: 6,
    }),
    db.trainingSession.findMany({
      where: { trainerId: trainer.id },
      include: { dog: true },
      orderBy: { date: "desc" },
      take: 4,
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="h1">Hola, {trainer.name.split(" ")[0]} 👋</h1>

      <div className="grid grid-cols-3 gap-3">
        {[
          ["Clientes", clients],
          ["Perros", dogs],
          ["Deberes pendientes", pending],
        ].map(([label, value]) => (
          <div key={label} className="card text-center">
            <p className="text-2xl font-bold text-brand-700">{value}</p>
            <p className="muted leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="muted">Tu código de invitación: dáselo a tus clientes para que se registren</p>
        <p className="text-2xl font-bold tracking-wider text-brand-700">{trainer.inviteCode}</p>
      </div>

      <section className="space-y-3">
        <h2 className="h2">Últimas prácticas en casa</h2>
        {practices.length === 0 ? (
          <Empty>Tus clientes aún no han registrado prácticas.</Empty>
        ) : (
          <ul className="card divide-y divide-gray-100 p-0">
            {practices.map((p) => (
              <li key={p.id}>
                <Link href={`/adiestrador/perros/${p.dogId}`} className="block px-4 py-3 hover:bg-gray-50">
                  <p className="font-medium">
                    🐕 {p.dog.name} · {p.exercise.title}
                  </p>
                  <p className="muted">
                    {formatDate(p.date)} · {p.client.name} · {p.successes}/{p.repetitions} (
                    {percent(p.successes, p.repetitions)}%)
                  </p>
                  {p.notes && <p className="mt-1 text-sm text-gray-700">“{p.notes}”</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="h2">Últimas sesiones</h2>
        {lastSessions.length === 0 ? (
          <Empty>Registra tu primera sesión desde la ficha de un perro.</Empty>
        ) : (
          <ul className="card divide-y divide-gray-100 p-0">
            {lastSessions.map((s) => (
              <li key={s.id}>
                <Link href={`/adiestrador/perros/${s.dogId}#sesiones`} className="block px-4 py-3 hover:bg-gray-50">
                  📅 {formatDate(s.date)} · <span className="font-medium">{s.dog.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
