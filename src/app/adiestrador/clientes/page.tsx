import Link from "next/link";
import { Empty, PageHeader } from "@/components/ui";
import { requireTrainer } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ClientsPage() {
  const trainer = await requireTrainer();
  const clients = await db.user.findMany({
    where: { trainerId: trainer.id },
    include: { dogs: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle={
          <>
            También pueden registrarse solos con tu código <b className="text-brand-700">{trainer.inviteCode}</b>
          </>
        }
        action={
          <Link href="/adiestrador/clientes/nuevo" className="btn shrink-0">
            + Nuevo
          </Link>
        }
      />
      {clients.length === 0 ? (
        <Empty>Todavía no tienes clientes.</Empty>
      ) : (
        <ul className="space-y-3">
          {clients.map((c) => (
            <li key={c.id}>
              <Link href={`/adiestrador/clientes/${c.id}`} className="card block hover:border-brand-500">
                <p className="font-semibold">{c.name}</p>
                <p className="muted">
                  {c.dogs.length ? "🐕 " + c.dogs.map((d) => d.name).join(", ") : "Sin perros todavía"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
