import Link from "next/link";
import { notFound } from "next/navigation";
import { createDog, unlinkClient, updateClient } from "@/app/actions/trainer";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { DogFields } from "@/components/DogFields";
import { Field } from "@/components/Field";
import { Collapsible, Empty, PageHeader } from "@/components/ui";
import { requireTrainer } from "@/lib/auth";
import { DOG_SEX } from "@/lib/constants";
import { db } from "@/lib/db";
import { age } from "@/lib/format";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trainer = await requireTrainer();
  const client = await db.user.findFirst({
    where: { id, trainerId: trainer.id },
    include: {
      dogs: {
        orderBy: { name: "asc" },
        include: { _count: { select: { assignments: { where: { status: "PENDING" } } } } },
      },
    },
  });
  if (!client) notFound();

  return (
    <>
      <PageHeader
        title={client.name}
        back={{ href: "/adiestrador/clientes", label: "Clientes" }}
        subtitle={
          <>
            {client.email}
            {client.phone && (
              <>
                {" · "}
                <a href={`tel:${client.phone}`} className="link">
                  {client.phone}
                </a>
              </>
            )}
          </>
        }
      />

      <section className="mb-6 space-y-3">
        <h2 className="h2">Perros</h2>
        {client.dogs.length === 0 ? (
          <Empty>Este cliente aún no tiene perros.</Empty>
        ) : (
          client.dogs.map((dog) => (
            <Link key={dog.id} href={`/adiestrador/perros/${dog.id}`} className="card block hover:border-brand-500">
              <p className="font-semibold">🐕 {dog.name}</p>
              <p className="muted">
                {[dog.breed, dog.sex && DOG_SEX[dog.sex], age(dog.birthDate)].filter(Boolean).join(" · ")}
              </p>
              {dog._count.assignments > 0 && (
                <p className="mt-1 text-sm text-amber-700">{dog._count.assignments} deberes pendientes</p>
              )}
            </Link>
          ))
        )}
        <Collapsible title="+ Añadir perro">
          <ActionForm action={createDog.bind(null, client.id)}>
            <DogFields />
            <SubmitButton>Añadir perro</SubmitButton>
          </ActionForm>
        </Collapsible>
      </section>

      <section className="space-y-3">
        <Collapsible title="Editar datos del cliente">
          <ActionForm action={updateClient.bind(null, client.id)}>
            <Field label="Nombre y apellidos" name="clientName" defaultValue={client.name} required />
            <Field label="Teléfono" name="phone" type="tel" defaultValue={client.phone ?? ""} />
            <SubmitButton>Guardar</SubmitButton>
          </ActionForm>
          <form action={unlinkClient.bind(null, client.id)} className="mt-6 border-t pt-4">
            <ConfirmButton message={`¿Quitar a ${client.name} de tu lista de clientes?`}>
              Quitar de mis clientes
            </ConfirmButton>
          </form>
        </Collapsible>
      </section>
    </>
  );
}
